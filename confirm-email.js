/* ==========================================================================
   CONFIRM EMAIL PAGE: the landing spot for signUp()'s confirmation link
   --------------------------------------------------------------------------
   Supabase has already delivered the message through the project's SMTP
   provider. This page only reports whether the token was accepted, then sends
   the student to sign in.
   ========================================================================== */
(() => {
  const host = document.getElementById('confirmHost');
  if (!host) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AUTH = window.GoldHallAuth;

  const message = (icon, tone, text) => `
    <p class="reset-status ${tone || ''}" role="status" aria-live="polite">
      <i class="fas ${icon}"></i> ${esc(text)}
    </p>`;

  const goToHub = `
    <a class="form-submit" href="student" style="text-decoration:none">
      <i class="fas fa-right-to-bracket"></i> Go to the Student Hub
    </a>`;

  (async () => {
    try {
      if (!(await AUTH.available())) {
        host.innerHTML = message('fa-circle-info', 'warn',
          'Email confirmation is not available yet. Please contact the Hall Administrator.');
        return;
      }

      const outcome = await AUTH.consumeUrlTokens();
      if (!outcome.ok) {
        host.innerHTML = message('fa-link-slash', 'error',
          'That confirmation link is invalid or has expired. Sign in and request a new one, or create the account again.')
          + goToHub;
        return;
      }

      const user = await AUTH.currentUser();
      const email = user?.email || outcome.session?.user?.email || '';

      host.innerHTML = `
        <h2 class="auth-title">Email confirmed</h2>
        <p class="auth-subtitle">
          ${email
            ? `<strong>${esc(email)}</strong> is verified. Sign in with your password to open your Student Hub.`
            : 'Your email address is verified. Sign in with your password to open your Student Hub.'}
        </p>
        ${message('fa-circle-check', 'success', 'Your account is ready.')}
        ${goToHub}`;
      /* The confirmation session is not a sign-in; end it so the student
         proves the password they chose. */
      await AUTH.signOut().catch(() => {});
    } catch (error) {
      host.innerHTML = message('fa-triangle-exclamation', 'error',
        error.message || 'Something went wrong reading the confirmation link.') + goToHub;
    }
  })();
})();
