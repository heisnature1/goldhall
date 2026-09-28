const app = document.getElementById('adminApp');
const labels = { news: 'News', events: 'Events', gallery: 'Gallery', documents: 'Documents' };
const icons = { news: 'fa-newspaper', events: 'fa-calendar-days', gallery: 'fa-image', documents: 'fa-file-lines' };
let activeType = 'news';
let activeView = 'content';
let editingId = null;
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

function login() {
  app.innerHTML = `<section class="admin-login"><a class="admin-back" href="index.html"><i class="fas fa-house"></i> Back to the website</a><div class="login-card"><div class="login-mark"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"></div><h1>Admin Portal</h1><p>Manage Gold Refinery Hall content and student access.</p><form class="login-form" id="loginForm"><label>Username<input name="username" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="admin-btn"><i class="fas fa-right-to-bracket"></i> Sign in</button></form><p class="login-error" id="loginError" role="status"></p><p class="login-note">Preview admin: <strong>admin</strong> / <strong>goldhall</strong></p><p class="login-note">This static preview is not a production-secure admin system.</p></div></section>`;
  document.getElementById('loginForm').onsubmit = event => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    if (values.get('username') === 'admin' && values.get('password') === 'goldhall') {
      sessionStorage.setItem('goldHallAdmin', 'true');
      dashboard();
    } else document.getElementById('loginError').textContent = 'Incorrect username or password.';
  };
}

function dashboard() {
  const contentButtons = Object.keys(labels).map(type => `<button type="button" data-type="${type}" class="admin-tab ${activeView === 'content' && type === activeType ? 'active' : ''}"><i class="fas ${icons[type]}"></i>${labels[type]}</button>`).join('');
  app.innerHTML = `<div class="admin-shell"><header class="admin-topbar"><div class="admin-topbar-inner"><div class="admin-brand"><img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo"><div class="admin-brand-text"><h1>Gold Refinery Hall</h1><p>Single administrator · Preview</p></div></div><div class="admin-top-actions"><a class="admin-site-link" href="index.html"><i class="fas fa-house"></i> View website</a><button id="logout" type="button"><i class="fas fa-right-from-bracket"></i>Sign out</button></div></div></header><nav class="admin-tabbar" aria-label="Admin sections"><div class="admin-tabbar-inner">${contentButtons}<span class="admin-tab-sep" aria-hidden="true"></span><button id="portalTools" type="button" class="admin-tab ${activeView === 'portal' ? 'active' : ''}"><i class="fas fa-user-graduate"></i>Students &amp; elections</button></div></nav><main class="admin-main" id="adminMain"></main></div>`;
  document.querySelectorAll('[data-type]').forEach(button => button.onclick = () => { activeType = button.dataset.type; activeView = 'content'; editingId = null; dashboard(); });
  document.getElementById('portalTools').onclick = () => { activeView = 'portal'; dashboard(); };
  document.getElementById('logout').onclick = () => { sessionStorage.removeItem('goldHallAdmin'); login(); };
  activeView === 'portal' ? portalDashboard() : contentDashboard();
}

function contentDashboard() {
  const main = document.getElementById('adminMain');
  main.innerHTML = `<div class="admin-top"><div><h2>Manage ${labels[activeType]}</h2><p>Add, update, publish or remove public content.</p></div><button class="admin-btn secondary" id="resetContent">Restore sample content</button></div><div class="admin-grid"><section class="panel"><h3 id="formTitle">Add ${labels[activeType].slice(0,-1)}</h3><form class="editor-form" id="editorForm"><label>Title<input name="title" required></label><label>Description<textarea name="text" required></textarea></label><label>${activeType === 'gallery' ? 'Image URL' : activeType === 'events' ? 'Date and location' : 'Category or label'}<input name="meta"></label><label class="check-label"><input name="published" type="checkbox" checked> Publish on the website</label><button class="admin-btn">Save ${labels[activeType].slice(0,-1)}</button><button type="button" class="admin-btn secondary" id="cancelEdit" hidden>Cancel edit</button></form></section><section class="panel"><h3>Saved ${labels[activeType]}</h3><div id="contentList" class="content-list"></div></section></div>`;
  document.getElementById('resetContent').onclick = () => { if (confirm('Restore the original sample content?')) { GoldHallStore.reset(); contentDashboard(); } };
  document.getElementById('editorForm').onsubmit = saveContent;
  document.getElementById('cancelEdit').onclick = () => { editingId = null; contentDashboard(); };
  renderContentList();
}

