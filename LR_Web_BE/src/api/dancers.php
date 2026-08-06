<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

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

function input(): array
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

function boolValue(mixed $value, bool $default = true): bool
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

function validateCategory(?string $value): ?string
{
    $value = strtoupper(trim((string) $value));

    if ($value === '') {
        return null;
    }

    if (!in_array($value, ['M', 'A', 'B', 'C', 'D', 'E'], true)) {
        respond(400, [
            'status' => 'error',
            'message' => 'Třída musí být M, A, B, C, D nebo E.',
        ]);
    }

    return $value;
}

function categoryRank(?string $category): int
{
    return match ($category) {
        'M' => 6,
        'A' => 5,
        'B' => 4,
        'C' => 3,
        'D' => 2,
        'E' => 1,
        default => 0,
    };
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
    $view = $_GET['view'] ?? 'pairs';
    $admin = ($_GET['admin'] ?? '') === '1';

    if ($admin) {
        requireAuth();

        $dancers = $pdo->query(
            'SELECT
                idt,
                name,
                surname,
                category_lat,
                category_stt,
                is_active,
                is_public,
                display_order
             FROM dancers
             ORDER BY surname, name'
        )->fetchAll();

        $pairs = $pdo->query(
            'SELECT
                p.pair_id,
                p.idt1,
                p.idt2,
                p.points,
                p.finals,
                p.is_active,
                p.is_public,
                p.display_order,
                d1.name AS dancer1_name,
                d1.surname AS dancer1_surname,
                d2.name AS dancer2_name,
                d2.surname AS dancer2_surname
             FROM dance_pairs p
             JOIN dancers d1 ON d1.idt = p.idt1
             JOIN dancers d2 ON d2.idt = p.idt2
             ORDER BY p.display_order, d1.surname, d2.surname'
        )->fetchAll();

        $results = $pdo->query(
            'SELECT
                r.id,
                r.pair_id,
                r.competition_name,
                r.date,
                r.location,
                r.placement,
                d1.name || \' \' || d1.surname AS dancer1,
                d2.name || \' \' || d2.surname AS dancer2
             FROM competition_results r
             JOIN dance_pairs p ON p.pair_id = r.pair_id
             JOIN dancers d1 ON d1.idt = p.idt1
             JOIN dancers d2 ON d2.idt = p.idt2
             ORDER BY r.date DESC, r.id DESC'
        )->fetchAll();

        respond(200, [
            'status' => 'success',
            'data' => [
                'dancers' => $dancers,
                'pairs' => $pairs,
                'results' => $results,
            ],
        ]);
    }

    if ($view === 'pairs') {
        $rows = $pdo->query(
            'SELECT
                p.pair_id,
                p.points,
                p.finals,
                p.display_order,
                d1.idt AS dancer1_id,
                d1.name AS dancer1_name,
                d1.surname AS dancer1_surname,
                d1.category_lat AS dancer1_lat,
                d1.category_stt AS dancer1_stt,
                d2.idt AS dancer2_id,
                d2.name AS dancer2_name,
                d2.surname AS dancer2_surname,
                d2.category_lat AS dancer2_lat,
                d2.category_stt AS dancer2_stt
             FROM dance_pairs p
             JOIN dancers d1 ON d1.idt = p.idt1
             JOIN dancers d2 ON d2.idt = p.idt2
             WHERE
                p.is_active = TRUE
                AND p.is_public = TRUE
                AND d1.is_active = TRUE
                AND d1.is_public = TRUE
                AND d2.is_active = TRUE
                AND d2.is_public = TRUE'
        )->fetchAll();

        $pairs = array_map(static function (array $row): array {
            $latCategories = array_filter([
                $row['dancer1_lat'],
                $row['dancer2_lat'],
            ]);

            $sttCategories = array_filter([
                $row['dancer1_stt'],
                $row['dancer2_stt'],
            ]);

            usort(
                $latCategories,
                static fn ($a, $b) => categoryRank($b) <=> categoryRank($a)
            );

            usort(
                $sttCategories,
                static fn ($a, $b) => categoryRank($b) <=> categoryRank($a)
            );

            $lat = $latCategories[0] ?? null;
            $stt = $sttCategories[0] ?? null;

            return [
                'pair_id' => (int) $row['pair_id'],
                'dancer1' => [
                    'id' => (int) $row['dancer1_id'],
                    'name' => $row['dancer1_name'],
                    'surname' => $row['dancer1_surname'],
                ],
                'dancer2' => [
                    'id' => (int) $row['dancer2_id'],
                    'name' => $row['dancer2_name'],
                    'surname' => $row['dancer2_surname'],
                ],
                'category_lat' => $lat,
                'category_stt' => $stt,
                'points' => (int) $row['points'],
                'finals' => (bool) $row['finals'],
                'display_order' => (int) $row['display_order'],
                'best_rank' => max(categoryRank($lat), categoryRank($stt)),
            ];
        }, $rows);

        usort($pairs, static function (array $a, array $b): int {
            return
                $b['best_rank'] <=> $a['best_rank']
                ?: $b['points'] <=> $a['points']
                ?: $a['display_order'] <=> $b['display_order']
                ?: strcmp(
                    $a['dancer1']['surname'],
                    $b['dancer1']['surname']
                );
        });

        respond(200, [
            'status' => 'success',
            'data' => $pairs,
        ]);
    }

    if ($view === 'singles') {
        $statement = $pdo->query(
            'SELECT
                d.idt,
                d.name,
                d.surname,
                d.category_lat,
                d.category_stt,
                d.display_order
             FROM dancers d
             WHERE
                d.is_active = TRUE
                AND d.is_public = TRUE
                AND NOT EXISTS (
                    SELECT 1
                    FROM dance_pairs p
                    WHERE
                        p.is_active = TRUE
                        AND p.is_public = TRUE
                        AND (p.idt1 = d.idt OR p.idt2 = d.idt)
                )
             ORDER BY
                CASE d.category_lat
                    WHEN \'M\' THEN 6
                    WHEN \'A\' THEN 5
                    WHEN \'B\' THEN 4
                    WHEN \'C\' THEN 3
                    WHEN \'D\' THEN 2
                    WHEN \'E\' THEN 1
                    ELSE 0
                END DESC,
                CASE d.category_stt
                    WHEN \'M\' THEN 6
                    WHEN \'A\' THEN 5
                    WHEN \'B\' THEN 4
                    WHEN \'C\' THEN 3
                    WHEN \'D\' THEN 2
                    WHEN \'E\' THEN 1
                    ELSE 0
                END DESC,
                d.display_order,
                d.surname,
                d.name'
        );

        respond(200, [
            'status' => 'success',
            'data' => $statement->fetchAll(),
        ]);
    }

    if ($view === 'results') {
        $rows = $pdo->query(
            'SELECT
                r.id,
                r.pair_id,
                r.competition_name,
                r.date,
                r.location,
                r.placement,
                d1.name || \' \' || d1.surname AS dancer1,
                d2.name || \' \' || d2.surname AS dancer2
             FROM competition_results r
             JOIN dance_pairs p ON p.pair_id = r.pair_id
             JOIN dancers d1 ON d1.idt = p.idt1
             JOIN dancers d2 ON d2.idt = p.idt2
             WHERE
                p.is_active = TRUE
                AND p.is_public = TRUE
             ORDER BY r.date DESC, r.id DESC'
        )->fetchAll();

        respond(200, [
            'status' => 'success',
            'data' => $rows,
        ]);
    }

    respond(400, [
        'status' => 'error',
        'message' => 'Neplatný view parametr.',
    ]);
}

