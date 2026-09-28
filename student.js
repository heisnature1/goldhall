const authShell = document.getElementById('authShell');
const authHost = document.getElementById('authFormHost');
const dashboardHost = document.getElementById('studentDashboard');
const tabs = [...document.querySelectorAll('.auth-tab')];
const SESSION_KEY = 'goldHallStudentSession';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

function setMode(mode) {
  tabs.forEach(tab => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  if (mode === 'register') {
    authHost.innerHTML = `
      <h2 class="auth-title" id="authTitle">Create your account</h2>
      <p class="auth-subtitle">For currently enrolled UMaT students at every year level.</p>
      <form class="portal-form" id="registerForm">
        <label>Full name<input name="fullName" autocomplete="name" placeholder="e.g. Ama Mensah" required maxlength="100"></label>
        <div class="form-grid">
          <label>Student ID<input name="studentId" autocomplete="username" placeholder="Your UMaT student ID" required maxlength="40"></label>
          <label>Programme<input name="programme" placeholder="e.g. BSc Minerals Engineering" required maxlength="100"></label>
        </div>
        <div class="form-grid">
          <label>Year / level<select name="year" required><option value="" disabled selected>Select year</option>${[100,200,300,400,500,600].map(year => `<option value="${year}">Year ${year}</option>`).join('')}<option value="Other">Other / postgraduate</option></select></label>
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
      <form class="portal-form" id="loginForm">
        <label>Student ID<input name="studentId" autocomplete="username" placeholder="Your UMaT student ID" required maxlength="40"></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" placeholder="Your password" required></label>
        <button class="form-submit" type="submit">Sign in to Student Hub <i class="fas fa-arrow-right"></i></button>
        <p class="form-error" id="authMessage" role="status" aria-live="polite"></p>
      </form>`;
    document.getElementById('loginForm').addEventListener('submit', signIn);
  }
}

async function passwordDigest(password) {
  if (!window.crypto?.subtle) throw new Error('Secure password hashing is unavailable here. Open this preview on HTTPS or localhost.');
  const bytes = new TextEncoder().encode(password);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function registerStudent(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const message = document.getElementById('authMessage');
  const studentId = String(form.get('studentId')).trim().toUpperCase();
  const password = String(form.get('password'));
  if (password !== form.get('confirmPassword')) { message.textContent = 'Those passwords do not match.'; return; }
  if (GoldHallPortal.findStudent(studentId)) { message.textContent = 'That Student ID already has an account. Please sign in instead.'; return; }
  try {
    const student = {
      fullName: String(form.get('fullName')).trim(), studentId,
      programme: String(form.get('programme')).trim(), year: String(form.get('year')),
      room: String(form.get('room')).trim(), hallStatus: String(form.get('hallStatus')),
      passwordHash: await passwordDigest(password), accessStatus: 'active',
      createdAt: new Date().toISOString(), completedAt: null
    };
    GoldHallPortal.saveStudent(student);
    sessionStorage.setItem(SESSION_KEY, studentId);
    openDashboard(student);
  } catch (error) {
    message.textContent = error.message || 'Could not create the account. Please try again.';
  }
}

async function signIn(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const message = document.getElementById('authMessage');
  const studentId = String(form.get('studentId')).trim().toUpperCase();
  const student = GoldHallPortal.findStudent(studentId);
  if (!student) { message.textContent = 'We could not find an account for that Student ID.'; return; }
  if (student.accessStatus !== 'active') { showCompleted(); return; }
  try {
    if (await passwordDigest(String(form.get('password'))) !== student.passwordHash) {
      message.textContent = 'The Student ID or password is incorrect.';
      return;
    }
    sessionStorage.setItem(SESSION_KEY, student.studentId);
    openDashboard(student);
  } catch (error) {
    message.textContent = error.message || 'Could not sign in. Please try again.';
  }
}

function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  dashboardHost.hidden = true;
  dashboardHost.innerHTML = '';
  authShell.hidden = false;
  setMode('login');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showCompleted() {
  sessionStorage.removeItem(SESSION_KEY);
  authShell.hidden = true;
  dashboardHost.hidden = false;
  dashboardHost.innerHTML = `<section class="graduated-card"><span class="icon"><i class="fas fa-graduation-cap"></i></span><h1>Thank you for being part of Gold Hall.</h1><p>Student Hub access is for currently enrolled students. This account has been marked as completed, so sign-in and voting are no longer available.</p><p>If this status is a mistake, please contact the Gold Hall Admin.</p><a class="hub-button" href="index.html"><i class="fas fa-house"></i> Return to the website</a></section>`;
}

function openDashboard(student) {
  if (!student || student.accessStatus !== 'active') { showCompleted(); return; }
  authShell.hidden = true;
  dashboardHost.hidden = false;
  dashboardHost.innerHTML = dashboardMarkup(student);
  bindDashboard(student);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const resources = [
  { icon: 'fa-award', title: 'Ghana Scholarships Authority', text: 'Government-funded scholarship information and applications.', link: 'https://scholarships.gov.gh/', label: 'Visit the Authority' },
  { icon: 'fa-award', title: 'GETFund Scholarships', text: 'Open the GETFund scholarship application portal.', link: 'https://scholarships.getfund.gov.gh/', label: 'Open the portal' },
  { icon: 'fa-award', title: 'Mastercard Foundation Scholars', text: 'Learn about the Scholars Program and partner universities.', link: 'https://mastercardfdn.org/all/scholars/', label: 'Explore the programme' },
  { icon: 'fa-briefcase', title: 'LinkedIn Internships', text: 'Browse internship listings with Ghana location filters.', link: 'https://www.linkedin.com/jobs/search/?keywords=internship&location=Ghana', label: 'Browse opportunities' },
  { icon: 'fa-briefcase', title: 'Indeed Internships', text: 'Search internship openings and entry-level placements.', link: 'https://gh.indeed.com/q-internship-jobs.html', label: 'Browse listings' },
  { icon: 'fa-book-open', title: 'Khan Academy', text: 'Free learning support for maths, science and study skills.', link: 'https://www.khanacademy.org/', label: 'Explore lessons' },
  { icon: 'fa-book-open', title: 'MIT OpenCourseWare', text: 'Open course materials and lectures across many subjects.', link: 'https://ocw.mit.edu/', label: 'Browse courses' },
  { icon: 'fa-bus-simple', title: 'Bus schedules', text: 'Check the sample campus shuttle timetable below.', link: '#bus-schedule', label: 'See departures' }
];

function dashboardMarkup(student) {
  const notices = [
    { icon: 'fa-handshake-angle', title: 'Freshers Akwaaba', text: 'Welcome programme for new students: meet your hall executives, find key services and connect with your hall family. Confirm the official date with the Hall Office.' },
    { icon: 'fa-flag', title: 'Hall Week', text: 'The annual week brings residents together for culture, sports, service and academic activities. Watch the Events page for confirmed dates.' }
  ];
  if (typeof GoldHallStore !== 'undefined') {
    const managed = GoldHallStore.visible('news').slice(0, 2);
    managed.forEach(item => notices.push({ icon: 'fa-bullhorn', title: item.title, text: item.text }));
  }
  return `<div class="hub-dashboard">
    <section class="hub-welcome">
      <div><span class="student-eyebrow">STUDENT HUB · UMaT</span><h1>Welcome, ${esc(student.fullName.split(/\s+/)[0])}.</h1><p>Your Gold Hall resources, opportunities and student voice—all in one place.</p></div>
      <div class="welcome-side"><button class="hub-button" id="signOutButton" type="button"><i class="fas fa-arrow-right-from-bracket"></i> Sign out</button></div>
    </section>
    <div class="hub-profile-strip" aria-label="Student details">
      <span><i class="fas fa-id-card"></i> ${esc(student.studentId)}</span><span><i class="fas fa-graduation-cap"></i> ${esc(student.programme)}</span><span><i class="fas fa-layer-group"></i> Year ${esc(student.year)}</span><span><i class="fas fa-house"></i> ${esc(student.hallStatus)}${student.room ? ` · ${esc(student.room)}` : ''}</span>
    </div>
    <section class="hub-section" aria-labelledby="resourceHeading">
      <div class="hub-section-head"><div><span class="hub-kicker">Your student toolkit</span><h2 id="resourceHeading">Useful resources</h2></div><p>Open a link to explore more.</p></div>
      <div class="hub-resource-grid">${resources.map(item => `<article class="hub-resource"><span class="hub-resource-icon"><i class="fas ${item.icon}"></i></span><h3>${item.title}</h3><p>${item.text}</p><a class="resource-link" href="${item.link}" ${item.link.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${item.label} <i class="fas fa-arrow-up-right-from-square"></i></a></article>`).join('')}</div>
    </section>
    <section class="hub-section hub-lower-grid">
      <div class="hub-panel"><h3>Hall announcements</h3><p class="hub-panel-intro">Community updates and programmes to look forward to.</p><div class="announcement-list">${notices.slice(0, 4).map(item => `<article class="announcement"><span class="announcement-icon"><i class="fas ${item.icon}"></i></span><div><h4>${esc(item.title)}</h4><p>${esc(item.text)}</p></div></article>`).join('')}</div><p style="margin:13px 0 0"><a class="resource-link" href="events.html">All hall events <i class="fas fa-arrow-right"></i></a></p></div>
      <div class="hub-panel" id="bus-schedule"><h3>Campus shuttle</h3><p class="hub-panel-intro">Sample weekday departures · UMaT / Gold Hall</p><div class="bus-list"><div class="bus-row"><strong>Morning run</strong><span>6:30 · 7:15 · 8:00</span></div><div class="bus-row"><strong>Midday run</strong><span>12:00 · 13:00</span></div><div class="bus-row"><strong>Evening run</strong><span>16:30 · 17:30 · 18:30</span></div></div><p class="bus-caveat"><i class="fas fa-circle-info"></i> Indicative demo times only. Please confirm the current timetable with the Hall Office before travelling.</p></div>
    </section>
    <section class="hub-section" id="student-polls">
      <div class="election-header"><div><span class="hub-kicker">Your voice matters</span><h2 class="hub-section-head" style="display:block;margin:4px 0 0"><span id="electionTitle"></span></h2><p class="hub-section-head" style="display:block;margin:4px 0 0;color:#818b84;font:400 .82rem 'DM Sans',sans-serif">Free to vote · one ballot per student for each position</p></div><span id="electionStatus" class="election-status"></span></div>
      <div class="poll-grid" id="pollGrid"></div>
      <p class="hub-privacy-note"><i class="fas fa-shield-halved"></i> Voting is free. This preview saves votes in this browser and cannot verify student identity or prevent tampering. Use a secured server-side election system for an official or binding result.</p>
    </section>
    <section class="hub-section" style="display:flex;justify-content:flex-end"><button type="button" class="complete-access" id="completeAccess"><i class="fas fa-graduation-cap"></i> I have completed school — end my access</button></section>
  </div>`;
}

function renderPolls(student) {
  const election = GoldHallPortal.election();
  const title = document.getElementById('electionTitle');
  const status = document.getElementById('electionStatus');
  const grid = document.getElementById('pollGrid');
  title.textContent = election.title || 'Gold Hall Student Polls';
  status.className = `election-status${election.isOpen ? '' : ' closed'}`;
  status.innerHTML = `<i class="fas ${election.isOpen ? 'fa-circle-check' : 'fa-lock'}"></i> ${election.isOpen ? 'Polls open' : 'Polls closed'}`;
  if (!election.positions.length) { grid.innerHTML = '<p>No polls have been configured yet. Please check back later.</p>'; return; }
  grid.innerHTML = election.positions.map(position => {
    const currentVote = GoldHallPortal.voteFor(student.studentId, position.id);
    const tally = GoldHallPortal.results(position.id);
    const total = Object.values(tally).reduce((sum, value) => sum + value, 0);
    const candidates = position.candidates.map((candidate, index) => {
      const isSelected = currentVote === candidate;
      const count = tally[candidate] || 0;
      const label = currentVote ? `${count} vote${count === 1 ? '' : 's'}` : '';
      return `<div class="candidate-option${isSelected ? ' is-voted' : ''}"><label><input type="radio" name="${esc(position.id)}" value="${esc(candidate)}" ${isSelected ? 'checked' : ''} ${currentVote || !election.isOpen ? 'disabled' : ''}><span>${esc(candidate)}${isSelected ? ' · Your vote' : ''}</span></label><span class="candidate-result">${label}</span></div>`;
    }).join('');
    const buttonText = currentVote ? 'Vote recorded' : election.isOpen ? 'Cast free vote' : 'Voting closed';
    return `<article class="poll-card"><h3>${esc(position.title)}</h3><div class="poll-vote-count">${total} vote${total === 1 ? '' : 's'} recorded</div><form data-poll="${esc(position.id)}"><div class="candidate-list">${candidates}</div><button class="form-submit poll-submit" type="submit" ${currentVote || !election.isOpen ? 'disabled' : ''}>${buttonText}</button><p class="form-error" role="status" aria-live="polite"></p></form></article>`;
  }).join('');
  grid.querySelectorAll('form[data-poll]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const latestStudent = GoldHallPortal.findStudent(student.studentId);
    if (!latestStudent || latestStudent.accessStatus !== 'active') { showCompleted(); return; }
    const selected = form.querySelector('input[type="radio"]:checked');
    const error = form.querySelector('.form-error');
    if (!selected) { error.textContent = 'Choose one candidate before submitting your vote.'; return; }
    if (!GoldHallPortal.election().isOpen) { error.textContent = 'Voting has closed.'; return; }
    if (!GoldHallPortal.vote(student.studentId, form.dataset.poll, selected.value)) { error.textContent = 'A vote for this position has already been recorded.'; return; }
    renderPolls(student);
  }));
}

function bindDashboard(student) {
  document.getElementById('signOutButton').addEventListener('click', signOut);
  document.getElementById('completeAccess').addEventListener('click', () => {
    const confirmed = window.confirm('Mark your studies as completed and end Student Hub access for this account? You will not be able to sign in or vote again.');
    if (!confirmed) return;
    GoldHallPortal.updateStudent(student.studentId, { accessStatus: 'completed', completedAt: new Date().toISOString() });
    showCompleted();
  });
  renderPolls(student);
}

tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
setMode('login');
const sessionId = sessionStorage.getItem(SESSION_KEY);
if (sessionId) {
  const currentStudent = GoldHallPortal.findStudent(sessionId);
  if (currentStudent?.accessStatus === 'active') openDashboard(currentStudent);
  else if (currentStudent) showCompleted();
  else sessionStorage.removeItem(SESSION_KEY);
}

window.addEventListener('storage', event => {
  if (event.key !== 'goldHallStudents') return;
  const id = sessionStorage.getItem(SESSION_KEY);
  const currentStudent = id ? GoldHallPortal.findStudent(id) : null;
  if (id && (!currentStudent || currentStudent.accessStatus !== 'active')) showCompleted();
});
