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

const metaField = {
  news: { label: 'Category or label', placeholder: 'e.g. Achievement' },
  events: { label: 'Date and location', placeholder: 'e.g. 14 February · Main Hall' },
  gallery: { label: 'Caption (optional)', placeholder: 'e.g. Main entrance at sunset' },
  documents: { label: 'Category or label', placeholder: 'e.g. Policy' }
};
const linkField = {
  news: { label: 'Read-more link', placeholder: 'https://… leave empty to link to the News page' },
  events: { label: 'Event link', placeholder: 'https://… ticket, map or meeting link (optional)' },
  gallery: { label: 'Picture link', placeholder: 'https://… picture address (optional)' },
  documents: { label: 'Document link', placeholder: 'https://… download or view link (optional)' }
};

/* the picture can come from an upload or from a link — never from a picture ID */
let pictureData = '';
let uploadedPicture = '';
let pictureLabel = '';

function pictureFieldMarkup() {
  return `<fieldset class="upload-field">
    <legend>Picture</legend>
    <p class="field-help">Upload a picture from your device <strong>or</strong> paste a picture link. There is no picture ID to remember.</p>
    <label class="upload-drop" id="uploadDrop" for="pictureFile">
      <i class="fas fa-cloud-arrow-up"></i>
      <span><strong>Choose a picture to upload</strong><small>PNG, JPG, WEBP or GIF · up to 6 MB · you can also drop the file here</small></span>
    </label>
    <input id="pictureFile" type="file" accept="image/*" hidden>
    <label>Picture link<input name="pictureLink" id="pictureLink" type="url" placeholder="${linkField[activeType].placeholder}"></label>
    <div class="upload-preview" id="uploadPreview" hidden>
      <img id="uploadPreviewImg" alt="Picture preview">
      <div class="upload-preview-text"><strong id="uploadPreviewTitle">No picture chosen</strong><small id="uploadPreviewMeta"></small></div>
      <button type="button" class="admin-btn secondary" id="removePicture"><i class="fas fa-xmark"></i> Remove</button>
    </div>
    <p class="upload-feedback" id="uploadFeedback" role="status" aria-live="polite"></p>
  </fieldset>`;
}