requireAuth();

$payload = input();
$action = $payload['action'] ?? '';

if ($method === 'POST' && $action === 'create_dancer') {
    $name = trim((string) ($payload['name'] ?? ''));
    $surname = trim((string) ($payload['surname'] ?? ''));

    if ($name === '' || $surname === '') {
        respond(400, [
            'status' => 'error',
            'message' => 'Jméno i příjmení jsou povinné.',
        ]);
    }

    $statement = $pdo->prepare(
        'INSERT INTO dancers (
            name,
            surname,
            category_lat,
            category_stt,
            is_active,
            is_public,
            display_order
         ) VALUES (
            :name,
            :surname,
            :category_lat,
            :category_stt,
            :is_active,
            :is_public,
            :display_order
         ) RETURNING idt'
    );

    $statement->execute([
        ':name' => $name,
        ':surname' => $surname,
        ':category_lat' => validateCategory($payload['category_lat'] ?? null),
        ':category_stt' => validateCategory($payload['category_stt'] ?? null),
        ':is_active' => boolValue($payload['is_active'] ?? true),
        ':is_public' => boolValue($payload['is_public'] ?? true),
        ':display_order' => (int) ($payload['display_order'] ?? 0),
    ]);

    respond(201, [
        'status' => 'success',
        'id' => $statement->fetch()['idt'],
        'message' => 'Tanečník přidán.',
    ]);
}

