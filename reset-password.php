<?php
/**
 * Landing page for the password reset link that Supabase emails.
 *
 * Supabase must be told to send users here — see the README section
 * "Supabase Auth". The link arrives as `/reset-password#access_token=…&type=recovery`
 * (the fragment is not sent to the server, so the token is read in the browser)
 * or, with newer projects, as `?code=…`, which is exchanged client-side.
 *
 * Nothing here touches the database: reset-password.js does the work through
 * the publishable key so the token never leaves the browser.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/functions.php';

$page_title = 'Choose a new password | Gold Refinery Hall';
$extra_styles = ['student.css'];
$extra_scripts = ['auth-client.js', 'reset-password.js'];
$body_class = 'student-page';
$nav_key = 'student';

require __DIR__ . '/includes/head.php';
goldhall_loader();
?>

  <div class="student-topbar">
    <div class="student-topbar-inner">
      <span class="topbar-loc"><i class="fas fa-map-marker-alt"></i> University of Mines and Technology, Tarkwa</span>
      <em class="topbar-motto">Excellence &middot; Unity &middot; Leadership</em>
    </div>
  </div>

  <header class="student-header">
    <div class="student-header-inner">
      <a class="student-brand" href="" aria-label="Gold Refinery Hall home">
        <span class="brand-crest"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"></span>
        <span class="brand-text">
          <strong>GOLD REFINERY HALL</strong>
          <small>University of Mines and Technology</small>
        </span>
      </a>
      <nav class="student-top-nav" aria-label="Main navigation">
        <a href="">Home</a>
        <a href="student" class="active" aria-current="page">Student Hub</a>
        <a href="executives">Executives</a>
        <a href="events">Events</a>
        <a href="gallery">Gallery</a>
        <a href="about">About Us</a>
      </nav>
    </header>
  </header>

  <main class="student-app">
    <section class="auth-shell auth-shell-single">
      <section class="auth-card" aria-labelledby="resetTitle">
        <div class="auth-card-brand">
          <span class="auth-crest"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"></span>
          <h3>Reset your password</h3>
          <small>Gold Refinery Hall &middot; Student Hub</small>
        </div>

        <div id="resetHost">
          <p class="reset-status" role="status" aria-live="polite">
            <i class="fas fa-spinner fa-spin"></i> Checking your reset link…
          </p>
        </div>

        <p class="login-help"><a href="student">&larr; Back to sign in</a></p>
      </section>
    </section>
  </main>

  <footer class="student-footer">
    <span>&copy; <?= date('Y') ?> Gold Refinery Hall &middot; UMaT</span>
    <a href="">Back to the public website <i class="fas fa-arrow-right"></i></a>
  </footer>

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
