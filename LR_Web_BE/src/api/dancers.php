<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../services/CstsService.php';
header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requireAuth(): void
{
    if (empty($_SESSION['authenticated'])) {
        respond(401, [
            'status' => 'error',
            'message' => 'Nepřihlášen.',
        ]);
    }
}

function input(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!is_array($payload)) {
        respond(400, [
            'status' => 'error',
            'message' => 'Neplatná JSON data.',
        ]);
    }

    return $payload;
}

function boolValue(mixed $value, bool $default = true): bool
{
    if ($value === null || $value === '') {
        return $default;
    }

    if (is_bool($value)) {
        return $value;
    }

    return filter_var(
        $value,
        FILTER_VALIDATE_BOOLEAN,
        FILTER_NULL_ON_FAILURE
    ) ?? $default;
}

function toPgBool(mixed $value, bool $default = true): string
{
    return boolValue($value, $default) ? 'true' : 'false';
}

function validateCategory(?string $value): ?string
{
    $value = strtoupper(trim((string) $value));

    if ($value === '') {
        return null;
    }

    if (!in_array($value, ['M', 'A', 'B', 'C', 'D', 'E'], true)) {
        respond(400, [
            'status' => 'error',
            'message' => 'Třída musí být M, A, B, C, D nebo E.',
        ]);
    }

    return $value;
}

function categoryRank(?string $category): int
{
    return match ($category) {
        'M' => 6,
        'A' => 5,
        'B' => 4,
        'C' => 3,
        'D' => 2,
        'E' => 1,
        default => 0,
    };
}

