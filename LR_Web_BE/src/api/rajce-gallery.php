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

$action = $_GET['action'] ?? 'albums';

/**
 * Bezpečné stažení obsahu s timeoutem a User-Agent hlavičkou.
 */
function fetchRemoteUrl(string $url): ?string {
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n" .
                        "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n" .
                        "Accept-Language: cs,sk,en;q=0.9\r\n",
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

/**
 * 1. Získání seznamu alb z oficiálního RSS exportu
 */
if ($action === 'albums') {
    $cacheFile = sys_get_temp_dir() . '/rajce_albums_cache.json';
    $cacheTtl = 3600; // 1 hodina

    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
        $cachedData = @file_get_contents($cacheFile);
        if ($cachedData) {
            echo $cachedData;
            exit;
        }
    }

    $rssUrl = 'https://www.rajce.idnes.cz/export/user/lr-dance/albums.rss';
    $xmlContent = fetchRemoteUrl($rssUrl);

    if (!$xmlContent) {
        // Fallback: Pokud RSS selže, zkusíme starší cache i po expiraci
        if (file_exists($cacheFile)) {
            $staleData = @file_get_contents($cacheFile);
            if ($staleData) {
                echo $staleData;
                exit;
            }
        }

        http_response_code(502);
        echo json_encode([
            'status' => 'error',
            'message' => 'Nepodařilo se načíst alba z Rajče.cz.',
            'albums' => []
        ]);
        exit;
    }

    $albums = [];
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xmlContent);

    if ($xml && isset($xml->channel->item)) {
        foreach ($xml->channel->item as $item) {
            $rawTitle = (string)$item->title;
            // Odstranění prefixu "lr-dance | "
            $title = preg_replace('/^lr-dance\s*\|\s*/i', '', trim($rawTitle));
            $link = (string)$item->link;
            $coverUrl = (string)($item->image->url ?? '');
            $pubDate = (string)$item->pubDate;
            $description = (string)$item->description;

            // Detekce kategorie: carmen / kolony vs klubové akce (soustředění, soutěže)
            $lowerTitle = mb_strtolower($title, 'UTF-8');
            $isCarmen = str_contains($lowerTitle, 'carmen') || 
                        str_contains($lowerTitle, 'kolona') ||
                        str_contains($lowerTitle, 'stredoskolske') ||
                        str_contains($lowerTitle, 'středoškolské');

            // Vytažení tagů z popisu (např. #tanec #sport)
            preg_match_all('/#([\p{L}\d_]+)/u', $description, $tagMatches);
            $tags = $tagMatches[1] ?? [];

            // Vytvoření identifikátoru alba ze slugu
            $pathParts = explode('/', rtrim(parse_url($link, PHP_URL_PATH) ?? '', '/'));
            $id = end($pathParts) ?: md5($link);

            $albums[] = [
                'id' => $id,
                'title' => $title,
                'url' => $link,
                'coverUrl' => $coverUrl,
                'date' => $pubDate,
                'category' => $isCarmen ? 'carmen' : 'club',
                'tags' => array_values(array_unique($tags)),
            ];
        }
    }

    $response = json_encode([
        'status' => 'success',
        'count' => count($albums),
        'albums' => $albums
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    @file_put_contents($cacheFile, $response);
    echo $response;
    exit;
}

/**
 * 2. Získání fotografií konkrétního alba
 */
if ($action === 'album') {
    $albumUrl = trim((string)($_GET['url'] ?? ''));

    if ($albumUrl === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Chybí parametr url alba.']);
        exit;
    }

    // SSRF ochrana: Povolit pouze legitimní domény Rajčete
    $parsed = parse_url($albumUrl);
    $host = $parsed['host'] ?? '';
    if (!str_ends_with($host, 'rajce.idnes.cz') && !str_ends_with($host, 'rajce.net')) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Neplatná URL doména alba.']);
        exit;
    }

    $cacheKey = md5($albumUrl);
    $cacheFile = sys_get_temp_dir() . '/rajce_album_' . $cacheKey . '.json';
    $cacheTtl = 7200; // 2 hodiny

    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
        $cachedData = @file_get_contents($cacheFile);
        if ($cachedData) {
            echo $cachedData;
            exit;
        }
    }

    $html = fetchRemoteUrl($albumUrl);

    if (!$html) {
        if (file_exists($cacheFile)) {
            $staleData = @file_get_contents($cacheFile);
            if ($staleData) {
                echo $staleData;
                exit;
            }
        }

        http_response_code(502);
        echo json_encode([
            'status' => 'error',
            'message' => 'Nepodařilo se načíst obsah alba z Rajče.cz.',
            'photos' => []
        ]);
        exit;
    }

    // Vytažení titulku alba
    $albumTitle = '';
    if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $titleMatch)) {
        $albumTitle = trim(html_entity_decode($titleMatch[1], ENT_QUOTES, 'UTF-8'));
        $albumTitle = preg_replace('/(\s*–\s*|\s*\|\s*)Rajče\.net.*$/i', '', $albumTitle);
        $albumTitle = preg_replace('/(\s*–\s*|\s*\|\s*)Rajče\.idnes\.cz.*$/i', '', $albumTitle);
    }

    // Vytažení strukturovaných fotografií z JSON embedded v HTML
    $photos = [];
    
    // Vyhledání výskytů image_url a thumb_url
    preg_match_all('/\"id\":\s*(\d+).*?\"image_url\":\s*\"([^\"]+)\".*?\"thumb_url\":\s*\"([^\"]+)\"/is', $html, $allMatches, PREG_SET_ORDER);

    if (empty($allMatches)) {
        // Alternativní regex pro zachycení obrázků
        preg_match_all('/\"image_url\":\s*\"([^\"]+)\"/i', $html, $imgMatches);
        preg_match_all('/\"thumb_url\":\s*\"([^\"]+)\"/i', $html, $thumbMatches);

        $imgList = $imgMatches[1] ?? [];
        $thumbList = $thumbMatches[1] ?? [];
        $count = count($imgList);

        for ($i = 0; $i < $count; $i++) {
            $img = str_replace('\\/', '/', $imgList[$i]);
            $thumb = isset($thumbList[$i]) ? str_replace('\\/', '/', $thumbList[$i]) : $img;
            $pathInfo = pathinfo(parse_url($img, PHP_URL_PATH) ?? '');
            $filename = $pathInfo['basename'] ?? ('foto_' . ($i + 1));

            $photos[] = [
                'id' => (string)($i + 1),
                'imageUrl' => $img,
                'thumbUrl' => $thumb,
                'title' => $filename,
                'alt' => $albumTitle . ' – ' . $filename
            ];
        }
    } else {
        foreach ($allMatches as $m) {
            $photoId = $m[1];
            $img = str_replace('\\/', '/', $m[2]);
            $thumb = str_replace('\\/', '/', $m[3]);
            $pathInfo = pathinfo(parse_url($img, PHP_URL_PATH) ?? '');
            $filename = $pathInfo['basename'] ?? ('foto_' . $photoId);

            $photos[] = [
                'id' => (string)$photoId,
                'imageUrl' => $img,
                'thumbUrl' => $thumb,
                'title' => $filename,
                'alt' => $albumTitle . ' – ' . $filename
            ];
        }
    }

    $response = json_encode([
        'status' => 'success',
        'title' => $albumTitle,
        'count' => count($photos),
        'photos' => $photos
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if (!empty($photos)) {
        @file_put_contents($cacheFile, $response);
    }

    echo $response;
    exit;
}

http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'Neznámá akce.']);
