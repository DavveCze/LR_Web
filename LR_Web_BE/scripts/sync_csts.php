<?php
declare(strict_types=1);

/**
 * CLI Skript pro pravidelnou synchronizaci bodů a finále z ČSTS (csts.cz).
 * Doporučené spuštění v Cronu každé pondělí ráno:
 * 0 6 * * 1 docker exec lrdance_php php /var/www/html/scripts/sync_csts.php >> /var/log/csts_sync.log 2>&1
 */

if (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
    require_once __DIR__ . '/../db.php';
    require_once __DIR__ . '/../services/CstsService.php';
} else {
    require_once __DIR__ . '/../src/config.php';
    require_once __DIR__ . '/../src/db.php';
    require_once __DIR__ . '/../src/services/CstsService.php';
}

echo "[" . date('Y-m-d H:i:s') . "] Spouštím synchronizaci s ČSTS...\n";

try {
    $pdo = getPDO();
    $service = new CstsService();

    $result = $service->syncAllActive($pdo);

    echo sprintf(
        "[%s] Hotovo. Aktivních tanečníků: %d, aktualizováno: %d.\n",
        date('Y-m-d H:i:s'),
        $result['total_active'],
        $result['synced']
    );

    if (!empty($result['errors'])) {
        echo "Nalezené chyby:\n" . implode("\n", $result['errors']) . "\n";
    }
} catch (Throwable $e) {
    echo "[" . date('Y-m-d H:i:s') . "] CHYBA: " . $e->getMessage() . "\n";
    exit(1);
}
