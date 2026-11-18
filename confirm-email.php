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
    </div>
  </header>

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

  <footer class="student-footer">
    <span>&copy; <?= date('Y') ?> Gold Refinery Hall &middot; UMaT</span>
    <a href="">Back to the public website <i class="fas fa-arrow-right"></i></a>
  </footer>

<script src="fx.js"></script>
</body>
</html>
