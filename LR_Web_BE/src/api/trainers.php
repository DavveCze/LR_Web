<?php
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

function parseBoolean($value, bool $default = false): bool {
    if ($value === null || $value === '') return $default;
    if (is_bool($value)) return $value;
    $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    return $parsed ?? $default;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM trainers ORDER BY display_order ASC, id ASC');
        $rows = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $rows]);
        break;

    case 'POST':
        requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || empty($data['full_name'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Jméno trenéra je povinné.']);
            exit;
        }

        $stmt = $pdo->prepare('
            INSERT INTO trainers (full_name, title, info, category_lat, category_stt, image_src, is_active, display_order)
            VALUES (:full_name, :title, :info, :category_lat, :category_stt, :image_src, :is_active, :display_order)
        ');

        $stmt->bindValue(':full_name', trim($data['full_name']), PDO::PARAM_STR);
        $stmt->bindValue(':title', trim($data['title'] ?? ''), PDO::PARAM_STR);
        $stmt->bindValue(':info', $data['info'] ?? null, PDO::PARAM_STR);
        $stmt->bindValue(':category_lat', parseBoolean($data['category_lat'] ?? false), PDO::PARAM_BOOL);
        $stmt->bindValue(':category_stt', parseBoolean($data['category_stt'] ?? false), PDO::PARAM_BOOL);
        $stmt->bindValue(':image_src', trim($data['image_src'] ?? ''), PDO::PARAM_STR);
        $stmt->bindValue(':is_active', parseBoolean($data['is_active'] ?? true, true), PDO::PARAM_BOOL);
        $stmt->bindValue(':display_order', (int)($data['display_order'] ?? 0), PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['status' => 'success', 'message' => 'Trenér přidán.']);
        break;

    case 'PUT':
        requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || empty($data['id']) || empty($data['full_name'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Chybí ID nebo Jméno.']);
            exit;
        }

        $stmt = $pdo->prepare('
            UPDATE trainers SET 
                full_name = :full_name, title = :title, info = :info,
                category_lat = :category_lat, category_stt = :category_stt,
                image_src = :image_src, is_active = :is_active, display_order = :display_order
            WHERE id = :id
        ');

        $stmt->bindValue(':id', (int)$data['id'], PDO::PARAM_INT);
        $stmt->bindValue(':full_name', trim($data['full_name']), PDO::PARAM_STR);
        $stmt->bindValue(':title', trim($data['title'] ?? ''), PDO::PARAM_STR);
        $stmt->bindValue(':info', $data['info'] ?? null, PDO::PARAM_STR);
        $stmt->bindValue(':category_lat', parseBoolean($data['category_lat'] ?? false), PDO::PARAM_BOOL);
        $stmt->bindValue(':category_stt', parseBoolean($data['category_stt'] ?? false), PDO::PARAM_BOOL);
        $stmt->bindValue(':image_src', trim($data['image_src'] ?? ''), PDO::PARAM_STR);
        $stmt->bindValue(':is_active', parseBoolean($data['is_active'] ?? true, true), PDO::PARAM_BOOL);
        $stmt->bindValue(':display_order', (int)($data['display_order'] ?? 0), PDO::PARAM_INT);
        $stmt->execute();

        echo json_encode(['status' => 'success', 'message' => 'Trenér upraven.']);
        break;

    case 'DELETE':
        requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Chybí ID.']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM trainers WHERE id = :id');
        $stmt->execute(['id' => $id]);
        echo json_encode(['status' => 'success', 'message' => 'Trenér smazán.']);
        break;
}