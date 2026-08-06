<?php
declare(strict_types=1);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config.php';

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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

function parseBoolean(mixed $value, bool $default = true): bool
{
    if ($value === null || $value === '') {
        return $default;
    }

    if (is_bool($value)) {
        return $value;
    }

    return filter_var(
        $value,
        FILTER_VALIDATE_BOOLEAN,
        FILTER_NULL_ON_FAILURE
    ) ?? $default;
}

function validateDay(string $day): string
{
    $validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    if (!in_array($day, $validDays, true)) {
        respond(400, [
            'status' => 'error',
            'message' => 'Neplatný den v týdnu.',
        ]);
    }

    return $day;
}

function validateType(string $type): string
{
    $validTypes = ['free', 'guided', 'practice', 'fitness'];

    if (!in_array($type, $validTypes, true)) {
        respond(400, [
            'status' => 'error',
            'message' => 'Neplatný typ tréninku.',
        ]);
    }

    return $type;
}

function validateTime(string $time, string $fieldLabel): string
{
    $date = DateTime::createFromFormat('H:i', $time);

    if (!$date || $date->format('H:i') !== $time) {
        respond(400, [
            'status' => 'error',
            'message' => "Neplatný čas: {$fieldLabel}.",
        ]);
    }

    return $time;
}

function getPayload(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!is_array($payload)) {
        respond(400, [
            'status' => 'error',
            'message' => 'Neplatná JSON data.',
        ]);
    }

    return $payload;
}

