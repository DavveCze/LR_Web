<?php
// Otevřeme to tvému Vite lokálnímu serveru
header("Access-Control-Allow-Origin: http://localhost:5173");
// Povolíme hlavičky, které může klient posílat
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
// Povolíme metody
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Zpracování Preflight OPTIONS requestu z prohlížeče
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_log('ENV dump: ' . print_r($_ENV, true));
error_log('ADMIN_USER: ' . (getenv('ADMIN_USER') ?: 'NENALEZENO'));

require_once __DIR__ . '/../config.php'; 

// 3. Klasické zpracování POST požadavku
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);



if ($data && isset($data['username']) && isset($data['password'])) {
    if ($data['username'] === $_ENV['ADMIN_USER'] && $data['password'] === $_ENV['ADMIN_PASS']) {
        
        $token = bin2hex(random_bytes(32));
        
        echo json_encode([
            "status" => "success", 
            "message" => "Přihlášení úspěšné.",
            "token" => $token
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Špatné jméno nebo heslo."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Vyplňte údaje."]);
}
?>