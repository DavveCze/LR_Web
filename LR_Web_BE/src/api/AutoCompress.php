<?php

declare(strict_types=1);

// AutoCompress.php
// Automatická komprese a synchronizace responsivních WebP variant obrázků.
// Podporuje:
// 1. CLI mód: php AutoCompress.php [--force]
// 2. HTTP GET mód: GET /api/AutoCompress.php?action=sync
// 3. HTTP POST mód: upload nového obrázku přes multipart/form-data

$isCli = (php_sapi_name() === 'cli') || !isset($_SERVER['REQUEST_METHOD']);

if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Vrátí kořenový adresář s assety (v Dockeru /var/www/frontend-assets, na hostu lokální FE).
 */
function getAssetsBase(): string
{
    $env = getenv('FRONTEND_ASSETS_PATH');
    if ($env && is_dir($env)) {
        return rtrim($env, '/');
    }

    if (is_dir('/var/www/frontend-assets')) {
        return '/var/www/frontend-assets';
    }

    $candidates = [
        __DIR__ . '/../../../LR_Web_FE/public/assets/imgs',
        __DIR__ . '/../../LR_Web_FE/public/assets/imgs',
        dirname(__DIR__, 3) . '/LR_Web_FE/public/assets/imgs',
    ];

    foreach ($candidates as $cand) {
        $real = realpath($cand);
        if ($real && is_dir($real)) {
            return $real;
        }
    }

    return '/var/www/frontend-assets';
}

