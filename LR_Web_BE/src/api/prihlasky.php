<?php
// src/api/prihlasky.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config.php';

function requireAuth() {
    if (empty($_SESSION['authenticated'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Nepřihlášen.']);
        exit;
    }
}

try {
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        getenv('DB_HOST') ?: 'postgres',
        getenv('DB_PORT') ?: '5432',
        getenv('DB_NAME')
    );
    $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASSWORD'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Chyba připojení k databázi.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        requireAuth();
        handlePost($pdo);
        break;
    case 'PUT':
        requireAuth();
        handlePut($pdo);
        break;
    case 'DELETE':
        requireAuth();
        handleDelete($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Metoda nepovolena.']);
}

function handleGet(PDO $pdo) {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare('SELECT * FROM registrations WHERE id = :id');
        $stmt->execute(['id' => $_GET['id']]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Přihláška nenalezena.']);
            return;
        }
        echo json_encode(['status' => 'success', 'data' => $row]);
        return;
    }

    $stmt = $pdo->query('SELECT * FROM registrations ORDER BY category, created_at DESC');
    $rows = $stmt->fetchAll();

    $grouped = [];
    foreach ($rows as $row) {
        $category = $row['category'];
        if (!isset($grouped[$category])) {
            $grouped[$category] = [
                'headline' => $category,
                'components' => [],
            ];
        }
        $grouped[$category]['components'][] = [
            'id' => $row['id'],
            'headline' => $row['headline'],
            'content' => $row['content'],
            'link' => $row['link'],
            'cost' => $row['cost'],
            'isActive' => (bool) $row['is_active'],
        ];
    }

    echo json_encode(['status' => 'success', 'data' => array_values($grouped)]);
}

function parseBoolean($value, bool $default = true): bool {
    if ($value === null || $value === '') {
        return $default;
    }

    if (is_bool($value)) {
        return $value;
    }

    $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

    return $parsed ?? $default;
}

function handlePost(PDO $pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || empty($data['category']) || empty($data['headline'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Vyplňte povinná pole.']);
        return;
    }

    $isActive = parseBoolean($data['isActive'] ?? null, true);

    $stmt = $pdo->prepare(
        'INSERT INTO registrations (category, headline, content, link, cost, is_active)
         VALUES (:category, :headline, :content, :link, :cost, :is_active)
         RETURNING id'
    );

    $stmt->bindValue(':category', trim($data['category']), PDO::PARAM_STR);
    $stmt->bindValue(':headline', trim($data['headline']), PDO::PARAM_STR);

    $stmt->bindValue(
        ':content',
        !empty($data['content']) ? $data['content'] : null,
        !empty($data['content']) ? PDO::PARAM_STR : PDO::PARAM_NULL,
    );

    $stmt->bindValue(
        ':link',
        !empty($data['link']) ? $data['link'] : null,
        !empty($data['link']) ? PDO::PARAM_STR : PDO::PARAM_NULL,
    );

    $stmt->bindValue(
        ':cost',
        !empty($data['cost']) ? $data['cost'] : null,
        !empty($data['cost']) ? PDO::PARAM_STR : PDO::PARAM_NULL,
    );

    $stmt->bindValue(':is_active', $isActive, PDO::PARAM_BOOL);

    $stmt->execute();

    $newId = $stmt->fetch()['id'];

    http_response_code(201);
    echo json_encode([
        'status' => 'success',
        'message' => 'Přihláška vytvořena.',
        'id' => $newId,
    ]);
}

function handlePut(PDO $pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || empty($data['id']) || empty($data['category']) || empty($data['headline'])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Chybí ID nebo povinná pole.',
        ]);
        return;
    }

    $isActive = parseBoolean($data['isActive'] ?? null, true);

    $stmt = $pdo->prepare(
        'UPDATE registrations
         SET category = :category,
             headline = :headline,
             content = :content,
             link = :link,
             cost = :cost,
             is_active = :is_active
         WHERE id = :id'
    );

    $stmt->bindValue(':id', (int) $data['id'], PDO::PARAM_INT);
    $stmt->bindValue(':category', trim($data['category']), PDO::PARAM_STR);
    $stmt->bindValue(':headline', trim($data['headline']), PDO::PARAM_STR);

    $stmt->bindValue(
        ':content',
        !empty($data['content']) ? $data['content'] : null,
        !empty($data['content']) ? PDO::PARAM_STR : PDO::PARAM_NULL,
    );

    $stmt->bindValue(
        ':link',
        !empty($data['link']) ? $data['link'] : null,
        !empty($data['link']) ? PDO::PARAM_STR : PDO::PARAM_NULL,
    );

    $stmt->bindValue(
        ':cost',
        !empty($data['cost']) ? $data['cost'] : null,
        !empty($data['cost']) ? PDO::PARAM_STR : PDO::PARAM_NULL,
    );

    $stmt->bindValue(':is_active', $isActive, PDO::PARAM_BOOL);

    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Přihláška nenalezena nebo beze změn.',
        ]);
        return;
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Přihláška aktualizována.',
    ]);
}

function handleDelete(PDO $pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Chybí ID přihlášky.']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM registrations WHERE id = :id');
    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Přihláška nenalezena.']);
        return;
    }

    echo json_encode(['status' => 'success', 'message' => 'Přihláška smazána.']);
}