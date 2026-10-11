<?php
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Povolena je pouze metoda POST.']);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../services/SecurityGuardian.php';
require_once __DIR__ . '/../services/UniversalMailer.php';

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Neplatná data požadavku.']);
    exit;
}

// 1. Antispam & Bezpečnostní kontrola
$ip = SecurityGuardian::getClientIp();

// Honeypot pole (musí zůstat prázdné)
$honeypot = $data['website'] ?? $data['_hp'] ?? '';
if (!empty($honeypot)) {
    // Tichý úspěch pro roboty
    echo json_encode(['status' => 'success', 'message' => 'Vaše zpráva byla odeslána.']);
    exit;
}

// Časové okno (formulář nelze odeslat rychleji než za 2 sekundy)
if (!empty($data['_ts'])) {
    $timeWindow = SecurityGuardian::validateTimeWindow((int)$data['_ts'], minSeconds: 2, maxSeconds: 86400);
    if (!$timeWindow['valid']) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => $timeWindow['reason']]);
        exit;
    }
}

// Rate limiting (max 5 zpráv z jedné IP za 10 minut)
$rateLimit = SecurityGuardian::checkRateLimit($ip, maxPerIp: 5, ipPeriod: 600);
if (!$rateLimit['allowed']) {
    http_response_code(429);
    echo json_encode([
        'status' => 'error',
        'message' => 'Příliš mnoho požadavků. Zkuste to prosím za chvíli.',
        'retryAfter' => $rateLimit['retryAfter'] ?? 60
    ]);
    exit;
}

// 2. Validace vstupních polí
$name = trim((string)($data['name'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$phone = trim((string)($data['phone'] ?? ''));
$message = trim((string)($data['message'] ?? ''));

if ($name === '' || mb_strlen($name) < 2) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Vyplňte prosím platné jméno a příjmení.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Zadejte platnou e-mailovou adresu.']);
    exit;
}

if ($message === '' || mb_strlen($message) < 5) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Text zprávy musí mít alespoň 5 znaků.']);
    exit;
}

// Geofencing ČR (kontrola předvolby a IP)
$geoCheck = SecurityGuardian::verifyCzechVisitor($ip, $phone);
if (!$geoCheck['allowed']) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => $geoCheck['reason']]);
    exit;
}

// 3. Uložení do databáze (Prepared Statement)
try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('
        INSERT INTO contact_inquiries (name, email, phone, message, ip_address)
        VALUES (:name, :email, :phone, :message, :ip_address)
        RETURNING id
    ');
    $stmt->execute([
        'name' => $name,
        'email' => $email,
        'phone' => $phone !== '' ? $phone : null,
        'message' => $message,
        'ip_address' => $ip,
    ]);
    $inquiryId = $stmt->fetch()['id'] ?? null;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Došlo k chybě při ukládání zprávy.']);
    exit;
}

// 4. Odeslání e-mailu přes UniversalMailer (asynchronně / s ošetřením chyb)
try {
    $adminEmail = getenv('ADMIN_USER') ?: 'lrdanceostrava@gmail.com';
    $mailer = new UniversalMailer(defaultTo: $adminEmail);

    $emailSubject = "Nová zpráva z webu LR-Dance od: {$name}";
    $emailBody = "Jméno: {$name}\nE-mail: {$email}\nTelefon: {$phone}\nIP: {$ip}\n\nZpráva:\n{$message}";

    @$mailer->sendRaw($adminEmail, $emailSubject, $emailBody);
} catch (Throwable) {
    // E-mailová chyba nesmí shodit úspěšný zápis v DB
}

http_response_code(200);
echo json_encode([
    'status' => 'success',
    'message' => 'Děkujeme, vaše zpráva byla úspěšně odeslána.',
    'id' => $inquiryId,
], JSON_UNESCAPED_UNICODE);
