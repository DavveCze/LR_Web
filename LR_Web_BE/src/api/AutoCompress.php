<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Helper functions
function respond(int $status, array $data): void
{
	http_response_code($status);
	echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
	exit;
}

// Ensure the directory exists, creating it if necessary
function ensureDir(string $dir, bool $createIfNull = false): void
{
	if (!is_dir($dir) && $createIfNull) {
		if (!mkdir($dir, 0775, true) && !is_dir($dir)) {
			respond(500, ['error' => 'Failed to create output directory.']);
		}
	}

	if (!is_dir($dir)) {
		respond(500, ['error' => 'Output directory does not exist.']);
	}
}

// Sanitize a single path segment (e.g., a filename or folder name)
function sanitizePathSegment(string $value): string
{
	$value = trim($value);
	$value = preg_replace('/[^a-zA-Z0-9_-]+/', '_', $value) ?? '';
	return trim($value, '._-');
}

// Sanitize a relative path, ensuring it doesn't contain dangerous segments
function sanitizeRelativePath(string $value): string
{
	$segments = preg_split('~/+~', trim($value, '/')) ?: [];
	$segments = array_filter(array_map(static fn (string $segment): string => sanitizePathSegment($segment), $segments));
	return implode('/', $segments);
}

// Create an image resource from a file based on its MIME type
function imageFromFile(string $path, string $mime)
{
	return match ($mime) {
		'image/jpeg' => imagecreatefromjpeg($path),
		'image/png' => imagecreatefrompng($path),
		'image/gif' => imagecreatefromgif($path),
		'image/webp' => function_exists('imagecreatefromwebp') ? imagecreatefromwebp($path) : false,
		default => false,
	};
}

// Calculate resized dimensions while maintaining aspect ratio
function resizedDimensions(string $sourcePath, int $targetWidth): array
{
	$info = getimagesize($sourcePath);
	if ($info === false) {
		return ['ok' => false, 'error' => 'Invalid image.'];
	}

	[$width, $height] = $info;
	if ($width <= 0 || $height <= 0) {
		return ['ok' => false, 'error' => 'Invalid image dimensions.'];
	}

	$newWidth = min($targetWidth, $width);
	$newHeight = (int) round(($height / $width) * $newWidth);

	return [
		'ok' => true,
		'width' => $newWidth,
		'height' => $newHeight,
		'mime' => $info['mime'] ?? '',
	];
}

// Convert an image to WebP format with resizing
function toWebp(string $sourcePath, string $outputPath, int $resizeWidth, int $resizeHeight, int $sourceWidth, int $sourceHeight, string $mime): array
{
	$src = imageFromFile($sourcePath, $mime);
	if ($src === false) {
		return ['ok' => false, 'error' => 'Unsupported image format or missing GD webp support.'];
	}

	$dst = imagecreatetruecolor($resizeWidth, $resizeHeight);
	imagealphablending($dst, false);
	imagesavealpha($dst, true);
	$transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
	imagefilledrectangle($dst, 0, 0, $resizeWidth, $resizeHeight, $transparent);
	imagecopyresampled($dst, $src, 0, 0, 0, 0, $resizeWidth, $resizeHeight, $sourceWidth, $sourceHeight);

	$saved = imagewebp($dst, $outputPath, 82);

	imagedestroy($src);
	imagedestroy($dst);

	if (!$saved) {
		return ['ok' => false, 'error' => 'Failed to write webp file.'];
	}

	return [
		'ok' => true,
		'width' => $resizeWidth,
		'height' => $resizeHeight,
		'path' => $outputPath,
	];
}

// Normalize the target directory based on POST data
function normalizeTargetDirectory(array $postData): string
{
	$folder = sanitizeRelativePath((string) ($postData['folder'] ?? ''));
	if ($folder !== '') {
		return $folder;
	}

	$index = sanitizePathSegment((string) ($postData['index'] ?? ''));
	$name = sanitizePathSegment((string) ($postData['name'] ?? ''));
	if ($index !== '' && $name !== '') {
		return $index . '/' . $name;
	}

	if ($index !== '') {
		return $index;
	}

	return 'home_imgs';
}

	if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
		respond(405, ['error' => 'Use POST with multipart/form-data image upload.']);
	}

	if (!isset($_FILES['image'])) {
		respond(400, ['error' => 'Missing image file field named "image".']);
	}

	$file = $_FILES['image'];
	if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
		respond(400, ['error' => 'Upload failed.']);
	}

	$tmpPath = $file['tmp_name'];
	if (!is_uploaded_file($tmpPath)) {
		respond(400, ['error' => 'Invalid upload.']);
	}

	$targetDirectory = normalizeTargetDirectory($_POST);
	$uploadDir = $webAssetsBase . '/' . $targetDirectory;
	ensureDir($uploadDir);

	$baseName = (string) ($_POST['name'] ?? '');
	if ($baseName === '') {
		$baseName = pathinfo($file['name'] ?? 'image', PATHINFO_FILENAME);
	}
	$baseName = sanitizePathSegment($baseName) ?: 'image';

	$targets = [1920, 1280, 768];
	$results = [];

	$imageInfo = getimagesize($tmpPath);
	if ($imageInfo === false) {
		respond(400, ['error' => 'Invalid image.']);
	}

	[$sourceWidth, $sourceHeight] = $imageInfo;
	$mime = $imageInfo['mime'] ?? '';

	foreach ($targets as $index => $width) {
		$dimensionInfo = resizedDimensions($tmpPath, $width);
		if (!($dimensionInfo['ok'] ?? false)) {
			$results[] = $dimensionInfo;
			continue;
		}

		$resizeWidth = $dimensionInfo['width'];
		$resizeHeight = $dimensionInfo['height'];
		$out = sprintf('%s/%s_%dx%d.webp', $uploadDir, $baseName, $width, $index + 1);
		$results[] = toWebp($tmpPath, $out, $resizeWidth, $resizeHeight, $sourceWidth, $sourceHeight, $mime);
	}

	$errors = array_values(array_filter($results, static fn ($r) => !($r['ok'] ?? false)));
	if ($errors !== []) {
		respond(500, [
			'error' => 'Compression failed.',
			'details' => $errors,
		]);
	}

	$originalOut = sprintf('%s/%s_origin.%s', $uploadDir, $baseName, pathinfo($file['name'], PATHINFO_EXTENSION));
	rename($tmpPath, $originalOut);

	moveGeneratedFilesToPredefinedLocation($results, $uploadDir);

	respond(200, [
		'message' => 'Image compressed successfully.',
		'targetDirectory' => $targetDirectory,
		'files' => array_map(static fn ($r) => [
			'width' => $r['width'],
			'height' => $r['height'],
			'path' => $r['path'],
		], $results),
]);

// Move generated files to a predefined location if specified
function moveGeneratedFilesToPredefinedLocation(array $results, string $uploadDir): void
{
    $predefinedLocation = $_POST['predefinedLocation'] ?? '';
    if ($predefinedLocation !== '') {
        $predefinedUploadDir = $webAssetsBase . '/' . $predefinedLocation;
		// Ensure the predefined directory exists
        ensureDir($predefinedUploadDir);
        foreach ($results as $result) {
            $sourcePath = $result['path'];
            $destinationPath = sprintf('%s/%s_%dx%d.webp', $predefinedUploadDir, $result['baseName'], $result['width'], $result['index'] + 1);
            rename($sourcePath, $destinationPath);
        }
    }
}

