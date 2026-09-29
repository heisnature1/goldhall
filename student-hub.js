/* ==========================================================================
   GOLD HALL STUDENT HUB — shared layer
   Session helpers, the pop-up dialog (account created, confirmations),
   dynamic scholarships & internships, grievance desk, and members-only
   dashboard view. Loaded by both student.html and dashboard.html.
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

  /* ---------- scholarships & internships data ---------- */
  const learningResources = [
    { icon: 'fa-book-open', title: 'Khan Academy', text: 'Free learning support for mathematics, physics, engineering and study skills.', link: 'https://www.khanacademy.org/', label: 'Explore lessons' },
    { icon: 'fa-graduation-cap', title: 'MIT OpenCourseWare', text: 'Open course materials, textbooks and lecture archives across sciences and engineering.', link: 'https://ocw.mit.edu/', label: 'Browse courses' },
    { icon: 'fa-laptop-code', title: 'Coursera & edX Free Programmes', text: 'Technical coursework, programming certifications and skill tracks from top global institutions.', link: 'https://www.coursera.org/', label: 'View courses' }
  ];

  function getScholarships() {
    if (typeof GoldHallStore !== 'undefined') {
      const items = GoldHallStore.visible('scholarships');
      if (items && items.length) return items;
    }
    return [
      { id: 's1', title: 'Ghana Scholarships Authority', text: 'Government-funded scholarship information and application portal for local and foreign tertiary students across Ghana.', meta: 'Government Funding · All Year Groups', link: 'https://scholarships.gov.gh/', label: 'Visit the Authority', image: '' },
      { id: 's2', title: 'GETFund Tertiary Scholarships', text: 'Financial grant and bursary portal managed by the Ghana Education Trust Fund for undergraduate and postgraduate studies.', meta: 'Tertiary Education · Financial Grant', link: 'https://scholarships.getfund.gov.gh/', label: 'Open GETFund Portal', image: '' },
      { id: 's3', title: 'Mastercard Foundation Scholars Program', text: 'Comprehensive educational support covering full tuition, accommodation, study materials, and leadership development for African youth.', meta: 'Full Scholarship · Leadership', link: 'https://mastercardfdn.org/all/scholars/', label: 'Explore Programme', image: '' },
      { id: 's4', title: 'MTN Ghana Bright Scholarship', text: 'Tuition and accommodation grant for brilliant and needy students in public tertiary universities studying STEM, humanities and technology.', meta: 'Tuition & Stipends · STEM / General', link: 'https://mtn.com.gh/foundation/', label: 'Apply on MTN Portal', image: '' }
    ];
  }

  function getInternships() {
    if (typeof GoldHallStore !== 'undefined') {
      const items = GoldHallStore.visible('internships');
      if (items && items.length) return items;
    }
    return [
      { id: 'i1', title: 'LinkedIn Ghana Internships & Placements', text: 'Browse and apply for real-time industrial attachment and internship openings with top mining, engineering, and tech firms in Ghana.', meta: 'Engineering, Mining & Tech', link: 'https://www.linkedin.com/jobs/search/?keywords=internship&location=Ghana', label: 'Browse Opportunities', image: '' },
      { id: 'i2', title: 'Indeed Internships Ghana', text: 'Search vacation placements, graduate trainee programmes, and entry-level practical attachments with local and multinational employers.', meta: 'Vacation & Graduate Roles', link: 'https://gh.indeed.com/q-internship-jobs.html', label: 'Browse Listings', image: '' },
      { id: 'i3', title: 'Ghana Chamber of Mines Attachments', text: 'Practical industrial training and vacation internship placements across member mining companies and extraction contractors.', meta: 'Mining & Minerals Engineering', link: 'https://ghanachamberofmines.org/', label: 'Visit Chamber Portal', image: '' },
      { id: 'i4', title: 'National Service Scheme & Pre-Service Portal', text: 'Pre-service industrial attachment guidelines, registration, and internship postings for Ghanaian tertiary students.', meta: 'Public & Private Placements', link: 'https://nss.gov.gh/', label: 'Open NSS Portal', image: '' }
    ];
  }

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

  /* ---------- dashboard view markup ---------- */
  function dashboardMarkup(student) {
    const scholarships = getScholarships();
    const internships = getInternships();

    return `<div class="hub-dashboard">
    <section class="hub-welcome" data-reveal>
      <div>
        <span class="student-eyebrow">STUDENT HUB · MEMBERS ONLY</span>
        <h1>Welcome, ${esc(student.fullName.split(/\s+/)[0])}.</h1>
        <p>Your Gold Hall resources, opportunities, student voice and grievance desk—all in one place.</p>
      </div>
      <div class="welcome-side">
        <button class="hub-button" id="signOutButton" type="button"><i class="fas fa-arrow-right-from-bracket"></i> Sign out</button>
      </div>
    </section>

    <div class="hub-profile-strip" aria-label="Student details" data-reveal style="--fx-delay:.08s">
      <span><i class="fas fa-id-card"></i> ${esc(student.studentId)}</span>
      <span><i class="fas fa-graduation-cap"></i> ${esc(student.programme)}</span>
      <span><i class="fas fa-layer-group"></i> Level ${esc(student.year)}</span>
      <span><i class="fas fa-house"></i> ${esc(student.hallStatus)}${student.room ? ` · ${esc(student.room)}` : ''}</span>
      <span><i class="fas fa-envelope"></i> ${esc(student.studentEmail || 'No student email on file')}</span>
      ${student.personalEmail ? `<span><i class="fas fa-envelope-open-text"></i> ${esc(student.personalEmail)}</span>` : ''}
    </div>

    <div class="hub-section hub-tabs-wrap" data-reveal style="--fx-delay:.14s">
      <div class="hub-tabs" role="tablist" aria-label="Student Hub sections">
        <button class="hub-tab active" id="tabScholarships" type="button" role="tab" aria-selected="true" aria-controls="panelScholarships" tabindex="0"><i class="fas fa-award" aria-hidden="true"></i> Scholarships &amp; internships</button>
        <button class="hub-tab" id="tabGrievances" type="button" role="tab" aria-selected="false" aria-controls="panelGrievances" tabindex="-1"><i class="fas fa-clipboard-question" aria-hidden="true"></i> Grievance desk</button>
        <button class="hub-tab" id="tabAnnouncements" type="button" role="tab" aria-selected="false" aria-controls="panelAnnouncements" tabindex="-1"><i class="fas fa-bullhorn" aria-hidden="true"></i> Hall announcements</button>
        <button class="hub-tab" id="tabPolls" type="button" role="tab" aria-selected="false" aria-controls="panelPolls" tabindex="-1"><i class="fas fa-check-to-slot" aria-hidden="true"></i> Hall polls</button>
      </div>

      <!-- TAB 1: Scholarships, Internships & Learning -->
      <section class="hub-tab-panel" id="panelScholarships" role="tabpanel" aria-labelledby="tabScholarships" tabindex="0">
        <div class="hub-section-head">
          <div><span class="hub-kicker">Funding opportunities</span><h2>Scholarships</h2></div>
          <p>Explore government, corporate and foundation scholarship schemes and application portals.</p>
        </div>
        <div class="hub-resource-grid" id="scholarshipsGrid">
          ${scholarships.map(item => `
            <article class="hub-resource">
              ${item.image ? `<div class="hub-resource-img"><img src="${esc(item.image)}" alt=""></div>` : ''}
              <span class="hub-resource-icon"><i class="fas fa-award"></i></span>
              <h3>${esc(item.title)}</h3>
              ${item.meta ? `<span class="hub-resource-meta"><i class="fas fa-tag"></i> ${esc(item.meta)}</span>` : ''}
              <p>${esc(item.text)}</p>
              ${item.link ? `<a class="resource-link" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.label || 'Apply on Portal')} <i class="fas fa-arrow-up-right-from-square"></i></a>` : ''}
            </article>
          `).join('')}
        </div>

        <div class="hub-section-head hub-subsection-head">
          <div><span class="hub-kicker">Career &amp; attachments</span><h2>Internships &amp; placements</h2></div>
          <p>Industrial attachments, vacation training and entry-level practical placements.</p>
        </div>
        <div class="hub-resource-grid" id="internshipsGrid">
          ${internships.map(item => `
            <article class="hub-resource">
              ${item.image ? `<div class="hub-resource-img"><img src="${esc(item.image)}" alt=""></div>` : ''}
              <span class="hub-resource-icon"><i class="fas fa-briefcase"></i></span>
              <h3>${esc(item.title)}</h3>
              ${item.meta ? `<span class="hub-resource-meta"><i class="fas fa-tag"></i> ${esc(item.meta)}</span>` : ''}
              <p>${esc(item.text)}</p>
              ${item.link ? `<a class="resource-link" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.label || 'Browse Opportunities')} <i class="fas fa-arrow-up-right-from-square"></i></a>` : ''}
            </article>
          `).join('')}
        </div>

        <div class="hub-section-head hub-subsection-head">
          <div><span class="hub-kicker">Academic support</span><h2>Open learning resources</h2></div>
          <p>Free tutorial platforms and open courseware for engineering and sciences.</p>
        </div>
        <div class="hub-resource-grid">
          ${learningResources.map(item => `
            <article class="hub-resource">
              <span class="hub-resource-icon"><i class="fas ${item.icon}"></i></span>
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.text)}</p>
              <a class="resource-link" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.label)} <i class="fas fa-arrow-up-right-from-square"></i></a>
            </article>
          `).join('')}
        </div>
      </section>

      <!-- TAB 2: Grievance Desk -->
      <section class="hub-tab-panel" id="panelGrievances" role="tabpanel" aria-labelledby="tabGrievances" tabindex="0" hidden>
        <div class="hub-section-head">
          <div><span class="hub-kicker">Student voice &amp; welfare</span><h2>Grievance &amp; Complaint Desk</h2></div>
          <p>Lodge room maintenance requests, utility complaints, security concerns or hall feedback. Hall administration reviews each submission and records actions taken.</p>
        </div>

        <div class="hub-grievance-layout">
          <div class="hub-grievance-form-panel">
            <div class="hub-panel">
              <h3><i class="fas fa-pen-to-square"></i> Lodge a Complaint</h3>
              <p class="hub-panel-intro">Submit a new complaint. Maintenance officers and hall administration receive your ticket immediately.</p>
              <form id="grievanceForm" class="portal-form" novalidate>
                <div class="form-grid">
                  <label>Category
                    <select name="category" required>
                      <option value="" disabled selected>Select complaint category</option>
                      <option value="Room Maintenance &amp; Electrical">Room Maintenance &amp; Electrical</option>
                      <option value="Water &amp; Plumbing Issues">Water &amp; Plumbing Issues</option>
                      <option value="Sanitation &amp; Waste Disposal">Sanitation &amp; Waste Disposal</option>
                      <option value="Security &amp; Safety Concerns">Security &amp; Safety Concerns</option>
                      <option value="Hall Amenities &amp; Wi-Fi">Hall Amenities &amp; Wi-Fi</option>
                      <option value="Noise &amp; Resident Conflict">Noise &amp; Resident Conflict</option>
                      <option value="Student Welfare &amp; Health">Student Welfare &amp; Health</option>
                      <option value="Hall Fees &amp; Administrative">Hall Fees &amp; Administrative</option>
                      <option value="General Hall Matter">General Hall Matter</option>
                    </select>
                  </label>
                  <label>Urgency / Priority
                    <select name="priority" required>
                      <option value="normal" selected>Normal / Routine (within 48 hrs)</option>
                      <option value="high">High Priority (within 24 hrs)</option>
                      <option value="urgent">Urgent / Emergency (Safety / utility hazard)</option>
                    </select>
                  </label>
                </div>

                <label>Affected Room / Location
                  <input name="location" value="${esc(student.room || student.hallStatus)}" placeholder="e.g. Block B · Room 14 or 2nd Floor Washrooms" required maxlength="100">
                </label>

                <label>Complaint Subject
                  <input name="subject" placeholder="e.g. Faulty ceiling fan capacitor and loose socket" required maxlength="120">
                </label>

                <label>Detailed Explanation
                  <textarea name="description" rows="4" placeholder="Describe the fault or issue clearly: what happened, how long it has persisted, and any safety concerns..." required></textarea>
                </label>

                <label class="check-label" style="display:flex;align-items:center;gap:8px;font-size:.8rem;font-weight:500;color:#3f5446">
                  <input name="isAnonymous" type="checkbox"> Submit anonymously (hall officers will see the complaint without your name)
                </label>

                <button class="form-submit" type="submit" id="submitGrievanceBtn">
                  <i class="fas fa-paper-plane"></i> Submit Complaint to Admin
                </button>
                <p class="form-error" id="grievanceFormFeedback" role="status" aria-live="polite"></p>
              </form>
            </div>
          </div>

          <div class="hub-grievance-history-panel">
            <div class="hub-panel">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
                <div>
                  <h3><i class="fas fa-list-check"></i> My Submitted Complaints</h3>
                  <p class="hub-panel-intro" style="margin-bottom:0">Track status updates and official actions taken by the Hall Administration.</p>
                </div>
              </div>

              <div class="hub-grievance-filters" id="studentGrievanceFilters">
                <button type="button" class="hub-filter-pill active" data-filter="all">All</button>
                <button type="button" class="hub-filter-pill" data-filter="pending">Pending</button>
                <button type="button" class="hub-filter-pill" data-filter="in-progress">In Progress</button>
                <button type="button" class="hub-filter-pill" data-filter="resolved">Resolved</button>
              </div>

              <div id="studentGrievancesList" class="student-grievance-list"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 3: Announcements -->
      <section class="hub-tab-panel" id="panelAnnouncements" role="tabpanel" aria-labelledby="tabAnnouncements" tabindex="0" hidden>
        <div class="hub-section-head">
          <div><span class="hub-kicker">Stay connected</span><h2>Hall announcements</h2></div>
          <p>Community updates, programmes and campus shuttle transport information.</p>
        </div>
        <div class="hub-lower-grid">
          <div class="hub-panel">
            <h3>From the Hall</h3>
            <p class="hub-panel-intro">Community updates and programmes to look forward to.</p>
            <div class="announcement-list">
              ${notices().slice(0, 4).map(item => `<article class="announcement"><span class="announcement-icon"><i class="fas ${item.icon}"></i></span><div><h4>${esc(item.title)}</h4><p>${esc(item.text)}</p></div></article>`).join('')}
            </div>
            <p style="margin:13px 0 0"><a class="resource-link" href="events.html">All hall events <i class="fas fa-arrow-right"></i></a></p>
          </div>
          <div class="hub-panel" id="bus-schedule">
            <h3>Campus shuttle</h3>
            <p class="hub-panel-intro">Indicative weekday departures · UMaT / Gold Hall</p>
            <div class="bus-list">
              <div class="bus-row"><strong>Morning run</strong><span>6:30 · 7:15 · 8:00</span></div>
              <div class="bus-row"><strong>Midday run</strong><span>12:00 · 13:00</span></div>
              <div class="bus-row"><strong>Evening run</strong><span>16:30 · 17:30 · 18:30</span></div>
            </div>
            <p class="bus-caveat"><i class="fas fa-circle-info"></i> These times are indicative; please confirm the current timetable with the Hall Office before travelling.</p>
          </div>
        </div>
      </section>

      <!-- TAB 4: Hall Polls -->
      <section class="hub-tab-panel" id="panelPolls" role="tabpanel" aria-labelledby="tabPolls" tabindex="0" hidden>
        <div class="election-header">
          <div>
            <span class="hub-kicker">Your voice matters</span>
            <h2 class="poll-section-title"><span id="electionTitle"></span></h2>
            <p class="poll-section-intro">Free to vote · one ballot per student for each position</p>
          </div>
          <span id="electionStatus" class="election-status"></span>
        </div>
        <div class="poll-grid" id="pollGrid"></div>
        <p class="hub-privacy-note"><i class="fas fa-shield-halved"></i> Voting is free. Votes are saved in this browser and cannot verify student identity or prevent tampering. Use a secured server-side election system for an official or binding result.</p>
      </section>
    </div>

    <section class="hub-section" style="display:flex;justify-content:flex-end">
      <button type="button" class="complete-access" id="completeAccess"><i class="fas fa-graduation-cap"></i> I have completed school — end my access</button>
    </section>
  </div>`;
  }

  /* ---------- Grievances rendering & submission ---------- */
  let currentGrievanceFilter = 'all';

  function renderStudentGrievances(student, host, filter = 'all') {
    const listEl = host.querySelector('#studentGrievancesList');
    if (!listEl) return;

    let grievances = typeof GoldHallPortal !== 'undefined' ? GoldHallPortal.studentGrievances(student.studentId) : [];

    // If this student has no specific grievances yet in demo, check if they want to see all submitted
    if (!grievances.length && typeof GoldHallPortal !== 'undefined') {
      grievances = GoldHallPortal.grievances();
    }

    if (filter !== 'all') {
      grievances = grievances.filter(g => g.status === filter);
    }

    const priorityLabels = { urgent: 'Urgent', high: 'High', normal: 'Normal' };
    const statusLabels = {
      pending: 'Pending Review',
      'in-progress': 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    };

    if (!grievances.length) {
      listEl.innerHTML = `<div class="empty-student-grievance">
        <i class="fas fa-clipboard-check"></i>
        <h4>No complaints in this view</h4>
        <p>Use the form on the left to submit a maintenance or hall complaint. You will be able to track admin responses here.</p>
      </div>`;
      return;
    }

    listEl.innerHTML = grievances.map(g => {
      const dateStr = g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'Recently';

      const actionDateStr = g.adminActionDate ? new Date(g.adminActionDate).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : '';

      return `<article class="student-grievance-item ${g.status}">
        <div class="s-grievance-top">
          <div class="s-grievance-tags">
            <span class="s-gid">#${esc(g.id)}</span>
            <span class="s-status-badge ${g.status}">${statusLabels[g.status] || g.status}</span>
            <span class="s-priority-badge priority-${g.priority || 'normal'}">${priorityLabels[g.priority] || g.priority}</span>
            <span class="s-cat-badge"><i class="fas fa-tag"></i> ${esc(g.category)}</span>
          </div>
          <span class="s-date"><i class="fas fa-clock"></i> ${dateStr}</span>
        </div>

        <h4 class="s-subject">${esc(g.subject)}</h4>
        <p class="s-desc">${esc(g.description)}</p>
        <div class="s-location"><i class="fas fa-location-dot"></i> Location: <strong>${esc(g.location || g.room || 'Gold Hall')}</strong></div>

        <!-- Admin Action Callout -->
        ${g.adminAction ? `
          <div class="s-admin-action-callout ${g.status}">
            <div class="s-action-head">
              <span class="s-action-title"><i class="fas fa-shield-halved"></i> Hall Administration Action</span>
              <span class="s-action-time">${actionDateStr}</span>
            </div>
            <p class="s-action-text">${esc(g.adminAction)}</p>
            ${g.actionHandler ? `<div class="s-action-handler"><i class="fas fa-id-badge"></i> Assigned Officer: <strong>${esc(g.actionHandler)}</strong></div>` : ''}
          </div>
        ` : `
          <div class="s-admin-pending-callout">
            <i class="fas fa-clock"></i>
            <div>
              <strong>Awaiting Administrator Review</strong>
              <p>Your complaint has been transmitted to Hall Administration. Investigation notes and actions will appear here once an officer is dispatched.</p>
            </div>
          </div>
        `}
      </article>`;
    }).join('');
  }

  function setupGrievanceEvents(student, host) {
    const form = host.querySelector('#grievanceForm');
    const feedback = host.querySelector('#grievanceFormFeedback');
    const filterButtons = host.querySelectorAll('#studentGrievanceFilters button');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGrievanceFilter = btn.dataset.filter;
        renderStudentGrievances(student, host, currentGrievanceFilter);
      });
    });

    if (form) {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(form);
        const category = String(data.get('category') || '').trim();
        const priority = String(data.get('priority') || 'normal').trim();
        const location = String(data.get('location') || '').trim();
        const subject = String(data.get('subject') || '').trim();
        const description = String(data.get('description') || '').trim();
        const isAnonymous = data.get('isAnonymous') === 'on';

        if (!category) { feedback.textContent = 'Please select a complaint category.'; return; }
        if (!location) { feedback.textContent = 'Please enter the affected room or location.'; return; }
        if (subject.length < 4) { feedback.textContent = 'Please provide a clear subject (at least 4 characters).'; return; }
        if (description.length < 10) { feedback.textContent = 'Please describe the complaint in detail (at least 10 characters).'; return; }

        feedback.textContent = '';
        const submitBtn = form.querySelector('#submitGrievanceBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting complaint… <i class="fas fa-spinner fa-spin"></i>';

        try {
          const newGrievance = GoldHallPortal.saveGrievance({
            studentId: student.studentId,
            studentName: student.fullName,
            studentEmail: student.studentEmail,
            programme: student.programme,
            year: student.year,
            hallStatus: student.hallStatus,
            room: student.room,
            category,
            priority,
            location,
            subject,
            description,
            isAnonymous
          });

          form.reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Complaint to Admin';

          dialog({
            icon: 'fa-circle-check',
            tone: 'success',
            eyebrow: `Reference #${newGrievance.id}`,
            title: 'Complaint Logged Successfully',
            body: 'Your complaint has been submitted to the Gold Refinery Hall Administration. Hall maintenance and welfare officers will review your ticket and record actions taken.',
            details: [
              ['Reference ID', newGrievance.id],
              ['Category', newGrievance.category],
              ['Priority', newGrievance.priority.toUpperCase()],
              ['Location', newGrievance.location],
              ['Status', 'Pending Review']
            ],
            actions: [
              { label: 'View in Grievance Desk', primary: true, onClick: () => {
                renderStudentGrievances(student, host, currentGrievanceFilter);
              }}
            ]
          });

          renderStudentGrievances(student, host, currentGrievanceFilter);
        } catch (err) {
          feedback.textContent = 'Could not submit complaint. Please try again.';
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Complaint to Admin';
        }
      });
    }
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
    const tabList = host.querySelector('[role="tablist"]');
    const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    const activateTab = (tab, moveFocus = false) => {
      tabs.forEach(item => {
        const active = item === tab;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        const panel = host.querySelector(`#${item.getAttribute('aria-controls')}`);
        if (panel) panel.hidden = !active;
      });
      if (moveFocus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', event => {
        let nextIndex;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        activateTab(tabs[nextIndex], true);
      });
    });

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
    renderStudentGrievances(student, host, 'all');
    setupGrievanceEvents(student, host);

    // Live update when grievances or scholarships are updated in another tab/admin
    window.addEventListener('storage', event => {
      if (event.key === 'goldHallGrievances') {
        renderStudentGrievances(student, host, currentGrievanceFilter);
      }
      if (event.key === 'goldHallManagedContent') {
        // Refresh scholarships & internships cards
        const sGrid = host.querySelector('#scholarshipsGrid');
        const iGrid = host.querySelector('#internshipsGrid');
        if (sGrid) {
          sGrid.innerHTML = getScholarships().map(item => `
            <article class="hub-resource">
              ${item.image ? `<div class="hub-resource-img"><img src="${esc(item.image)}" alt=""></div>` : ''}
              <span class="hub-resource-icon"><i class="fas fa-award"></i></span>
              <h3>${esc(item.title)}</h3>
              ${item.meta ? `<span class="hub-resource-meta"><i class="fas fa-tag"></i> ${esc(item.meta)}</span>` : ''}
              <p>${esc(item.text)}</p>
              ${item.link ? `<a class="resource-link" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.label || 'Apply on Portal')} <i class="fas fa-arrow-up-right-from-square"></i></a>` : ''}
            </article>`).join('');
        }
        if (iGrid) {
          iGrid.innerHTML = getInternships().map(item => `
            <article class="hub-resource">
              ${item.image ? `<div class="hub-resource-img"><img src="${esc(item.image)}" alt=""></div>` : ''}
              <span class="hub-resource-icon"><i class="fas fa-briefcase"></i></span>
              <h3>${esc(item.title)}</h3>
              ${item.meta ? `<span class="hub-resource-meta"><i class="fas fa-tag"></i> ${esc(item.meta)}</span>` : ''}
              <p>${esc(item.text)}</p>
              ${item.link ? `<a class="resource-link" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.label || 'Browse Opportunities')} <i class="fas fa-arrow-up-right-from-square"></i></a>` : ''}
            </article>`).join('');
        }
      }
    });

    window.GoldHallFX?.observe(host);
  }

  function completedMarkup() {
    return `<section class="graduated-card">
      <span class="grad-crest"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"></span>
      <span class="icon"><i class="fas fa-graduation-cap"></i></span>
      <h1>Thank you for being part of Gold Hall.</h1>
      <p>Student Hub access is for currently enrolled students. This account has been marked as completed, so sign-in and voting are no longer available.</p>
      <p>If this status is a mistake, please contact the Gold Hall Admin.</p>
      <a class="hub-button" href="index.html"><i class="fas fa-house"></i> Return to the website</a>
    </section>`;
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