if ($method === 'PUT' && $action === 'update_dancer') {
    $id = (int) ($payload['idt'] ?? 0);
    $name = trim((string) ($payload['name'] ?? ''));
    $surname = trim((string) ($payload['surname'] ?? ''));

    if ($id <= 0 || $name === '' || $surname === '') {
        respond(400, [
            'status' => 'error',
            'message' => 'Chybí ID, jméno nebo příjmení.',
        ]);
    }

    $statement = $pdo->prepare(
        'UPDATE dancers
         SET
            name = :name,
            surname = :surname,
            category_lat = :category_lat,
            category_stt = :category_stt,
            is_active = :is_active,
            is_public = :is_public,
            display_order = :display_order
         WHERE idt = :idt'
    );

    $statement->execute([
        ':idt' => $id,
        ':name' => $name,
        ':surname' => $surname,
        ':category_lat' => validateCategory($payload['category_lat'] ?? null),
        ':category_stt' => validateCategory($payload['category_stt'] ?? null),
        ':is_active' => boolValue($payload['is_active'] ?? true),
        ':is_public' => boolValue($payload['is_public'] ?? true),
        ':display_order' => (int) ($payload['display_order'] ?? 0),
    ]);

    respond(200, [
        'status' => 'success',
        'message' => 'Tanečník upraven.',
    ]);
}

if ($method === 'POST' && $action === 'create_pair') {
    $idt1 = (int) ($payload['idt1'] ?? 0);
    $idt2 = (int) ($payload['idt2'] ?? 0);

    if ($idt1 <= 0 || $idt2 <= 0 || $idt1 === $idt2) {
        respond(400, [
            'status' => 'error',
            'message' => 'Vyber dva různé tanečníky.',
        ]);
    }

    $firstId = min($idt1, $idt2);
    $secondId = max($idt1, $idt2);

    $existingPair = $pdo->prepare(
        'SELECT pair_id
         FROM dance_pairs
         WHERE idt1 = :idt1 AND idt2 = :idt2
         LIMIT 1'
    );

    $existingPair->execute([
        ':idt1' => $firstId,
        ':idt2' => $secondId,
    ]);

    $existing = $existingPair->fetch();

    if ($existing) {
        respond(409, [
            'status' => 'error',
            'message' => 'Tento taneční pár již existuje.',
            'pair_id' => (int) $existing['pair_id'],
        ]);
    }

    $statement = $pdo->prepare(
        'INSERT INTO dance_pairs (
            idt1,
            idt2,
            is_active,
            is_public,
            display_order
        ) VALUES (
            :idt1,
            :idt2,
            :is_active,
            :is_public,
            :display_order
        )
        RETURNING pair_id'
    );

    try {
        $statement->execute([
            ':idt1' => $firstId,
            ':idt2' => $secondId,
            ':is_active' => boolValue($payload['is_active'] ?? true),
            ':is_public' => boolValue($payload['is_public'] ?? true),
            ':display_order' => (int) ($payload['display_order'] ?? 0),
        ]);

        $createdPair = $statement->fetch();

        respond(201, [
            'status' => 'success',
            'id' => (int) $createdPair['pair_id'],
            'message' => 'Taneční pár vytvořen.',
        ]);
    } catch (PDOException $exception) {
        if ($exception->getCode() === '23505') {
            respond(409, [
                'status' => 'error',
                'message' => 'Tento taneční pár již existuje.',
            ]);
        }

        throw $exception;
    }
}

