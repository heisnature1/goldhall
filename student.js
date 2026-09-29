/* ==========================================================================
   STUDENT HUB — account page (student.html)
   Sign in / create account only. A successful sign-in or a new account sends
   the student to dashboard.html, the members-only page that is not listed
   anywhere in the site navigation.
   ========================================================================== */
const authShell = document.getElementById('authShell');
const authHost = document.getElementById('authFormHost');
const completedHost = document.getElementById('studentDashboard');
const tabs = [...document.querySelectorAll('.auth-tab')];

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const DASHBOARD_URL = 'dashboard.html';

function findAccount(studentId) {
  return GoldHallPortal.findStudent(String(studentId || '').trim().toUpperCase());
}

/* ---------- auth forms ---------- */
function setMode(mode) {
  tabs.forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  if (mode === 'register') {
    authHost.innerHTML = `
      <h2 class="auth-title" id="authTitle">Create your account</h2>
      <p class="auth-subtitle">For currently enrolled UMaT students (Levels 100 to 400).</p>
      <form class="portal-form" id="registerForm" novalidate>
        <label>Full name<input name="fullName" autocomplete="name" placeholder="e.g. Ama Mensah" required maxlength="100"></label>
        <div class="form-grid">
          <label>Student ID<input name="studentId" autocomplete="username" placeholder="Your UMaT student ID" required maxlength="40"></label>
          <label>Programme<input name="programme" placeholder="e.g. BSc Minerals Engineering" required maxlength="100"></label>
        </div>
        <label>Student email<input name="studentEmail" type="email" autocomplete="email" placeholder="e.g. ama.mensah@st.umat.edu.gh" required maxlength="120"><span class="field-hint"><i class="fas fa-graduation-cap"></i> Your official UMaT student email</span></label>
        <label>Personal email<input name="personalEmail" type="email" autocomplete="email" placeholder="e.g. ama.mensah@gmail.com" required maxlength="120"><span class="field-hint"><i class="fas fa-envelope-open-text"></i> For hall updates and account recovery</span></label>
        <div class="form-grid">
          <label>Level<select name="year" required><option value="" disabled selected>Select level</option>${[100,200,300,400].map(level => `<option value="${level}">Level ${level}</option>`).join('')}</select></label>
          <label>Hall status<select name="hallStatus" id="hallStatus" required><option value="" disabled selected>Select status</option><option>Resident</option><option>Non-Resident</option></select></label>
        </div>
        <label>Room / bedspace <span class="form-note" style="display:inline">(required for residents)</span><input name="room" id="roomInput" placeholder="e.g. Block A · Room 12 · Bed 2" maxlength="80"></label>
        <label>Password<input name="password" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" required></label>
        <label>Confirm password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Enter your password again" required></label>
        <p class="form-note">Your hall access is for the duration of your studies. Mark your account as completed when you finish school; the single Hall Admin can also update this status.</p>
        <button class="form-submit" type="submit">Create student account <i class="fas fa-arrow-right"></i></button>
        <p class="form-error" id="authMessage" role="status" aria-live="polite"></p>
      </form>`;
    const status = document.getElementById('hallStatus');
    const room = document.getElementById('roomInput');
    const syncRoom = () => { room.required = status.value === 'Resident'; room.placeholder = status.value === 'Resident' ? 'e.g. Block A · Room 12 · Bed 2' : 'Optional for non-residents'; };
    status.addEventListener('change', syncRoom);
    document.getElementById('registerForm').addEventListener('submit', registerStudent);
  } else {
    authHost.innerHTML = `
      <h2 class="auth-title" id="authTitle">Welcome back</h2>
      <p class="auth-subtitle">Sign in with your student ID to open your hall hub.</p>
      <form class="portal-form" id="loginForm" novalidate>
        <label>Student ID<input name="studentId" autocomplete="username" placeholder="Your UMaT student ID" required maxlength="40"></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" placeholder="Your password" required></label>
        <button class="form-submit" type="submit" id="loginSubmit">Sign in to Student Hub <i class="fas fa-arrow-right"></i></button>
        <p class="form-error" id="authMessage" role="status" aria-live="polite"></p>
      </form>`;
    document.getElementById('loginForm').addEventListener('submit', signIn);
  }
}

function message(text, tone = 'error') {
  const el = document.getElementById('authMessage');
  if (!el) return;
  el.className = tone === 'success' ? 'form-success' : 'form-error';
  el.textContent = text || '';
}

