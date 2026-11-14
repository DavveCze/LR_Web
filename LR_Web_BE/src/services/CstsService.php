<?php
declare(strict_types=1);

class CstsService
{
    private const BASE_URL = 'https://www.csts.cz/api/1/athletes/';
    private const TIMEOUT_SECONDS = 10;
    private const USER_AGENT = 'LR-Dance-Web/1.0 (+https://lrdance.cz)';

    /**
     * Stáhne a zparsuje data o tanečníkovi z ČSTS API podle IDT.
     * Automaticky ošetřuje rate-limit (HTTP 429) s bezpečným backoffem.
     */
    public function fetchAthlete(int $idt, int $retryCount = 3): ?array
    {
        if ($idt <= 0) {
            return null;
        }

        $url = self::BASE_URL . $idt;

        for ($attempt = 0; $attempt <= $retryCount; $attempt++) {
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => self::TIMEOUT_SECONDS,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_USERAGENT => self::USER_AGENT,
                CURLOPT_HTTPHEADER => [
                    'Accept: application/json',
                ],
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);

            $rawResponse = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            // Pokud ČSTS vrátí 429 (Too Many Requests), počkáme a zkusíme znovu
            if ($httpCode === 429 && $attempt < $retryCount) {
                $backoffSecs = match ($attempt) {
                    0 => 3,
                    1 => 4,
                    default => 6,
                };
                sleep($backoffSecs);
                continue;
            }

            if ($curlError || $httpCode !== 200 || !$rawResponse) {
                return null;
            }

            $data = json_decode($rawResponse, true);
            if (!is_array($data) || empty($data['collection']) || !is_array($data['collection'][0])) {
                return null;
            }

            return $this->normalizeAthleteData($data['collection'][0]);
        }

