/* ==========================================================================
   GOLD HALL STUDENT HUB — shared layer
   Session helpers, the pop-up dialog (account created, confirmations) and the
   members-only dashboard view. Loaded by both student.html (sign in / register)
   and dashboard.html (the signed-in page that is never listed in the nav).
   ========================================================================== */
(() => {
  const SESSION_KEY = 'goldHallStudentSession';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

  /* ---------- session ---------- */
  const session = {
    id() { try { return sessionStorage.getItem(SESSION_KEY); } catch (_) { return null; } },
    student() {
      const id = this.id();
      return id && typeof GoldHallPortal !== 'undefined' ? GoldHallPortal.findStudent(id) : null;
    },
    start(studentId) { try { sessionStorage.setItem(SESSION_KEY, studentId); } catch (_) { /* storage blocked */ } },
    end() { try { sessionStorage.removeItem(SESSION_KEY); } catch (_) { /* storage blocked */ } }
  };

  /* ---------- dialog (pop-up message box) ---------- */
  let dialogEl = null;
  let lastFocused = null;

  function closeDialog() {
    if (!dialogEl) return;
    const el = dialogEl;
    dialogEl = null;
    el.classList.remove('open');
    document.body.classList.remove('gh-dialog-open');
    window.setTimeout(() => el.remove(), 260);
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }

  /**
   * Show a pop-up message.
   * options: { icon, tone:'success'|'warn', eyebrow, title, body, details:[[label,value]],
   *            actions:[{ label, icon, primary, keepOpen, onClick }], dismissible }
   */
  function dialog(options = {}) {
    const {
      icon = 'fa-circle-check', tone = 'success', eyebrow = '', title = '', body = '',
      details = [], actions = [{ label: 'Close', primary: true }], dismissible = true
    } = options;

    closeDialog();
    lastFocused = document.activeElement;

    const el = document.createElement('div');
    el.className = 'gh-dialog-backdrop';
    el.innerHTML = `
      <div class="gh-dialog gh-tone-${esc(tone)}" role="dialog" aria-modal="true" aria-labelledby="ghDialogTitle" tabindex="-1">
        <span class="gh-dialog-icon"><i class="fas ${esc(icon)}"></i></span>
        ${eyebrow ? `<span class="gh-dialog-eyebrow">${esc(eyebrow)}</span>` : ''}
        <h2 id="ghDialogTitle">${esc(title)}</h2>
        ${body ? `<p class="gh-dialog-body">${body}</p>` : ''}
        ${details.length ? `<div class="gh-dialog-details">${details.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>` : ''}
        <div class="gh-dialog-actions">${actions.map((action, index) => `<button type="button" class="${action.primary ? 'form-submit' : 'gh-dialog-ghost'}" data-action="${index}">${action.icon ? `<i class="fas ${esc(action.icon)}"></i> ` : ''}${esc(action.label)}</button>`).join('')}</div>
      </div>`;
    document.body.appendChild(el);
    dialogEl = el;
    requestAnimationFrame(() => el.classList.add('open'));
    document.body.classList.add('gh-dialog-open');

    el.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = actions[Number(button.dataset.action)] || {};
        if (!action.keepOpen) closeDialog();
        action.onClick?.();
      });
    });
    if (dismissible) {
      el.addEventListener('click', event => { if (event.target === el) closeDialog(); });
      el.addEventListener('keydown', event => { if (event.key === 'Escape') closeDialog(); });
    }
    el.querySelector('.form-submit, .gh-dialog-ghost, .gh-dialog')?.focus();
    return { close: closeDialog };
  }

  document.addEventListener('keydown', event => { if (event.key === 'Escape' && dialogEl) closeDialog(); });

  /* ---------- dashboard data ---------- */
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

  function notices() {
    const list = [
      { icon: 'fa-handshake-angle', title: 'Freshers Akwaaba', text: 'Welcome programme for new students: meet your hall executives, find key services and connect with your hall family. Confirm the official date with the Hall Office.' },
      { icon: 'fa-flag', title: 'Hall Week', text: 'The annual week brings residents together for culture, sports, service and academic activities. Watch the Events page for confirmed dates.' }
    ];
    if (typeof GoldHallStore !== 'undefined') {
      GoldHallStore.visible('news').slice(0, 2).forEach(item => list.push({ icon: 'fa-bullhorn', title: item.title, text: item.text }));
    }
    return list;
  }

  function dashboardMarkup(student) {
    return `<div class="hub-dashboard">
    <section class="hub-welcome" data-reveal>
      <div><span class="student-eyebrow">STUDENT HUB · MEMBERS ONLY</span><h1>Welcome, ${esc(student.fullName.split(/\s+/)[0])}.</h1><p>Your Gold Hall resources, opportunities and student voice—all in one place.</p></div>
      <div class="welcome-side"><button class="hub-button" id="signOutButton" type="button"><i class="fas fa-arrow-right-from-bracket"></i> Sign out</button></div>
    </section>
    <div class="hub-profile-strip" aria-label="Student details" data-reveal style="--fx-delay:.08s">
      <span><i class="fas fa-id-card"></i> ${esc(student.studentId)}</span><span><i class="fas fa-graduation-cap"></i> ${esc(student.programme)}</span><span><i class="fas fa-layer-group"></i> Year ${esc(student.year)}</span><span><i class="fas fa-house"></i> ${esc(student.hallStatus)}${student.room ? ` · ${esc(student.room)}` : ''}</span><span><i class="fas fa-envelope"></i> ${esc(student.studentEmail || 'No student email on file')}</span>${student.personalEmail ? `<span><i class="fas fa-envelope-open-text"></i> ${esc(student.personalEmail)}</span>` : ''}
    </div>
    <section class="hub-section" aria-labelledby="resourceHeading" data-reveal style="--fx-delay:.14s">
      <div class="hub-section-head"><div><span class="hub-kicker">Your student toolkit</span><h2 id="resourceHeading">Useful resources</h2></div><p>Open a link to explore more.</p></div>
      <div class="hub-resource-grid">${resources.map(item => `<article class="hub-resource"><span class="hub-resource-icon"><i class="fas ${item.icon}"></i></span><h3>${item.title}</h3><p>${item.text}</p><a class="resource-link" href="${item.link}" ${item.link.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${item.label} <i class="fas fa-arrow-up-right-from-square"></i></a></article>`).join('')}</div>
    </section>
    <section class="hub-section hub-lower-grid" data-reveal style="--fx-delay:.2s">
      <div class="hub-panel"><h3>Hall announcements</h3><p class="hub-panel-intro">Community updates and programmes to look forward to.</p><div class="announcement-list">${notices().slice(0, 4).map(item => `<article class="announcement"><span class="announcement-icon"><i class="fas ${item.icon}"></i></span><div><h4>${esc(item.title)}</h4><p>${esc(item.text)}</p></div></article>`).join('')}</div><p style="margin:13px 0 0"><a class="resource-link" href="events.html">All hall events <i class="fas fa-arrow-right"></i></a></p></div>
      <div class="hub-panel" id="bus-schedule"><h3>Campus shuttle</h3><p class="hub-panel-intro">Sample weekday departures · UMaT / Gold Hall</p><div class="bus-list"><div class="bus-row"><strong>Morning run</strong><span>6:30 · 7:15 · 8:00</span></div><div class="bus-row"><strong>Midday run</strong><span>12:00 · 13:00</span></div><div class="bus-row"><strong>Evening run</strong><span>16:30 · 17:30 · 18:30</span></div></div><p class="bus-caveat"><i class="fas fa-circle-info"></i> Indicative demo times only. Please confirm the current timetable with the Hall Office before travelling.</p></div>
    </section>
    <section class="hub-section" id="student-polls" data-reveal style="--fx-delay:.26s">
      <div class="election-header"><div><span class="hub-kicker">Your voice matters</span><h2 class="hub-section-head" style="display:block;margin:4px 0 0"><span id="electionTitle"></span></h2><p class="hub-section-head" style="display:block;margin:4px 0 0;color:#818b84;font:400 .82rem 'DM Sans',sans-serif">Free to vote · one ballot per student for each position</p></div><span id="electionStatus" class="election-status"></span></div>
      <div class="poll-grid" id="pollGrid"></div>
      <p class="hub-privacy-note"><i class="fas fa-shield-halved"></i> Voting is free. This preview saves votes in this browser and cannot verify student identity or prevent tampering. Use a secured server-side election system for an official or binding result.</p>
    </section>
    <section class="hub-section" style="display:flex;justify-content:flex-end"><button type="button" class="complete-access" id="completeAccess"><i class="fas fa-graduation-cap"></i> I have completed school — end my access</button></section>
  </div>`;
  }

  function renderPolls(student, host, onAccessLost) {
    const election = GoldHallPortal.election();
    const title = host.querySelector('#electionTitle');
    const status = host.querySelector('#electionStatus');
    const grid = host.querySelector('#pollGrid');
    title.textContent = election.title || 'Gold Hall Student Polls';
    status.className = `election-status${election.isOpen ? '' : ' closed'}`;
    status.innerHTML = `<i class="fas ${election.isOpen ? 'fa-circle-check' : 'fa-lock'}"></i> ${election.isOpen ? 'Polls open' : 'Polls closed'}`;
    if (!election.positions.length) { grid.innerHTML = '<p>No polls have been configured yet. Please check back later.</p>'; return; }
    grid.innerHTML = election.positions.map(position => {
      const currentVote = GoldHallPortal.voteFor(student.studentId, position.id);
      const tally = GoldHallPortal.results(position.id);
      const total = Object.values(tally).reduce((sum, value) => sum + value, 0);
      const candidates = position.candidates.map(candidate => {
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
      if (!latestStudent || latestStudent.accessStatus !== 'active') { onAccessLost?.(); return; }
      const selected = form.querySelector('input[type="radio"]:checked');
      const error = form.querySelector('.form-error');
      if (!selected) { error.textContent = 'Choose one candidate before submitting your vote.'; return; }
      if (!GoldHallPortal.election().isOpen) { error.textContent = 'Voting has closed.'; return; }
      if (!GoldHallPortal.vote(student.studentId, form.dataset.poll, selected.value)) { error.textContent = 'A vote for this position has already been recorded.'; return; }
      renderPolls(student, host, onAccessLost);
    }));
  }

  /** Signed-in (members-only) hub view. */
  function mount(host, student, options = {}) {
    const { onSignOut, onAccessLost } = options;
    const lost = () => { onAccessLost ? onAccessLost() : blocked(host); };
    host.hidden = false;
    host.innerHTML = dashboardMarkup(student);
    host.querySelector('#signOutButton').addEventListener('click', () => {
      if (onSignOut) onSignOut();
      else { session.end(); window.location.href = 'student.html'; }
    });
    host.querySelector('#completeAccess').addEventListener('click', () => {
      dialog({
        icon: 'fa-graduation-cap', tone: 'warn', eyebrow: 'End my access',
        title: 'Mark your studies as completed?',
        body: 'Your Student Hub access and voting will be switched off and you will be signed out. This is how your hall access ends when you finish school.',
        actions: [
          { label: 'Yes, end my access', primary: true, onClick: () => {
            GoldHallPortal.updateStudent(student.studentId, { accessStatus: 'completed', completedAt: new Date().toISOString() });
            lost();
          } },
          { label: 'No, keep my access' }
        ]
      });
    });
    renderPolls(student, host, lost);
    window.GoldHallFX?.observe(host);
  }

  function completedMarkup() {
    return `<section class="graduated-card"><span class="grad-crest"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"></span><span class="icon"><i class="fas fa-graduation-cap"></i></span><h1>Thank you for being part of Gold Hall.</h1><p>Student Hub access is for currently enrolled students. This account has been marked as completed, so sign-in and voting are no longer available.</p><p>If this status is a mistake, please contact the Gold Hall Admin.</p><a class="hub-button" href="index.html"><i class="fas fa-house"></i> Return to the website</a></section>`;
  }

  /** Shown when an account is completed / revoked: clears the session and replaces the view. */
  function blocked(host, options = {}) {
    session.end();
    if (options.authShell) options.authShell.hidden = true;
    host.hidden = false;
    host.innerHTML = completedMarkup();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.GoldHallSession = session;
  window.GoldHallDialog = dialog;
  window.GoldHallHub = { mount, blocked, dialog, session };
})();
