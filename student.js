/* ==========================================================================
   STUDENT HUB: account page (student.php)
   --------------------------------------------------------------------------
   Accounts are handled by Supabase Auth when it is configured
   (api/auth-config.php decides): signUp() sends the confirmation email through
   the project's SMTP provider, signInWithPassword() opens the hub, and
   resetPasswordForEmail() emails a secure reset link.

   When Supabase Auth is not configured the page falls back to the original
   browser-only prototype store, so the site still works with no setup.
   ========================================================================== */
const authShell = document.getElementById('authShell');
const authHost = document.getElementById('authFormHost');
const completedHost = document.getElementById('studentDashboard');
const tabs = [...document.querySelectorAll('.auth-tab')];

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const DASHBOARD_URL = 'dashboard';
const AUTH = window.GoldHallAuth;

/* Resolved once: true when Supabase Auth is configured for this deployment. */
let supabaseAuth = false;
let authMode = 'login';

function findAccount(studentId) {
  return GoldHallPortal.findStudent(String(studentId || '').trim().toUpperCase());
}

/**
 * Show a line of feedback under the form.
 *
 * An error is announced, not just tinted: the element carries role="alert" and
 * an icon, and scrolls itself into view. A small red sentence can be missed,
 * particularly on a phone where the keyboard has already moved the card.
 */
function message(text, tone = 'error') {
  const el = document.getElementById('authMessage');
  if (!el) return;

  const kind = tone === 'success' ? 'success' : 'error';
  el.className = `form-${kind} auth-alert auth-alert-${kind}`;
  el.innerHTML = text
    ? `<i class="fas ${kind === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i><span>${esc(text)}</span>`
    : '';
  el.removeAttribute('role');
  el.setAttribute('role', kind === 'success' ? 'status' : 'alert');

  if (text) {
    /* Never leave the reason off-screen. `nearest` keeps a page that already
       shows it from jumping. */
    try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_) { /* older browsers */ }
  }
}

/**
 * Clear the notice as soon as the student starts fixing it.
 *
 * A stale "that email and password do not match" helpfully stays put while
 * someone retypes, which reads as though the retry also failed.
 */
function clearMessageOnEdit(container) {
  if (!container) return;
  container.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      /* Registration keeps its own live password hint; only the alert clears. */
      const el = document.getElementById('authMessage');
      if (el && el.textContent) message('');
    });
  });
}

/**
 * Wire every show-password checkbox inside a container.
 *
 * One checkbox may drive several fields: registration reveals both the
 * password and its confirmation, since the point there is comparing them.
 * Re-run after each render because the forms are rebuilt from template
 * strings, which throws away the listeners.
 */
function bindShowPassword(container) {
  if (!container) return;
  container.querySelectorAll('[data-show-password]').forEach(box => {
    const ids = String(box.dataset.showPassword || '').split(',').map(id => id.trim()).filter(Boolean);
    const fields = ids
      .map(id => document.getElementById(id) || container.querySelector(`[name="${id}"]`))
      .filter(Boolean);
    if (!fields.length) return;
    box.addEventListener('change', () => {
      fields.forEach(field => { field.type = box.checked ? 'text' : 'password'; });
    });
  });
}

/* ---------- auth forms ---------- */
function setMode(mode) {
  authMode = mode;
  tabs.forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  if (mode === 'register') return renderRegister();
  if (mode === 'forgot') return renderForgot();
  return renderLogin();
}

/* ---------- sign in ---------- */
function renderLogin() {
  authHost.innerHTML = `
    <h2 class="auth-title" id="authTitle">Welcome back</h2>
    <p class="auth-subtitle">
      ${supabaseAuth
        ? 'Sign in with the email address you registered with.'
        : 'Sign in with your student ID to open your hall hub.'}
    </p>
    <form class="portal-form" id="loginForm" novalidate>
      ${supabaseAuth
        ? `<label>Email address<input name="email" type="email" autocomplete="email" placeholder="e.g. ama.mensah@st.umat.edu.gh" required maxlength="160"></label>`
        : `<label>Student ID<input name="studentId" autocomplete="username" placeholder="Your UMaT student ID" required maxlength="40"></label>`}
      <label>Password
        <input name="password" type="password" id="loginPassword" autocomplete="current-password" placeholder="Your password" data-password required>
      </label>
      <label class="reset-show">
        <input type="checkbox" data-show-password="loginPassword"> Show password
      </label>
      <p class="form-error auth-alert" id="authMessage" role="alert" aria-live="assertive"></p>
      <button class="form-submit" type="submit" id="loginSubmit">Sign in to Student Hub <i class="fas fa-arrow-right"></i></button>
      <p class="auth-links"><button type="button" class="auth-link" id="forgotLink">Forgot your password?</button></p>
    </form>`;
  document.getElementById('loginForm').addEventListener('submit', signIn);
  document.getElementById('forgotLink').addEventListener('click', () => setMode('forgot'));
  bindShowPassword(authHost);
  clearMessageOnEdit(document.getElementById('loginForm'));
}

