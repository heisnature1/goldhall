<?php
/**
 * Administration sign-in.
 *
 * A single hall administrator account, configured with environment variables:
 *
 *   GOLDHALL_ADMIN_USER      (default: admin)
 *   GOLDHALL_ADMIN_PASSWORD  (default: goldhall — CHANGE THIS)
 *
 * The old prototype hard-coded the password into JavaScript, which meant
 * anyone could read it in the page source. It is verified here, on the server,
 * and the cookie is HttpOnly.
 *
 * ---------------------------------------------------------------------------
 * Why this does not use PHP sessions
 * ---------------------------------------------------------------------------
 * On Vercel each request may be served by a different, freshly started
 * instance, and the session files PHP writes to /tmp belong to one instance
 * only. A session that was valid when the page rendered could therefore be
 * unknown a moment later, when the browser called api/admin-content.php or
 * api/portal.php: the administrator was signed out mid-edit, or every write
 * was refused with "only the administrator can…".
 *
 * The sign-in is therefore carried in a signed cookie instead. Its value is
 *   v1.<expiry>.<hmac>
 * and it is verified without touching the filesystem, so it means the same
 * thing on every instance. The signature key comes from GOLDHALL_ADMIN_SECRET
 * when set, and is otherwise derived from the admin password, so nothing new
 * has to be configured for this to work.
 */

declare(strict_types=1);

/** Cookie that carries the administrator's signed sign-in. */
const GOLDHALL_ADMIN_COOKIE = 'goldhall_admin';

/** Cookie that carries the value the CSRF token is derived from. */
const GOLDHALL_CSRF_COOKIE = 'goldhall_admin_csrf';

/** How long a sign-in lasts, in seconds (12 hours). */
const GOLDHALL_ADMIN_TTL = 43200;

function goldhall_admin_user(): string
{
    $user = getenv('GOLDHALL_ADMIN_USER');
    return $user !== false && $user !== '' ? $user : 'admin';
}

function goldhall_admin_password(): string
{
    $password = getenv('GOLDHALL_ADMIN_PASSWORD');
    return $password !== false && $password !== '' ? $password : 'goldhall';
}

/**
 * The key that signs cookies.
 *
 * An explicit GOLDHALL_ADMIN_SECRET is preferred. Without one the admin
 * password is used, which is already a server-side secret and is already
 * required to sign in, so the signatures are unforgeable either way. Changing
 * the password therefore also invalidates outstanding sign-ins, which is the
 * behaviour you want.
 */
function goldhall_admin_secret(): string
{
    $secret = getenv('GOLDHALL_ADMIN_SECRET');
    if ($secret !== false && $secret !== '') {
        return hash('sha256', $secret);
    }
    return hash('sha256', 'goldhall-cookie-key|' . goldhall_admin_password());
}

/** True when the connection is HTTPS, so the cookies can be marked Secure. */
function goldhall_is_https(): bool
{
    return !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
}

/**
 * Write a cookie.
 *
 * SameSite=Lax is deliberate: Strict would withhold the cookie on a normal
 * top-level navigation to /admin, and None is unnecessary because nothing here
 * is embedded cross-site.
 */
function goldhall_cookie_set(string $name, string $value, int $expires): void
{
    if (headers_sent()) {
        return;
    }
    setcookie($name, $value, [
        'expires'  => $expires,
        'path'     => '/',
        'httponly' => true,
        'secure'   => goldhall_is_https(),
        'samesite' => 'Lax',
    ]);
    /* Make it visible to the rest of this request too. */
    $_COOKIE[$name] = $value;
}

function goldhall_cookie_clear(string $name): void
{
    goldhall_cookie_set($name, '', time() - 3600);
    unset($_COOKIE[$name]);
}

/** The expiry carried by a valid sign-in cookie, or null when there is none. */
function goldhall_admin_expiry(): ?int
{
    $raw = (string) ($_COOKIE[GOLDHALL_ADMIN_COOKIE] ?? '');
    if ($raw === '') {
        return null;
    }

    $parts = explode('.', $raw);
    if (count($parts) !== 3 || $parts[0] !== 'v1') {
        return null;
    }
    [, $expiry, $signature] = $parts;
    if (!ctype_digit($expiry)) {
        return null;
    }

    $expected = hash_hmac('sha256', 'v1.' . $expiry, goldhall_admin_secret());
    if (!hash_equals($expected, $signature)) {
        return null;
    }
    if ((int) $expiry < time()) {
        return null;
    }
    return (int) $expiry;
}

/** True when the current browser is signed in as the administrator. */
function goldhall_is_admin(): bool
{
    return goldhall_admin_expiry() !== null;
}

/**
 * Check credentials and set the sign-in cookie on success.
 *
 * Call this before any output: it writes headers.
 */
function goldhall_admin_login(string $user, string $password): bool
{
    // hash_equals keeps the comparison constant-time.
    $userOk     = hash_equals(goldhall_admin_user(), $user);
    $passwordOk = hash_equals(goldhall_admin_password(), $password);

    if (!$userOk || !$passwordOk) {
        return false;
    }

    $expiry   = time() + GOLDHALL_ADMIN_TTL;
    $signature = hash_hmac('sha256', 'v1.' . $expiry, goldhall_admin_secret());
    goldhall_cookie_set(GOLDHALL_ADMIN_COOKIE, 'v1.' . $expiry . '.' . $signature, $expiry);

    return true;
}

function goldhall_admin_logout(): void
{
    goldhall_cookie_clear(GOLDHALL_ADMIN_COOKIE);
}

/**
 * The value the CSRF token is derived from.
 *
 * A random cookie per browser, created on first use. Deriving the token from
 * it with the server's key gives a token that is unguessable, unique per
 * browser, and verifiable on any instance without stored state.
 */
function goldhall_csrf_nonce(): string
{
    $nonce = (string) ($_COOKIE[GOLDHALL_CSRF_COOKIE] ?? '');
    if (preg_match('/^[a-f0-9]{32}$/', $nonce) === 1) {
        return $nonce;
    }

    $nonce = bin2hex(random_bytes(16));
    goldhall_cookie_set(GOLDHALL_CSRF_COOKIE, $nonce, time() + GOLDHALL_ADMIN_TTL);
    return $nonce;
}

/** CSRF token for the admin forms. */
function goldhall_csrf_token(): string
{
    return hash_hmac('sha256', 'csrf.' . goldhall_csrf_nonce(), goldhall_admin_secret());
}

function goldhall_csrf_valid(?string $token): bool
{
    if (!is_string($token) || $token === '') {
        return false;
    }
    return hash_equals(goldhall_csrf_token(), $token);
}
