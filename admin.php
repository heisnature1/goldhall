<?php
/**
 * Administrator portal.
 *
 * The sign-in is verified here, on the server (includes/auth.php), instead of
 * against a password embedded in JavaScript. Once signed in, the portal's
 * client-side app runs as before and saves through api/admin-content.php.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/supabase.php';

goldhall_session();

$error = '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (isset($_POST['logout'])) {
        goldhall_admin_logout();
        header('Location: admin.php');
        exit;
    }

    if (!goldhall_csrf_valid($_POST['csrf'] ?? null)) {
        $error = 'That form expired. Please try signing in again.';
    } else {
        $user     = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        if (goldhall_admin_login($user, $password)) {
            header('Location: admin.php');
            exit;
        }
        $error = 'Those details did not match. Please check the username and password.';
    }
}

$signedIn = goldhall_is_admin();

$page_title = 'Admin Portal | Gold Refinery Hall';
$extra_styles = ['admin.css'];
$extra_scripts = $signedIn
    ? ['content-store.js', 'student-portal-store.js', 'admin.js']
    : [];
$body_class = 'admin-page';

require __DIR__ . '/includes/head.php';
?>
<?php
/* The signed-in portal is built inside #adminApp by admin.js, which replaces
   that element's contents outright. Anything the page needs to survive that
   render therefore has to live outside it: the sign-out form, and the bar that
   warns when content cannot be saved. Burying them inside #adminApp is what
   used to make the bar vanish and the sign-out button do nothing. */
?>
<?php if ($signedIn) : ?>
<?php
/* Where content is stored, so a save that cannot work is obvious before the
   administrator types anything. */
$store = goldhall_supabase_status();
?>
    <div class="admin-store-slot" id="adminStoreBar">
        <div class="admin-store-bar admin-store-<?= $store['ok'] ? 'ok' : ($store['configured'] ? 'warn' : 'local') ?>" role="status">
            <i class="fas <?= $store['ok'] ? 'fa-circle-check' : ($store['configured'] ? 'fa-triangle-exclamation' : 'fa-hard-drive') ?>"></i>
            <span><?= goldhall_e($store['message']) ?></span>
        </div>
    </div>
    <form method="post" action="admin.php" class="admin-signout" hidden id="adminSignOut">
        <input type="hidden" name="csrf" value="<?= goldhall_e(goldhall_csrf_token()) ?>">
        <input type="hidden" name="logout" value="1">
    </form>
<?php endif; ?>
<main id="adminApp">
<?php if (!$signedIn) : ?>
    <div class="admin-login">
        <div class="login-card">
            <div class="admin-login-brand">
                <img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo">
                <h1>Admin Portal</h1>
                <p>Gold Refinery Hall · UMaT</p>
            </div>
<?php if ($error !== '') : ?>
            <p class="login-error" role="alert"><?= goldhall_e($error) ?></p>
<?php endif; ?>
            <form method="post" action="admin.php" class="admin-login-form">
                <input type="hidden" name="csrf" value="<?= goldhall_e(goldhall_csrf_token()) ?>">
                <label>
                    Username
                    <input type="text" name="username" autocomplete="username" required autofocus>
                </label>
                <label>
                    Password
                    <input type="password" name="password" autocomplete="current-password" required>
                </label>
                <button class="admin-btn" type="submit"><i class="fas fa-right-to-bracket"></i> Sign in</button>
            </form>
            <p class="login-help"><a href="">&larr; Back to the site</a></p>
        </div>
    </div>
<?php else : ?>
    <noscript>
        <p style="padding:2rem;text-align:center">The admin portal needs JavaScript to manage content.</p>
    </noscript>
<?php endif; ?>
</main>
<?php if ($signedIn) : ?>
<script>
  // The portal's own chrome is rendered by admin.js; give it a way out.
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('div');
    bar.className = 'admin-session-bar';
    bar.innerHTML = '<span><i class="fas fa-user-shield"></i> Signed in as administrator</span>'
      + '<button type="button" class="admin-btn secondary" id="adminLogout"><i class="fas fa-right-from-bracket"></i> Sign out</button>';
    document.body.appendChild(bar);
    bar.querySelector('#adminLogout').addEventListener('click', () => {
      document.getElementById('adminSignOut').submit();
    });
  });
</script>
<?php endif; ?>
<script src="fx.js"></script>
</body>
</html>
