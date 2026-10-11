<?php
declare(strict_types=1);

/**
 * Geo-Antispam & Security Guardian
 * Universal security, rate limiting, and geo-validation service for Czech & EU web applications.
 */
class SecurityGuardian {
    /**
     * Resolves client IP address safely, checking trusted reverse-proxy / CDN headers.
     */
    public static function getClientIp(): string {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $cfIp = trim($_SERVER['HTTP_CF_CONNECTING_IP']);
            if (filter_var($cfIp, FILTER_VALIDATE_IP)) {
                return $cfIp;
            }
        }
        $remote = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : '127.0.0.1';
    }

    /**
     * Checks if IP is localhost, loopback or private RFC1918 network.
     */
    public static function isLocalOrPrivateIp(string $ip): bool {
        if ($ip === '127.0.0.1' || $ip === '::1') {
            return true;
        }
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }

    /**
     * Validates that visitor is located in the Czech Republic or submitting with Czech credentials.
     * @return array{allowed: bool, reason: string, country: string}
     */
    public static function verifyCzechVisitor(string $ip, string $contact): array {
        // 1. Phone number check: reject foreign international phone numbers
        $cleanPhone = preg_replace('/[^\d+]/', '', $contact);
        if ($cleanPhone !== null && str_starts_with($cleanPhone, '+')) {
            if (!str_starts_with($cleanPhone, '+420')) {
                return [
                    'allowed' => false,
                    'reason' => 'Poptávky přijímáme pouze pro realizace v ČR (zadána zahraniční telefonní předvolba).',
                    'country' => 'Foreign Phone',
                ];
            }
        }

        // 2. Allow localhost and internal development environments
        if (self::isLocalOrPrivateIp($ip)) {
            return ['allowed' => true, 'reason' => '', 'country' => 'CZ (Local/Dev)'];
        }

        // 3. Check standard proxy/CDN geo headers
        $geoHeaders = ['HTTP_CF_IPCOUNTRY', 'HTTP_X_COUNTRY_CODE', 'HTTP_GEOIP_COUNTRY_CODE'];
        foreach ($geoHeaders as $hdr) {
            if (!empty($_SERVER[$hdr])) {
                $hdrCountry = strtoupper(trim($_SERVER[$hdr]));
                if ($hdrCountry === 'CZ') {
                    return ['allowed' => true, 'reason' => '', 'country' => 'CZ'];
                }
                if ($hdrCountry !== 'XX' && $hdrCountry !== 'T1' && strlen($hdrCountry) === 2) {
                    return [
                        'allowed' => false,
                        'reason' => 'Formulář je dostupný pouze pro návštěvníky z České republiky.',
                        'country' => $hdrCountry,
                    ];
                }
            }
        }

        // 4. Priority check: If contact is a valid CZ phone (+420 or 9 digits) or Czech email (.cz)
        if (self::isCzechContact($contact)) {
            return ['allowed' => true, 'reason' => '', 'country' => 'CZ (Verified Contact)'];
        }

        // 5. Fallback lookup via IP Geolocation API with local file caching
        $country = self::lookupIpCountry($ip);
        if ($country !== null) {
            if ($country === 'CZ') {
                return ['allowed' => true, 'reason' => '', 'country' => 'CZ'];
            }
            return [
                'allowed' => false,
                'reason' => 'Formulář je dostupný pouze pro návštěvníky z České republiky.',
                'country' => $country,
            ];
        }

        return ['allowed' => true, 'reason' => '', 'country' => 'CZ (Default)'];
    }

    /**
     * Checks if contact is a Czech phone (+420 or 9 digits) or ends in .cz
     */
    public static function isCzechContact(string $contact): bool {
        $v = trim($contact);
        $digits = preg_replace('/\D/', '', $v);
        if (strlen($digits) === 9) {
            return true;
        }
        if (strlen($digits) === 12 && str_starts_with($digits, '420')) {
            return true;
        }
        if (filter_var($v, FILTER_VALIDATE_EMAIL)) {
            return str_ends_with(strtolower($v), '.cz');
        }
        return false;
    }

    /**
     * Look up country code using a lightweight cache and fast HTTP query.
     */
    private static function lookupIpCountry(string $ip): ?string {
        $cacheFile = sys_get_temp_dir() . '/geo_cache_' . md5($ip) . '.json';
        if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 86400)) {
            $cached = @file_get_contents($cacheFile);
            if ($cached) {
                $data = json_decode($cached, true);
                if (!empty($data['country'])) {
                    return $data['country'];
                }
            }
        }

        $url = 'http://ip-api.com/json/' . urlencode($ip) . '?fields=status,countryCode';
        $ctx = stream_context_create([
            'http' => [
                'timeout' => 0.8,
                'ignore_errors' => true,
                'user_agent' => 'GeoChecker/1.0',
            ],
        ]);

        $response = @file_get_contents($url, false, $ctx);
        if ($response) {
            $data = json_decode($response, true);
            if (!empty($data['status']) && $data['status'] === 'success' && !empty($data['countryCode'])) {
                $code = strtoupper($data['countryCode']);
                @file_put_contents($cacheFile, json_encode(['country' => $code]));
                return $code;
            }
        }
        return null;
    }

    /**
     * File-locked Rate Limiter preventing spam attacks and brute-force flooding.
     * Zero-database dependency, uses flock(LOCK_EX) on temp file.
     * @return array{allowed: bool, retryAfter: int}
     */
    public static function checkRateLimit(
        string $ip,
        int $maxPerIp = 3,
        int $ipPeriod = 600,
        int $maxGlobal = 30,
        int $globalPeriod = 3600
    ): array {
        if (getenv('DISABLE_RATE_LIMIT') === '1') {
            return ['allowed' => true, 'retryAfter' => 0];
        }

        $lockPath = sys_get_temp_dir() . '/app_ratelimit.json';
        $fp = @fopen($lockPath, 'c+');
        if (!$fp) {
            return ['allowed' => true, 'retryAfter' => 0];
        }

        if (!flock($fp, LOCK_EX)) {
            fclose($fp);
            return ['allowed' => true, 'retryAfter' => 0];
        }

        $now = time();
        $fileSize = filesize($lockPath);
        $records = [];
        if ($fileSize > 0) {
            $raw = fread($fp, $fileSize);
            $decoded = json_decode($raw ?: '', true);
            if (is_array($decoded)) {
                $records = $decoded;
            }
        }

        $activeRecords = [];
        $ipCount = 0;
        $globalCount = 0;
        $oldestForIp = null;

        foreach ($records as $entry) {
            $entryTime = (int)($entry['t'] ?? 0);
            $entryIp = (string)($entry['ip'] ?? '');

            if ($now - $entryTime < $globalPeriod) {
                $activeRecords[] = $entry;
                $globalCount++;
            }

            if ($entryIp === $ip && ($now - $entryTime < $ipPeriod)) {
                $ipCount++;
                if ($oldestForIp === null || $entryTime < $oldestForIp) {
                    $oldestForIp = $entryTime;
                }
            }
        }

        if ($ipCount >= $maxPerIp) {
            $retryAfter = max(1, ($oldestForIp !== null ? ($oldestForIp + $ipPeriod - $now) : $ipPeriod));
            flock($fp, LOCK_UN);
            fclose($fp);
            return ['allowed' => false, 'retryAfter' => $retryAfter];
        }

        if ($globalCount >= $maxGlobal) {
            flock($fp, LOCK_UN);
            fclose($fp);
            return ['allowed' => false, 'retryAfter' => 300];
        }

        $activeRecords[] = ['ip' => $ip, 't' => $now];
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($activeRecords));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        return ['allowed' => true, 'retryAfter' => 0];
    }

    /**
     * Checks honeypot trap and minimum form fill timing.
     * @return array{isSpam: bool, reason: string}
     */
    public static function checkSpamTraps(array $input, string $honeypotField = '_hp_company'): array {
        // 1. Honeypot check
        if (!empty($input[$honeypotField])) {
            return ['isSpam' => true, 'reason' => 'Honeypot filled'];
        }

        // 2. Timing check: human users need at least 3 seconds, discard stale sessions (>72h)
        $formTime = (int)($input['_form_time'] ?? 0);
        if ($formTime > 0) {
            $elapsed = time() - $formTime;
            if ($elapsed < 3) {
                return ['isSpam' => true, 'reason' => "Form filled too fast ({$elapsed}s < 3s)"];
            }
            if ($elapsed > 259200) {
                return ['isSpam' => true, 'reason' => 'Form submission expired (>72 hours)'];
            }
        }

        return ['isSpam' => false, 'reason' => ''];
    }
}