if ($method === 'PUT' && $action === 'update_pair') {
    $pairId = (int) ($payload['pair_id'] ?? 0);

    if ($pairId <= 0) {
        respond(400, [
            'status' => 'error',
            'message' => 'Chybí ID páru.',
        ]);
    }

    $statement = $pdo->prepare(
        'UPDATE dance_pairs
         SET
            is_active = :is_active,
            is_public = :is_public,
            display_order = :display_order
         WHERE pair_id = :pair_id'
    );

    $statement->execute([
        ':pair_id' => $pairId,
        ':is_active' => boolValue($payload['is_active'] ?? true),
        ':is_public' => boolValue($payload['is_public'] ?? true),
        ':display_order' => (int) ($payload['display_order'] ?? 0),
    ]);

    respond(200, [
        'status' => 'success',
        'message' => 'Taneční pár upraven.',
    ]);
}

if ($method === 'POST' && $action === 'create_result') {
    $pairId = (int) ($payload['pair_id'] ?? 0);
    $competition = trim((string) ($payload['competition_name'] ?? ''));
    $location = trim((string) ($payload['location'] ?? ''));
    $placement = trim((string) ($payload['placement'] ?? ''));
    $date = trim((string) ($payload['date'] ?? ''));

    if ($pairId <= 0 || $competition === '' || $location === '' || $placement === '' || $date === '') {
        respond(400, [
            'status' => 'error',
            'message' => 'Vyplň pár, soutěž, datum, místo i umístění.',
        ]);
    }

    $statement = $pdo->prepare(
        'INSERT INTO competition_results (
            pair_id,
            competition_name,
            date,
            location,
            placement
         ) VALUES (
            :pair_id,
            :competition_name,
            :date,
            :location,
            :placement
         ) RETURNING id'
    );

    $statement->execute([
        ':pair_id' => $pairId,
        ':competition_name' => $competition,
        ':date' => $date,
        ':location' => $location,
        ':placement' => $placement,
    ]);

    respond(201, [
        'status' => 'success',
        'id' => $statement->fetch()['id'],
        'message' => 'Výsledek přidán.',
    ]);
}

if ($method === 'DELETE' && $action === 'delete_pair') {
    $pairId = (int) ($payload['pair_id'] ?? 0);

    if ($pairId <= 0) {
        respond(400, [
            'status' => 'error',
            'message' => 'Chybí ID páru.',
        ]);
    }

    $pdo->beginTransaction();

    try {
        $deleteResults = $pdo->prepare(
            'DELETE FROM competition_results WHERE pair_id = :pair_id'
        );
        $deleteResults->execute([':pair_id' => $pairId]);

        $deletePair = $pdo->prepare(
            'DELETE FROM dance_pairs WHERE pair_id = :pair_id'
        );
        $deletePair->execute([':pair_id' => $pairId]);

        $pdo->commit();
    } catch (Throwable $exception) {
        $pdo->rollBack();
        throw $exception;
    }

    respond(200, [
        'status' => 'success',
        'message' => 'Pár i jeho výsledky byly smazány.',
    ]);
}

if ($method === 'DELETE' && $action === 'delete_result') {
    $id = (int) ($payload['id'] ?? 0);

    $statement = $pdo->prepare(
        'DELETE FROM competition_results WHERE id = :id'
    );
    $statement->execute([':id' => $id]);

    respond(200, [
        'status' => 'success',
        'message' => 'Výsledek smazán.',
    ]);
}

respond(405, [
    'status' => 'error',
    'message' => 'Nepodporovaná operace.',
]);