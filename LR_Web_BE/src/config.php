<?php
// Povol CORS z frontendu s podporou credentials a privátní sítě
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origin)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Access-Control-Request-Private-Network");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Private-Network: true");

// Vypořádání se s OPTIONS requestem globálně
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Zásadní úprava pro Cookies - syntaxe pole funguje 100% od PHP 7.3
if (PHP_SAPI !== 'cli' && session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_lifetime' => 3600,
        'cookie_path' => '/',
        'cookie_domain' => '',
        'cookie_secure' => false,
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax'
    ]);
}

// Jednoduchý načtač .env souboru pro čisté PHP
function loadEnv($path) {
    if (!file_exists($path)) {
        die(json_encode(["status" => "error", "message" => "Kritická chyba: Chybí konfigurační soubor."]));
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;

        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        $value = trim($value, '"\'');

        $_ENV[$name] = $value;
        putenv(sprintf('%s=%s', $name, $value));
    }
}

// Spustíme funkci a načteme .env soubor z root složky
loadEnv(__DIR__ . '/.env');
?>
