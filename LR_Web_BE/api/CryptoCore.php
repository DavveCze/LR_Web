<?php
class CryptoCore {
    private $key;

    public function __construct($secret_key) {
        // Klíč musí mít přesně 32 bytů. SHA-256 hash z libovolného hesla nám to zajistí.
        $this->key = hash('sha256', $secret_key, true);
    }

    public function encrypt($plaintext) {
        // AES-256-GCM potřebuje 12 bytů dlouhý inicializační vektor (IV)
        $ivLength = openssl_cipher_iv_length('aes-256-gcm');
        $iv = openssl_random_pseudo_bytes($ivLength);
        
        $tag = ""; // Sem GCM uloží kontrolní podpis proti manipulaci
        
        $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $this->key, OPENSSL_RAW_DATA, $iv, $tag);
        
        // Spojíme IV, podpis (Tag - vždy 16 bytů) a zašifrovaná data dohromady.
        // Obalíme do Base64 POUZE kvůli bezpečnému uložení do textového sloupce v databázi.
        return base64_encode($iv . $tag . $ciphertext);
    }

    public function decrypt($encodedPayload) {
        $data = base64_decode($encodedPayload);
        
        $ivLength = openssl_cipher_iv_length('aes-256-gcm');
        $iv = substr($data, 0, $ivLength);
        $tag = substr($data, $ivLength, 16); // Tag má vždy 16 bytů
        $ciphertext = substr($data, $ivLength + 16);
        
        return openssl_decrypt($ciphertext, 'aes-256-gcm', $this->key, OPENSSL_RAW_DATA, $iv, $tag);
    }

    public static function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
?>