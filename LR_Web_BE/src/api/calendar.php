<?php
declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$calendarIcsUrl = 'https://calendar.google.com/calendar/ical/qc9gbrdp1qrij02tenteeknopk%40group.calendar.google.com/public/basic.ics';
$cacheFile = sys_get_temp_dir() . '/google_calendar_cache.json';
$cacheTtl = 120; // 2 minuty pro svižnou aktualizaci změn z Google Kalendáře

$forceRefresh = isset($_GET['refresh']) && $_GET['refresh'] === '1';

if (!$forceRefresh && file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
    $cached = @file_get_contents($cacheFile);
    if ($cached !== false && $cached !== '') {
        echo $cached;
        exit;
    }
}

function fetchIcsContent(string $url): ?string {
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) LR-Dance/1.0\r\n" .
                        "Accept: text/calendar, text/plain, */*\r\n",
            'timeout' => 8,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ]
    ]);

    $content = @file_get_contents($url, false, $ctx);
    return ($content !== false && $content !== '') ? $content : null;
}

$rawIcs = fetchIcsContent($calendarIcsUrl);

// Pokud selže stažení a existuje jakákoliv starší cache, vrátíme ji
if ($rawIcs === null) {
    if (file_exists($cacheFile)) {
        $cached = @file_get_contents($cacheFile);
        if ($cached !== false && $cached !== '') {
            echo $cached;
            exit;
        }
    }
    http_response_code(502);
    echo json_encode([
        'status' => 'error',
        'message' => 'Nepodařilo se stáhnout data kalendáře.',
        'events' => []
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Unfold řádků iCal (řádky začínající mezerou nebo tabulátorem jsou pokračováním předchozího)
$lines = preg_split("/\r\n|\n|\r/", $rawIcs);
$unfolded = [];
foreach ($lines as $line) {
    if ($line === '') continue;
    if (isset($line[0]) && ($line[0] === ' ' || $line[0] === "\t")) {
        if (!empty($unfolded)) {
            $unfolded[count($unfolded) - 1] .= substr($line, 1);
        }
    } else {
        $unfolded[] = $line;
    }
}

$rawEvents = [];
$currentEvent = null;

foreach ($unfolded as $line) {
    $line = trim($line);
    if ($line === 'BEGIN:VEVENT') {
        $currentEvent = [];
    } elseif ($line === 'END:VEVENT') {
        if ($currentEvent !== null) {
            $rawEvents[] = $currentEvent;
        }
        $currentEvent = null;
    } elseif ($currentEvent !== null && strpos($line, ':') !== false) {
        [$keyPart, $valuePart] = explode(':', $line, 2);
        $key = strtoupper(explode(';', $keyPart)[0]);
        // Dekódování iCal escapovaných znaků
        $value = str_replace(['\\n', '\\N', '\\,', '\\;'], ["\n", "\n", ',', ';'], $valuePart);
        $currentEvent[$key] = $value;
    }
}

function parseIcalDate(?string $str): ?DateTimeImmutable {
    if (!$str) return null;
    $clean = trim($str);
    // Formát YYYYMMDD nebo YYYYMMDDTHHMMSSZ
    if (preg_match('/^(\d{4})(\d{2})(\d{2})/', $clean, $m)) {
        return new DateTimeImmutable("{$m[1]}-{$m[2]}-{$m[3]} 00:00:00", new DateTimeZone('Europe/Prague'));
    }
    return null;
}

function detectEventType(string $title, string $desc): string {
    $t = mb_strtolower($title . ' ' . $desc, 'UTF-8');
    if (str_contains($t, 'tábor') || str_contains($t, 'tabor')) {
        return 'tabor';
    }
    if (str_contains($t, 'akademie')) {
        return 'akademie';
    }
    if (str_contains($t, 'soutěž') || str_contains($t, 'soutez') || str_contains($t, 'pohár') || str_contains($t, 'pohar') || str_contains($t, 'čsts') || str_contains($t, 'csts') || str_contains($t, 'mčr')) {
        return 'soutez';
    }
    if (str_contains($t, 'soustředění') || str_contains($t, 'soustredeni') || str_contains($t, 'víkend') || str_contains($t, 'vikend')) {
        return 'soustredeni';
    }
    return 'soustredeni';
}

function detectLocation(string $title, ?string $loc): string {
    if (!empty($loc)) {
        $clean = trim($loc);
        // Vyčistí případné Google Maps artefakty typu ", E, "
        $clean = preg_replace('/\s*,\s*[A-Z]\s*,\s*/', ', ', $clean);
        return $clean;
    }
    $t = mb_strtolower($title, 'UTF-8');
    if (str_contains($t, 'hotel') || str_contains($t, 'budoucnost') || str_contains($t, 'beskyd')) {
        return 'Beskydy, Hotel Budoucnost';
    }
    if (str_contains($t, 'letní soustředění') || str_contains($t, 'zimní soustředění') || str_contains($t, 'víkendové soustředění')) {
        return 'Beskydy, Hotel Budoucnost';
    }
    if (str_contains($t, 'letní tábor') || str_contains($t, 'spací tábor') || str_contains($t, 'víkend carmen')) {
        return 'Beskydy, Pobytový areál';
    }
    if (str_contains($t, 'příměstský tábor') || str_contains($t, 'primestsky')) {
        return 'Taneční sál Ostrava';
    }
    if (str_contains($t, 'akademie')) {
        return 'Kulturní dům Ostrava';
    }
    if (str_contains($t, 'pohár') || str_contains($t, 'soutěž')) {
        return 'Sportovní hala Ostrava';
    }
    return 'Ostrava a okolí';
}

function detectNote(string $title, ?string $desc, string $type): string {
    $descTrim = trim((string)$desc);
    if (!empty($descTrim) && mb_strtolower($descTrim, 'UTF-8') !== 'soustředění' && mb_strtolower($descTrim, 'UTF-8') !== 'soustredeni') {
        return $descTrim;
    }
    
    $t = mb_strtolower($title, 'UTF-8');
    if ($type === 'soustredeni') {
        if (str_contains($t, 'letní')) {
            return 'Fyzický trénink, standard i latina pro všechny věkové kategorie';
        }
        if (str_contains($t, 'zimní') || str_contains($t, 'víkendové') || str_contains($t, 'předvánoční')) {
            return 'Intenzivní víkendový seminář LAT & STT s trenéry klubu';
        }
        return 'Intenzivní trénink a taneční příprava párů LR Dance Team';
    }
    if ($type === 'tabor') {
        if (str_contains($t, 'příměstský')) {
            return 'Příměstský taneční tábor CARMEN pro děti a mládež';
        }
        return 'Letní pobytový taneční tábor pro děti a mládež s bohatým programem';
    }
    if ($type === 'akademie') {
        return 'Vystoupení všech kurzů od dětí po dospělé';
    }
    if ($type === 'soutez') {
        return 'Účast nominovaných párů LR Dance Team';
    }
    return 'Bližší informace u trenérů a vedení klubu';
}

$today = new DateTimeImmutable('today', new DateTimeZone('Europe/Prague'));
$parsedEvents = [];

$idCounter = 1;
foreach ($rawEvents as $ev) {
    $start = parseIcalDate($ev['DTSTART'] ?? null);
    $end = parseIcalDate($ev['DTEND'] ?? null);
    if (!$start) continue;

    // V iCal u celodenních akcí je DTEND exkluzivní (např. 18. – 21. znamená konec 20.)
    $displayEnd = $end;
    if ($end && $end > $start) {
        $displayEnd = $end->modify('-1 day');
    } else {
        $displayEnd = $start;
    }

    $summary = trim($ev['SUMMARY'] ?? 'Taneční akce');
    $desc = $ev['DESCRIPTION'] ?? null;
    $loc = $ev['LOCATION'] ?? null;

    $type = detectEventType($summary, (string)$desc);
    $location = detectLocation($summary, $loc);
    $note = detectNote($summary, $desc, $type);

    // Formátování data: např. "11. – 13. 12." nebo "09. 05." nebo "18. – 23. 07. 2026"
    $startDay = $start->format('d.');
    $startMonth = $start->format('m.');
    $startYear = $start->format('Y');

    $endDay = $displayEnd->format('d.');
    $endMonth = $displayEnd->format('m.');
    $endYear = $displayEnd->format('Y');

    $isCurrentYear = ($startYear === $today->format('Y'));

    if ($start->format('Y-m-d') === $displayEnd->format('Y-m-d')) {
        $dateFormatted = $isCurrentYear ? "{$startDay} {$startMonth}" : "{$startDay} {$startMonth} {$startYear}";
    } elseif ($startMonth === $endMonth && $startYear === $endYear) {
        $dateFormatted = $isCurrentYear ? "{$startDay} – {$endDay} {$startMonth}" : "{$startDay} – {$endDay} {$startMonth} {$startYear}";
    } else {
        $dateFormatted = $isCurrentYear ? "{$startDay} {$startMonth} – {$endDay} {$endMonth}" : "{$startDay} {$startMonth} – {$endDay} {$endMonth} {$endYear}";
    }

    $parsedEvents[] = [
        'id' => $idCounter++,
        'uid' => $ev['UID'] ?? (string)$idCounter,
        'title' => $summary,
        'date' => $dateFormatted,
        'location' => $location,
        'type' => $type,
        'note' => $note,
        'startDate' => $start->format('Y-m-d'),
        'endDate' => $displayEnd->format('Y-m-d'),
        'isUpcoming' => ($displayEnd >= $today),
    ];
}

// Seřazení chronologicky
usort($parsedEvents, fn($a, $b) => strcmp($a['startDate'], $b['startDate']));

// Výběr nadcházejících akcí (od dneška dál, seřazeno vzestupně)
$upcomingEvents = array_values(array_filter($parsedEvents, fn($e) => $e['isUpcoming']));

// Proběhlé akce (seřazené sestupně od nejnovějších)
$pastEvents = array_values(array_filter($parsedEvents, fn($e) => !$e['isUpcoming']));
usort($pastEvents, fn($a, $b) => strcmp($b['startDate'], $a['startDate']));

$response = [
    'status' => 'success',
    'calendarName' => 'LR akce apod.',
    'calendarUrl' => 'https://calendar.google.com/calendar/embed?src=qc9gbrdp1qrij02tenteeknopk%40group.calendar.google.com&ctz=Europe%2FPrague',
    'fetchedAt' => (new DateTimeImmutable())->format('c'),
    'events' => $parsedEvents,
    'upcomingEvents' => $upcomingEvents,
    'pastEvents' => $pastEvents,
    'totalUpcoming' => count($upcomingEvents),
    'totalPast' => count($pastEvents),
    'allEvents' => $parsedEvents
];

$jsonOutput = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
@file_put_contents($cacheFile, $jsonOutput);

echo $jsonOutput;