        return null;
    }

    /**
     * Normalizuje data vrácená z ČSTS pro potřeby našeho systému.
     */
    private function normalizeAthleteData(array $raw): array
    {
        $fullName = trim((string) ($raw['name'] ?? ''));
        $nameParts = preg_split('/\s+/', $fullName);
        if (count($nameParts) > 1) {
            $surname = array_pop($nameParts);
            $firstName = implode(' ', $nameParts);
        } else {
            $firstName = $fullName;
            $surname = '';
        }

        $lat = $raw['lat'] ?? null;
        $stt = $raw['stt'] ?? null;

        // Pokud lat / stt nejsou na rootu objektu, zkusit projít rankingPoints
        if (!is_array($lat) && !empty($raw['rankingPoints']) && is_array($raw['rankingPoints'])) {
            foreach ($raw['rankingPoints'] as $rp) {
                if (($rp['discipline'] ?? '') === 'Latin' && !is_array($lat)) {
                    $lat = $rp;
                }
                if (($rp['discipline'] ?? '') === 'Standard' && !is_array($stt)) {
                    $stt = $rp;
                }
            }
        }

        $normalizeCategory = static function (?string $class): ?string {
            if (!$class) {
                return null;
            }
            $clean = strtoupper(trim($class));
            return in_array($clean, ['M', 'A', 'B', 'C', 'D', 'E'], true) ? $clean : null;
        };

        $catLat = is_array($lat) ? $normalizeCategory($lat['class'] ?? ($lat['personalClass'] ?? null)) : null;
        $pointsLat = is_array($lat) ? (int) ($lat['points'] ?? ($lat['personalPoints'] ?? 0)) : 0;
        $finalsLat = is_array($lat) ? (int) (($lat['domesticFinaleCount'] ?? 0) + ($lat['foreignFinaleCount'] ?? 0)) : 0;
        $partnerLatName = is_array($lat) && !empty($lat['partner']) ? trim((string) $lat['partner']) : null;
        $partnerLatIdt = is_array($lat) && !empty($lat['partnerIdt']) ? (int) $lat['partnerIdt'] : null;

        $catStt = is_array($stt) ? $normalizeCategory($stt['class'] ?? ($stt['personalClass'] ?? null)) : null;
        $pointsStt = is_array($stt) ? (int) ($stt['points'] ?? ($stt['personalPoints'] ?? 0)) : 0;
        $finalsStt = is_array($stt) ? (int) (($stt['domesticFinaleCount'] ?? 0) + ($stt['foreignFinaleCount'] ?? 0)) : 0;
        $partnerSttName = is_array($stt) && !empty($stt['partner']) ? trim((string) $stt['partner']) : null;
        $partnerSttIdt = is_array($stt) && !empty($stt['partnerIdt']) ? (int) $stt['partnerIdt'] : null;

        $suggestedPartnerIdt = $partnerLatIdt ?: $partnerSttIdt;
        $suggestedPartnerName = $partnerLatName ?: $partnerSttName;

        return [
            'csts_idt' => (int) ($raw['idt'] ?? 0),
            'full_name' => $fullName,
            'name' => $firstName,
            'surname' => $surname,
            'sex' => $raw['sex'] ?? null,
            'category_lat' => $catLat,
            'points_lat' => $pointsLat,
            'finals_lat' => $finalsLat,
            'partner_lat_name' => $partnerLatName,
            'partner_lat_idt' => $partnerLatIdt,
            'category_stt' => $catStt,
            'points_stt' => $pointsStt,
            'finals_stt' => $finalsStt,
            'partner_stt_name' => $partnerSttName,
            'partner_stt_idt' => $partnerSttIdt,
            'suggested_partner_idt' => $suggestedPartnerIdt,
            'suggested_partner_name' => $suggestedPartnerName,
        ];
    }

    /**
     * Vytvoří nebo aktualizuje tanečníka v databázi z ČSTS,
     * a volitelně naimportuje partnera a vytvoří/propojí pár.
     */
    public function importOrUpdateAthlete(PDO $pdo, int $idt, bool $linkPartner = true): array
    {
        $athlete = $this->fetchAthlete($idt);
        if (!$athlete) {
            throw new RuntimeException("Tanečník s IDT {$idt} nebyl v ČSTS nalezen nebo se nepodařilo spojit se serverem.");
        }

        // 1. Zjistit, zda tanečník už existuje (dle csts_idt nebo jména a příjmení)
        $findStmt = $pdo->prepare(
            'SELECT idt, name, surname, csts_idt FROM dancers 
             WHERE csts_idt = :csts_idt 
                OR (LOWER(name) = LOWER(:name) AND LOWER(surname) = LOWER(:surname))
             LIMIT 1'
        );
        $findStmt->execute([
            ':csts_idt' => $athlete['csts_idt'],
            ':name' => $athlete['name'],
            ':surname' => $athlete['surname'],
        ]);
        $existing = $findStmt->fetch();

        $dancerId = null;

        if ($existing) {
            $dancerId = (int) $existing['idt'];
            $updateStmt = $pdo->prepare(
                'UPDATE dancers
                 SET
                    name = :name,
                    surname = :surname,
                    category_lat = COALESCE(:category_lat, category_lat),
                    category_stt = COALESCE(:category_stt, category_stt),
                    points_lat = :points_lat,
                    finals_lat = :finals_lat,
                    points_stt = :points_stt,
                    finals_stt = :finals_stt,
                    csts_idt = :csts_idt,
                    csts_synced_at = NOW()
                 WHERE idt = :idt'
            );
            $updateStmt->execute([
                ':idt' => $dancerId,
                ':name' => $athlete['name'] !== '' ? $athlete['name'] : $existing['name'],
                ':surname' => $athlete['surname'] !== '' ? $athlete['surname'] : $existing['surname'],
                ':category_lat' => $athlete['category_lat'],
                ':category_stt' => $athlete['category_stt'],
                ':points_lat' => $athlete['points_lat'],
                ':finals_lat' => $athlete['finals_lat'],
                ':points_stt' => $athlete['points_stt'],
                ':finals_stt' => $athlete['finals_stt'],
                ':csts_idt' => $athlete['csts_idt'],
            ]);
        } else {
            $insertStmt = $pdo->prepare(
                'INSERT INTO dancers (
                    name,
                    surname,
                    category_lat,
                    category_stt,
                    points_lat,
                    finals_lat,
                    points_stt,
                    finals_stt,
                    csts_idt,
                    csts_synced_at,
                    is_active,
                    is_public,
                    display_order
                 ) VALUES (
                    :name,
                    :surname,
                    :category_lat,
                    :category_stt,
                    :points_lat,
                    :finals_lat,
                    :points_stt,
                    :finals_stt,
                    :csts_idt,
                    NOW(),
                    TRUE,
                    TRUE,
                    0
                 ) RETURNING idt'
            );
            $insertStmt->execute([
                ':name' => $athlete['name'],
                ':surname' => $athlete['surname'],
                ':category_lat' => $athlete['category_lat'],
                ':category_stt' => $athlete['category_stt'],
                ':points_lat' => $athlete['points_lat'],
                ':finals_lat' => $athlete['finals_lat'],
                ':points_stt' => $athlete['points_stt'],
                ':finals_stt' => $athlete['finals_stt'],
                ':csts_idt' => $athlete['csts_idt'],
            ]);
            $dancerId = (int) $insertStmt->fetch()['idt'];
        }

        $createdPairs = [];

        // 2. Pokud má tanečník partnera a je povoleno párování
        // Podporuje jak jednoho partnera pro obě disciplíny, tak různé partnery na LAT a STT
        if ($linkPartner) {
            $pLatIdt = $athlete['partner_lat_idt'] ?? null;
            $pLatName = $athlete['partner_lat_name'] ?? null;
            $pSttIdt = $athlete['partner_stt_idt'] ?? null;
            $pSttName = $athlete['partner_stt_name'] ?? null;

            if ($pLatIdt && $pSttIdt && $pLatIdt === $pSttIdt) {
                // Stejný partner pro LAT i STT
                $pId = $this->linkPairForDiscipline(
                    $pdo,
                    $dancerId,
                    $pLatIdt,
                    $pLatName,
                    $athlete['category_lat'],
                    $athlete['points_lat'],
                    $athlete['finals_lat'],
                    $athlete['category_stt'],
                    $athlete['points_stt'],
                    $athlete['finals_stt']
                );
                if ($pId) {
                    $createdPairs[] = $pId;
                }
            } else {
                // Různí partneři pro LAT a STT (nebo pouze jeden z nich)
                if ($pLatIdt) {
                    $pId = $this->linkPairForDiscipline(
                        $pdo,
                        $dancerId,
                        $pLatIdt,
                        $pLatName,
                        $athlete['category_lat'],
                        $athlete['points_lat'],
                        $athlete['finals_lat'],
                        null,
                        0,
                        0
                    );
                    if ($pId) {
                        $createdPairs[] = $pId;
                    }
                }

                if ($pSttIdt) {
                    $pId = $this->linkPairForDiscipline(
                        $pdo,
                        $dancerId,
                        $pSttIdt,
                        $pSttName,
                        null,
                        0,
                        0,
                        $athlete['category_stt'],
                        $athlete['points_stt'],
                        $athlete['finals_stt']
                    );
                    if ($pId) {
                        $createdPairs[] = $pId;
                    }
                }
            }
        }

        return [
            'dancer_id' => $dancerId,
            'athlete' => $athlete,
            'pair_ids' => $createdPairs,
            'pair_id' => $createdPairs[0] ?? null,
        ];
    }

    /**
     * Zajistí vytvoření nebo aktualizaci propojení v dance_pairs pro danou disciplínu a partnera.
     */
    private function linkPairForDiscipline(
        PDO $pdo,
        int $dancerId,
        int $partnerIdt,
        ?string $partnerKnownName,
        ?string $categoryLat,
        int $pointsLat,
        int $finalsLat,
        ?string $categoryStt,
        int $pointsStt,
        int $finalsStt
    ): ?int {
        // 1. Vyhledat partnera v DB (dle csts_idt nebo jména)
        $findPartnerStmt = $pdo->prepare(
            'SELECT idt, name, surname FROM dancers WHERE csts_idt = :csts_idt LIMIT 1'
        );
        $findPartnerStmt->execute([':csts_idt' => $partnerIdt]);
        $partnerRow = $findPartnerStmt->fetch();

        // Pokud nebyl nalezen dle csts_idt, zkusíme vyhledat dle jména (pokud existuje)
        if (!$partnerRow && !empty($partnerKnownName)) {
            $parts = preg_split('/\s+/', trim($partnerKnownName));
            $pSurname = count($parts) > 1 ? array_pop($parts) : '';
            $pFirstName = implode(' ', $parts);

            $findByNameStmt = $pdo->prepare(
                'SELECT idt, name, surname FROM dancers 
                 WHERE LOWER(name) = LOWER(:name) AND LOWER(surname) = LOWER(:surname)
                 LIMIT 1'
            );
            $findByNameStmt->execute([':name' => $pFirstName, ':surname' => $pSurname]);
            $partnerRow = $findByNameStmt->fetch();
            if ($partnerRow) {
                // Doplnit csts_idt
                $updCsts = $pdo->prepare('UPDATE dancers SET csts_idt = :csts_idt WHERE idt = :idt');
                $updCsts->execute([':csts_idt' => $partnerIdt, ':idt' => $partnerRow['idt']]);
            }
        }

        $partnerDancerId = null;
        if ($partnerRow) {
            $partnerDancerId = (int) $partnerRow['idt'];
        } else {
            // Šetrná prodleva před voláním dalšího partnera z ČSTS proti 429
            sleep(2);
            try {
                $partnerRes = $this->importOrUpdateAthlete($pdo, $partnerIdt, false);
                $partnerDancerId = $partnerRes['dancer_id'] ?? null;
            } catch (Throwable $e) {
                error_log("Chyba při stahování partnera IDT {$partnerIdt} z ČSTS: " . $e->getMessage());

                // Fallback: Pokud se nepodařilo stáhnout profil z ČSTS (např. rate limit),
                // ale známe jméno a příjmení z nadřazeného profilu, vytvoříme ho přímo
                if (!empty($partnerKnownName)) {
                    $parts = preg_split('/\s+/', trim($partnerKnownName));
                    $pSurname = count($parts) > 1 ? array_pop($parts) : '';
                    $pFirstName = implode(' ', $parts);

                    $fallbackStmt = $pdo->prepare(
                        'INSERT INTO dancers (
                            name,
                            surname,
                            category_lat,
                            category_stt,
                            points_lat,
                            finals_lat,
                            points_stt,
                            finals_stt,
                            csts_idt,
                            csts_synced_at,
                            is_active,
                            is_public,
                            display_order
                         ) VALUES (
                            :name,
                            :surname,
                            :category_lat,
                            :category_stt,
                            :points_lat,
                            :finals_lat,
                            :points_stt,
                            :finals_stt,
                            :csts_idt,
                            NOW(),
                            TRUE,
                            TRUE,
                            0
                         ) RETURNING idt'
                    );
                    $fallbackStmt->execute([
                        ':name' => $pFirstName,
                        ':surname' => $pSurname,
                        ':category_lat' => $categoryLat,
                        ':category_stt' => $categoryStt,
                        ':points_lat' => $pointsLat,
                        ':finals_lat' => $finalsLat,
                        ':points_stt' => $pointsStt,
                        ':finals_stt' => $finalsStt,
                        ':csts_idt' => $partnerIdt,
                    ]);
                    $partnerDancerId = (int) $fallbackStmt->fetch()['idt'];
                }
            }
        }

        if (!$partnerDancerId || $partnerDancerId === $dancerId) {
            return null;
        }

        $firstId = min($dancerId, $partnerDancerId);
        $secondId = max($dancerId, $partnerDancerId);

        $findPairStmt = $pdo->prepare(
            'SELECT pair_id FROM dance_pairs 
             WHERE (idt1 = :idt1 AND idt2 = :idt2) OR (idt1 = :idt2 AND idt2 = :idt1)
             LIMIT 1'
        );
        $findPairStmt->execute([
            ':idt1' => $firstId,
            ':idt2' => $secondId,
        ]);
        $pairRow = $findPairStmt->fetch();

        if ($pairRow) {
            $pairId = (int) $pairRow['pair_id'];
            $updatePair = $pdo->prepare(
                'UPDATE dance_pairs
                 SET category_lat = COALESCE(:category_lat, category_lat),
                     category_stt = COALESCE(:category_stt, category_stt),
                     points_lat = CASE WHEN :has_lat = 1 THEN :points_lat ELSE points_lat END,
                     finals_lat = CASE WHEN :has_lat = 1 THEN :finals_lat ELSE finals_lat END,
                     points_stt = CASE WHEN :has_stt = 1 THEN :points_stt ELSE points_stt END,
                     finals_stt = CASE WHEN :has_stt = 1 THEN :finals_stt ELSE finals_stt END,
                     csts_synced_at = NOW()
                 WHERE pair_id = :pair_id'
            );
            $updatePair->execute([
                ':pair_id' => $pairId,
                ':category_lat' => $categoryLat,
                ':category_stt' => $categoryStt,
                ':has_lat' => $categoryLat !== null ? 1 : 0,
                ':points_lat' => $pointsLat,
                ':finals_lat' => $finalsLat,
                ':has_stt' => $categoryStt !== null ? 1 : 0,
                ':points_stt' => $pointsStt,
                ':finals_stt' => $finalsStt,
            ]);
            return $pairId;
        }

        $insertPair = $pdo->prepare(
            'INSERT INTO dance_pairs (
                idt1,
                idt2,
                category_lat,
                category_stt,
                points_lat,
                finals_lat,
                points_stt,
                finals_stt,
                csts_synced_at,
                is_active,
                is_public,
                display_order
             ) VALUES (
                :idt1,
                :idt2,
                :category_lat,
                :category_stt,
                :points_lat,
                :finals_lat,
                :points_stt,
                :finals_stt,
                NOW(),
                TRUE,
                TRUE,
                0
             ) RETURNING pair_id'
        );
        $insertPair->execute([
            ':idt1' => $firstId,
            ':idt2' => $secondId,
            ':category_lat' => $categoryLat,
            ':category_stt' => $categoryStt,
            ':points_lat' => $pointsLat,
            ':finals_lat' => $finalsLat,
            ':points_stt' => $pointsStt,
            ':finals_stt' => $finalsStt,
        ]);
        return (int) $insertPair->fetch()['pair_id'];
    }

    /**
     * Hromadná synchronizace všech aktivních tanečníků s ČSTS IDT.
     * Dodržuje bezpečnostní prodlevu mezi voláními, aby nedošlo k blokaci.
     */
    public function syncAllActive(PDO $pdo): array
    {
        $stmt = $pdo->query(
            'SELECT idt, csts_idt, name, surname 
             FROM dancers 
             WHERE csts_idt IS NOT NULL AND csts_idt > 0 AND is_active = TRUE
             ORDER BY idt'
        );
        $dancers = $stmt->fetchAll();

        $updatedCount = 0;
        $errors = [];

        foreach ($dancers as $dancer) {
            $idt = (int) $dancer['csts_idt'];
            try {
                $athlete = $this->fetchAthlete($idt);
                if ($athlete) {
                    $updateStmt = $pdo->prepare(
                        'UPDATE dancers
                         SET category_lat = COALESCE(:category_lat, category_lat),
                             category_stt = COALESCE(:category_stt, category_stt),
                             points_lat = :points_lat,
                             finals_lat = :finals_lat,
                             points_stt = :points_stt,
                             finals_stt = :finals_stt,
                             csts_synced_at = NOW()
                         WHERE idt = :idt'
                    );
                    $updateStmt->execute([
                        ':idt' => $dancer['idt'],
                        ':category_lat' => $athlete['category_lat'],
                        ':category_stt' => $athlete['category_stt'],
                        ':points_lat' => $athlete['points_lat'],
                        ':finals_lat' => $athlete['finals_lat'],
                        ':points_stt' => $athlete['points_stt'],
                        ':finals_stt' => $athlete['finals_stt'],
                    ]);

                    // Aktualizovat i spojené páry pro LAT a STT
                    $pLatIdt = $athlete['partner_lat_idt'] ?? null;
                    $pSttIdt = $athlete['partner_stt_idt'] ?? null;

                    if ($pLatIdt) {
                        $this->linkPairForDiscipline(
                            $pdo,
                            (int) $dancer['idt'],
                            (int) $pLatIdt,
                            $athlete['category_lat'],
                            $athlete['points_lat'],
                            $athlete['finals_lat'],
                            ($pSttIdt === $pLatIdt) ? $athlete['category_stt'] : null,
                            ($pSttIdt === $pLatIdt) ? $athlete['points_stt'] : 0,
                            ($pSttIdt === $pLatIdt) ? $athlete['finals_stt'] : 0
                        );
                    }

                    if ($pSttIdt && $pSttIdt !== $pLatIdt) {
                        $this->linkPairForDiscipline(
                            $pdo,
                            (int) $dancer['idt'],
                            (int) $pSttIdt,
                            null,
                            0,
                            0,
                            $athlete['category_stt'],
                            $athlete['points_stt'],
                            $athlete['finals_stt']
                        );
                    }

                    $updatedCount++;
                } else {
                    $errors[] = "Nepodařilo se stáhnout data pro tanečníka {$dancer['name']} {$dancer['surname']} (IDT {$idt}) z ČSTS.";
                }
            } catch (Throwable $e) {
                $errors[] = "Chyba u tanečníka {$dancer['name']} {$dancer['surname']} (IDT {$idt}): " . $e->getMessage();
            }

            // Šetrná prodleva 2 sekundy proti rate-limitingu ČSTS
            usleep(2000000);
        }

        return [
            'total_active' => count($dancers),
            'synced' => $updatedCount,
            'errors' => $errors,
            'synced_at' => date('Y-m-d H:i:s'),
        ];
    }
}
