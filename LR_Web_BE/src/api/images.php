<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

const ASSETS_BASE = '/var/www/frontend-assets';

function respond(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (empty($_SESSION['authenticated']) && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    // Pro GET (výpis na frontendu) můžeme povolit veřejný přístup,
    // ale pro POST/PUT/DELETE vyžadujeme admina.
    respond(401, ['status' => 'error', 'message' => 'Nepřihlášen.']);
}

$method = $_SERVER['REQUEST_METHOD'];

// VÝPIS VŠECH OBRÁZKŮ (Nebo filtrování podle složky)
if ($method === 'GET') {
    $folderFilter = $_GET['folder'] ?? null;
    $assets = [];

    // Projdeme složky v assets
    $directories = glob(ASSETS_BASE . '/*', GLOB_ONLYDIR);
    if (!$directories) $directories = [];

    foreach ($directories as $dir) {
        $folderName = basename($dir);
        if ($folderFilter && $folderName !== $folderFilter) continue;

        // Najdeme všechny soubory končící na _3.webp (nejvyšší kvalita - použijeme jako referenci assetu)
        // nebo _origin.*
        $files = scandir($dir);
        $foundBases = [];

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;

            // Regex zachytí baseName před _1, _2, _3 nebo _origin
            if (preg_match('/^(.+)_(origin|1|2|3)\.(webp|jpg|png|gif)$/i', $file, $matches)) {
                $baseName = $matches[1];
                $foundBases[$baseName] = true;
            }
        }

        foreach (array_keys($foundBases) as $baseName) {
            $assets[] = [
                'folder' => $folderName,
                'baseName' => $baseName,
                // Náhled url - zkusíme _1 (nejmenší) pro rychlé načítání v adminu
                'previewUrl' => "/assets/imgs/{$folderName}/{$baseName}_1.webp"
            ];
        }
    }

    respond(200, ['status' => 'success', 'data' => $assets]);
}

$data = json_decode(file_get_contents('php://input'), true);

// PŘEJMENOVÁNÍ
if ($method === 'PUT') {
    $folder = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $data['folder'] ?? '');
    $oldBase = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $data['oldBaseName'] ?? '');
    $newBase = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $data['newBaseName'] ?? '');

    if (!$folder || !$oldBase || !$newBase) respond(400, ['status' => 'error', 'message' => 'Chybí parametry.']);

    $dir = ASSETS_BASE . '/' . $folder;
    $files = glob("{$dir}/{$oldBase}_*");
    $renamed = 0;

    foreach ($files as $file) {
        // Získáme konec (např. origin.jpg nebo 1.webp)
        $suffix = substr(basename($file), strlen($oldBase));
        $newFile = $dir . '/' . $newBase . $suffix;
        if (rename($file, $newFile)) $renamed++;
    }

    if ($renamed > 0) {
        respond(200, ['status' => 'success', 'message' => "Přejmenováno $renamed souborů."]);
    } else {
        respond(404, ['status' => 'error', 'message' => 'Původní soubory nenalezeny.']);
    }
}

// SMAZÁNÍ
if ($method === 'DELETE') {
    $folder = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $data['folder'] ?? '');
    $baseName = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $data['baseName'] ?? '');

    if (!$folder || !$baseName) respond(400, ['status' => 'error', 'message' => 'Chybí parametry.']);

    $dir = ASSETS_BASE . '/' . $folder;
    $files = glob("{$dir}/{$baseName}_*");
    $deleted = 0;

    foreach ($files as $file) {
        if (unlink($file)) $deleted++;
    }

    if ($deleted > 0) {
        respond(200, ['status' => 'success', 'message' => "Smazáno $deleted souborů."]);
    } else {
        respond(404, ['status' => 'error', 'message' => 'Soubory nenalezeny.']);
    }
}

respond(405, ['status' => 'error', 'message' => 'Metoda nepovolena.']);