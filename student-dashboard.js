/* ==========================================================================
   DASHBOARD PAGE — members-only Student Hub (dashboard.html)
   Guards the page: no session means no content, an active session renders the
   hub, and a completed account gets the "access ended" view.
   ========================================================================== */
const hubHost = document.getElementById('studentDashboard');
const membersNote = document.getElementById('membersNote');
const studentChip = document.getElementById('studentChip');
const headerSignOut = document.getElementById('headerSignOut');
const SIGN_IN_URL = 'student.html';

function leaveToSignIn() {
  GoldHallSession.end();
  window.location.replace(SIGN_IN_URL);
}

function signOutNow() {
  GoldHallDialog({
    icon: 'fa-arrow-right-from-bracket', tone: 'warn', eyebrow: 'Sign out',
    title: 'Sign out of your Student Hub?',
    body: 'You will need your Student ID and password to open this page again.',
    actions: [
      { label: 'Yes, sign me out', primary: true, onClick: leaveToSignIn },
      { label: 'Stay signed in' }
    ]
  });
}

function showName(student) {
  studentChip.innerHTML = `<i class="fas fa-user-graduate"></i> ${student.fullName.split(/\s+/)[0]} · ${student.studentId}`;
  studentChip.hidden = false;
  headerSignOut.hidden = false;
  headerSignOut.addEventListener('click', signOutNow);
  membersNote.hidden = false;
}

function accessLost() {
  studentChip.hidden = true;
  headerSignOut.hidden = true;
  GoldHallHub.blocked(hubHost);
}

/* ---------- gate ---------- */
const account = GoldHallSession.student();
if (!GoldHallSession.id() || !account) {
  window.location.replace(SIGN_IN_URL);
} else if (account.accessStatus !== 'active') {
  accessLost();
} else {
  hubHost.hidden = false;
  showName(account);
  GoldHallHub.mount(hubHost, account, { onSignOut: signOutNow, onAccessLost: accessLost });
}

/* the admin (or another tab) can end access while this page is open */
window.addEventListener('storage', event => {
  if (event.key !== 'goldHallStudents') return;
  const current = GoldHallSession.student();
  if (!current || current.accessStatus !== 'active') accessLost();
});