function respond(int $status, array $data, bool $isCli = false): void
{
    if ($isCli) {
        echo ($data['message'] ?? json_encode($data, JSON_UNESCAPED_UNICODE)) . PHP_EOL;
        if (isset($data['details']) && is_array($data['details'])) {
            foreach ($data['details'] as $detail) {
                echo "  - {$detail}" . PHP_EOL;
            }
        }
        exit($status >= 400 ? 1 : 0);
    }

    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function sanitizeSegment(string $value): string
{
    $value = trim($value);
    $value = preg_replace('/[^a-zA-Z0-9_-]+/', '_', $value) ?? '';
    return trim($value, '._-');
}

function sanitizeRelativePath(string $value): string
{
    $segments = preg_split('~/+~', trim($value, '/')) ?: [];
    $segments = array_filter(array_map(static fn (string $s): string => sanitizeSegment($s), $segments));
    return implode('/', $segments);
}

function imageFromFile(string $path, string $mime): GdImage|false
{
    return match ($mime) {
        'image/jpeg' => imagecreatefromjpeg($path),
        'image/png' => imagecreatefrompng($path),
        'image/gif' => imagecreatefromgif($path),
        'image/webp' => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($path) : false,
        default => false,
    };
}

function saveWebpVariant(
    GdImage $source,
    int $sourceWidth,
    int $sourceHeight,
    int $targetWidth,
    string $destinationPath
): bool {
    $width = min($targetWidth, $sourceWidth);
    $height = max(1, (int) round(($sourceHeight / $sourceWidth) * $width));

    $canvas = imagecreatetruecolor($width, $height);
    if (!$canvas) {
        return false;
    }

    imagealphablending($canvas, false);
    imagesavealpha($canvas, true);

    $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
    imagefilledrectangle($canvas, 0, 0, $width, $height, $transparent);

    imagecopyresampled(
        $canvas,
        $source,
        0,
        0,
        0,
        0,
        $width,
        $height,
        $sourceWidth,
        $sourceHeight
    );

    $saved = imagewebp($canvas, $destinationPath, 82);
    imagedestroy($canvas);

    return $saved;
}

/**
 * Projde všechny podsložky a vygeneruje chybějící responsivní varianty _1.webp, _2.webp, _3.webp.
 */
function syncAssets(string $assetsBase, bool $force = false, bool $isCli = false): array
{
    if (!is_dir($assetsBase)) {
        return [
            'status' => 'error',
            'message' => "Adresář pro assety neexistuje: {$assetsBase}",
            'scanned' => 0,
            'generated' => 0,
            'skipped' => 0,
            'details' => [],
        ];
    }

    if (!extension_loaded('gd') || !function_exists('imagewebp')) {
        return [
            'status' => 'error',
            'message' => 'PHP GD knihovna s podporou WebP není dostupná.',
            'scanned' => 0,
            'generated' => 0,
            'skipped' => 0,
            'details' => [],
        ];
    }

    $subdirs = array_filter(glob($assetsBase . '/*'), 'is_dir');
    $subdirs[] = $assetsBase; // i pro root složku

    $scanned = 0;
    $generated = 0;
    $skipped = 0;
    $details = [];

    $targetWidths = [
        1 => 768,
        2 => 1280,
        3 => 1920,
    ];

    foreach ($subdirs as $dir) {
        $folderName = ($dir === $assetsBase) ? '' : basename($dir);

        // Najdeme všechny soubory
        $files = glob($dir . '/*.*');
        if (!$files) {
            continue;
        }

        // Shromáždíme unikátní baseNames a jejich zdrojové soubory
        // Preferujeme *_origin.* soubory, případně jakýkoliv jiný net-variantní obrázek
        $origins = [];

        foreach ($files as $file) {
            $filename = basename($file);

            // Přeskočíme vygenerované varianty _1.webp, _2.webp, _3.webp
            if (preg_match('/^(.+)_[123]\.webp$/i', $filename)) {
                continue;
            }

            // Pokud je to *_origin.*
            if (preg_match('/^(.+)_origin\.(jpe?g|png|webp|gif)$/i', $filename, $m)) {
                $baseName = $m[1];
                $origins[$baseName] = $file;
                continue;
            }

            // Pokud je to obyčejný obrázek bez _origin a bez _1/2/3
            if (preg_match('/^([a-zA-Z0-9_-]+)\.(jpe?g|png|webp|gif)$/i', $filename, $m)) {
                $baseName = $m[1];
                if (!isset($origins[$baseName])) {
                    $origins[$baseName] = $file;
                }
            }
        }

        foreach ($origins as $baseName => $sourcePath) {
            $scanned++;

            $v1 = "{$dir}/{$baseName}_1.webp";
            $v2 = "{$dir}/{$baseName}_2.webp";
            $v3 = "{$dir}/{$baseName}_3.webp";

            $sourceMtime = @filemtime($sourcePath) ?: 0;
            $allExist = file_exists($v1) && file_exists($v2) && file_exists($v3);

            if (!$force && $allExist) {
                // Ověříme, zda zdroj není novější než vygenerované soubory
                $v1Mtime = @filemtime($v1) ?: 0;
                if ($v1Mtime >= $sourceMtime) {
                    $skipped++;
                    continue;
                }
            }

            // Potřebujeme vygenerovat varianty ze sourcePath
            $imageInfo = @getimagesize($sourcePath);
            if ($imageInfo === false) {
                $details[] = "Chyba: {$folderName}/{$baseName} - neplatný formát obrázku.";
                continue;
            }

            [$srcWidth, $srcHeight] = $imageInfo;
            $mime = $imageInfo['mime'] ?? '';

            $sourceImage = imageFromFile($sourcePath, $mime);
            if ($sourceImage === false) {
                $details[] = "Chyba: {$folderName}/{$baseName} - nelze otevřít přes GD ({$mime}).";
                continue;
            }

            $created = 0;
            foreach ($targetWidths as $level => $tw) {
                $outPath = "{$dir}/{$baseName}_{$level}.webp";
                if ($force || !file_exists($outPath) || (@filemtime($outPath) < $sourceMtime)) {
                    if (saveWebpVariant($sourceImage, $srcWidth, $srcHeight, $tw, $outPath)) {
                        $created++;
                    }
                }
            }

            imagedestroy($sourceImage);

            if ($created > 0) {
                $generated++;
                $relFolder = $folderName ?: 'root';
                $details[] = "Vygenerováno {$created} variant pro [{$relFolder}/{$baseName}].";
                if ($isCli) {
                    echo "  [AutoCompress] Vygenerováno {$created} variant: {$relFolder}/{$baseName}" . PHP_EOL;
                }
            } else {
                $skipped++;
            }
        }
    }

    return [
        'status' => 'success',
        'message' => "AutoCompress synchronizace dokončena. Zkontrolováno: {$scanned}, Nově vygenerováno: {$generated}, Ponecháno beze změny: {$skipped}.",
        'scanned' => $scanned,
        'generated' => $generated,
        'skipped' => $skipped,
        'details' => $details,
    ];
}

// ==========================================
// HLAVNÍ SPOUŠTĚCÍ LOGIKA
// ==========================================

$assetsBase = getAssetsBase();

// 1. CLI SPUŠTĚNÍ
if ($isCli) {
    $force = in_array('--force', $argv ?? [], true);
    echo "=== AutoCompress.php (CLI) ===" . PHP_EOL;
    echo "Adresář assetů: {$assetsBase}" . PHP_EOL;
    echo "Spouštím synchronizaci..." . PHP_EOL;

    $result = syncAssets($assetsBase, $force, true);
    echo "Status: " . $result['status'] . PHP_EOL;
    echo $result['message'] . PHP_EOL;
    exit($result['status'] === 'success' ? 0 : 1);
}

// 2. HTTP GET SPUŠTĚNÍ (Synchronizace při spuštění projektu / po git pull)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $force = isset($_GET['force']) && ($_GET['force'] === '1' || $_GET['force'] === 'true');
    $result = syncAssets($assetsBase, $force, false);
    respond($result['status'] === 'success' ? 200 : 500, $result, false);
}

