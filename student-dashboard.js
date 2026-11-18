/* ==========================================================================
   DASHBOARD PAGE: members-only Student Hub (dashboard.html)
   Guards the page: no session means no content, an active session renders the
   hub, and a completed account gets the "access ended" view.
   ========================================================================== */
const hubHost = document.getElementById('studentDashboard');
const SIGN_IN_URL = 'student';

/*
 * The page no longer carries the site header, so the name chip and the header
 * sign out button are gone with it. Signing out is still reachable: the hub
 * renders its own Sign out button and passes this handler to it. Each lookup
 * is guarded so a missing element can never stop the page rendering.
 */
const studentChip = document.getElementById('studentChip');
const headerSignOut = document.getElementById('headerSignOut');

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
  if (studentChip) {
    studentChip.innerHTML = `<i class="fas fa-user-graduate"></i> ${student.fullName.split(/\s+/)[0]} · ${student.studentId}`;
    studentChip.hidden = false;
  }
  if (headerSignOut) {
    headerSignOut.hidden = false;
    headerSignOut.addEventListener('click', signOutNow);
  }
}

function accessLost() {
  if (studentChip) studentChip.hidden = true;
  if (headerSignOut) headerSignOut.hidden = true;
  GoldHallHub.blocked(hubHost);
}

/* ---------- gate ---------- */
/*
 * The student record lives in the database now, so this is a request rather
 * than a lookup: it has to be awaited. A Promise is always truthy, so skipping
 * the await would have let an unknown session through to the hub and passed a
 * Promise in place of the student.
 */
(async () => {
  const sessionId = GoldHallSession.id();
  const account = sessionId ? await GoldHallSession.student() : null;

  if (!sessionId || !account) {
    window.location.replace(SIGN_IN_URL);
    return;
  }
  if (account.accessStatus !== 'active') {
    accessLost();
    return;
  }

  hubHost.hidden = false;
  showName(account);
  /* Content (scholarships, internships, events) comes from the server too, so
     paint once it has arrived. The seed paints if that request fails. */
  const paint = () => GoldHallHub.mount(hubHost, account, { onSignOut: signOutNow, onAccessLost: accessLost });
  if (typeof GoldHallStore !== 'undefined' && GoldHallStore.ready) {
    GoldHallStore.ready().then(paint, paint);
  } else {
    paint();
  }
})();

/*
 * Another tab can end this student's access. Grievances and ballots are no
 * longer mirrored in storage, so this only reacts to a sign-out.
 */
window.addEventListener('storage', async event => {
  if (event.key !== 'goldHallStudentSession') return;
  const current = await GoldHallSession.student();
  if (!current || current.accessStatus !== 'active') accessLost();
});
