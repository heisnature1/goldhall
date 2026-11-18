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
          <p class="brand-tagline">Your hall, in your pocket: opportunities, campus transport, learning resources, hall updates and free student polls in one place.</p>
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
          <small>Sign in or create your account. Students only.</small>
        </div>
        <div class="auth-tabs" role="tablist" aria-label="Student account">
          <button class="auth-tab active" id="loginTab" type="button" role="tab" aria-selected="true" data-mode="login"><i class="fas fa-right-to-bracket"></i> Sign in</button>
          <button class="auth-tab" id="registerTab" type="button" role="tab" aria-selected="false" data-mode="register"><i class="fas fa-user-plus"></i> Create account</button>
        </div>
        <div id="authFormHost">
          <!--
            The sign-in form ships in the HTML, not only from student.js.

            It used to be injected by script after `await AUTH.status()`, so a
            slow fetch, a blocked CDN or any script error left the card empty
            with nothing to explain itself. Rendering it here means the page is
            usable the moment it paints; student.js re-renders it in place when
            Supabase Auth resolves, switching the identifier to email.
          -->
          <h2 class="auth-title" id="authTitle">Welcome back</h2>
          <p class="auth-subtitle">Sign in with your email address or your student ID to open your hall hub.</p>
          <form class="portal-form" id="loginForm" novalidate>
            <label>Email address or Student ID
              <input name="identifier" type="text" autocomplete="username"
                     placeholder="e.g. ama.mensah@st.umat.edu.gh" required maxlength="160">
            </label>
            <label>Password
              <input name="password" type="password" id="loginPassword" autocomplete="current-password"
                     placeholder="Your password" data-password required>
            </label>
            <label class="reset-show">
              <input type="checkbox" data-show-password="loginPassword"> Show password
            </label>
            <!-- Above the button on purpose: an error below it can sit out of
                 view once the on-screen keyboard has scrolled the card. -->
            <p class="form-error auth-alert" id="authMessage" role="alert" aria-live="assertive"></p>
            <button class="form-submit" type="submit" id="loginSubmit">Sign in to Student Hub <i class="fas fa-arrow-right"></i></button>
            <p class="auth-links"><button type="button" class="auth-link" id="forgotLink">Forgot your password?</button></p>
          </form>
        </div>
        <!--
          Normally removed by student.js once Supabase Auth is confirmed. It is
          hidden until then, and kept only so the two cases that genuinely
          need a note (offline prototype mode, library failed to load) have
          somewhere to appear after a moment.
        -->
        <p class="demo-disclaimer" hidden><i class="fas fa-circle-info"></i> Checking how student accounts are stored…</p>
      </section>
    </section>
    <!-- filled only when an account has completed school / lost access -->
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
