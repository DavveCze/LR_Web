<?php
// Jednoduchý načtač .env souboru pro čisté PHP
function loadEnv($path) {
    if (!file_exists($path)) {
        // Pokud .env chybí (např. jsi ho zapomněl nahrát na produkci), raději aplikaci zastavíme.
        die(json_encode(["status" => "error", "message" => "Kritická chyba: Chybí konfigurační soubor."]));
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lines as $line) {
        // Přeskočíme komentáře (řádky začínající na #)
        if (strpos(trim($line), '#') === 0) continue;

        // Rozdělíme klíč a hodnotu (např. DB_USER=root)
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        // Odstraníme případné uvozovky kolem hodnoty
        $value = trim($value, '"\'');

        // Uložíme do prostředí
        $_ENV[$name] = $value;
        putenv(sprintf('%s=%s', $name, $value));
    }
}

// Spustíme funkci a načteme .env soubor z root složky
loadEnv(__DIR__ . '/.env');
?>