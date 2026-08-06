<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Všechny headers (CORS) i session_start() řeší config.php!
require_once __DIR__ . '/../config.php';

// Jednoduchý rate limiting podle IP (v produkci lepší přes Redis/DB)
$ip = $_SERVER['REMOTE_ADDR'];
$attemptsKey = 'login_attempts_' . $ip;
$_SESSION[$attemptsKey] = $_SESSION[$attemptsKey] ?? ['count' => 0, 'first' => time()];

if ($_SESSION[$attemptsKey]['count'] >= 5 && (time() - $_SESSION[$attemptsKey]['first']) < 900) {
    http_response_code(429);
    echo json_encode(['status' => 'error', 'message' => 'Příliš mnoho pokusů. Zkuste to později.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['email'], $data['password'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Vyplňte údaje.']);
    exit;
}

$adminUser = getenv('ADMIN_USER');
$adminPasswordHash = getenv('ADMIN_PASS_HASH');

$emailMatches = hash_equals($adminUser, $data['email']);
$passwordMatches = password_verify($data['password'], $adminPasswordHash);

if ($emailMatches && $passwordMatches) {
    session_regenerate_id(true); // nová session ID po úspěšném loginu — zabrání session fixation
    $_SESSION['authenticated'] = true;
    $_SESSION['user'] = $data['email'];
    unset($_SESSION[$attemptsKey]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Přihlášení úspěšné.',
    ]);
} else {
    $_SESSION[$attemptsKey]['count']++;
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Špatné jméno nebo heslo.']);
}