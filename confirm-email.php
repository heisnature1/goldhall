<?php
/**
 * Landing page for the email-confirmation link sent by signUp().
 *
 * Supabase appends its tokens as a URL fragment (#access_token=…), so the
 * exchange happens in auth-client.js. This page just reports the outcome and
 * points the student at the hub.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/functions.php';

$page_title = 'Confirm your email | Gold Refinery Hall';
$extra_styles = ['student.css'];
$extra_scripts = ['auth-client.js', 'confirm-email.js'];
$body_class = 'student-page';

require __DIR__ . '/includes/head.php';
goldhall_loader();
?>

  <main class="student-app">
    <section class="auth-shell auth-shell-single">
      <section class="auth-card" aria-labelledby="confirmTitle">
        <div class="auth-card-brand">
          <span class="auth-crest"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"></span>
          <h3 id="confirmTitle">Confirming your email</h3>
          <small>Gold Refinery Hall &middot; Student Hub</small>
        </div>

        <div id="confirmHost">
          <p class="reset-status" role="status" aria-live="polite">
            <i class="fas fa-spinner fa-spin"></i> Verifying your email address…
          </p>
        </div>

        <p class="login-help"><a href="student">&larr; Back to the Student Hub</a></p>
      </section>
    </section>
  </main>


<?php
/* Emit this page's scripts ($extra_scripts) and fx.js.
   These pages close their own body, so the loop has to run here. */
?>

<?php foreach ((array) $extra_scripts as $src) : ?>
<script src="<?= function_exists('goldhall_e') ? goldhall_e($src) : htmlspecialchars($src) ?>"></script>
<?php endforeach; ?>
<script src="fx.js"></script>
</body>
</html>