function renderContentList() {
  const list = document.getElementById('contentList');
  const items = GoldHallStore.get(activeType);
  list.innerHTML = items.length ? items.map(item => `<article class="content-row"><div><h4>${safe(item.title)}</h4><p>${safe(item.meta)}</p><span class="status ${item.published ? '' : 'draft'}">${item.published ? 'Published' : 'Draft'}</span></div><div class="row-actions"><button title="Edit" data-edit="${safe(item.id)}"><i class="fas fa-pen"></i></button><button title="Delete" data-delete="${safe(item.id)}"><i class="fas fa-trash"></i></button></div></article>`).join('') : '<p>No content yet. Add your first item using the form.</p>';
  list.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => editContent(button.dataset.edit));
  list.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => { if (confirm('Delete this item?')) { GoldHallStore.remove(activeType, button.dataset.delete); renderContentList(); } });
}

function editContent(id) {
  const item = GoldHallStore.get(activeType).find(entry => entry.id === id);
  if (!item) return;
  editingId = id;
  const form = document.getElementById('editorForm');
  form.elements.title.value = item.title;
  form.elements.text.value = item.text;
  form.elements.meta.value = item.meta;
  form.elements.published.checked = item.published;
  document.getElementById('formTitle').textContent = `Edit ${labels[activeType].slice(0,-1)}`;
  document.getElementById('cancelEdit').hidden = false;
  form.scrollIntoView({ behavior: 'smooth' });
}

function saveContent(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  GoldHallStore.save(activeType, { id: editingId || `${activeType}-${Date.now()}`, title: values.get('title').trim(), text: values.get('text').trim(), meta: values.get('meta').trim(), published: values.get('published') === 'on' });
  editingId = null;
  contentDashboard();
}

