<?php
/**
 * Browser configuration for Supabase Auth.
 *
 * The frontend needs a project URL and a *publishable* key to call
 * auth.signUp() / auth.resetPasswordForEmail(). It must never see
 * GOLDHALL_SUPABASE_KEY, which bypasses row-level security.
 *
 *   GET api/auth-config.php
 *   {
 *     "enabled": true,
 *     "url": "https://<ref>.supabase.co",
 *     "key": "sb_publishable_...",          // or the legacy anon JWT
 *     "redirect_to": "https://site/reset-password",
 *     "confirm_redirect_to": "https://site/confirm-email",
 *     "site_url": "https://site"
 *   }
 *
 * When either variable is missing, `enabled` is false and the Student Hub
 * keeps using its local prototype store instead of breaking.
 *
 * Configuration (Vercel → Settings → Environment Variables):
 *
 *   GOLDHALL_SUPABASE_URL              https://<project-ref>.supabase.co
 *   GOLDHALL_SUPABASE_PUBLISHABLE_KEY  sb_publishable_…  (or legacy anon JWT)
 *   GOLDHALL_SITE_URL                  optional; used to build redirect links
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/functions.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

/** The publishable key: never the service/secret key. */
function goldhall_public_key(): string
{
    $key = getenv('GOLDHALL_SUPABASE_PUBLISHABLE_KEY');
    if ($key === false || trim($key) === '') {
        $key = getenv('GOLDHALL_SUPABASE_ANON_KEY');
    }
    $key = is_string($key) ? trim($key) : '';

    /* Refuse anything that can write. If someone pastes the secret key into
       the publishable variable, the site must not hand it to a browser. */
    if (str_starts_with($key, 'sb_secret_')) {
        return '';
    }

    return $key;
}

/** Absolute URL of this site, for the confirmation and reset links. */
function goldhall_site_url(): string
{
    $configured = getenv('GOLDHALL_SITE_URL');
    if (is_string($configured) && trim($configured) !== '') {
        return rtrim(trim($configured), '/');
    }

    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    if ($host === '') {
        return '';
    }

    $https  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $scheme = $https ? 'https' : 'http';

    return $scheme . '://' . $host;
}

$url = getenv('GOLDHALL_SUPABASE_URL') ?: getenv('SUPABASE_URL');
$url = is_string($url) ? rtrim(trim($url), '/') : '';
$key = goldhall_public_key();

$enabled = $url !== '' && $key !== '';
$site    = $enabled ? goldhall_site_url() : '';

echo json_encode([
    'enabled' => $enabled,
    'url'     => $url,
    'key'     => $key,
    /* Supabase appends the recovery token to this address when the user
       clicks the reset link. */
    'redirect_to' => $site !== '' ? $site . '/reset-password' : '',
    /* …and the confirmation token to this one. They are different pages: a
       reset link must never land on the confirmation screen, and vice versa. */
    'confirm_redirect_to' => $site !== '' ? $site . '/confirm-email' : '',
    'site_url'    => $site,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
