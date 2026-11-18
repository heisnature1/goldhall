<?php
/**
 * Signed-in Student Hub. Reachable only after signing in; not in any menu.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/functions.php';

$page_title = 'Student Dashboard | Gold Refinery Hall';
$extra_styles = ['student.css'];
$extra_scripts = ['content-store.js', 'student-portal-store.js', 'student-hub.js', 'student-dashboard.js'];
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
        <a href="dashboard" class="active" aria-current="page">Student Hub</a>
        <a href="executives">Executives</a>
        <a href="events">Events</a>
        <a href="gallery">Gallery</a>
        <a href="about">About Us</a>
      </nav>
      <div class="student-header-actions">
        <span class="student-chip" id="studentChip" hidden></span>
        <button class="hub-button hub-button-small" id="headerSignOut" type="button" hidden><i class="fas fa-arrow-right-from-bracket"></i> Sign out</button>
      </div>
    </div>
  </header>

  <main id="studentApp" class="student-app">
    <div class="members-only-note" id="membersNote" hidden>
      <i class="fas fa-lock"></i> Private student area &mdash; this page is not listed in the website menu.
    </div>
    <div id="studentDashboard" hidden></div>
  </main>

  <footer class="student-footer">
    <span>&copy; 2026 Gold Refinery Hall &middot; UMaT</span>
    <a href="">Back to the public website <i class="fas fa-arrow-right"></i></a>
  </footer>

<script src="fx.js"></script>
</body>
</html>