function portalDashboard() {
  const main = document.getElementById('adminMain');
  const members = GoldHallPortal.students();
  const election = GoldHallPortal.election();
  const active = members.filter(member => member.accessStatus === 'active').length;
  const completed = members.length - active;
  const results = election.positions.map(position => {
    const tally = GoldHallPortal.results(position.id);
    const total = Object.values(tally).reduce((sum, count) => sum + count, 0);
    return `<div class="election-result-row"><div><strong>${safe(position.title)}</strong><small>${total} ballot${total === 1 ? '' : 's'}</small></div><div>${position.candidates.map(candidate => `<span>${safe(candidate)} <b>${tally[candidate] || 0}</b></span>`).join('')}</div></div>`;
  }).join('');
  main.innerHTML = `<div class="admin-top"><div><h2>Student Hub administration</h2><p>One administrator manages student access and free online polls.</p></div><span class="admin-preview-tag"><i class="fas fa-triangle-exclamation"></i> Browser-only preview</span></div>
    <div class="portal-stats"><div class="portal-stat"><span>Registered students</span><strong>${members.length}</strong></div><div class="portal-stat"><span>Active access</span><strong>${active}</strong></div><div class="portal-stat"><span>Completed studies</span><strong>${completed}</strong></div><div class="portal-stat"><span>Poll status</span><strong>${election.isOpen ? 'Open' : 'Closed'}</strong></div></div>
    <div class="portal-admin-grid"><section class="panel"><div class="panel-heading-row"><div><h3>Student accounts</h3><p>Mark a student completed to end access to the hub and polls.</p></div></div><div class="table-wrap"><table class="student-table"><thead><tr><th>Student</th><th>Programme / year</th><th>Hall / room</th><th>Access</th><th></th></tr></thead><tbody>${members.length ? members.map(member => `<tr><td><strong>${safe(member.fullName)}</strong><small>${safe(member.studentId)}</small>${member.studentEmail ? `<small class="member-email"><i class="fas fa-envelope"></i> ${safe(member.studentEmail)}</small>` : ''}${member.personalEmail ? `<small class="member-email personal"><i class="fas fa-envelope-open-text"></i> ${safe(member.personalEmail)}</small>` : ''}</td><td>${safe(member.programme)}<small>Year ${safe(member.year)}</small></td><td>${safe(member.hallStatus)}<small>${safe(member.room || '—')}</small></td><td><span class="member-status ${member.accessStatus === 'active' ? 'member-active' : 'member-complete'}">${member.accessStatus === 'active' ? 'Active' : 'Completed'}</span></td><td><button class="table-action ${member.accessStatus === 'active' ? 'mark-complete' : ''}" data-status="${safe(member.studentId)}" data-next="${member.accessStatus === 'active' ? 'completed' : 'active'}">${member.accessStatus === 'active' ? 'Mark complete' : 'Restore access'}</button></td></tr>`).join('') : '<tr><td colspan="5" class="empty-table">No student accounts registered yet.</td></tr>'}</tbody></table></div></section>
    <section class="panel"><h3>Election & poll setup</h3><p class="portal-help">One poll per line. Use <code>Position | Candidate One, Candidate Two</code>. At least two candidates per position.</p><form class="editor-form" id="electionForm"><label>Poll title<input name="title" value="${safe(election.title)}" required maxlength="100"></label><label>Positions and candidates<textarea name="positions" required rows="9">${election.positions.map(position => `${position.title} | ${position.candidates.join(', ')}`).join('\n')}</textarea></label><label class="check-label"><input name="isOpen" type="checkbox" ${election.isOpen ? 'checked' : ''}> Voting is open</label><button class="admin-btn">Save poll setup</button><p class="form-feedback" id="electionFeedback" role="status"></p></form></section></div>
    <section class="panel election-results-panel"><div class="panel-heading-row"><div><h3>Poll results</h3><p>Live tally from ballots saved in this browser.</p></div></div><div class="election-results">${results}</div></section>
    <p class="admin-security-note"><i class="fas fa-circle-info"></i> This preview stores student records, password hashes and votes in each browser. The demo sign-in is not real identity verification; do not use it for sensitive student data or official elections without a backend, verified university accounts, server-side vote controls and secure administration.</p>`;
  main.querySelectorAll('[data-status]').forEach(button => button.onclick = () => {
    const accessStatus = button.dataset.next;
    if (accessStatus === 'completed' && !confirm(`Mark ${button.dataset.status} as completed and revoke Student Hub access?`)) return;
    GoldHallPortal.updateStudent(button.dataset.status, { accessStatus, completedAt: accessStatus === 'completed' ? new Date().toISOString() : null });
    portalDashboard();
  });
  document.getElementById('electionForm').onsubmit = saveElection;
}

function saveElection(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const lines = String(values.get('positions')).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const positions = [];
  for (const line of lines) {
    const separator = line.indexOf('|');
    if (separator < 1) { document.getElementById('electionFeedback').textContent = 'Use one line per poll: Position | Candidate One, Candidate Two'; return; }
    const title = line.slice(0, separator).trim();
    const candidates = line.slice(separator + 1).split(',').map(candidate => candidate.trim()).filter(Boolean);
    if (!title || candidates.length < 2) { document.getElementById('electionFeedback').textContent = 'Each position needs a title and at least two candidate names.'; return; }
    if (positions.some(position => position.title.toLowerCase() === title.toLowerCase())) { document.getElementById('electionFeedback').textContent = `The position “${title}” appears more than once.`; return; }
    positions.push({ title, candidates });
  }
  if (!positions.length) { document.getElementById('electionFeedback').textContent = 'Add at least one poll position.'; return; }
  GoldHallPortal.saveElection({ title: values.get('title').trim(), isOpen: values.get('isOpen') === 'on', positions });
  portalDashboard();
}

if (sessionStorage.getItem('goldHallAdmin') === 'true') dashboard(); else login();
