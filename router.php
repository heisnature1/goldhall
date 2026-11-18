<?php
/**
 * Router for PHP's built-in server, so the same URLs work locally:
 *
 *   php -S localhost:8000 router.php
 *
 * Mirrors the .htaccess rules: real files are served as-is, /about resolves
 * to about.php, and includes/ and data/ are never exposed.
 */

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = '/' . ltrim(rawurldecode($path), '/');

// Block the internals, exactly like the Apache rules.
if (preg_match('#^/(includes|data)/#', $path) || preg_match('#\.(json|tmp|sqlite)$#', $path)) {
    http_response_code(404);
    echo 'Not found';
    return true;
}

$root = __DIR__;
$file = realpath($root . $path);

// A real file inside the document root: let the built-in server handle it.
if ($file !== false && str_starts_with($file, $root) && is_file($file)) {
    if (str_ends_with($file, '.php')) {
        require $file;
        return true;
    }
    return false;
}

// /about -> /about.php
if ($file !== false && str_starts_with($file, $root) && is_dir($file)) {
    $index = $file . '/index.php';
    if (is_file($index)) {
        require $index;
        return true;
    }
}

if (!str_ends_with($path, '.php')) {
    $candidate = realpath($root . $path . '.php');
    if ($candidate !== false && str_starts_with($candidate, $root) && is_file($candidate)) {
        require $candidate;
        return true;
    }
}

http_response_code(404);
echo 'Not found';
return true;
