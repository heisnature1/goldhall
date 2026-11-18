/* ==========================================================================
   SUPABASE AUTH — browser client
   --------------------------------------------------------------------------
   Wraps the pieces of Supabase Auth the Student Hub needs:

     signUp()                create an account, triggers the confirmation email
     signInWithPassword()    sign in after the email has been confirmed
     resetPasswordForEmail() send the secure reset link
     updateUser()            set the new password from the reset link
     signOut()               end the session

   Every confirmation, recovery and password-change email is delivered by the
   SMTP provider configured in Supabase (Authentication → Emails → SMTP
   Settings). Nothing on this side sends mail, and the templates — subject,
   body, sender — are edited there, not here.

   Only a publishable key reaches this file: it is fetched from
   api/auth-config.php, which refuses to hand over a secret key.
   ========================================================================== */
window.GoldHallAuth = (() => {
  const CONFIG_URL = 'api/auth-config.php';
  const VENDOR_URL = 'assets/vendor/supabase.js';

  let configPromise = null;
  let clientPromise = null;

  /* ---------- config ---------- */
  function loadConfig() {
    if (!configPromise) {
      configPromise = fetch(CONFIG_URL, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        .then(response => (response.ok ? response.json() : null))
        .catch(() => null)
        .then(payload => (payload && payload.enabled ? payload : null));
    }
    return configPromise;
  }

  /**
   * Load a script once.
   *
   * Guarded with a timeout on purpose: a stalled request, an extension or a
   * captive portal can leave a <script> that never fires load *or* error, and
   * without this the page would sit on "Checking…" forever.
   */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-vendor="${src}"]`)) return resolve();

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.vendor = src;

      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        if (error) {
          script.remove();
          reject(error);
        } else {
          resolve();
        }
      };

      script.onload = () => finish(null);
      script.onerror = () => finish(new Error('Could not load the sign-in library. Check your connection and try again.'));
      window.setTimeout(() => finish(new Error('The sign-in library took too long to load.')), 8000);

      document.head.appendChild(script);
    });
  }

  /** The configured Supabase client, or null when Auth is not usable. */
  async function client() {
    if (clientPromise) return clientPromise;

    clientPromise = (async () => {
      const config = await loadConfig();
      if (!config) return null;

      try {
        await loadScript(VENDOR_URL);
      } catch (_) {
        /* Do not cache this: a later attempt (a reload, or a retry after the
           network came back) must be able to try again. */
        clientPromise = null;
        return null;
      }

      const library = window.supabase;
      const createClient = typeof library?.createClient === 'function'
        ? library.createClient
        : (typeof library === 'function' ? library.createClient : null);
      if (!createClient) return null;

      return createClient(config.url, config.key, {
        auth: {
          /* Keep the session in localStorage so the reset link works after the
             fragment has been consumed, and auto-refresh the token. */
          persistSession: true,
          autoRefreshToken: true,
          /* The reset and confirmation links carry tokens in the URL. */
          detectSessionInUrl: true,
          storageKey: 'goldhall-auth',
          flowType: 'pkce'
        }
      });
    })();

    return clientPromise;
  }

  /** True when the project is configured, so the UI can explain itself. */
  async function available() {
    return (await client()) !== null;
  }

  /**
   * Why Auth is or is not usable, so the page can say something accurate:
   *
   *   'ready'         configured and the client library loaded
   *   'unconfigured'  no publishable key on the server
   *   'blocked'       configured, but assets/vendor/supabase.js did not load
   *
   * A blocked library must not look like "not set up" — one is a deployment
   * problem, the other is a missing variable.
   */
  async function status() {
    const config = await loadConfig();
    if (!config) return 'unconfigured';
    return (await client()) ? 'ready' : 'blocked';
  }

  /**
   * Where Supabase should send the user after an email link.
   *
   * Two separate destinations: a recovery link goes to /reset-password and a
   * sign-up confirmation goes to /confirm-email. Both must also be listed in
   * Supabase → Authentication → URL Configuration → Redirect URLs, or
   * Supabase silently substitutes the Site URL.
   */
  async function redirectTo(kind = 'recovery') {
    const config = await loadConfig();
    if (!config) return undefined;

    if (kind === 'signup') {
      return config.confirm_redirect_to
        || (config.site_url ? `${config.site_url}/confirm-email` : undefined);
    }

    return config.redirect_to || (config.site_url ? `${config.site_url}/reset-password` : undefined);
  }

  /* ---------- friendly errors ---------- */
  /**
   * Supabase returns terse messages ("Email not confirmed", "Invalid login
   * credentials"). Rewrite the ones a student can act on, and never leak raw
   * API text into the page.
   */
  function explain(error) {
    const message = String(error?.message || error || '').trim();
    const code = String(error?.code || '');
    const lower = message.toLowerCase();

    if (lower.includes('invalid login credentials')) {
      return 'That email and password do not match an account. Check them and try again.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Please confirm your email first — open the link we emailed you, then sign in.';
    }
    if (lower.includes('user already registered') || code === 'user_already_exists') {
      return 'An account with that email already exists. Sign in instead, or reset your password.';
    }
    if (lower.includes('password should be at least')) {
      return 'Choose a password with at least 8 characters.';
    }
    if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
      return 'That does not look like a valid email address.';
    }
    if (lower.includes('for security purposes') || lower.includes('rate limit') || code === 'over_email_send_rate_limit') {
      return 'Too many attempts in a short time. Please wait a minute and try again.';
    }
    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
      return 'We could not reach the sign-in service. Check your connection and try again.';
    }
    /* Exhausted recovery links and expired confirmations. */
    if (lower.includes('expired') || code === 'otp_expired' || lower.includes('invalid or has expired')) {
      return 'That link has expired. Request a new one and open it as soon as it arrives.';
    }
    if (lower.includes('auth session missing')) {
      return 'That link is no longer valid. Request a new one from the sign-in page.';
    }

    return message || 'Something went wrong. Please try again.';
  }

  /* ---------- operations ---------- */
  /**
   * Create an account. Supabase sends the confirmation email through the
   * project's SMTP provider; `data` becomes user metadata.
   */
  async function signUp({ email, password, data = {}, emailRedirectTo }) {
    const supabase = await client();
    if (!supabase) throw new Error('Sign-up is not configured yet. Please contact the Hall Administrator.');

    const { data: result, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data,
        emailRedirectTo: emailRedirectTo || await redirectTo('signup')
      }
    });
    if (error) throw new Error(explain(error));

    /* With email confirmation on, `session` is null until the student clicks
       the link; `user.identities` is empty when the address is already taken
       (Supabase deliberately does not error, to avoid leaking accounts). */
    const alreadyExists = Array.isArray(result?.user?.identities) && result.user.identities.length === 0;

    return {
      user: result?.user || null,
      needsConfirmation: !result?.session,
      alreadyExists
    };
  }

  async function signIn(email, password) {
    const supabase = await client();
    if (!supabase) throw new Error('Sign-in is not configured yet. Please contact the Hall Administrator.');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(explain(error));
    return data?.user || null;
  }

  /** Send the secure reset link (delivered by the project's SMTP provider). */
  async function sendReset(email) {
    const supabase = await client();
    if (!supabase) throw new Error('Password reset is not configured yet. Please contact the Hall Administrator.');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: await redirectTo()
    });
    /* Supabase answers the same way whether or not the address exists, so the
       page cannot be used to discover who has an account. */
    if (error) throw new Error(explain(error));
  }

  async function updatePassword(password) {
    const supabase = await client();
    if (!supabase) throw new Error('Password reset is not configured yet. Please contact the Hall Administrator.');

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(explain(error));
  }

  async function signOut() {
    const supabase = await client();
    if (supabase) await supabase.auth.signOut();
  }

  async function currentUser() {
    const supabase = await client();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  }

  /** Current session, including the recovery state right after a reset link. */
  async function currentSession() {
    const supabase = await client();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  }

  /**
   * Turn the tokens Supabase appended to the URL into a session.
   *
   * With `detectSessionInUrl` the client does this on its own, but the reset
   * page has to know whether it worked before showing a password form.
   */
  async function consumeUrlTokens() {
    const supabase = await client();
    if (!supabase) return { ok: false, reason: 'disabled' };

    const hash = String(window.location.hash || '').replace(/^#/, '');
    const search = new URLSearchParams(window.location.search);

    /* Supabase reports a rejected or expired token in-place:
       #error=access_denied&error_code=otp_expired&error_description=… */
    const errorDescription = new URLSearchParams(hash).get('error_description')
      || search.get('error_description')
      || new URLSearchParams(hash).get('error')
      || search.get('error');
    if (errorDescription) {
      return {
        ok: false,
        reason: 'error',
        message: decodeURIComponent(errorDescription.replace(/\+/g, ' '))
      };
    }

    /* Newer projects send ?code=… which the client exchanges automatically. */
    if (search.get('code') && supabase.auth.exchangeCodeForSession) {
      const { error } = await supabase.auth.exchangeCodeForSession(search.get('code'));
      if (error) return { ok: false, reason: 'error', message: explain(error) };
    }

    /* Give detectSessionInUrl a moment to store the session. */
    const session = await currentSession();
    if (session) {
      /* Clean the tokens out of the address bar once they are in storage. */
      if (window.location.hash || search.get('code')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return { ok: true, session };
    }

    return { ok: false, reason: 'no-session' };
  }

  return {
    available,
    status,
    signUp,
    signIn,
    sendReset,
    updatePassword,
    signOut,
    currentUser,
    currentSession,
    consumeUrlTokens,
    explain
  };
})();
