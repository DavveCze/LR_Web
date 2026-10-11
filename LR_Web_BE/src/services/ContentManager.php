<?php
declare(strict_types=1);

/**
 * ContentManager
 * Atomic Content & Revision Manager adapted from dev-library for LR Dance Web.
 * Safely loads and stores customizable page content blocks in JSON with revisions and file locking.
 */
class ContentManager {
    public static function getDataDir(): string {
        $dir = dirname(__DIR__) . '/data';
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
        return $dir;
    }

    public static function getDataFile(): string {
        return self::getDataDir() . '/site_content.json';
    }

    public static function getRevisionsDir(): string {
        $dir = self::getDataDir() . '/revisions';
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        return $dir;
    }

    public static function load(?string $page = null): array {
        $file = self::getDataFile();
        if (!file_exists($file)) {
            return [];
        }
        $raw = @file_get_contents($file);
        if (!$raw) {
            return [];
        }
        $data = json_decode($raw, true) ?: [];
        if ($page !== null) {
            return isset($data[$page]) && is_array($data[$page]) ? $data[$page] : [];
        }
        return $data;
    }

    public static function save(string $page, array $pageContent): array {
        $file = self::getDataFile();
        $lockFile = $file . '.lock';

        $fpLock = fopen($lockFile, 'c');
        if ($fpLock) {
            flock($fpLock, LOCK_EX);
        }

        try {
            $existing = [];
            if (file_exists($file)) {
                $raw = @file_get_contents($file);
                if ($raw) {
                    $existing = json_decode($raw, true) ?: [];
                }
                // Backup snapshot
                $revDir = self::getRevisionsDir();
                $backup = $revDir . '/' . date('Y-m-d_H-i-s') . '_site_content.json';
                @copy($file, $backup);
                self::pruneRevisions(30);
            }

            // Update page slice
            $existing[$page] = $pageContent;
            $existing['_updated_at'] = date('c');

            $json = json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $tmp = tempnam(dirname($file), 'cnttmp_');
            if (!$tmp) {
                return ['success' => false, 'error' => 'Nelze vytvořit dočasný soubor'];
            }

            $fp = fopen($tmp, 'w');
            if (!$fp) {
                @unlink($tmp);
                return ['success' => false, 'error' => 'Nelze zapsat dočasný soubor'];
            }
            fwrite($fp, $json);
            fflush($fp);
            fclose($fp);

            if (!@rename($tmp, $file)) {
                @unlink($tmp);
                return ['success' => false, 'error' => 'Nelze přepsat cílový soubor'];
            }

            @chmod($file, 0664);
            clearstatcache();
            return ['success' => true, 'error' => ''];
        } finally {
            if ($fpLock) {
                flock($fpLock, LOCK_UN);
                fclose($fpLock);
            }
        }
    }

    private static function pruneRevisions(int $maxKeep = 30): void {
        $files = glob(self::getRevisionsDir() . '/*_site_content.json') ?: [];
        if (count($files) <= $maxKeep) {
            return;
        }
        usort($files, fn($a, $b) => filemtime($a) <=> filemtime($b));
        $toRemove = array_slice($files, 0, count($files) - $maxKeep);
        foreach ($toRemove as $f) {
            @unlink($f);
        }
    }
}
