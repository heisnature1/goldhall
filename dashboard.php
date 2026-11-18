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

  <main id="studentApp" class="student-app">
    <div class="members-only-note" id="membersNote" hidden>
      <i class="fas fa-lock"></i> Private student area. This page is not listed in the website menu.
    </div>
    <div id="studentDashboard" hidden></div>
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
