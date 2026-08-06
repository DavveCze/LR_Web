<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ASSETS_BASE = '/var/www/frontend-assets';

function respond(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
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

function sanitizeSegment(string $value): string
{
    $value = trim($value);
    $value = preg_replace('/[^a-zA-Z0-9_-]+/', '-', $value) ?? '';
    $value = trim($value, '.-_');

    return $value !== '' ? strtolower($value) : 'image';
}

function sanitizeRelativePath(string $value): string
{
    $segments = preg_split('~/+~', trim($value, '/')) ?: [];

    $segments = array_filter(
        array_map(
            static fn (string $segment): string => sanitizeSegment($segment),
            $segments
        )
    );

    return implode('/', $segments);
}

function makeDirectory(string $path): void
{
    if (!is_dir($path) && !mkdir($path, 0775, true) && !is_dir($path)) {
        respond(500, [
            'status' => 'error',
            'message' => 'Nelze vytvořit cílový adresář pro obrázky.',
        ]);
    }
}

function imageFromFile(string $path, string $mime): GdImage|false
{
    return match ($mime) {
        'image/jpeg' => imagecreatefromjpeg($path),
        'image/png' => imagecreatefrompng($path),
        'image/gif' => imagecreatefromgif($path),
        'image/webp' => function_exists('imagecreatefromwebp')
            ? imagecreatefromwebp($path)
            : false,
        default => false,
    };
}

function saveWebpVariant(
    GdImage $source,
    int $sourceWidth,
    int $sourceHeight,
    int $targetWidth,
    string $destination
): array {
    $width = min($targetWidth, $sourceWidth);
    $height = max(1, (int) round(($sourceHeight / $sourceWidth) * $width));

    $canvas = imagecreatetruecolor($width, $height);

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

    $saved = imagewebp($canvas, $destination, 82);
    imagedestroy($canvas);

    if (!$saved) {
        respond(500, [
            'status' => 'error',
            'message' => 'Nepodařilo se uložit optimalizovaný WebP soubor.',
        ]);
    }

    return [
        'width' => $width,
        'height' => $height,
        'filename' => basename($destination),
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'status' => 'error',
        'message' => 'Použij POST request s multipart/form-data.',
    ]);
}

requireAuth();

if (!extension_loaded('gd') || !function_exists('imagewebp')) {
    respond(500, [
        'status' => 'error',
        'message' => 'PHP kontejner nemá aktivní GD knihovnu s podporou WebP.',
    ]);
}

if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
    respond(400, [
        'status' => 'error',
        'message' => 'Chybí soubor v poli image.',
    ]);
}

$file = $_FILES['image'];

if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    respond(400, [
        'status' => 'error',
        'message' => 'Nahrávání souboru selhalo.',
    ]);
}

if (($file['size'] ?? 0) > MAX_UPLOAD_BYTES) {
    respond(413, [
        'status' => 'error',
        'message' => 'Soubor je příliš velký. Maximum je 12 MB.',
    ]);
}

$tmpPath = (string) $file['tmp_name'];

if (!is_uploaded_file($tmpPath)) {
    respond(400, [
        'status' => 'error',
        'message' => 'Neplatný upload.',
    ]);
}

$imageInfo = getimagesize($tmpPath);

if ($imageInfo === false) {
    respond(400, [
        'status' => 'error',
        'message' => 'Soubor není platný obrázek.',
    ]);
}

[$sourceWidth, $sourceHeight] = $imageInfo;
$mime = $imageInfo['mime'] ?? '';

$allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

if (!in_array($mime, $allowedMimeTypes, true)) {
    respond(415, [
        'status' => 'error',
        'message' => 'Podporovány jsou pouze JPEG, PNG, GIF a WebP.',
    ]);
}

$relativeFolder = sanitizeRelativePath((string) ($_POST['folder'] ?? 'uploads'));
$targetDirectory = rtrim(ASSETS_BASE, '/') . '/' . $relativeFolder;

makeDirectory($targetDirectory);

$inputName = (string) ($_POST['name'] ?? pathinfo((string) $file['name'], PATHINFO_FILENAME));
$baseName = sanitizeSegment($inputName);



$extension = match ($mime) {
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    default => 'bin',
};

$originalFilename = "{$baseName}_origin.{$extension}";
$originalPath = "{$targetDirectory}/{$originalFilename}";

if (!move_uploaded_file($tmpPath, $originalPath)) {
    respond(500, [
        'status' => 'error',
        'message' => 'Nelze uložit původní obrázek.',
    ]);
}

$source = imageFromFile($originalPath, $mime);

if ($source === false) {
    @unlink($originalPath);

    respond(415, [
        'status' => 'error',
        'message' => 'Formát nelze převést do WebP.',
    ]);
}

$variants = [];

$variantsToCreate = [
    1 => 768,
    2 => 1280,
    3 => 1920,
];

foreach ($variantsToCreate as $level => $targetWidth) {
    $filename = "{$baseName}_{$level}.webp";
    $path = "{$targetDirectory}/{$filename}";

    $variant = saveWebpVariant(
        $source,
        $sourceWidth,
        $sourceHeight,
        $targetWidth,
        $path
    );

    $variant['level'] = $level;
    $variant['url'] = "/assets/imgs/{$relativeFolder}/{$filename}";
    $variants[] = $variant;
}

imagedestroy($source);

respond(201, [
    'status' => 'success',
    'message' => 'Obrázek byl uložen a optimalizován.',
    'folder' => $relativeFolder,
    'original' => [
        'filename' => $originalFilename,
        'url' => "/assets/imgs/{$relativeFolder}/{$originalFilename}",
    ],
    'variants' => $variants,
]);