/* ---------- forgot password ---------- */
function renderForgot() {
  authHost.innerHTML = `
    <h2 class="auth-title" id="authTitle">Forgot your password?</h2>
    <p class="auth-subtitle">
      ${supabaseAuth
        ? 'Enter the email address on your account and we will send you a secure link to choose a new password.'
        : 'Password reset needs the site to be connected to Supabase Auth. Please contact the Hall Administrator.'}
    </p>
    <form class="portal-form" id="forgotForm" novalidate>
      <label>Email address
        <input name="email" type="email" autocomplete="email" placeholder="e.g. ama.mensah@st.umat.edu.gh" required maxlength="160">
      </label>
      <button class="form-submit" type="submit" id="forgotSubmit"${supabaseAuth ? '' : ' disabled'}>
        Send reset link <i class="fas fa-paper-plane"></i>
      </button>
      <p class="form-error" id="authMessage" role="status" aria-live="polite"></p>
      <p class="auth-links"><button type="button" class="auth-link" id="backToLogin"><i class="fas fa-arrow-left"></i> Back to sign in</button></p>
    </form>`;
  document.getElementById('forgotForm').addEventListener('submit', requestReset);
  clearMessageOnEdit(document.getElementById('forgotForm'));
  document.getElementById('backToLogin').addEventListener('click', () => setMode('login'));
}

async function requestReset(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get('email') || '').trim().toLowerCase();
  const submit = document.getElementById('forgotSubmit');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    message('Enter the email address you registered with.');
    return;
  }

  submit.disabled = true;
  submit.innerHTML = 'Sending… <i class="fas fa-spinner fa-spin"></i>';
  message('');

  try {
    await AUTH.sendReset(email);
    /* The same confirmation whether or not the address exists, so this page
       cannot be used to find out who has an account. */
    authHost.innerHTML = `
      <h2 class="auth-title">Check your email</h2>
      <p class="auth-subtitle">
        If <strong>${esc(email)}</strong> is registered, a reset link is on its way.
        It expires after a short time, and it can only be used once.
      </p>
      <p class="reset-status success" role="status" aria-live="polite">
        <i class="fas fa-envelope-circle-check"></i> Open the link in the email to choose a new password.
      </p>
      <p class="form-note">Nothing arrived? Check the spam folder, and make sure the address matches the one you signed up with.</p>
      <a class="form-submit" href="student" style="text-decoration:none"><i class="fas fa-arrow-left"></i> Back to sign in</a>`;
  } catch (error) {
    message(error.message || 'Could not send the reset link. Please try again.');
    submit.disabled = false;
    submit.innerHTML = 'Send reset link <i class="fas fa-paper-plane"></i>';
  }
}

