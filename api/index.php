<?php
/**
 * Vercel entry point.
 *
 * Vercel only executes PHP that lives under api/ — every other .php file is
 * served as a static download, which is why the site was downloading instead
 * of rendering. All page requests are rewritten here by vercel.json and this
 * dispatcher hands them to the real page in the project root.
 *
 * On Apache/shared hosting these files are executed directly and this
 * dispatcher is never used.
 */

declare(strict_types=1);

/** The pages that may be dispatched, mapped to the file in the project root. */
const GOLDHALL_VERCEL_PAGES = [
    'index'      => 'index.php',
    'about'      => 'about.php',
    'executives' => 'executives.php',
    'events'     => 'events.php',
    'gallery'    => 'gallery.php',
    'contact'    => 'contact.php',
    'students'   => 'students.php',
    'student'    => 'student.php',
    'dashboard'  => 'dashboard.php',
    'admin'      => 'admin.php',
    /* Supabase Auth landing pages */
    'reset-password' => 'reset-password.php',
    'confirm-email'  => 'confirm-email.php',
];

/**
 * Work out which page was requested.
 *
 * Vercel may hand over the rewritten path (/api/index.php) rather than the
 * original, so fall back in order: explicit ?page=, the original URI, then
 * the rewritten path. Anything unrecognised is the home page.
 */
function goldhall_vercel_page(): string
{
    $candidates = [];

    if (isset($_GET['page'])) {
        $candidates[] = (string) $_GET['page'];
    }
    foreach (['REQUEST_URI', 'ORIGINAL_URL', 'HTTP_X_ORIGINAL_URL', 'SCRIPT_NAME'] as $key) {
        if (!empty($_SERVER[$key])) {
            $candidates[] = (string) $_SERVER[$key];
        }
    }

    foreach ($candidates as $raw) {
        $path = parse_url($raw, PHP_URL_PATH);
        if (!is_string($path)) {
            continue;
        }

        $name = trim($path, '/');
        $name = preg_replace('/\.php$/i', '', $name);
        // Strip a leading api/ if the rewritten path leaked through.
        $name = preg_replace('#^api/#i', '', (string) $name);
        $name = trim((string) $name, '/');

        if ($name === '' || $name === 'index') {
            return 'index';
        }
        if (isset(GOLDHALL_VERCEL_PAGES[$name])) {
            return $name;
        }
    }

    return 'index';
}

$page = goldhall_vercel_page();
$file = __DIR__ . '/../' . GOLDHALL_VERCEL_PAGES[$page];

if (!is_file($file)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Page not found';
    exit;
}

/*
 * The pages detect the active nav tab from SCRIPT_NAME. Point it at the real
 * page so highlighting and the per-page banner rules keep working.
 */
$_SERVER['SCRIPT_NAME']     = '/' . GOLDHALL_VERCEL_PAGES[$page];
$_SERVER['PHP_SELF']        = '/' . GOLDHALL_VERCEL_PAGES[$page];
$_SERVER['DOCUMENT_ROOT']   = dirname(__DIR__);

require $file;