try {
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        getenv('DB_HOST') ?: 'postgres',
        getenv('DB_PORT') ?: '5432',
        getenv('DB_NAME')
    );

    $pdo = new PDO(
        $dsn,
        getenv('DB_USER'),
        getenv('DB_PASSWORD'),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $exception) {
    respond(500, [
        'status' => 'error',
        'message' => 'Chyba připojení k databázi.',
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Náhled z ČSTS API
    if (($_GET['action'] ?? '') === 'csts_preview') {
        requireAuth();
        $idt = (int) ($_GET['idt'] ?? 0);
        if ($idt <= 0) {
            respond(400, [
                'status' => 'error',
                'message' => 'Zadej platné ČSTS IDT.',
            ]);
        }

        $service = new CstsService();
        $athlete = $service->fetchAthlete($idt);
        if (!$athlete) {
            respond(404, [
                'status' => 'error',
                'message' => "Tanečník s IDT {$idt} nebyl v ČSTS nalezen nebo je služba dočasně nedostupná.",
            ]);
        }

        respond(200, [
            'status' => 'success',
            'data' => $athlete,
        ]);
    }

    $view = $_GET['view'] ?? 'pairs';
    $admin = ($_GET['admin'] ?? '') === '1';

    if ($admin) {
        requireAuth();

        $dancers = $pdo->query(
            'SELECT
                idt,
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
             FROM dancers
             ORDER BY surname, name'
        )->fetchAll();

        $pairs = $pdo->query(
            'SELECT
                p.pair_id,
                p.idt1,
                p.idt2,
                p.category_lat,
                p.category_stt,
                p.points,
                p.finals,
                p.points_lat,
                p.finals_lat,
                p.points_stt,
                p.finals_stt,
                p.csts_synced_at,
                p.is_active,
                p.is_public,
                p.display_order,
                d1.name AS dancer1_name,
                d1.surname AS dancer1_surname,
                d2.name AS dancer2_name,
                d2.surname AS dancer2_surname
             FROM dance_pairs p
             JOIN dancers d1 ON d1.idt = p.idt1
             LEFT JOIN dancers d2 ON d2.idt = p.idt2
             ORDER BY p.display_order, d1.surname, d2.surname'
        )->fetchAll();

        $results = $pdo->query(
            'SELECT
                r.id,
                r.pair_id,
                r.competition_name,
                r.date,
                r.location,
                r.placement,
                d1.name || \' \' || d1.surname AS dancer1,
                CASE WHEN d2.idt IS NOT NULL THEN d2.name || \' \' || d2.surname ELSE NULL END AS dancer2
             FROM competition_results r
             JOIN dance_pairs p ON p.pair_id = r.pair_id
             JOIN dancers d1 ON d1.idt = p.idt1
             LEFT JOIN dancers d2 ON d2.idt = p.idt2
             ORDER BY r.date DESC, r.id DESC'
        )->fetchAll();

        respond(200, [
            'status' => 'success',
            'data' => [
                'dancers' => $dancers,
                'pairs' => $pairs,
                'results' => $results,
            ],
        ]);
    }

    if ($view === 'pairs') {
        $rows = $pdo->query(
            'SELECT
                p.pair_id,
                p.category_lat AS pair_category_lat,
                p.category_stt AS pair_category_stt,
                p.points,
                p.finals,
                p.points_lat,
                p.finals_lat,
                p.points_stt,
                p.finals_stt,
                p.csts_synced_at,
                p.display_order,
                d1.idt AS dancer1_id,
                d1.name AS dancer1_name,
                d1.surname AS dancer1_surname,
                d1.category_lat AS dancer1_lat,
                d1.category_stt AS dancer1_stt,
                d1.points_lat AS d1_points_lat,
                d1.finals_lat AS d1_finals_lat,
                d1.points_stt AS d1_points_stt,
                d1.finals_stt AS d1_finals_stt,
                d2.idt AS dancer2_id,
                d2.name AS dancer2_name,
                d2.surname AS dancer2_surname,
                d2.category_lat AS dancer2_lat,
                d2.category_stt AS dancer2_stt,
                d2.points_lat AS d2_points_lat,
                d2.finals_lat AS d2_finals_lat,
                d2.points_stt AS d2_points_stt,
                d2.finals_stt AS d2_finals_stt
             FROM dance_pairs p
             JOIN dancers d1 ON d1.idt = p.idt1
             LEFT JOIN dancers d2 ON d2.idt = p.idt2
             WHERE
                p.is_active = TRUE
                AND p.is_public = TRUE
                AND d1.is_active = TRUE
                AND d1.is_public = TRUE
                AND (d2.idt IS NULL OR (d2.is_active = TRUE AND d2.is_public = TRUE))'
        )->fetchAll();

        $pairs = array_map(static function (array $row): array {
            $hasDancer2 = !empty($row['dancer2_id']);

            $hasExplicitCategories = ($row['pair_category_lat'] !== null || $row['pair_category_stt'] !== null);

            if ($hasExplicitCategories) {
                $lat = $row['pair_category_lat'];
                $stt = $row['pair_category_stt'];
            } else {
                $latCategories = array_filter([
                    $row['dancer1_lat'],
                    $hasDancer2 ? $row['dancer2_lat'] : null,
                ]);

                $sttCategories = array_filter([
                    $row['dancer1_stt'],
                    $hasDancer2 ? $row['dancer2_stt'] : null,
                ]);

                usort(
                    $latCategories,
                    static fn ($a, $b) => categoryRank($b) <=> categoryRank($a)
                );

                usort(
                    $sttCategories,
                    static fn ($a, $b) => categoryRank($b) <=> categoryRank($a)
                );

                $lat = $latCategories[0] ?? null;
                $stt = $sttCategories[0] ?? null;
            }

            $pointsLat = $lat ? (int) ($row['points_lat'] ?: $row['d1_points_lat']) : 0;
            $finalsLat = $lat ? (int) ($row['finals_lat'] ?: $row['d1_finals_lat']) : 0;
            $pointsStt = $stt ? (int) ($row['points_stt'] ?: $row['d1_points_stt']) : 0;
            $finalsStt = $stt ? (int) ($row['finals_stt'] ?: $row['d1_finals_stt']) : 0;

            return [
                'pair_id' => (int) $row['pair_id'],
                'is_solo' => !$hasDancer2,
                'dancer1' => [
                    'id' => (int) $row['dancer1_id'],
                    'name' => $row['dancer1_name'],
                    'surname' => $row['dancer1_surname'],
                ],
                'dancer2' => $hasDancer2 ? [
                    'id' => (int) $row['dancer2_id'],
                    'name' => $row['dancer2_name'],
                    'surname' => $row['dancer2_surname'],
                ] : null,
                'category_lat' => $lat,
                'category_stt' => $stt,
                'points' => (int) $row['points'],
                'finals' => (bool) $row['finals'],
                'points_lat' => $pointsLat,
                'finals_lat' => $finalsLat,
                'points_stt' => $pointsStt,
                'finals_stt' => $finalsStt,
                'csts_synced_at' => $row['csts_synced_at'] ?? null,
                'display_order' => (int) $row['display_order'],
                'best_rank' => max(categoryRank($lat), categoryRank($stt)),
            ];
        }, $rows);

        usort($pairs, static function (array $a, array $b): int {
            return
                $b['best_rank'] <=> $a['best_rank']
                ?: $b['points'] <=> $a['points']
                ?: $a['display_order'] <=> $b['display_order']
                ?: strcmp(
                    $a['dancer1']['surname'],
                    $b['dancer1']['surname']
                );
        });

        respond(200, [
            'status' => 'success',
            'data' => $pairs,
        ]);
    }

    if ($view === 'singles') {
        $statement = $pdo->query(
            'SELECT
                d.idt,
                d.name,
                d.surname,
                d.category_lat,
                d.category_stt,
                d.points_lat,
                d.finals_lat,
                d.points_stt,
                d.finals_stt,
                d.display_order
             FROM dancers d
             WHERE
                d.is_active = TRUE
                AND d.is_public = TRUE
                AND NOT EXISTS (
                    SELECT 1
                    FROM dance_pairs p
                    WHERE
                        p.is_active = TRUE
                        AND p.is_public = TRUE
                        AND (p.idt1 = d.idt OR p.idt2 = d.idt)
                )
             ORDER BY
                CASE d.category_lat
                    WHEN \'M\' THEN 6
                    WHEN \'A\' THEN 5
                    WHEN \'B\' THEN 4
                    WHEN \'C\' THEN 3
                    WHEN \'D\' THEN 2
                    WHEN \'E\' THEN 1
                    ELSE 0
                END DESC,
                CASE d.category_stt
                    WHEN \'M\' THEN 6
                    WHEN \'A\' THEN 5
                    WHEN \'B\' THEN 4
                    WHEN \'C\' THEN 3
                    WHEN \'D\' THEN 2
                    WHEN \'E\' THEN 1
                    ELSE 0
                END DESC,
                d.display_order,
                d.surname,
                d.name'
        );

        respond(200, [
            'status' => 'success',
            'data' => $statement->fetchAll(),
        ]);
    }

    if ($view === 'results') {
        $rows = $pdo->query(
            'SELECT
                r.id,
                r.pair_id,
                r.competition_name,
                r.date,
                r.location,
                r.placement,
                d1.name AS dancer1_name,
                d1.surname AS dancer1_surname,
                d2.name AS dancer2_name,
                d2.surname AS dancer2_surname,
                d1.name || \' \' || d1.surname AS dancer1,
                CASE WHEN d2.idt IS NOT NULL THEN d2.name || \' \' || d2.surname ELSE NULL END AS dancer2
             FROM competition_results r
             JOIN dance_pairs p ON p.pair_id = r.pair_id
             JOIN dancers d1 ON d1.idt = p.idt1
             LEFT JOIN dancers d2 ON d2.idt = p.idt2
             WHERE
                p.is_active = TRUE
                AND p.is_public = TRUE
             ORDER BY r.date DESC, r.id DESC'
        )->fetchAll();

        respond(200, [
            'status' => 'success',
            'data' => $rows,
        ]);
    }

    respond(400, [
        'status' => 'error',
        'message' => 'Neplatný view parametr.',
    ]);
}

requireAuth();

$payload = input();
$action = $payload['action'] ?? '';

// 1. Vytvoření / import tanečníka přímo z ČSTS podle IDT
if ($method === 'POST' && $action === 'create_from_csts') {
    $idt = (int) ($payload['idt'] ?? 0);
    $linkPartner = boolValue($payload['link_partner'] ?? true, true);

    if ($idt <= 0) {
        respond(400, [
            'status' => 'error',
            'message' => 'Zadej platné ČSTS IDT.',
        ]);
    }

    try {
        $service = new CstsService();
        $result = $service->importOrUpdateAthlete($pdo, $idt, $linkPartner);

        $pairCount = count($result['pair_ids'] ?? []);
        $msg = 'Tanečník ' . ($result['athlete']['full_name'] ?? '') . ' byl úspěšně importován z ČSTS.';
        if ($pairCount > 0) {
            $msg .= " Vytvořeno/propojeno párů: {$pairCount}.";
        }

        respond(201, [
            'status' => 'success',
            'message' => $msg,
            'data' => $result,
        ]);
    } catch (Throwable $e) {
        respond(500, [
            'status' => 'error',
            'message' => $e->getMessage(),
        ]);
    }
}

// 2. Ruční spuštění hromadné synchronizace bodů z ČSTS pro všechny aktivní páry/tanečníky
if ($method === 'POST' && $action === 'sync_csts') {
    try {
        $service = new CstsService();
        $result = $service->syncAllActive($pdo);

        respond(200, [
            'status' => 'success',
            'message' => sprintf(
                'Synchronizace s ČSTS dokončena. Aktualizováno %d z %d aktivních tanečníků.',
                $result['synced'],
                $result['total_active']
            ),
            'data' => $result,
        ]);
    } catch (Throwable $e) {
        respond(500, [
            'status' => 'error',
            'message' => 'Chyba synchronizace s ČSTS: ' . $e->getMessage(),
        ]);
    }
}

if ($method === 'POST' && $action === 'create_dancer') {
    $name = trim((string) ($payload['name'] ?? ''));
    $surname = trim((string) ($payload['surname'] ?? ''));

    if ($name === '' || $surname === '') {
        respond(400, [
            'status' => 'error',
            'message' => 'Jméno i příjmení jsou povinné.',
        ]);
    }

    $cstsIdt = !empty($payload['csts_idt']) && (int) $payload['csts_idt'] > 0 ? (int) $payload['csts_idt'] : null;

    $statement = $pdo->prepare(
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
            :is_active,
            :is_public,
            :display_order
         ) RETURNING idt'
    );

    try {
        $statement->execute([
            ':name' => $name,
            ':surname' => $surname,
            ':category_lat' => validateCategory($payload['category_lat'] ?? null),
            ':category_stt' => validateCategory($payload['category_stt'] ?? null),
            ':points_lat' => (int) ($payload['points_lat'] ?? 0),
            ':finals_lat' => (int) ($payload['finals_lat'] ?? 0),
            ':points_stt' => (int) ($payload['points_stt'] ?? 0),
            ':finals_stt' => (int) ($payload['finals_stt'] ?? 0),
            ':csts_idt' => $cstsIdt,
            ':is_active' => toPgBool($payload['is_active'] ?? true),
            ':is_public' => toPgBool($payload['is_public'] ?? true),
            ':display_order' => (int) ($payload['display_order'] ?? 0),
        ]);

        respond(201, [
            'status' => 'success',
            'id' => $statement->fetch()['idt'],
            'message' => 'Tanečník přidán.',
        ]);
    } catch (Throwable $e) {
        respond(500, [
            'status' => 'error',
            'message' => 'Chyba při ukládání tanečníka: ' . $e->getMessage(),
        ]);
    }
}

if ($method === 'PUT' && $action === 'update_dancer') {
    $id = (int) ($payload['idt'] ?? 0);
    $name = trim((string) ($payload['name'] ?? ''));
    $surname = trim((string) ($payload['surname'] ?? ''));

    if ($id <= 0 || $name === '' || $surname === '') {
        respond(400, [
            'status' => 'error',
            'message' => 'Chybí ID, jméno nebo příjmení.',
        ]);
    }

    $cstsIdt = !empty($payload['csts_idt']) && (int) $payload['csts_idt'] > 0 ? (int) $payload['csts_idt'] : null;

    $statement = $pdo->prepare(
        'UPDATE dancers
         SET
            name = :name,
            surname = :surname,
            category_lat = :category_lat,
            category_stt = :category_stt,
            points_lat = :points_lat,
            finals_lat = :finals_lat,
            points_stt = :points_stt,
            finals_stt = :finals_stt,
            csts_idt = :csts_idt,
            is_active = :is_active,
            is_public = :is_public,
            display_order = :display_order
         WHERE idt = :idt'
    );

    try {
        $statement->execute([
            ':idt' => $id,
            ':name' => $name,
            ':surname' => $surname,
            ':category_lat' => validateCategory($payload['category_lat'] ?? null),
            ':category_stt' => validateCategory($payload['category_stt'] ?? null),
            ':points_lat' => (int) ($payload['points_lat'] ?? 0),
            ':finals_lat' => (int) ($payload['finals_lat'] ?? 0),
            ':points_stt' => (int) ($payload['points_stt'] ?? 0),
            ':finals_stt' => (int) ($payload['finals_stt'] ?? 0),
            ':csts_idt' => $cstsIdt,
            ':is_active' => toPgBool($payload['is_active'] ?? true),
            ':is_public' => toPgBool($payload['is_public'] ?? true),
            ':display_order' => (int) ($payload['display_order'] ?? 0),
        ]);

        respond(200, [
            'status' => 'success',
            'message' => 'Tanečník upraven.',
        ]);
    } catch (Throwable $e) {
        respond(500, [
            'status' => 'error',
            'message' => 'Chyba při úpravě tanečníka: ' . $e->getMessage(),
        ]);
    }
}

if ($method === 'POST' && $action === 'create_pair') {
    $idt1 = (int) ($payload['idt1'] ?? 0);
    $rawIdt2 = $payload['idt2'] ?? null;
    $idt2 = ($rawIdt2 !== null && $rawIdt2 !== '' && (int) $rawIdt2 > 0) ? (int) $rawIdt2 : null;

    if ($idt1 <= 0) {
        respond(400, [
            'status' => 'error',
            'message' => 'Vyber hlavního tanečníka.',
        ]);
    }

    if ($idt2 !== null && $idt1 === $idt2) {
        respond(400, [
            'status' => 'error',
            'message' => 'Pár musí tvořit dva různí tanečníci (nebo ponech druhého prázdného pro sólo).',
        ]);
    }

    if ($idt2 === null) {
        $existingPair = $pdo->prepare(
            'SELECT pair_id
             FROM dance_pairs
             WHERE idt1 = :idt1 AND idt2 IS NULL
             LIMIT 1'
        );
        $existingPair->execute([':idt1' => $idt1]);
    } else {
        $firstId = min($idt1, $idt2);
        $secondId = max($idt1, $idt2);

        $existingPair = $pdo->prepare(
            'SELECT pair_id
             FROM dance_pairs
             WHERE (idt1 = :idt1 AND idt2 = :idt2) OR (idt1 = :idt2 AND idt2 = :idt1)
             LIMIT 1'
        );
        $existingPair->execute([
            ':idt1' => $firstId,
            ':idt2' => $secondId,
        ]);
    }

    $existing = $existingPair->fetch();

    if ($existing) {
        respond(409, [
            'status' => 'error',
            'message' => $idt2 === null ? 'Tento tanečník již má vytvořenou sólo registraci.' : 'Tento taneční pár již existuje.',
            'pair_id' => (int) $existing['pair_id'],
        ]);
    }

    $firstId = $idt2 !== null ? min($idt1, $idt2) : $idt1;
    $secondId = $idt2 !== null ? max($idt1, $idt2) : null;

    $statement = $pdo->prepare(
        'INSERT INTO dance_pairs (
            idt1,
            idt2,
            category_lat,
            category_stt,
            points_lat,
            finals_lat,
            points_stt,
            finals_stt,
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
            :is_active,
            :is_public,
            :display_order
        )
        RETURNING pair_id'
    );

    try {
        $statement->execute([
            ':idt1' => $firstId,
            ':idt2' => $secondId,
            ':category_lat' => validateCategory($payload['category_lat'] ?? null),
            ':category_stt' => validateCategory($payload['category_stt'] ?? null),
            ':points_lat' => (int) ($payload['points_lat'] ?? 0),
            ':finals_lat' => (int) ($payload['finals_lat'] ?? 0),
            ':points_stt' => (int) ($payload['points_stt'] ?? 0),
            ':finals_stt' => (int) ($payload['finals_stt'] ?? 0),
            ':is_active' => toPgBool($payload['is_active'] ?? true),
            ':is_public' => toPgBool($payload['is_public'] ?? true),
            ':display_order' => (int) ($payload['display_order'] ?? 0),
        ]);

        $createdPair = $statement->fetch();

        respond(201, [
            'status' => 'success',
            'id' => (int) $createdPair['pair_id'],
            'message' => $idt2 === null ? 'Sólo tanečník zaregistrován.' : 'Taneční pár vytvořen.',
        ]);
    } catch (PDOException $exception) {
        if ($exception->getCode() === '23505') {
            respond(409, [
                'status' => 'error',
                'message' => $idt2 === null ? 'Tento tanečník již má vytvořenou sólo registraci.' : 'Tento taneční pár již existuje.',
            ]);
        }

        throw $exception;
    }
}

