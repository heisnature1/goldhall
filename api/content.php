<?php
/**
 * Read-only content endpoint.
 *
 * The public pages are rendered by PHP, but the Student Hub is still a
 * client-side app. This exposes the published content as JSON so it reads from
 * the same data/content.json the server renders from, instead of keeping its
 * own copy in localStorage.
 *
 *   api/content.php            -> all published content, keyed by type
 *   api/content.php?type=events -> one type
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/functions.php';
require_once dirname(__DIR__) . '/includes/seed-content.php';
require_once dirname(__DIR__) . '/includes/content.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// Read-only: nothing here writes.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$type = isset($_GET['type']) ? (string) $_GET['type'] : '';

if ($type !== '') {
    if (!in_array($type, goldhall_content_types(), true)) {
        http_response_code(404);
        echo json_encode(['error' => 'Unknown content type']);
        exit;
    }
    echo json_encode(goldhall_items($type), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = [];
foreach (goldhall_content_types() as $contentType) {
    $payload[$contentType] = goldhall_items($contentType);
}

echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
