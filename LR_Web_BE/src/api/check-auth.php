<?php
// src/api/check-auth.php
require_once __DIR__ . '/../config.php';

if (!empty($_SESSION['authenticated'])) {
    echo json_encode(['status' => 'success', 'user' => $_SESSION['user']]);
} else {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Nepřihlášen.']);
}