if ($method === 'PUT' && $action === 'update_pair') {
    $pairId = (int) ($payload['pair_id'] ?? 0);

    if ($pairId <= 0) {
        respond(400, [
            'status' => 'error',
            'message' => 'Chybí ID páru.',
        ]);
    }

    $statement = $pdo->prepare(
        'UPDATE dance_pairs
         SET
            category_lat = :category_lat,
            category_stt = :category_stt,
            points_lat = :points_lat,
            finals_lat = :finals_lat,
            points_stt = :points_stt,
            finals_stt = :finals_stt,
            is_active = :is_active,
            is_public = :is_public,
            display_order = :display_order
         WHERE pair_id = :pair_id'
    );

    try {
        $statement->execute([
            ':pair_id' => $pairId,
            ':category_lat' => validateCategory($payload['category_lat'] ?? null),
            ':category_stt' => validateCategory($payload['category_stt'] ?? null),
            ':points_lat' => (int) ($payload['points_lat'] ?? 0),
            ':finals_lat' => (int) ($payload['finals_lat'] ?? 0),
            ':points_stt' => (int) ($payload['points_stt'] ?? 0),
            ':finals_stt' => (int) ($payload['finals_stt'] ?? 0),
            ':is_active' => toPgBool($payload['is_active'] ?? true),
            ':is_public' => toPgBool($payload['is_public'] ?? true),
            ':display_order' => (int) ($payload['display_order'] ?? 0),
        ]);

        respond(200, [
            'status' => 'success',
            'message' => 'Taneční pár upraven.',
        ]);
    } catch (Throwable $e) {
        respond(500, [
            'status' => 'error',
            'message' => 'Chyba při úpravě tanečního páru: ' . $e->getMessage(),
        ]);
    }
}

