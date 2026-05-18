<?php
/**
 * TikTok User Posts API — Backend Proxy
 * Dipanggil oleh Vercel API route untuk mengambil postingan user TikTok via Tikwm
 */

// ── Config ────────────────────────────────────────────────────────────────────
$env = parse_ini_file(__DIR__ . '/.env');
define('API_KEY', $env['API_KEY'] ?? '');
define('CACHE_TTL', 1800); // 30 menit

// ── Helpers ───────────────────────────────────────────────────────────────────
function get_request_header(string $name): string {
    $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    return $_SERVER[$key] ?? '';
}

function json_response(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ── CORS ──────────────────────────────────────────────────────────────────────
header('Access-Control-Allow-Origin: https://reetools.vercel.app');
header('Access-Control-Allow-Headers: X-API-Key, Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
$providedKey = $_GET['key'] ?? get_request_header('X-API-Key');
if (!hash_equals(API_KEY, $providedKey)) {
    json_response(['error' => 'Unauthorized'], 401);
}

// ── Parse request ─────────────────────────────────────────────────────────────
$username = trim($_GET['username'] ?? '');
$username = ltrim($username, '@');
$limit = min((int)($_GET['limit'] ?? 30), 50);
if ($limit < 1) $limit = 30;

if ($username === '') {
    json_response(['error' => 'Username diperlukan'], 400);
}

// ── Redis cache ───────────────────────────────────────────────────────────────
$redis = null;
$cacheKey = "tiktok:posts:{$username}:{$limit}";

try {
    $redis = new Redis();
    $redis->connect('127.0.0.1', 6379, 1.0);
    $cached = $redis->get($cacheKey);
    if ($cached !== false) {
        header('X-Cache: HIT');
        echo $cached;
        exit;
    }
    header('X-Cache: MISS');
} catch (\Exception $e) {
    // Redis not available — continue without cache
}

// ── Fetch from Tikwm ──────────────────────────────────────────────────────────
$url = sprintf(
    'https://www.tikwm.com/api/user/posts?unique_id=%s&count=%d&cursor=0',
    urlencode($username),
    min($limit, 35)
);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER     => [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept: application/json',
    ],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    json_response(['error' => "Gagal konek ke TikTok: {$curlError}"], 502);
}

if ($httpCode !== 200 || empty($response)) {
    json_response(['error' => "Tikwm HTTP {$httpCode}"], 502);
}

$data = json_decode($response, true);
if (!is_array($data) || ($data['code'] ?? -1) !== 0 || empty($data['data']['videos'])) {
    json_response([
        'error' => $data['msg'] ?? 'Username tidak ditemukan atau tidak memiliki postingan publik.',
    ], 404);
}

// ── Map posts ─────────────────────────────────────────────────────────────────
$posts = [];
foreach ($data['data']['videos'] as $v) {
    $isPhoto = !empty($v['images']);
    $urls = null;

    if ($isPhoto && is_array($v['images'])) {
        $urls = array_values(array_map(function ($img) {
            return is_array($img) ? ($img['url'] ?? '') : (string)$img;
        }, $v['images']));
        $urls = array_filter($urls, fn($u) => $u !== '');
    }

    $posts[] = [
        'id'         => (string)($v['video_id'] ?? $v['id'] ?? ''),
        'desc'       => (string)($v['title'] ?? ''),
        'type'       => $isPhoto ? 'photo' : 'video',
        'thumbnail'  => (string)($v['cover'] ?? $v['origin_cover'] ?? ''),
        'url'        => (string)($v['play'] ?? $v['wmplay'] ?? ''),
        'urls'       => $urls,
        'stats'      => [
            'playCount'    => (int)($v['play_count'] ?? 0),
            'likeCount'    => (int)($v['digg_count'] ?? 0),
            'shareCount'   => (int)($v['share_count'] ?? 0),
            'commentCount' => (int)($v['comment_count'] ?? 0),
        ],
        'createTime' => (int)($v['create_time'] ?? 0),
    ];
}

$result = json_encode([
    'username'   => $username,
    'totalPosts' => count($posts),
    'posts'      => $posts,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// ── Save to Redis ─────────────────────────────────────────────────────────────
if ($redis) {
    try {
        $redis->setex($cacheKey, CACHE_TTL, $result);
    } catch (\Exception $e) {
        // ignore cache write errors
    }
}

echo $result;