/* ---------- create account ---------- */
function renderRegister() {
  authHost.innerHTML = `
    <h2 class="auth-title" id="authTitle">Create your account</h2>
    <p class="auth-subtitle">For currently enrolled UMaT students (Levels 100 to 400).</p>
    <form class="portal-form" id="registerForm" novalidate>
      <label>Full name<input name="fullName" autocomplete="name" placeholder="e.g. Ama Mensah" required maxlength="100"></label>
      <div class="form-grid">
        <label>Student ID<input name="studentId" autocomplete="username" placeholder="Your UMaT student ID" required maxlength="40"></label>
        <label>Programme<input name="programme" placeholder="e.g. BSc Minerals Engineering" required maxlength="100"></label>
      </div>
      <label>Student email
        <input name="studentEmail" type="email" autocomplete="email" placeholder="e.g. ama.mensah@st.umat.edu.gh" required maxlength="160">
        <span class="field-hint"><i class="fas fa-graduation-cap"></i> Your official UMaT student email</span>
      </label>
      <label>Personal email
        <input name="personalEmail" type="email" autocomplete="email" placeholder="e.g. ama.mensah@gmail.com" maxlength="160">
        <span class="field-hint"><i class="fas fa-envelope-open-text"></i> Optional, for hall updates and account recovery</span>
      </label>
      <div class="form-grid">
        <label>Level<select name="year" required><option value="" disabled selected>Select level</option>${[100,200,300,400].map(level => `<option value="${level}">Level ${level}</option>`).join('')}</select></label>
        <label>Hall status<select name="hallStatus" id="hallStatus" required><option value="" disabled selected>Select status</option><option>Resident</option><option>Non-Resident</option></select></label>
      </div>
      <label>Room / bedspace <span class="form-note" style="display:inline">(required for residents)</span><input name="room" id="roomInput" placeholder="e.g. Block A · Room 12 · Bed 2" maxlength="80"></label>
      <label>Password
        <input name="password" type="password" id="registerPassword" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" data-password required>
      </label>
      <label>Confirm password
        <input name="confirmPassword" type="password" id="registerConfirm" autocomplete="new-password" minlength="8" placeholder="Enter your password again" data-password required>
        <span class="field-hint" id="passwordMatch"></span>
      </label>
      <label class="reset-show">
        <input type="checkbox" data-show-password="registerPassword,registerConfirm"> Show passwords
      </label>
      <p class="form-note">
        ${supabaseAuth
          ? 'We will email you a confirmation link. Your hall access lasts for the duration of your studies.'
          : 'Your hall access is for the duration of your studies.'}
      </p>
      <button class="form-submit" type="submit" id="registerSubmit">Create student account <i class="fas fa-arrow-right"></i></button>
      <p class="form-error" id="authMessage" role="status" aria-live="polite"></p>
    </form>`;

  const pw = document.getElementById('registerPassword');
  const pwConfirm = document.getElementById('registerConfirm');
  const pwHint = document.getElementById('passwordMatch');

  /* Say it while they type, not after they submit. Empty until they have
     typed into both, so the field does not start out complaining. */
  const checkMatch = () => {
    if (!pwHint) return;
    const hasBoth = pw.value !== '' && pwConfirm.value !== '';
    if (!hasBoth) {
      pwHint.textContent = '';
      pwHint.className = 'field-hint';
      return;
    }
    const same = pw.value === pwConfirm.value;
    pwHint.textContent = same ? 'Passwords match.' : 'These passwords do not match yet.';
    pwHint.className = same ? 'field-hint ok' : 'field-hint warn';
  };
  pw.addEventListener('input', checkMatch);
  pwConfirm.addEventListener('input', checkMatch);
  bindShowPassword(authHost);
  clearMessageOnEdit(document.getElementById('registerForm'));

  const status = document.getElementById('hallStatus');
  const room = document.getElementById('roomInput');
  const syncRoom = () => {
    room.required = status.value === 'Resident';
    room.placeholder = status.value === 'Resident' ? 'e.g. Block A · Room 12 · Bed 2' : 'Optional for non-residents';
  };
  status.addEventListener('change', syncRoom);
  document.getElementById('registerForm').addEventListener('submit', registerStudent);
}