if ($method === 'POST' && $action === 'create_result') {
    $competition = trim((string) ($payload['competition_name'] ?? ''));
    $location = trim((string) ($payload['location'] ?? ''));
    $date = trim((string) ($payload['date'] ?? ''));

    if ($competition === '' || $location === '' || $date === '') {
        respond(400, [
            'status' => 'error',
            'message' => 'Vyplň soutěž, datum a místo konání.',
        ]);
    }

    // Podpora hromadného přidání (entries: [{ pair_id, placement }]) i původního jednoho výsledku
    $entries = [];
    if (!empty($payload['entries']) && is_array($payload['entries'])) {
        foreach ($payload['entries'] as $item) {
            $pId = (int) ($item['pair_id'] ?? 0);
            $plc = trim((string) ($item['placement'] ?? ''));
            if ($pId > 0 && $plc !== '') {
                $entries[] = ['pair_id' => $pId, 'placement' => $plc];
            }
        }
    } elseif (!empty($payload['pair_id']) && !empty($payload['placement'])) {
        $entries[] = [
            'pair_id' => (int) $payload['pair_id'],
            'placement' => trim((string) $payload['placement']),
        ];
    }

    if (empty($entries)) {
        respond(400, [
            'status' => 'error',
            'message' => 'Přidej alespoň jeden taneční pár / sólo s umístěním.',
        ]);
    }

    $statement = $pdo->prepare(
        'INSERT INTO competition_results (
            pair_id,
            competition_name,
            date,
            location,
            placement
         ) VALUES (
            :pair_id,
            :competition_name,
            :date,
            :location,
            :placement
         ) RETURNING id'
    );

    $pdo->beginTransaction();
    try {
        $lastId = 0;
        foreach ($entries as $entry) {
            $statement->execute([
                ':pair_id' => $entry['pair_id'],
                ':competition_name' => $competition,
                ':date' => $date,
                ':location' => $location,
                ':placement' => $entry['placement'],
            ]);
            $lastId = (int) $statement->fetch()['id'];
        }
        $pdo->commit();

        respond(201, [
            'status' => 'success',
            'id' => $lastId,
            'message' => count($entries) > 1 ? 'Výsledky byly úspěšně přidány (' . count($entries) . ').' : 'Výsledek přidán.',
        ]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

if ($method === 'DELETE' && $action === 'delete_pair') {
    $pairId = (int) ($payload['pair_id'] ?? 0);

    if ($pairId <= 0) {
        respond(400, [
            'status' => 'error',
            'message' => 'Chybí ID páru.',
        ]);
    }

    $pdo->beginTransaction();

    try {
        $deleteResults = $pdo->prepare(
            'DELETE FROM competition_results WHERE pair_id = :pair_id'
        );
        $deleteResults->execute([':pair_id' => $pairId]);

        $deletePair = $pdo->prepare(
            'DELETE FROM dance_pairs WHERE pair_id = :pair_id'
        );
        $deletePair->execute([':pair_id' => $pairId]);

        $pdo->commit();
    } catch (Throwable $exception) {
        $pdo->rollBack();
        throw $exception;
    }

    respond(200, [
        'status' => 'success',
        'message' => 'Pár i jeho výsledky byly smazány.',
    ]);
}

if ($method === 'DELETE' && $action === 'delete_result') {
    $id = (int) ($payload['id'] ?? 0);

    $statement = $pdo->prepare(
        'DELETE FROM competition_results WHERE id = :id'
    );
    $statement->execute([':id' => $id]);

    respond(200, [
        'status' => 'success',
        'message' => 'Výsledek smazán.',
    ]);
}

respond(405, [
    'status' => 'error',
    'message' => 'Nepodporovaná operace.',
]);