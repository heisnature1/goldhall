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
 * and the session cookie is HttpOnly.
 */

declare(strict_types=1);

/** Start the session once, with safe cookie flags. */
function goldhall_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    // Only configure cookies when PHP is actually going to send one, and only
    // before any output. On the CLI, or after HTML has started, these calls
    // raise warnings and the headers are already gone.
    if (!headers_sent() && filter_var(ini_get('session.use_cookies'), FILTER_VALIDATE_BOOLEAN)) {
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'httponly' => true,
            'secure'   => $secure,
            'samesite' => 'Lax',
        ]);
        session_name('goldhall_admin');
    }
    @session_start();
}

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

/** True when the current session is signed in as the administrator. */
function goldhall_is_admin(): bool
{
    goldhall_session();
    return !empty($_SESSION['goldhall_admin']);
}

/**
 * Check credentials and start a session on success.
 */
function goldhall_admin_login(string $user, string $password): bool
{
    goldhall_session();

    // hash_equals keeps the comparison constant-time.
    $userOk     = hash_equals(goldhall_admin_user(), $user);
    $passwordOk = hash_equals(goldhall_admin_password(), $password);

    if (!$userOk || !$passwordOk) {
        return false;
    }

    // Prevent session fixation.
    session_regenerate_id(true);
    $_SESSION['goldhall_admin'] = true;
    return true;
}

function goldhall_admin_logout(): void
{
    goldhall_session();
    $_SESSION = [];
    session_destroy();
}

/** CSRF token for the admin forms. */
function goldhall_csrf_token(): string
{
    goldhall_session();
    if (empty($_SESSION['goldhall_csrf'])) {
        $_SESSION['goldhall_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['goldhall_csrf'];
}

function goldhall_csrf_valid(?string $token): bool
{
    goldhall_session();
    return is_string($token)
        && !empty($_SESSION['goldhall_csrf'])
        && hash_equals($_SESSION['goldhall_csrf'], $token);
}