async function passwordDigest(password) {
  if (!window.crypto?.subtle) throw new Error('Secure password hashing is unavailable here. Open this preview on HTTPS or localhost.');
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Shared validation for both backends. Returns a profile object or a string error. */
function readRegistration(form) {
  const studentId = String(form.get('studentId') || '').trim().toUpperCase();
  const fullName = String(form.get('fullName') || '').trim();
  const studentEmail = String(form.get('studentEmail') || '').trim().toLowerCase();
  const personalEmail = String(form.get('personalEmail') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  const confirmPassword = String(form.get('confirmPassword') || '');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!['100', '200', '300', '400'].includes(String(form.get('year')))) return 'Please select your level (100, 200, 300 or 400).';
  if (fullName.length < 3) return 'Please enter your full name.';
  if (!studentId) return 'Please enter your UMaT Student ID.';
  if (!emailPattern.test(studentEmail)) return 'Enter a valid student email address.';
  if (personalEmail && !emailPattern.test(personalEmail)) return 'Enter a valid personal email address, or leave it blank.';
  if (personalEmail && studentEmail === personalEmail) return 'Your student email and personal email should be different addresses.';
  if (password.length < 8) return 'Choose a password with at least 8 characters.';
  if (password !== confirmPassword) return 'Those passwords do not match.';
  if (String(form.get('hallStatus')) === 'Resident' && !String(form.get('room') || '').trim()) {
    return 'Enter your room / bedspace, or choose Non-Resident.';
  }

  return {
    fullName, studentId,
    programme: String(form.get('programme') || '').trim(),
    year: String(form.get('year')),
    room: String(form.get('room') || '').trim(),
    hallStatus: String(form.get('hallStatus')),
    studentEmail, personalEmail,
    password
  };
}

async function registerStudent(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const parsed = readRegistration(new FormData(formEl));
  if (typeof parsed === 'string') {
    message(parsed);
    return;
  }

  const submit = document.getElementById('registerSubmit');
  submit.disabled = true;
  submit.innerHTML = 'Creating your account… <i class="fas fa-spinner fa-spin"></i>';

  try {
    if (supabaseAuth) {
      await registerWithSupabase(parsed);
      return;
    }
    await registerLocally(parsed);
  } catch (error) {
    message(error.message || 'Could not create the account. Please try again.');
    submit.disabled = false;
    submit.innerHTML = 'Create student account <i class="fas fa-arrow-right"></i>';
  }
}

/** Supabase Auth: create the account and send the confirmation email. */
async function registerWithSupabase(profile) {
  const existing = GoldHallPortal.students().find(student =>
    student.studentEmail === profile.studentEmail || student.studentId === profile.studentId);
  if (existing) throw new Error('That student ID or email is already registered. Sign in instead.');

  const result = await AUTH.signUp({
    email: profile.studentEmail,
    password: profile.password,
    data: {
      full_name: profile.fullName,
      student_id: profile.studentId,
      programme: profile.programme,
      level: profile.year,
      hall_status: profile.hallStatus,
      room: profile.room,
      personal_email: profile.personalEmail
    }
  });

  if (result.alreadyExists) {
    throw new Error('An account with that email already exists. Sign in instead, or reset your password.');
  }

  /* Keep the hall profile locally so the hub can show a name straight after
     the student confirms their email. The password is never stored here;
     Supabase Auth holds it. */
  GoldHallPortal.saveStudent({
    fullName: profile.fullName,
    studentId: profile.studentId,
    programme: profile.programme,
    year: profile.year,
    room: profile.room,
    hallStatus: profile.hallStatus,
    studentEmail: profile.studentEmail,
    personalEmail: profile.personalEmail,
    passwordHash: null,
    authProvider: 'supabase',
    emailConfirmed: false,
    accessStatus: 'active',
    createdAt: new Date().toISOString(),
    completedAt: null
  });

  await confirmedDialog(profile);
}

/** Tell the student to open the confirmation email Supabase just sent. */
function confirmedDialog(profile) {
  return new Promise(resolve => {
    GoldHallDialog({
      icon: 'fa-envelope-circle-check', tone: 'success', eyebrow: 'Check your email',
      title: `One more step, ${esc(profile.fullName.split(/\s+/)[0])}!`,
      body: `We sent a confirmation link to <strong>${esc(profile.studentEmail)}</strong>. Open it to activate your account, then sign in. The link can only be used once and expires after a short time.`,
      details: [
        ['Student ID', profile.studentId],
        ['Programme', profile.programme],
        ['Level', `Level ${profile.year}`]
      ],
      actions: [{ label: 'Got it', icon: 'fa-check', primary: true, onClick: () => { setMode('login'); resolve(); } }],
      dismissible: false
    });
  });
}

/** Prototype fallback: the original browser-only account. */
async function registerLocally(profile) {
  const emailTaken = GoldHallPortal.students().find(existing =>
    existing.studentEmail === profile.studentEmail || existing.personalEmail === profile.studentEmail);
  if (emailTaken) throw new Error('That student email is already registered to another account.');
  if (findAccount(profile.studentId)) throw new Error('That Student ID already has an account. Please sign in instead.');

  const student = {
    fullName: profile.fullName,
    studentId: profile.studentId,
    programme: profile.programme,
    year: profile.year,
    room: profile.room,
    hallStatus: profile.hallStatus,
    studentEmail: profile.studentEmail,
    personalEmail: profile.personalEmail,
    passwordHash: await passwordDigest(profile.password),
    accessStatus: 'active',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  GoldHallPortal.saveStudent(student);
  GoldHallSession.start(profile.studentId);
  message('Your account was created. Opening your Student Hub…', 'success');
  accountCreatedDialog(student);
}

function accountCreatedDialog(student) {
  GoldHallDialog({
    icon: 'fa-circle-check', tone: 'success', eyebrow: 'Account created',
    title: `Welcome to Gold Hall, ${esc(student.fullName.split(/\s+/)[0])}!`,
    body: 'Your student account is ready and you are already signed in. Your Student Hub is a private page. It is not shown in the website menu, so only signed-in students can open it.',
    details: [
      ['Student ID', student.studentId],
      ['Programme', student.programme],
      ['Level', `Level ${student.year}`],
      ['Hall status', student.hallStatus + (student.room ? ` · ${student.room}` : '')],
      ['Student email', student.studentEmail]
    ],
    actions: [
      { label: 'Open my Student Hub', icon: 'fa-arrow-right', primary: true, onClick: () => { window.location.href = DASHBOARD_URL; } },
      { label: 'Not now, sign in instead', onClick: () => { GoldHallSession.end(); setMode('login'); } }
    ]
  });
}

/* ---------- sign in ---------- */
async function signIn(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const form = new FormData(formEl);
  const submit = document.getElementById('loginSubmit');

  /* The server-rendered form uses one "identifier" field so it can accept
     either an email (Auth) or a Student ID (prototype); the script-rendered
     variants post `email` or `studentId`. Accept all three. */
  const identifier = String(form.get('identifier') || '').trim();
  const asEmail = String(form.get('email') || identifier).trim().toLowerCase();
  const asStudentId = String(form.get('studentId') || identifier).trim().toUpperCase();

  if (supabaseAuth) {
    return signInWithSupabase({ get: key => (key === 'email' ? asEmail : form.get(key)) }, submit);
  }

  const studentId = asStudentId;
  const password = String(form.get('password') || '');
  if (!studentId || !password) {
    message('Enter your Student ID and password.');
    return;
  }
  const student = findAccount(studentId);
  if (!student) {
    message('That student ID and password do not match an account. Check them and try again.');
    return;
  }
  if (student.accessStatus !== 'active') {
    blocked(student);
    return;
  }

  submit.disabled = true;
  submit.innerHTML = 'Signing you in… <i class="fas fa-spinner fa-spin"></i>';
  try {
    if (await passwordDigest(password) !== student.passwordHash) {
      message('That student ID and password do not match an account. Check them and try again.');
      submit.disabled = false;
      submit.innerHTML = 'Sign in to Student Hub <i class="fas fa-arrow-right"></i>';
      return;
    }
    GoldHallSession.start(student.studentId);
    message('Signed in. Opening your Student Hub…', 'success');
    window.location.href = DASHBOARD_URL;
    return;
  } catch (error) {
    message(error.message || 'Could not sign in. Please try again.');
  }
  submit.disabled = false;
  submit.innerHTML = 'Sign in to Student Hub <i class="fas fa-arrow-right"></i>';
}

async function signInWithSupabase(form, submit) {
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  if (!email || !password) {
    message('Enter your email address and password.');
    return;
  }

  submit.disabled = true;
  submit.innerHTML = 'Signing you in… <i class="fas fa-spinner fa-spin"></i>';

  try {
    const user = await AUTH.signIn(email, password);
    const meta = user?.user_metadata || {};

    /* Link the Supabase identity to the local hall profile the hub renders. */
    let student = GoldHallPortal.students().find(entry =>
      (entry.studentEmail || '').toLowerCase() === email ||
      (meta.student_id && entry.studentId === String(meta.student_id).toUpperCase()));

    if (student) {
      GoldHallPortal.updateStudent(student.studentId, { emailConfirmed: true, authProvider: 'supabase' });
    } else {
      student = {
        fullName: meta.full_name || email,
        studentId: String(meta.student_id || email).toUpperCase(),
        programme: meta.programme || '',
        year: String(meta.level || ''),
        room: meta.room || '',
        hallStatus: meta.hall_status || 'Resident',
        studentEmail: email,
        personalEmail: meta.personal_email || '',
        passwordHash: null,
        authProvider: 'supabase',
        emailConfirmed: true,
        accessStatus: 'active',
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      GoldHallPortal.saveStudent(student);
    }

    if (student.accessStatus !== 'active') {
      await AUTH.signOut().catch(() => {});
      blocked(student);
      return;
    }

    GoldHallSession.start(student.studentId);
    message('Signed in. Opening your Student Hub…', 'success');
    window.location.href = DASHBOARD_URL;
  } catch (error) {
    message(error.message || 'Could not sign in. Please try again.');
    submit.disabled = false;
    submit.innerHTML = 'Sign in to Student Hub <i class="fas fa-arrow-right"></i>';
  }
}

/* ---------- blocked account ---------- */
function blocked(student) {
  GoldHallHub.blocked(completedHost, { authShell });
  window.setTimeout(() => {
    GoldHallDialog({
      icon: 'fa-lock', tone: 'warn', eyebrow: 'Access closed',
      title: 'This account has completed school',
      body: `Student Hub access for <strong>${esc(student.fullName)}</strong> (${esc(student.studentId)}) has ended, so sign-in and voting are unavailable. If this is a mistake, please contact the Gold Hall Admin.`,
      actions: [{ label: 'Back to the website', icon: 'fa-house', primary: true, onClick: () => { window.location.href = './'; } }]
    });
  }, 260);
}

/* ---------- boot ---------- */

/*
 * Paint the form immediately, before anything is awaited.
 *
 * `setMode('login')` used to run only after `await AUTH.status()`, and that
 * awaits the config fetch, the CDN script and the client. Any stall in that
 * chain left the card completely empty: no form, no message, no clue, which
 * is indistinguishable from a broken page. The form now renders at once using
 * the safe fallback (Student ID), and is re-rendered once the real status is
 * known. A student can see and touch the page within a frame.
 */
function paintFallbackForm() {
  try {
    /* If student.php already shipped the form, keep it and just wire it up:
       re-rendering would throw away what the browser has already painted. */
    if (bindShippedLogin()) return;
    setMode('login');
  } catch (error) {
    /* Never let a rendering problem leave a blank card. */
    authHost.innerHTML = `
      <p class="form-error" role="status">The sign-in form could not be drawn.
      Please reload the page, and contact the Hall Administrator if this continues.</p>`;
  }
}

/**
 * Wire up the sign-in form that student.php renders into the HTML.
 *
 * Returns true when it found and bound one. Until Auth resolves, an email or a
 * Student ID both go through the browser-only path, which is the same thing
 * the page did before Supabase existed.
 */
function bindShippedLogin() {
  const form = document.getElementById('loginForm');
  if (!form || form.dataset.bound === '1') return !!form;

  form.dataset.bound = '1';
  form.addEventListener('submit', signIn);

  const forgot = document.getElementById('forgotLink');
  if (forgot) forgot.addEventListener('click', () => setMode('forgot'));
  return true;
}

async function boot() {
  tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));

  paintFallbackForm();

  let authStatus = 'unconfigured';
  try {
    authStatus = (typeof AUTH !== 'undefined' && await AUTH.status()) || 'unconfigured';
  } catch (_) {
    authStatus = 'unconfigured';
  }
  supabaseAuth = authStatus === 'ready';

  /*
   * Explanatory line under the card.
   *
   * Nothing is shown when Auth is working: a student who has just been given a
   * clear form does not need a paragraph about how accounts are stored. The
   * line is kept only for the two cases where it is genuinely useful news,
   * namely the library failing to load and the offline prototype fallback.
   */
  const note = document.querySelector('.demo-disclaimer');
  if (note) {
    if (supabaseAuth) {
      note.remove();
    } else if (authStatus === 'blocked') {
      note.className = 'demo-disclaimer demo-disclaimer-warn';
      note.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Secure sign-in could not load on this device, so the hub is using its offline prototype accounts. If you expected to sign in with your email, check your connection and reload.';
      note.removeAttribute('hidden');
    } else {
      note.innerHTML = '<i class="fas fa-circle-info"></i> Student accounts and ballots are stored only in this browser. For your security, do not reuse a password.';
      note.removeAttribute('hidden');
    }
  }

  /* Redraw with the resolved mode (email vs Student ID). */
  if (authMode === 'login') setMode('login');

  const sessionStudent = GoldHallSession.student();
  if (!GoldHallSession.id()) return;
  if (sessionStudent?.accessStatus === 'active') window.location.replace(DASHBOARD_URL);
  else if (sessionStudent) blocked(sessionStudent);
  else GoldHallSession.end();
}

boot();

window.addEventListener('storage', event => {
  if (event.key !== 'goldHallStudents' || !GoldHallSession.id()) return;
  const current = GoldHallSession.student();
  if (!current || current.accessStatus !== 'active') GoldHallSession.end();
});