function formatSize(length) {
  const kb = Math.round(length / 1024);
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

function renderPicturePreview() {
  const wrap = document.getElementById('uploadPreview');
  const image = document.getElementById('uploadPreviewImg');
  const title = document.getElementById('uploadPreviewTitle');
  const meta = document.getElementById('uploadPreviewMeta');
  if (!wrap) return;
  if (!pictureData) {
    wrap.hidden = true;
    image.removeAttribute('src');
    return;
  }
  wrap.hidden = false;
  image.src = pictureData;
  title.textContent = pictureLabel || 'Picture';
  meta.textContent = pictureData.startsWith('data:') ? `Uploaded from your device · about ${formatSize(pictureData.length)}` : pictureData;
}

function readPicture(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('Please choose a picture file (PNG, JPG, WEBP or GIF).')); return; }
    if (file.size > 6 * 1024 * 1024) { reject(new Error('That picture is larger than 6 MB. Please choose a smaller file.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('That picture could not be read. Please try another file.'));
    reader.onload = () => {
      const raw = String(reader.result);
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') { resolve(raw); return; }
      const image = new Image();
      image.onload = () => resolve(shrinkPicture(image, file.type));
      image.onerror = () => resolve(raw);
      image.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

/* keep uploaded pictures small so the preview stays light and storage does not fill up */
function shrinkPicture(image, type) {
  const max = 1280;
  const naturalWidth = image.naturalWidth || max;
  const naturalHeight = image.naturalHeight || max;
  const scale = Math.min(1, max / Math.max(naturalWidth, naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(naturalHeight * scale));
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let result = type === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.82);
  if (result.length > 700000) result = canvas.toDataURL('image/jpeg', 0.72);
  return result;
}

async function usePicture(file) {
  const feedback = document.getElementById('uploadFeedback');
  try {
    feedback.className = 'upload-feedback';
    feedback.textContent = 'Preparing your picture…';
    const dataUrl = await readPicture(file);
    uploadedPicture = dataUrl;
    pictureData = dataUrl;
    pictureLabel = 'Uploaded picture';
    document.getElementById('pictureLink').value = '';
    renderPicturePreview();
    feedback.className = 'upload-feedback ok';
    feedback.textContent = `Picture ready (${formatSize(dataUrl.length)}). It is saved when you press Save.`;
  } catch (error) {
    feedback.className = 'upload-feedback';
    feedback.textContent = error.message;
  }
}

function bindPictureField() {
  const fileInput = document.getElementById('pictureFile');
  const linkInput = document.getElementById('pictureLink');
  const drop = document.getElementById('uploadDrop');
  const remove = document.getElementById('removePicture');

  linkInput.addEventListener('input', () => {
    const value = linkInput.value.trim();
    if (value) { pictureData = value; pictureLabel = 'Picture from link'; }
    else if (uploadedPicture) { pictureData = uploadedPicture; pictureLabel = 'Uploaded picture'; }
    else { pictureData = ''; pictureLabel = ''; }
    document.getElementById('uploadFeedback').textContent = '';
    renderPicturePreview();
  });
  fileInput.addEventListener('change', () => { if (fileInput.files?.[0]) usePicture(fileInput.files[0]); });
  remove.addEventListener('click', () => {
    pictureData = ''; uploadedPicture = ''; pictureLabel = '';
    linkInput.value = '';
    document.getElementById('uploadFeedback').textContent = '';
    renderPicturePreview();
  });
  ['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.remove('dragging'); }));
  drop.addEventListener('drop', event => { const file = event.dataTransfer?.files?.[0]; if (file) usePicture(file); });
  renderPicturePreview();
}

function contentDashboard() {
  const main = document.getElementById('adminMain');
  const meta = metaField[activeType];
  const link = linkField[activeType];
  main.innerHTML = `<div class="admin-top"><div><h2>Manage ${labels[activeType]}</h2><p>Add, update, publish or remove public content.</p></div><button class="admin-btn secondary" id="resetContent">Restore sample content</button></div><div class="admin-grid"><section class="panel"><h3 id="formTitle">Add ${labels[activeType].slice(0,-1)}</h3><form class="editor-form" id="editorForm"><label>Title<input name="title" required></label><label>Description<textarea name="text" required></textarea></label><label>${meta.label}<input name="meta" placeholder="${meta.placeholder}"></label><label>${link.label}<input name="link" type="url" placeholder="${link.placeholder}"><span class="field-help">The button on the website opens this address. Leave it empty to keep the default page link.</span></label>${pictureFieldMarkup()}<label class="check-label"><input name="published" type="checkbox" checked> Publish on the website</label><p class="upload-feedback" id="saveFeedback" role="status" aria-live="polite"></p><button class="admin-btn">Save ${labels[activeType].slice(0,-1)}</button><button type="button" class="admin-btn secondary" id="cancelEdit" hidden>Cancel edit</button></form></section><section class="panel"><h3>Saved ${labels[activeType]}</h3><div id="contentList" class="content-list"></div></section></div>`;
  document.getElementById('resetContent').onclick = () => { if (confirm('Restore the original sample content?')) { GoldHallStore.reset(); editingId = null; pictureData = ''; uploadedPicture = ''; contentDashboard(); } };
  document.getElementById('editorForm').onsubmit = saveContent;
  document.getElementById('cancelEdit').onclick = () => { editingId = null; pictureData = ''; uploadedPicture = ''; contentDashboard(); };
  bindPictureField();
  renderContentList();
}

function renderContentList() {
  const list = document.getElementById('contentList');
  const items = GoldHallStore.get(activeType);
  list.innerHTML = items.length ? items.map(item => `<article class="content-row">
      <div class="content-row-main">
        ${item.image ? `<img class="content-thumb" src="${safe(item.image)}" alt="">` : ''}
        <div>
          <h4>${safe(item.title)}</h4>
          ${item.meta ? `<p>${safe(item.meta)}</p>` : ''}
          ${item.link ? `<p class="content-row-link"><i class="fas fa-link"></i> ${safe(item.link)}</p>` : ''}
          <span class="status ${item.published ? '' : 'draft'}">${item.published ? 'Published' : 'Draft'}</span>
        </div>
      </div>
      <div class="row-actions"><button title="Edit" data-edit="${safe(item.id)}"><i class="fas fa-pen"></i></button><button title="Delete" data-delete="${safe(item.id)}"><i class="fas fa-trash"></i></button></div>
    </article>`).join('') : '<p>No content yet. Add your first item using the form.</p>';
  list.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => editContent(button.dataset.edit));
  list.querySelectorAll('[data-delete]').forEach(button => button.onclick = () => { if (confirm('Delete this item?')) { GoldHallStore.remove(activeType, button.dataset.delete); renderContentList(); } });
}

function editContent(id) {
  const item = GoldHallStore.get(activeType).find(entry => entry.id === id);
  if (!item) return;
  editingId = id;
  pictureData = item.image || '';
  uploadedPicture = pictureData.startsWith('data:') ? pictureData : '';
  pictureLabel = pictureData ? (uploadedPicture ? 'Uploaded picture' : 'Picture from link') : '';
  const form = document.getElementById('editorForm');
  form.elements.title.value = item.title;
  form.elements.text.value = item.text;
  form.elements.meta.value = item.meta || '';
  form.elements.link.value = item.link || '';
  form.elements.pictureLink.value = uploadedPicture ? '' : pictureData;
  form.elements.published.checked = item.published;
  document.getElementById('formTitle').textContent = `Edit ${labels[activeType].slice(0,-1)}`;
  document.getElementById('cancelEdit').hidden = false;
  renderPicturePreview();
  form.scrollIntoView({ behavior: 'smooth' });
}

/* allow friendly entries such as example.com or documents/hall.pdf */
function normalizeLink(value) {
  const link = String(value || '').trim();
  if (!link) return '';
  if (/^(javascript|data|vbscript):/i.test(link)) return '';
  if (/^(https?:|mailto:|tel:|\/|#|\.)/i.test(link)) return link;
  if (/^[\w.-]+\.(html?|pdf|docx?|xlsx?|pptx?)$/i.test(link)) return link;
  return `https://${link}`;
}

function saveContent(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const feedback = document.getElementById('saveFeedback');
  const saved = GoldHallStore.save(activeType, {
    id: editingId || `${activeType}-${Date.now()}`,
    title: String(values.get('title')).trim(),
    text: String(values.get('text')).trim(),
    meta: String(values.get('meta') || '').trim(),
    link: normalizeLink(values.get('link')),
    image: pictureData,
    published: values.get('published') === 'on'
  });
  if (!saved) {
    feedback.textContent = 'Could not save: this browser’s storage is full. Remove an item or upload a smaller picture.';
    return;
  }
  editingId = null;
  pictureData = '';
  uploadedPicture = '';
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
