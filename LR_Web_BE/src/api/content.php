<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../services/ContentManager.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($method === 'GET') {
    $page = isset($_GET['page']) ? trim((string)$_GET['page']) : null;
    $data = ContentManager::load($page);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    if (!is_array($payload) || empty($payload['page']) || !isset($payload['content']) || !is_array($payload['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Neplatný požadavek. Očekává se pole page a content.']);
        exit;
    }

    $page = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string)$payload['page']);
    $result = ContentManager::save($page, $payload['content']);

    if (!$result['success']) {
        http_response_code(500);
        echo json_encode(['error' => $result['error']]);
        exit;
    }

    echo json_encode(['success' => true, 'page' => $page]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Metoda není povolena']);