async function passwordDigest(password) {
  if (!window.crypto?.subtle) throw new Error('Secure password hashing is unavailable here. Open this preview on HTTPS or localhost.');
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/* ---------- create account ---------- */
async function registerStudent(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const form = new FormData(formEl);
  const studentId = String(form.get('studentId')).trim().toUpperCase();
  const password = String(form.get('password'));
  const confirmPassword = String(form.get('confirmPassword'));
  const fullName = String(form.get('fullName')).trim();
  const studentEmail = String(form.get('studentEmail')).trim().toLowerCase();
  const personalEmail = String(form.get('personalEmail')).trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!['100', '200', '300', '400'].includes(String(form.get('year')))) { message('Please select your level (100, 200, 300 or 400).'); return; }
  if (fullName.length < 3) { message('Please enter your full name.'); return; }
  if (!studentId) { message('Please enter your UMaT Student ID.'); return; }
  if (!emailPattern.test(studentEmail)) { message('Enter a valid student email address.'); return; }
  if (!emailPattern.test(personalEmail)) { message('Enter a valid personal email address.'); return; }
  if (studentEmail === personalEmail) { message('Your student email and personal email should be different addresses.'); return; }
  const emailTaken = GoldHallPortal.students().find(existing => existing.studentEmail === studentEmail || existing.personalEmail === studentEmail);
  if (emailTaken) { message('That student email is already registered to another account.'); return; }
  if (password.length < 8) { message('Choose a password with at least 8 characters.'); return; }
  if (password !== confirmPassword) { message('Those passwords do not match.'); return; }
  if (findAccount(studentId)) { message('That Student ID already has an account. Please sign in instead.'); return; }
  if (String(form.get('hallStatus')) === 'Resident' && !String(form.get('room')).trim()) { message('Enter your room / bedspace, or choose Non-Resident.'); return; }

  const submit = formEl.querySelector('.form-submit');
  submit.disabled = true;
  submit.innerHTML = 'Creating your account… <i class="fas fa-spinner fa-spin"></i>';
  try {
    const student = {
      fullName, studentId,
      programme: String(form.get('programme')).trim(), year: String(form.get('year')),
      room: String(form.get('room')).trim(), hallStatus: String(form.get('hallStatus')),
      studentEmail, personalEmail,
      passwordHash: await passwordDigest(password), accessStatus: 'active',
      createdAt: new Date().toISOString(), completedAt: null
    };
    GoldHallPortal.saveStudent(student);
    GoldHallSession.start(studentId);
    message('Your account was created. Opening your Student Hub…', 'success');
    accountCreatedDialog(student);
  } catch (error) {
    message(error.message || 'Could not create the account. Please try again.');
    submit.disabled = false;
    submit.innerHTML = 'Create student account <i class="fas fa-arrow-right"></i>';
  }
}

function accountCreatedDialog(student) {
  GoldHallDialog({
    icon: 'fa-circle-check', tone: 'success', eyebrow: 'Account created',
    title: `Welcome to Gold Hall, ${esc(student.fullName.split(/\s+/)[0])}!`,
    body: 'Your student account is ready and you are already signed in. Your Student Hub is a private page — it is not shown in the website menu, so only signed-in students can open it.',
    details: [
      ['Student ID', student.studentId],
      ['Programme', student.programme],
      ['Level', `Level ${student.year}`],
      ['Hall status', student.hallStatus + (student.room ? ` · ${student.room}` : '')],
      ['Student email', student.studentEmail]
    ],
    actions: [
      { label: 'Open my Student Hub', icon: 'fa-arrow-right', primary: true, onClick: () => { window.location.href = DASHBOARD_URL; } },
      { label: 'Not now — sign in instead', onClick: () => { GoldHallSession.end(); setMode('login'); } }
    ]
  });
}

/* ---------- sign in ---------- */
async function signIn(event) {
  event.preventDefault();
  const formEl = event.currentTarget;
  const form = new FormData(formEl);
  const studentId = String(form.get('studentId')).trim().toUpperCase();
  const password = String(form.get('password'));
  if (!studentId || !password) { message('Enter your Student ID and password.'); return; }
  const student = findAccount(studentId);
  if (!student) { message('We could not find an account for that Student ID.'); return; }
  if (student.accessStatus !== 'active') { blocked(student); return; }
  const submit = document.getElementById('loginSubmit');
  submit.disabled = true;
  submit.innerHTML = 'Signing you in… <i class="fas fa-spinner fa-spin"></i>';
  try {
    if (await passwordDigest(password) !== student.passwordHash) {
      message('The Student ID or password is incorrect.');
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

/* ---------- blocked account ---------- */
function blocked(student) {
  GoldHallHub.blocked(completedHost, { authShell });
  window.setTimeout(() => {
    GoldHallDialog({
      icon: 'fa-lock', tone: 'warn', eyebrow: 'Access closed',
      title: 'This account has completed school',
      body: `Student Hub access for <strong>${esc(student.fullName)}</strong> (${esc(student.studentId)}) has ended, so sign-in and voting are unavailable. If this is a mistake, please contact the Gold Hall Admin.`,
      actions: [{ label: 'Back to the website', icon: 'fa-house', primary: true, onClick: () => { window.location.href = 'index.html'; } }]
    });
  }, 260);
}

/* ---------- boot ---------- */
tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
setMode('login');

const sessionStudent = GoldHallSession.student();
if (GoldHallSession.id()) {
  if (sessionStudent?.accessStatus === 'active') window.location.replace(DASHBOARD_URL);
  else if (sessionStudent) blocked(sessionStudent);
  else GoldHallSession.end();
}

window.addEventListener('storage', event => {
  if (event.key !== 'goldHallStudents' || !GoldHallSession.id()) return;
  const current = GoldHallSession.student();
  if (!current || current.accessStatus !== 'active') GoldHallSession.end();
});
