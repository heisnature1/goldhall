<?php
/**
 * Student Hub: registration and sign-in.
 *
 * The hub itself is a client-side app; this page only supplies its shell and
 * the styles/scripts. Content it displays comes from api/content.php.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/functions.php';

$page_title = 'Student Hub | Gold Refinery Hall';
$extra_styles = ['student.css'];
$extra_scripts = ['content-store.js', 'student-portal-store.js', 'student-hub.js', 'auth-client.js', 'student.js'];
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

  <main id="studentApp" class="student-app">
    <section class="auth-shell" id="authShell">
      <aside class="brand-panel">
        <div class="brand-panel-inner">
          <span class="brand-crest-lg" aria-hidden="false"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall crest"></span>
          <div class="brand-name">
            <h2>Gold Refinery Hall</h2>
            <span class="brand-rule"></span>
            <p>University of Mines and Technology</p>
          </div>
          <p class="brand-tagline">Your hall, in your pocket &mdash; opportunities, campus transport, learning resources, hall updates and free student polls in one place.</p>
          <ul class="auth-benefits">
            <li><i class="fas fa-check"></i> Open to every year group</li>
            <li><i class="fas fa-check"></i> Free to register and vote</li>
            <li><i class="fas fa-check"></i> Access ends when you complete school</li>
          </ul>
          <div class="brand-motto"><span>EXCELLENCE</span><i class="fas fa-gem"></i><span>UNITY</span><i class="fas fa-gem"></i><span>LEADERSHIP</span></div>
        </div>
      </aside>
      <section class="auth-card" aria-labelledby="authTitle">
        <div class="auth-card-brand">
          <span class="auth-crest"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"></span>
          <h3>Student Hub</h3>
          <small>Sign in or create your account &mdash; students only</small>
        </div>
        <div class="auth-tabs" role="tablist" aria-label="Student account">
          <button class="auth-tab active" id="loginTab" type="button" role="tab" aria-selected="true" data-mode="login"><i class="fas fa-right-to-bracket"></i> Sign in</button>
          <button class="auth-tab" id="registerTab" type="button" role="tab" aria-selected="false" data-mode="register"><i class="fas fa-user-plus"></i> Create account</button>
        </div>
        <div id="authFormHost"></div>
        <p class="demo-disclaimer"><i class="fas fa-circle-info"></i> Checking how student accounts are stored…</p>
      </section>
    </section>
    <!-- filled only when an account has completed school / lost access -->
    <div id="studentDashboard" hidden></div>
  </main>

  <footer class="student-footer">
    <span>&copy; 2026 Gold Refinery Hall &middot; UMaT</span>
    <a href="">Back to the public website <i class="fas fa-arrow-right"></i></a>
  </footer>

<script src="fx.js"></script>
</body>
</html>
