<?php
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=utf-8");

function requireAuth(): void {
    if (empty($_SESSION['authenticated'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Nepřihlášen.']);
        exit;
    }
}

try {
    $pdo = getPDO();
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

function hasExtendedColumns(PDO $pdo): bool {
    try {
        $pdo->query("SELECT image_url, created_at, updated_at FROM news LIMIT 0");
        return true;
    } catch (PDOException $e) {
        return false;
    }
}

function handleGet(PDO $pdo): void {
    $extended = hasExtendedColumns($pdo);
    $cols = $extended
        ? 'id, headline, text, date, image_url, created_at, updated_at'
        : 'id, headline, text, date, NULL AS image_url, date AS created_at, NULL AS updated_at';

    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT {$cols} FROM news WHERE id = :id");
        $stmt->execute(['id' => (int)$_GET['id']]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Aktualita nenalezena.']);
            return;
        }

        echo json_encode(['status' => 'success', 'data' => $row], JSON_UNESCAPED_UNICODE);
        return;
    }

    if (isset($_GET['latest'])) {
        $stmt = $pdo->query("SELECT {$cols} FROM news ORDER BY date DESC, id DESC LIMIT 1");
        $row = $stmt->fetch();
        echo json_encode(['status' => 'success', 'data' => $row ?: null], JSON_UNESCAPED_UNICODE);
        return;
    }

    $stmt = $pdo->query("SELECT {$cols} FROM news ORDER BY date DESC, id DESC");
    $rows = $stmt->fetchAll();

    echo json_encode(['status' => 'success', 'data' => $rows], JSON_UNESCAPED_UNICODE);
}

function handlePost(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || empty($data['headline']) || empty($data['text'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Vyplňte titulek a text aktuality.']);
        return;
    }

    $headline = trim((string)$data['headline']);
    $text = trim((string)$data['text']);
    $date = !empty($data['date']) ? trim((string)$data['date']) : date('Y-m-d');
    $imageUrl = !empty($data['image_url']) ? trim((string)$data['image_url']) : null;

    $extended = hasExtendedColumns($pdo);

    if ($extended) {
        $stmt = $pdo->prepare('
            INSERT INTO news (headline, text, date, image_url, created_at)
            VALUES (:headline, :text, :date, :image_url, NOW())
            RETURNING id
        ');
        $stmt->execute([
            'headline' => $headline,
            'text' => $text,
            'date' => $date,
            'image_url' => $imageUrl,
        ]);
    } else {
        $stmt = $pdo->prepare('
            INSERT INTO news (headline, text, date)
            VALUES (:headline, :text, :date)
            RETURNING id
        ');
        $stmt->execute([
            'headline' => $headline,
            'text' => $text,
            'date' => $date,
        ]);
    }

    $id = $stmt->fetch()['id'] ?? null;

    http_response_code(201);
    echo json_encode([
        'status' => 'success',
        'message' => 'Aktualita byla úspěšně přidána.',
        'id' => $id,
    ], JSON_UNESCAPED_UNICODE);
}

function handlePut(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || empty($data['id']) || empty($data['headline']) || empty($data['text'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Chybí ID, titulek nebo text.']);
        return;
    }

    $id = (int)$data['id'];
    $headline = trim((string)$data['headline']);
    $text = trim((string)$data['text']);
    $date = !empty($data['date']) ? trim((string)$data['date']) : date('Y-m-d');
    $imageUrl = array_key_exists('image_url', $data) && !empty($data['image_url']) ? trim((string)$data['image_url']) : null;

    $extended = hasExtendedColumns($pdo);

    if ($extended) {
        $stmt = $pdo->prepare('
            UPDATE news
            SET headline = :headline, text = :text, date = :date, image_url = :image_url, updated_at = NOW()
            WHERE id = :id
        ');
        $stmt->execute([
            'id' => $id,
            'headline' => $headline,
            'text' => $text,
            'date' => $date,
            'image_url' => $imageUrl,
        ]);
    } else {
        $stmt = $pdo->prepare('
            UPDATE news
            SET headline = :headline, text = :text, date = :date
            WHERE id = :id
        ');
        $stmt->execute([
            'id' => $id,
            'headline' => $headline,
            'text' => $text,
            'date' => $date,
        ]);
    }

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Aktualita nenalezena.']);
        return;
    }

    echo json_encode(['status' => 'success', 'message' => 'Aktualita aktualizována.'], JSON_UNESCAPED_UNICODE);
}

function handleDelete(PDO $pdo): void {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Chybí ID aktuality.']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM news WHERE id = :id');
    $stmt->execute(['id' => (int)$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Aktualita nenalezena.']);
        return;
    }

    echo json_encode(['status' => 'success', 'message' => 'Aktualita smazána.'], JSON_UNESCAPED_UNICODE);
}