// 3. HTTP POST SPUŠTĚNÍ (Upload nového obrázku)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Pokud je POST požadavek na synchronizaci
    if (isset($_POST['action']) && $_POST['action'] === 'sync') {
        $force = isset($_POST['force']) && ($_POST['force'] === '1' || $_POST['force'] === 'true');
        $result = syncAssets($assetsBase, $force, false);
        respond($result['status'] === 'success' ? 200 : 500, $result, false);
    }

    // Jinak je to upload souboru
    if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
        respond(400, ['status' => 'error', 'message' => 'Chybí soubor v poli "image" nebo action="sync".']);
    }

    $file = $_FILES['image'];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        respond(400, ['status' => 'error', 'message' => 'Nahrávání selhalo.']);
    }

    $tmpPath = (string) $file['tmp_name'];
    if (!is_uploaded_file($tmpPath)) {
        respond(400, ['status' => 'error', 'message' => 'Neplatný upload.']);
    }

    $imageInfo = @getimagesize($tmpPath);
    if ($imageInfo === false) {
        respond(400, ['status' => 'error', 'message' => 'Soubor není platný obrázek.']);
    }

    [$sourceWidth, $sourceHeight] = $imageInfo;
    $mime = $imageInfo['mime'] ?? '';

    $relativeFolder = sanitizeRelativePath((string) ($_POST['folder'] ?? 'downloaded'));
    $uploadDir = $assetsBase . '/' . ($relativeFolder ?: 'home_imgs');

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $inputName = (string) ($_POST['name'] ?? pathinfo((string) $file['name'], PATHINFO_FILENAME));
    $baseName = sanitizeSegment($inputName) ?: 'image';

    $extension = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        default => 'bin',
    };

    $originalFilename = "{$baseName}_origin.{$extension}";
    $originalPath = "{$uploadDir}/{$originalFilename}";

    if (!move_uploaded_file($tmpPath, $originalPath)) {
        respond(500, ['status' => 'error', 'message' => 'Nelze uložit původní soubor.']);
    }

    $source = imageFromFile($originalPath, $mime);
    if ($source === false) {
        respond(415, ['status' => 'error', 'message' => 'Formát nelze otevřít.']);
    }

    $variantsToCreate = [
        1 => 768,
        2 => 1280,
        3 => 1920,
    ];

    $createdFiles = [];
    foreach ($variantsToCreate as $level => $tw) {
        $filename = "{$baseName}_{$level}.webp";
        $destPath = "{$uploadDir}/{$filename}";
        saveWebpVariant($source, $sourceWidth, $sourceHeight, $tw, $destPath);
        $createdFiles[] = $filename;
    }

    imagedestroy($source);

    respond(200, [
        'status' => 'success',
        'message' => 'Obrázek byl úspěšně nahrán a zkomprimován.',
        'folder' => $relativeFolder,
        'baseName' => $baseName,
        'original' => $originalFilename,
        'variants' => $createdFiles,
    ]);
}

respond(405, ['status' => 'error', 'message' => 'Nepodporovaná metoda.']);
