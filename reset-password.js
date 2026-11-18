/* ==========================================================================
   RESET PASSWORD PAGE — the other half of resetPasswordForEmail()
   --------------------------------------------------------------------------
   Supabase emails a link. Clicking it returns here with a recovery token in
   the URL fragment, which auth-client.js turns into a short-lived session.
   The form below then calls auth.updateUser({ password }), so the token is
   used once and never sent to this server.
   ========================================================================== */
(() => {
  const host = document.getElementById('resetHost');
  if (!host) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const AUTH = window.GoldHallAuth;

  const status = (icon, tone, text) => `
    <p class="reset-status ${tone || ''}" role="status" aria-live="polite">
      <i class="fas ${icon}"></i> ${esc(text)}
    </p>`;

  /**
   * @param {'disabled'|'error'|'no-session'} reason
   * @param {string} detail  Supabase's own explanation, when it gave one.
   */
  function unavailable(reason, detail = '') {
    if (reason === 'disabled') {
      host.innerHTML = status('fa-circle-info', 'warn',
        'Password reset is not available yet. Please contact the Hall Administrator for help with your account.');
      return;
    }

    /* Show what Supabase actually said ("Email link is invalid or has
       expired") rather than a generic sentence that hides the cause. */
    const explanation = detail
      ? `The reset link could not be used: ${detail}`
      : 'This reset link is invalid, has expired, or has already been used.';

    host.innerHTML = `
      ${status('fa-link-slash', 'error', explanation)}
      <p class="form-note">Reset links work once, and they expire after a short time.</p>
      <a class="form-submit" href="student" style="text-decoration:none"><i class="fas fa-paper-plane"></i> Request a new link</a>`;
  }

  function showForm(email) {
    host.innerHTML = `
      <h2 class="auth-title">Choose a new password</h2>
      <p class="auth-subtitle">
        ${email ? `Setting a new password for <strong>${esc(email)}</strong>.` : 'Set a new password for your Student Hub account.'}
      </p>
      <form class="portal-form" id="resetForm" novalidate>
        <label>New password
          <input name="password" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" required>
        </label>
        <label>Confirm new password
          <input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Enter it again" required>
        </label>
        <label class="reset-show">
          <input type="checkbox" id="showPassword"> Show passwords
        </label>
        <button class="form-submit" type="submit" id="resetSubmit">Save new password <i class="fas fa-arrow-right"></i></button>
        <p class="form-error" id="resetMessage" role="status" aria-live="polite"></p>
      </form>`;

    const form = document.getElementById('resetForm');
    const message = document.getElementById('resetMessage');
    const submit = document.getElementById('resetSubmit');
    const show = document.getElementById('showPassword');

    const say = (text, tone = 'error') => {
      message.className = tone === 'success' ? 'form-success' : 'form-error';
      message.textContent = text || '';
    };

    show.addEventListener('change', () => {
      form.querySelectorAll('input[type="password"]').forEach(input => {
        input.type = show.checked ? 'text' : 'password';
      });
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const values = new FormData(form);
      const password = String(values.get('password') || '');
      const confirm = String(values.get('confirmPassword') || '');

      if (password.length < 8) return say('Choose a password with at least 8 characters.');
      if (password !== confirm) return say('Those passwords do not match.');

      submit.disabled = true;
      submit.innerHTML = 'Saving… <i class="fas fa-spinner fa-spin"></i>';
      say('');

      try {
        await AUTH.updatePassword(password);
        /* Sign out so the new password is the one that opens the hub. */
        await AUTH.signOut().catch(() => {});
        host.innerHTML = `
          ${status('fa-circle-check', 'success', 'Your password has been changed. You can sign in with it now.')}
          <a class="form-submit" href="student" style="text-decoration:none"><i class="fas fa-right-to-bracket"></i> Sign in to the Student Hub</a>`;
      } catch (error) {
        say(error.message || 'Could not save the new password. Please try again.');
        submit.disabled = false;
        submit.innerHTML = 'Save new password <i class="fas fa-arrow-right"></i>';
      }
    });
  }

  (async () => {
    try {
      if (!(await AUTH.available())) return unavailable('disabled');

      const outcome = await AUTH.consumeUrlTokens();
      if (!outcome.ok) return unavailable(outcome.reason, outcome.message || '');

      const user = await AUTH.currentUser();
      showForm(user?.email || outcome.session?.user?.email || '');
    } catch (error) {
      host.innerHTML = status('fa-triangle-exclamation', 'error',
        error.message || 'Something went wrong reading the reset link.');
    }
  })();
})();