try {
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        getenv('DB_HOST') ?: 'postgres',
        getenv('DB_PORT') ?: '5432',
        getenv('DB_NAME')
    );

    $pdo = new PDO(
        $dsn,
        getenv('DB_USER'),
        getenv('DB_PASSWORD'),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $exception) {
    respond(500, [
        'status' => 'error',
        'message' => 'Chyba připojení k databázi.',
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $adminView = ($_GET['admin'] ?? '') === '1';

    $sql = '
        SELECT
            id,
            day_of_week,
            to_char(start_time, \'HH24:MI\') AS start_time,
            to_char(end_time, \'HH24:MI\') AS end_time,
            title,
            subtitle,
            block_type,
            is_active,
            display_order
        FROM training_schedule
    ';

    if (!$adminView) {
        $sql .= ' WHERE is_active = TRUE ';
    }

    $sql .= '
        ORDER BY
            CASE day_of_week
                WHEN \'monday\' THEN 1
                WHEN \'tuesday\' THEN 2
                WHEN \'wednesday\' THEN 3
                WHEN \'thursday\' THEN 4
                WHEN \'friday\' THEN 5
            END,
            start_time,
            display_order,
            id
    ';

    $rows = $pdo->query($sql)->fetchAll();

    respond(200, [
        'status' => 'success',
        'data' => $rows,
    ]);
}

requireAuth();

if (!in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
    respond(405, [
        'status' => 'error',
        'message' => 'Metoda nepovolena.',
    ]);
}

$data = getPayload();

if ($method === 'DELETE') {
    $id = (int) ($data['id'] ?? 0);

    if ($id <= 0) {
        respond(400, [
            'status' => 'error',
            'message' => 'Chybí ID bloku.',
        ]);
    }

    $statement = $pdo->prepare(
        'DELETE FROM training_schedule WHERE id = :id'
    );

    $statement->bindValue(':id', $id, PDO::PARAM_INT);
    $statement->execute();

    if ($statement->rowCount() === 0) {
        respond(404, [
            'status' => 'error',
            'message' => 'Blok rozvrhu nebyl nalezen.',
        ]);
    }

    respond(200, [
        'status' => 'success',
        'message' => 'Blok rozvrhu byl smazán.',
    ]);
}

$id = (int) ($data['id'] ?? 0);
$day = validateDay((string) ($data['day_of_week'] ?? ''));
$startTime = validateTime((string) ($data['start_time'] ?? ''), 'začátek');
$endTime = validateTime((string) ($data['end_time'] ?? ''), 'konec');

if ($endTime <= $startTime) {
    respond(400, [
        'status' => 'error',
        'message' => 'Konec musí být později než začátek.',
    ]);
}

$title = trim((string) ($data['title'] ?? ''));
$subtitle = trim((string) ($data['subtitle'] ?? ''));
$type = validateType((string) ($data['block_type'] ?? 'free'));

if ($title === '') {
    respond(400, [
        'status' => 'error',
        'message' => 'Název tréninku je povinný.',
    ]);
}

$params = [
    ':day_of_week' => $day,
    ':start_time' => $startTime,
    ':end_time' => $endTime,
    ':title' => $title,
    ':subtitle' => $subtitle !== '' ? $subtitle : null,
    ':block_type' => $type,
    ':display_order' => (int) ($data['display_order'] ?? 0),
];

if ($method === 'POST') {
    $statement = $pdo->prepare(
        'INSERT INTO training_schedule (
            day_of_week,
            start_time,
            end_time,
            title,
            subtitle,
            block_type,
            is_active,
            display_order
        ) VALUES (
            :day_of_week,
            :start_time,
            :end_time,
            :title,
            :subtitle,
            :block_type,
            :is_active,
            :display_order
        ) RETURNING id'
    );

    $statement->bindValue(':day_of_week', $day, PDO::PARAM_STR);
    $statement->bindValue(':start_time', $startTime, PDO::PARAM_STR);
    $statement->bindValue(':end_time', $endTime, PDO::PARAM_STR);
    $statement->bindValue(':title', $title, PDO::PARAM_STR);

    if ($subtitle === '') {
        $statement->bindValue(':subtitle', null, PDO::PARAM_NULL);
    } else {
        $statement->bindValue(':subtitle', $subtitle, PDO::PARAM_STR);
    }

    $statement->bindValue(':block_type', $type, PDO::PARAM_STR);
    $statement->bindValue(
        ':is_active',
        parseBoolean($data['is_active'] ?? true, true),
        PDO::PARAM_BOOL
    );
    $statement->bindValue(
        ':display_order',
        (int) ($data['display_order'] ?? 0),
        PDO::PARAM_INT
    );

    $statement->execute();
    $newId = $statement->fetch()['id'];

    respond(201, [
        'status' => 'success',
        'message' => 'Blok rozvrhu vytvořen.',
        'id' => $newId,
    ]);
}

if ($id <= 0) {
    respond(400, [
        'status' => 'error',
        'message' => 'Chybí ID bloku.',
    ]);
}

$statement = $pdo->prepare(
    'UPDATE training_schedule
     SET
        day_of_week = :day_of_week,
        start_time = :start_time,
        end_time = :end_time,
        title = :title,
        subtitle = :subtitle,
        block_type = :block_type,
        is_active = :is_active,
        display_order = :display_order,
        updated_at = CURRENT_TIMESTAMP
     WHERE id = :id'
);

$statement->bindValue(':id', $id, PDO::PARAM_INT);
$statement->bindValue(':day_of_week', $day, PDO::PARAM_STR);
$statement->bindValue(':start_time', $startTime, PDO::PARAM_STR);
$statement->bindValue(':end_time', $endTime, PDO::PARAM_STR);
$statement->bindValue(':title', $title, PDO::PARAM_STR);

if ($subtitle === '') {
    $statement->bindValue(':subtitle', null, PDO::PARAM_NULL);
} else {
    $statement->bindValue(':subtitle', $subtitle, PDO::PARAM_STR);
}

$statement->bindValue(':block_type', $type, PDO::PARAM_STR);
$statement->bindValue(
    ':is_active',
    parseBoolean($data['is_active'] ?? true, true),
    PDO::PARAM_BOOL
);
$statement->bindValue(
    ':display_order',
    (int) ($data['display_order'] ?? 0),
    PDO::PARAM_INT
);

$statement->execute();

if ($statement->rowCount() === 0) {
    respond(404, [
        'status' => 'error',
        'message' => 'Blok rozvrhu nebyl nalezen nebo se nezměnil.',
    ]);
}

respond(200, [
    'status' => 'success',
    'message' => 'Blok rozvrhu aktualizován.',
]);