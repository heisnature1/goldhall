<?php
/**
 * Write endpoint for the admin portal.
 *
 * The admin screens are still a client-side app; this is the piece that turns
 * "save" into a real change on the server instead of one browser's
 * localStorage.
 *
 *   POST api/admin-content.php   action=save    (type, item JSON)
 *   POST api/admin-content.php   action=delete  (type, id)
 *   POST api/admin-content.php   action=upload  (file)
 *
 * Requires an admin session (see includes/auth.php).
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/functions.php';
require_once dirname(__DIR__) . '/includes/seed-content.php';
require_once dirname(__DIR__) . '/includes/content.php';
require_once dirname(__DIR__) . '/includes/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function admin_json(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    admin_json(405, ['error' => 'Method not allowed']);
}

if (!goldhall_is_admin()) {
    admin_json(401, ['error' => 'Not signed in as an administrator.']);
}

$action = (string) ($_POST['action'] ?? $_GET['action'] ?? '');
$types  = goldhall_content_types();

/** Validate and clean one item coming from the admin form. */
function admin_clean_item(array $input, array $types): ?array
{
    $type = (string) ($input['type'] ?? '');
    if (!in_array($type, $types, true)) {
        return null;
    }

    $item = [
        'id'        => preg_replace('/[^A-Za-z0-9._-]/', '', (string) ($input['id'] ?? '')) ?: $type . '-' . bin2hex(random_bytes(4)),
        'title'     => trim((string) ($input['title'] ?? '')),
        'text'      => trim((string) ($input['text'] ?? '')),
        'meta'      => trim((string) ($input['meta'] ?? '')),
        'link'      => trim((string) ($input['link'] ?? '')),
        'label'     => trim((string) ($input['label'] ?? '')),
        'image'     => trim((string) ($input['image'] ?? '')),
        'position'  => trim((string) ($input['position'] ?? '50% 50%')),
        'published' => !empty($input['published']),
    ];

    if ($item['title'] === '') {
        return null;
    }

    // Only allow safe link targets: no javascript: or data: URLs.
    if ($item['link'] !== '' && preg_match('#^(javascript|data|vbscript):#i', $item['link'])) {
        $item['link'] = '';
    }
    // Pictures must be a relative asset path, an upload, or an http(s) URL.
    if ($item['image'] !== '' && !goldhall_is_picture($item['image'])) {
        $item['image'] = '';
    }

    return $item;
}

switch ($action) {
    case 'save':
        $payload = $_POST['item'] ?? '';
        $input   = is_string($payload) ? json_decode($payload, true) : null;
        if (!is_array($input)) {
            admin_json(400, ['error' => 'Invalid item payload.']);
        }

        $item = admin_clean_item($input, $types);
        if ($item === null) {
            admin_json(422, ['error' => 'A title and a valid content type are required.']);
        }

        $type = (string) $input['type'];
        $data = goldhall_content();
        $list = $data[$type] ?? [];

        $replaced = false;
        foreach ($list as $index => $existing) {
            if (($existing['id'] ?? '') === $item['id']) {
                $list[$index] = $item;
                $replaced = true;
                break;
            }
        }
        if (!$replaced) {
            array_unshift($list, $item);
        }

        $data[$type] = array_values($list);
        if (!goldhall_save_content($data)) {
            admin_json(500, ['error' => goldhall_write_error()]);
        }
        admin_json(200, ['ok' => true, 'item' => $item, 'replaced' => $replaced]);

    case 'delete':
        $type = (string) ($_POST['type'] ?? '');
        $id   = (string) ($_POST['id'] ?? '');
        if (!in_array($type, $types, true) || $id === '') {
            admin_json(422, ['error' => 'A valid content type and id are required.']);
        }

        $data = goldhall_content();
        $before = count($data[$type] ?? []);
        $data[$type] = array_values(array_filter(
            $data[$type] ?? [],
            static fn (array $item): bool => ($item['id'] ?? '') !== $id
        ));

        if (count($data[$type]) === $before) {
            admin_json(404, ['error' => 'That item no longer exists.']);
        }
        if (!goldhall_save_content($data)) {
            admin_json(500, ['error' => goldhall_write_error()]);
        }
        admin_json(200, ['ok' => true]);

    case 'upload':
        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            admin_json(400, ['error' => 'No file was uploaded.']);
        }
        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            admin_json(400, ['error' => 'The upload failed. Please try again.']);
        }
        if (($file['size'] ?? 0) > 6 * 1024 * 1024) {
            admin_json(413, ['error' => 'That picture is larger than 6 MB.']);
        }

        $info = @getimagesize($file['tmp_name']);
        $allowed = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif', IMAGETYPE_WEBP => 'webp'];
        if ($info === false || !isset($allowed[$info[2]])) {
            admin_json(415, ['error' => 'Please upload a PNG, JPG, WEBP or GIF image.']);
        }

        $dir = goldhall_upload_dir();
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            admin_json(500, ['error' => goldhall_write_error()]);
        }
        if (!is_writable($dir)) {
            admin_json(500, ['error' => goldhall_write_error()]);
        }

        // A random name, never the client-supplied one.
        $name = date('Ymd-His') . '-' . bin2hex(random_bytes(5)) . '.' . $allowed[$info[2]];
        if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) {
            admin_json(500, ['error' => 'Could not save the uploaded picture.']);
        }
        admin_json(200, ['ok' => true, 'url' => 'assets/uploads/' . $name]);

    default:
        admin_json(400, ['error' => 'Unknown action.']);
}
