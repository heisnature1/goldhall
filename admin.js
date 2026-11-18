const app = document.getElementById('adminApp');
const labels = {
  executives: 'Executives',
  events: 'Events',
  gallery: 'Gallery',
  scholarships: 'Scholarships',
  internships: 'Internships'
};
const icons = {
  executives: 'fa-users',
  events: 'fa-calendar-days',
  gallery: 'fa-image',
  scholarships: 'fa-award',
  internships: 'fa-briefcase'
};
let activeType = 'executives';
let activeView = 'content'; // 'content' | 'portal' | 'grievances'
let editingId = null;

// Grievance admin view filters
let grievanceStatusFilter = 'all';
let grievanceCategoryFilter = 'all';
let grievancePriorityFilter = 'all';
let grievanceSearchQuery = '';

const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

function dashboard() {
  const contentButtons = Object.keys(labels).map(type => `<button type="button" data-type="${type}" class="admin-tab ${activeView === 'content' && type === activeType ? 'active' : ''}"><i class="fas ${icons[type]}"></i>${labels[type]}</button>`).join('');

  /* The pending-grievance count now comes from the database. The shell renders
     first and the badge fills in when it arrives: waiting for it would stall
     the whole portal behind one request. */
  const pendingSlot = `<span class="admin-badge-count" id="pendingGrievanceBadge" hidden></span>`;

  app.innerHTML = `<div class="admin-shell">
    <header class="admin-topbar">
      <div class="admin-topbar-inner">
        <div class="admin-brand">
          <img src="assets/logo/gold-refinery-hall-logo.png" alt="Gold Refinery Hall logo">
          <div class="admin-brand-text">
            <h1>Gold Refinery Hall</h1>
            <p>Single administrator · Preview</p>
          </div>
        </div>
        <div class="admin-top-actions">
          <a class="admin-site-link" href="index.php"><i class="fas fa-house"></i> View website</a>
          <a class="admin-site-link" href="dashboard.php" target="_blank"><i class="fas fa-user-graduate"></i> Student Hub preview</a>
          <button id="logout" type="button"><i class="fas fa-right-from-bracket"></i>Sign out</button>
        </div>
      </div>
    </header>
    <nav class="admin-tabbar" aria-label="Admin sections">
      <div class="admin-tabbar-inner">
        ${contentButtons}
        <span class="admin-tab-sep" aria-hidden="true"></span>
        <button id="portalTools" type="button" class="admin-tab ${activeView === 'portal' ? 'active' : ''}"><i class="fas fa-user-graduate"></i>Students &amp; polls</button>
        <button id="grievanceTools" type="button" class="admin-tab ${activeView === 'grievances' ? 'active' : ''}"><i class="fas fa-clipboard-question"></i>Grievance desk ${pendingSlot}</button>
      </div>
    </nav>
    <main class="admin-main" id="adminMain"></main>
  </div>`;

  document.querySelectorAll('[data-type]').forEach(button => button.onclick = () => {
    activeType = button.dataset.type;
    activeView = 'content';
    editingId = null;
    dashboard();
  });
  document.getElementById('portalTools').onclick = () => { activeView = 'portal'; dashboard(); };
  document.getElementById('grievanceTools').onclick = () => { activeView = 'grievances'; dashboard(); };
  document.getElementById('logout').onclick = () => {
    /* The session lives in PHP, so signing out is a POST, not a local flag. */
    const form = document.getElementById('adminSignOut');
    if (form) form.submit();
  };

  if (typeof GoldHallPortal !== 'undefined') {
    GoldHallPortal.pendingGrievancesCount().then(count => {
      const badge = document.getElementById('pendingGrievanceBadge');
      if (!badge) return;
      badge.textContent = count > 0 ? String(count) : '';
      badge.hidden = !(count > 0);
    }).catch(() => {});
  }

  if (activeView === 'portal') portalDashboard();
  else if (activeView === 'grievances') grievancesDashboard();
  else contentDashboard();
}

const metaField = {
  executives: { label: 'Position or role', placeholder: 'e.g. President of Goldhall' },
  events: { label: 'Date and location', placeholder: 'e.g. 14 February · Main Hall' },
  gallery: { label: 'Caption or album (optional)', placeholder: 'e.g. Freshers’ Akwaaba' },
  scholarships: { label: 'Category, eligibility or deadline', placeholder: 'e.g. Government Funding · Deadline: 30 Nov' },
  internships: { label: 'Field, industry or eligibility', placeholder: 'e.g. Engineering & Mining · Vacation Trainee' }
};

const linkField = {
  executives: { label: 'Profile link (optional)', placeholder: 'https://… email, LinkedIn or bio link' },
  events: { label: 'Event link', placeholder: 'https://… ticket, map or meeting link (optional)' },
  gallery: { label: 'Picture link', placeholder: 'https://… picture address (optional)' },
  scholarships: { label: 'Application or scholarship website link', placeholder: 'https://scholarships.gov.gh/' },
  internships: { label: 'Application or listings link', placeholder: 'https://www.linkedin.com/jobs/...' }
};

/* the picture can come from an upload or from a link — never from a picture ID */
let pictureData = '';
let uploadedPicture = '';
let pictureLabel = '';

function pictureFieldMarkup() {
  return `<fieldset class="upload-field">
    <legend>Picture or banner (optional)</legend>
    <p class="field-help" id="pictureHelp">Upload a picture from your device <strong>or</strong> paste a picture link. Displayed on cards and resource listings.</p>
    <label class="upload-drop" id="uploadDrop" for="pictureFile">
      <i class="fas fa-cloud-arrow-up"></i>
      <span><strong>Choose a picture to upload</strong><small>PNG, JPG, WEBP or GIF · up to 6 MB · you can also drop the file here</small></span>
    </label>
    <input id="pictureFile" type="file" accept="image/*" hidden>
    <label>Picture link<input name="pictureLink" id="pictureLink" type="url" placeholder="${linkField[activeType]?.placeholder || 'https://… image URL'}"></label>
    <label>Picture framing<span class="field-help">Choose which part of the picture stays visible when it is cropped to fit a card.</span>
      <select name="picturePosition" id="picturePosition">
        <option value="50% 0%">Top — head near the top edge</option>
        <option value="50% 50%" selected>Centre — recommended for portraits</option>
        <option value="50% 100%">Bottom</option>
      </select>
    </label>
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
  const meta = metaField[activeType] || { label: 'Category or label', placeholder: 'e.g. Details' };
  const link = linkField[activeType] || { label: 'Website link', placeholder: 'https://…' };
  const singular = labels[activeType].endsWith('s') ? labels[activeType].slice(0, -1) : labels[activeType];

  main.innerHTML = `<div class="admin-top">
    <div>
      <h2>Manage ${labels[activeType]}</h2>
      <p>Add, update, link, publish or remove ${labels[activeType].toLowerCase()} visible to hall students.</p>
    </div>
    <button class="admin-btn secondary" id="resetContent"><i class="fas fa-rotate-left"></i> Restore sample content</button>
  </div>
  <div class="admin-grid">
    <section class="panel">
      <h3 id="formTitle">Add ${singular}</h3>
      ${activeType === 'gallery' ? `<p class="field-help gallery-hint"><i class="fas fa-circle-info"></i> Add photos of what is going on at the hall — freshers’ welcome, hall week, sports, projects and everyday life. Published photos appear on the home page and the Gallery page.</p>` : ''}
      <form class="editor-form" id="editorForm">
        <label>Title<input name="title" required placeholder="e.g. Official Programme or Organisation Name"></label>
        <label>Description / Details<textarea name="text" required placeholder="Describe what the opportunity offers, eligibility criteria, coverage or important instructions..."></textarea></label>
        <label>${meta.label}<input name="meta" placeholder="${meta.placeholder}"></label>
        <label>${link.label}<input name="link" type="url" placeholder="${link.placeholder}"><span class="field-help">The button on the student hub opens this address. Paste full link (https://...).</span></label>
        <label>Button / action label (optional)<input name="label" placeholder="e.g. Apply on Official Portal (defaults to 'Apply / Visit Site')"><span class="field-help">Custom text for the action button on the student hub.</span></label>
        ${pictureFieldMarkup()}
        <label class="check-label"><input name="published" type="checkbox" checked> Publish immediately on the Student Hub &amp; site</label>
        <p class="upload-feedback" id="saveFeedback" role="status" aria-live="polite"></p>
        <div style="display:flex;gap:10px;align-items:center;margin-top:6px">
          <button class="admin-btn" type="submit"><i class="fas fa-floppy-disk"></i> Save ${singular}</button>
          <button type="button" class="admin-btn secondary" id="cancelEdit" hidden>Cancel edit</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <h3>Saved ${labels[activeType]} (${GoldHallStore.get(activeType).length})</h3>
      <div id="contentList" class="content-list"></div>
    </section>
  </div>`;

  document.getElementById('resetContent').onclick = () => {
    alert('Content now lives on the server in data/content.json. To restore the sample content, delete that file on the server and reload — it will be recreated from includes/seed-content.php.');
  };
  document.getElementById('editorForm').onsubmit = saveContent;
  document.getElementById('cancelEdit').onclick = () => {
    editingId = null;
    pictureData = '';
    uploadedPicture = '';
    contentDashboard();
  };
  bindPictureField();
  renderContentList();
}

function renderContentList() {
  const list = document.getElementById('contentList');
  const items = GoldHallStore.get(activeType);
  list.innerHTML = items.length ? items.map(item => `<article class="content-row">
      <div class="content-row-main">
        ${item.image ? `<img class="content-thumb" src="${safe(item.image)}" alt="" style="object-position:${safe(item.position || '50% 50%')}">` : `<div class="content-thumb-placeholder"><i class="fas ${icons[activeType]}"></i></div>`}
        <div>
          <h4>${safe(item.title)}</h4>
          ${item.meta ? `<p class="content-row-meta"><i class="fas fa-tag"></i> ${safe(item.meta)}</p>` : ''}
          <p class="content-row-snippet">${safe(item.text).slice(0, 110)}${item.text && item.text.length > 110 ? '…' : ''}</p>
          ${item.link ? `<p class="content-row-link"><i class="fas fa-link"></i> <a href="${safe(item.link)}" target="_blank" rel="noopener">${safe(item.label || item.link)}</a></p>` : ''}
          <span class="status ${item.published ? '' : 'draft'}">${item.published ? 'Published' : 'Draft'}</span>
        </div>
      </div>
      <div class="row-actions">
        <button title="Edit" data-edit="${safe(item.id)}"><i class="fas fa-pen"></i></button>
        <button title="Delete" data-delete="${safe(item.id)}"><i class="fas fa-trash"></i></button>
      </div>
    </article>`).join('') : '<p class="empty-list-note">No items saved yet. Use the form on the left to add your first entry.</p>';

  list.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => editContent(button.dataset.edit));
  list.querySelectorAll('[data-delete]').forEach(button => button.onclick = async () => {
    if (!confirm('Delete this item? It will be removed from the site and the Student Hub.')) return;
    const body = new FormData();
    body.set('type', activeType);
    body.set('id', button.dataset.delete);
    try {
      await adminRequest('delete', body);
      await GoldHallStore.ready();
      renderContentList();
    } catch (error) {
      alert(`Could not delete: ${error.message}`);
    }
  });
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
  if (form.elements.label) form.elements.label.value = item.label || '';
  form.elements.pictureLink.value = uploadedPicture ? '' : pictureData;
  if (form.elements.picturePosition) form.elements.picturePosition.value = item.position || '50% 50%';
  form.elements.published.checked = item.published;
  const singular = labels[activeType].endsWith('s') ? labels[activeType].slice(0, -1) : labels[activeType];
  document.getElementById('formTitle').textContent = `Edit ${singular}`;
  document.getElementById('cancelEdit').hidden = false;
  renderPicturePreview();
  form.scrollIntoView({ behavior: 'smooth' });
}

function normalizeLink(value) {
  const link = String(value || '').trim();
  if (!link) return '';
  if (/^(javascript|data|vbscript):/i.test(link)) return '';
  if (/^(https?:|mailto:|tel:|\/|#|\.)/i.test(link)) return link;
  if (/^[\w.-]+\.(html?|pdf|docx?|xlsx?|pptx?)$/i.test(link)) return link;
  return `https://${link}`;
}

/* The server owns the content; these helpers talk to api/admin-content.php. */
async function adminRequest(action, body) {
  const form = body instanceof FormData ? body : new FormData();
  form.set('action', action);
  const response = await fetch('api/admin-content.php', {
    method: 'POST',
    body: form,
    headers: { Accept: 'application/json' },
    credentials: 'same-origin'
  });
  let payload = null;
  try { payload = await response.json(); } catch (_) { payload = null; }
  if (!response.ok || !payload || payload.error) {
    throw new Error((payload && payload.error) || `Request failed (${response.status}).`);
  }
  return payload;
}

async function saveContent(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const feedback = document.getElementById('saveFeedback');
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  const item = {
    type: activeType,
    id: editingId || `${activeType}-${Date.now()}`,
    title: String(values.get('title')).trim(),
    text: String(values.get('text')).trim(),
    meta: String(values.get('meta') || '').trim(),
    link: normalizeLink(values.get('link')),
    label: String(values.get('label') || '').trim(),
    image: pictureData,
    position: String(values.get('picturePosition') || '50% 50%'),
    published: values.get('published') === 'on'
  };

  if (submit) submit.disabled = true;
  if (feedback) feedback.textContent = 'Saving…';

  const body = new FormData();
  body.set('type', activeType);
  body.set('item', JSON.stringify(item));

  try {
    await adminRequest('save', body);
  } catch (error) {
    if (feedback) feedback.textContent = `Could not save: ${error.message}`;
    if (submit) submit.disabled = false;
    return;
  }

  if (submit) submit.disabled = false;
  if (feedback) feedback.textContent = '';
  editingId = null;
  pictureData = '';
  uploadedPicture = '';
  await GoldHallStore.ready();
  contentDashboard();
}

/* ==========================================================================
   PORTAL DASHBOARD — Students, Access & Elections
   ========================================================================== */
async function portalDashboard() {
  const main = document.getElementById('adminMain');
  main.innerHTML = '<p class="admin-loading">Loading students and polls…</p>';

  const members = await GoldHallPortal.students();
  const election = await GoldHallPortal.election();
  const active = members.filter(member => member.accessStatus === 'active').length;
  const completed = members.length - active;

  const tallies = await Promise.all(election.positions.map(position => GoldHallPortal.results(position.id)));
  const results = election.positions.map((position, index) => {
    const tally = tallies[index] || {};
    const total = Object.values(tally).reduce((sum, count) => sum + count, 0);
    return `<div class="election-result-row">
      <div><strong>${safe(position.title)}</strong><small>${total} ballot${total === 1 ? '' : 's'}</small></div>
      <div>${position.candidates.map(candidate => `<span>${safe(candidate)} <b>${tally[candidate] || 0}</b></span>`).join('')}</div>
    </div>`;
  }).join('');

  main.innerHTML = `<div class="admin-top">
    <div>
      <h2>Student Hub &amp; Polls Administration</h2>
      <p>Manage enrolled student access records and free student poll positions.</p>
    </div>
    <span class="admin-preview-tag"><i class="fas fa-database"></i> Stored in your database</span>
  </div>
  <div class="portal-stats">
    <div class="portal-stat"><span>Registered students</span><strong>${members.length}</strong></div>
    <div class="portal-stat"><span>Active access</span><strong>${active}</strong></div>
    <div class="portal-stat"><span>Completed studies</span><strong>${completed}</strong></div>
    <div class="portal-stat"><span>Poll status</span><strong>${election.isOpen ? 'Open' : 'Closed'}</strong></div>
  </div>
  <div class="portal-admin-grid">
    <section class="panel">
      <div class="panel-heading-row">
        <div>
          <h3>Student accounts</h3>
          <p>Mark a student completed when they graduate or finish school to revoke access to the hub and polls.</p>
        </div>
      </div>
      <div class="table-wrap">
        <table class="student-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Programme / Level</th>
              <th>Hall / Room</th>
              <th>Access</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${members.length ? members.map(member => `<tr>
              <td>
                <strong>${safe(member.fullName)}</strong>
                <small>${safe(member.studentId)}</small>
                ${member.studentEmail ? `<small class="member-email"><i class="fas fa-envelope"></i> ${safe(member.studentEmail)}</small>` : ''}
                ${member.personalEmail ? `<small class="member-email personal"><i class="fas fa-envelope-open-text"></i> ${safe(member.personalEmail)}</small>` : ''}
              </td>
              <td>
                ${safe(member.programme)}
                <small><i class="fas fa-layer-group"></i> Level ${safe(member.year)}</small>
              </td>
              <td>
                ${safe(member.hallStatus)}
                <small>${safe(member.room || '—')}</small>
              </td>
              <td>
                <span class="member-status ${member.accessStatus === 'active' ? 'member-active' : 'member-complete'}">
                  ${member.accessStatus === 'active' ? 'Active' : 'Completed'}
                </span>
              </td>
              <td>
                <button class="table-action ${member.accessStatus === 'active' ? 'mark-complete' : ''}" data-status="${safe(member.studentId)}" data-next="${member.accessStatus === 'active' ? 'completed' : 'active'}">
                  ${member.accessStatus === 'active' ? '<i class="fas fa-ban"></i> Mark complete' : '<i class="fas fa-rotate-left"></i> Restore access'}
                </button>
              </td>
            </tr>`).join('') : '<tr><td colspan="5" class="empty-table">No student accounts registered yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <h3>Election &amp; poll setup</h3>
      <p class="portal-help">One poll per line. Use <code>Position | Candidate One, Candidate Two</code>. At least two candidates per position.</p>
      <form class="editor-form" id="electionForm">
        <label>Poll title<input name="title" value="${safe(election.title)}" required maxlength="100"></label>
        <label>Positions and candidates<textarea name="positions" required rows="9">${election.positions.map(position => `${position.title} | ${position.candidates.join(', ')}`).join('\n')}</textarea></label>
        <label class="check-label"><input name="isOpen" type="checkbox" ${election.isOpen ? 'checked' : ''}> Voting is open</label>
        <button class="admin-btn"><i class="fas fa-floppy-disk"></i> Save poll setup</button>
        <p class="form-feedback" id="electionFeedback" role="status"></p>
      </form>
    </section>
  </div>
  <section class="panel election-results-panel">
    <div class="panel-heading-row">
      <div>
        <h3>Live poll results</h3>
        <p>Live tally from every ballot stored in the database.</p>
      </div>
    </div>
    <div class="election-results">${results}</div>
  </section>
  <p class="admin-security-note"><i class="fas fa-circle-info"></i> Sign-in is real: accounts are held by Supabase Auth, and passwords never reach this site. Student records, grievances and ballots are stored in your Supabase database, so a student who registers on their phone appears here, and their grievance reaches this desk. Ballots are unique per student and position, enforced by the database, so a vote cannot be cast twice by clearing a browser.</p>`;

  main.querySelectorAll('[data-status]').forEach(button => button.onclick = async () => {
    const accessStatus = button.dataset.next;
    if (accessStatus === 'completed' && !confirm(`Mark ${button.dataset.status} as completed and revoke Student Hub access?`)) return;
    button.disabled = true;
    await GoldHallPortal.updateStudent(button.dataset.status, { accessStatus, completedAt: accessStatus === 'completed' ? new Date().toISOString() : null });
    portalDashboard();
  });
  document.getElementById('electionForm').onsubmit = saveElection;
}

async function saveElection(event) {
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
  try {
    await GoldHallPortal.saveElection({ title: values.get('title').trim(), isOpen: values.get('isOpen') === 'on', positions });
  } catch (error) {
    document.getElementById('electionFeedback').textContent = error?.message || 'Could not save the poll.';
    return;
  }
  portalDashboard();
}

/* ==========================================================================
   GRIEVANCES & COMPLAINTS DESK — Admin Management & Actions
   ========================================================================== */
async function grievancesDashboard() {
  const main = document.getElementById('adminMain');
  main.innerHTML = '<p class="admin-loading">Loading grievances…</p>';
  const allGrievances = await GoldHallPortal.grievances();

  const counts = {
    all: allGrievances.length,
    pending: allGrievances.filter(g => g.status === 'pending').length,
    inProgress: allGrievances.filter(g => g.status === 'in-progress').length,
    resolved: allGrievances.filter(g => g.status === 'resolved').length,
    closed: allGrievances.filter(g => g.status === 'closed').length
  };

  // Filter list
  let filtered = allGrievances.filter(g => {
    if (grievanceStatusFilter !== 'all' && g.status !== grievanceStatusFilter) return false;
    if (grievancePriorityFilter !== 'all' && g.priority !== grievancePriorityFilter) return false;
    if (grievanceCategoryFilter !== 'all' && g.category !== grievanceCategoryFilter) return false;
    if (grievanceSearchQuery) {
      const q = grievanceSearchQuery.toLowerCase();
      const match = (g.id || '').toLowerCase().includes(q) ||
                    (g.subject || '').toLowerCase().includes(q) ||
                    (g.description || '').toLowerCase().includes(q) ||
                    (g.studentName || '').toLowerCase().includes(q) ||
                    (g.studentId || '').toLowerCase().includes(q) ||
                    (g.location || '').toLowerCase().includes(q) ||
                    (g.room || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const categories = [
    'Room Maintenance & Electrical',
    'Water & Plumbing Issues',
    'Sanitation & Waste Disposal',
    'Security & Safety Concerns',
    'Hall Amenities & Wi-Fi',
    'Noise & Resident Conflict',
    'Student Welfare & Health',
    'Hall Fees & Administrative',
    'General Hall Matter'
  ];

  main.innerHTML = `<div class="admin-top">
    <div>
      <h2>Student Grievance &amp; Complaint Desk</h2>
      <p>Review student complaints, assign maintenance officers, record official actions and update resolutions.</p>
    </div>
    <div style="display:flex;gap:10px">
      <button class="admin-btn secondary" id="resetGrievances"><i class="fas fa-rotate-left"></i> Reset sample complaints</button>
    </div>
  </div>

  <div class="portal-stats">
    <div class="portal-stat"><span>Total complaints</span><strong>${counts.all}</strong></div>
    <div class="portal-stat" style="border-left:3px solid #e6a117"><span>Pending review</span><strong style="color:#b78103">${counts.pending}</strong></div>
    <div class="portal-stat" style="border-left:3px solid #2980b9"><span>In progress</span><strong style="color:#1b6ca8">${counts.inProgress}</strong></div>
    <div class="portal-stat" style="border-left:3px solid #27ae60"><span>Resolved / closed</span><strong style="color:#228c4e">${counts.resolved + counts.closed}</strong></div>
  </div>

  <div class="admin-filter-bar">
    <div class="admin-filter-tabs">
      <button type="button" class="admin-filter-btn ${grievanceStatusFilter === 'all' ? 'active' : ''}" data-status-filter="all">All (${counts.all})</button>
      <button type="button" class="admin-filter-btn ${grievanceStatusFilter === 'pending' ? 'active' : ''}" data-status-filter="pending">Pending (${counts.pending})</button>
      <button type="button" class="admin-filter-btn ${grievanceStatusFilter === 'in-progress' ? 'active' : ''}" data-status-filter="in-progress">In Progress (${counts.inProgress})</button>
      <button type="button" class="admin-filter-btn ${grievanceStatusFilter === 'resolved' ? 'active' : ''}" data-status-filter="resolved">Resolved (${counts.resolved})</button>
      <button type="button" class="admin-filter-btn ${grievanceStatusFilter === 'closed' ? 'active' : ''}" data-status-filter="closed">Closed (${counts.closed})</button>
    </div>
    <div class="admin-filter-controls">
      <select id="categoryFilter" aria-label="Filter by category">
        <option value="all">All Categories</option>
        ${categories.map(c => `<option value="${safe(c)}" ${grievanceCategoryFilter === c ? 'selected' : ''}>${safe(c)}</option>`).join('')}
      </select>
      <select id="priorityFilter" aria-label="Filter by priority">
        <option value="all" ${grievancePriorityFilter === 'all' ? 'selected' : ''}>All Priorities</option>
        <option value="urgent" ${grievancePriorityFilter === 'urgent' ? 'selected' : ''}>Urgent / Emergency</option>
        <option value="high" ${grievancePriorityFilter === 'high' ? 'selected' : ''}>High Priority</option>
        <option value="normal" ${grievancePriorityFilter === 'normal' ? 'selected' : ''}>Normal / Routine</option>
      </select>
      <div class="admin-search-wrap">
        <i class="fas fa-search"></i>
        <input type="search" id="grievanceSearch" placeholder="Search by student, ID, subject..." value="${safe(grievanceSearchQuery)}">
      </div>
    </div>
  </div>

  <div class="grievance-cards-list">
    ${filtered.length ? filtered.map(g => renderGrievanceCard(g)).join('') : `
      <div class="panel empty-grievances-panel">
        <div class="empty-icon"><i class="fas fa-clipboard-check"></i></div>
        <h3>No complaints found</h3>
        <p>No student grievances match the active filter criteria.</p>
      </div>
    `}
  </div>`;

  // Bind filter events
  main.querySelectorAll('[data-status-filter]').forEach(btn => {
    btn.onclick = () => {
      grievanceStatusFilter = btn.dataset.statusFilter;
      grievancesDashboard();
    };
  });
  const catSel = document.getElementById('categoryFilter');
  if (catSel) catSel.onchange = () => { grievanceCategoryFilter = catSel.value; grievancesDashboard(); };
  const prioSel = document.getElementById('priorityFilter');
  if (prioSel) prioSel.onchange = () => { grievancePriorityFilter = prioSel.value; grievancesDashboard(); };
  const searchInput = document.getElementById('grievanceSearch');
  if (searchInput) {
    searchInput.oninput = () => {
      grievanceSearchQuery = searchInput.value.trim();
    };
    searchInput.onkeydown = event => {
      if (event.key === 'Enter') grievancesDashboard();
    };
    searchInput.onchange = () => grievancesDashboard();
  }

  const resetBtn = document.getElementById('resetGrievances');
  if (resetBtn) resetBtn.onclick = async () => {
    if (confirm('Delete every complaint in the database? This cannot be undone.')) {
      await GoldHallPortal.resetGrievances();
      grievanceStatusFilter = 'all';
      grievanceCategoryFilter = 'all';
      grievancePriorityFilter = 'all';
      grievanceSearchQuery = '';
      dashboard();
    }
  };

  // Bind grievance action forms
  main.querySelectorAll('.grievance-action-form').forEach(form => {
    form.onsubmit = async event => {
      event.preventDefault();
      const gid = form.dataset.gid;
      const data = new FormData(form);
      const status = data.get('status');
      const actionHandler = data.get('actionHandler');
      const adminAction = String(data.get('adminAction') || '').trim();
      const feedback = document.getElementById(`feedback-${gid}`);

      try {
        await GoldHallPortal.updateGrievance(gid, {
          status,
          actionHandler,
          adminAction,
          adminActionDate: adminAction ? new Date().toISOString() : null
        });
      } catch (error) {
        if (feedback) {
          feedback.className = 'upload-feedback error';
          feedback.textContent = error?.message || 'Could not save the action.';
        }
        return;
      }

      if (feedback) {
        feedback.className = 'upload-feedback ok';
        feedback.textContent = 'Action saved and student dashboard updated.';
      }
      setTimeout(() => dashboard(), 400);
    };
  });

  // Bind quick action buttons
  main.querySelectorAll('[data-quick-action]').forEach(btn => {
    btn.onclick = () => {
      const gid = btn.dataset.gid;
      const nextStatus = btn.dataset.quickAction;
      const form = main.querySelector(`form[data-gid="${gid}"]`);
      if (!form) return;
      form.elements.status.value = nextStatus;
      if (!form.elements.adminAction.value.trim()) {
        form.elements.adminAction.value = nextStatus === 'resolved'
          ? 'Hall administration has inspected and confirmed this issue resolved.'
          : 'Inspection underway by assigned hall technical officers.';
      }
      form.dispatchEvent(new Event('submit'));
    };
  });

  // Bind delete grievance buttons
  main.querySelectorAll('[data-delete-gid]').forEach(btn => {
    btn.onclick = async () => {
      const gid = btn.dataset.deleteGid;
      if (confirm(`Delete complaint ${gid}? This action cannot be undone.`)) {
        btn.disabled = true;
        await GoldHallPortal.deleteGrievance(gid);
        dashboard();
      }
    };
  });
}

function renderGrievanceCard(g) {
  const dateStr = g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Recently';

  const actionDateStr = g.adminActionDate ? new Date(g.adminActionDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '';

  const priorityClass = `priority-${g.priority || 'normal'}`;
  const priorityLabels = { urgent: 'Urgent / Emergency', high: 'High Priority', normal: 'Normal / Routine' };
  const statusLabels = {
    pending: 'Pending Review',
    'in-progress': 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed'
  };

  return `<article class="panel grievance-card ${g.status}">
    <div class="grievance-card-header">
      <div class="grievance-tags">
        <span class="grievance-id-tag">#${safe(g.id)}</span>
        <span class="grievance-status-badge ${g.status}">${statusLabels[g.status] || g.status}</span>
        <span class="grievance-priority-badge ${priorityClass}">${priorityLabels[g.priority] || g.priority}</span>
        <span class="grievance-cat-badge"><i class="fas fa-tag"></i> ${safe(g.category)}</span>
      </div>
      <div class="grievance-date"><i class="fas fa-clock"></i> ${dateStr}</div>
    </div>

    <div class="grievance-submitter-box">
      ${g.isAnonymous ? `
        <span class="submitter-tag anon"><i class="fas fa-user-secret"></i> Anonymous Student Submitter</span>
        <span class="submitter-detail"><i class="fas fa-building"></i> ${safe(g.hallStatus)} · Room: <strong>${safe(g.room || g.location || 'Not provided')}</strong></span>
      ` : `
        <span class="submitter-tag"><i class="fas fa-user-graduate"></i> <strong>${safe(g.studentName)}</strong> (${safe(g.studentId)})</span>
        <span class="submitter-detail"><i class="fas fa-graduation-cap"></i> ${safe(g.programme)} · Level ${safe(g.year)}</span>
        <span class="submitter-detail"><i class="fas fa-house"></i> ${safe(g.hallStatus)}${g.room ? ` · ${safe(g.room)}` : ''}</span>
        ${g.studentEmail ? `<span class="submitter-detail"><i class="fas fa-envelope"></i> <a href="mailto:${safe(g.studentEmail)}">${safe(g.studentEmail)}</a></span>` : ''}
      `}
    </div>

    <div class="grievance-main-content">
      <h3 class="grievance-subject">${safe(g.subject)}</h3>
      <p class="grievance-description">${safe(g.description)}</p>
      <div class="grievance-location-strip">
        <i class="fas fa-location-dot"></i> <strong>Affected Location:</strong> ${safe(g.location || g.room || 'Gold Hall Premises')}
      </div>
    </div>

    ${g.adminAction ? `
      <div class="grievance-current-action-box">
        <div class="current-action-head">
          <span><i class="fas fa-shield-halved"></i> Current Recorded Action &amp; Resolution</span>
          <small>${actionDateStr}</small>
        </div>
        <p class="current-action-text">${safe(g.adminAction)}</p>
        ${g.actionHandler ? `<div class="current-action-handler"><i class="fas fa-id-badge"></i> Assigned Unit: <strong>${safe(g.actionHandler)}</strong></div>` : ''}
      </div>
    ` : `
      <div class="grievance-no-action-box">
        <i class="fas fa-circle-exclamation"></i> No official administrative response recorded yet.
      </div>
    `}

    <div class="grievance-action-section">
      <h4 class="action-section-title"><i class="fas fa-pen-to-square"></i> Take Action / Update Status &amp; Student Response</h4>
      <form class="grievance-action-form" data-gid="${safe(g.id)}">
        <div class="grievance-form-grid">
          <label>Status
            <select name="status">
              <option value="pending" ${g.status === 'pending' ? 'selected' : ''}>Pending Review</option>
              <option value="in-progress" ${g.status === 'in-progress' ? 'selected' : ''}>In Progress (Action Initiated)</option>
              <option value="resolved" ${g.status === 'resolved' ? 'selected' : ''}>Resolved (Issue Fixed)</option>
              <option value="closed" ${g.status === 'closed' ? 'selected' : ''}>Closed / Dismissed</option>
            </select>
          </label>
          <label>Assigned Unit / Officer
            <select name="actionHandler">
              <option value="Hall Maintenance Unit" ${g.actionHandler === 'Hall Maintenance Unit' ? 'selected' : ''}>Hall Maintenance Unit</option>
              <option value="Plumbing & Works Section" ${g.actionHandler === 'Plumbing & Works Section' ? 'selected' : ''}>Plumbing & Works Section</option>
              <option value="Electrical Services Team" ${g.actionHandler === 'Electrical Services Team' ? 'selected' : ''}>Electrical Services Team</option>
              <option value="Sanitation & Cleaning Committee" ${g.actionHandler === 'Sanitation & Cleaning Committee' ? 'selected' : ''}>Sanitation & Cleaning Committee</option>
              <option value="Security & Safety Unit" ${g.actionHandler === 'Security & Safety Unit' ? 'selected' : ''}>Security & Safety Unit</option>
              <option value="Hall Warden / Management" ${g.actionHandler === 'Hall Warden / Management' ? 'selected' : ''}>Hall Warden / Management</option>
              <option value="JCR Welfare Committee" ${g.actionHandler === 'JCR Welfare Committee' ? 'selected' : ''}>JCR Welfare Committee</option>
              <option value="Hall Administration" ${!g.actionHandler || g.actionHandler === 'Hall Administration' ? 'selected' : ''}>Hall Administration</option>
            </select>
          </label>
        </div>
        <label>Official Action / Resolution Note (Visible to Student)
          <textarea name="adminAction" rows="3" placeholder="Provide details of the technician visit, repairs conducted, parts replaced, or safety instructions for the resident...">${safe(g.adminAction || '')}</textarea>
        </label>
        <div class="grievance-form-buttons">
          <button type="submit" class="admin-btn"><i class="fas fa-check"></i> Save Action &amp; Update Student</button>
          <button type="button" class="admin-btn secondary" data-quick-action="in-progress" data-gid="${safe(g.id)}"><i class="fas fa-wrench"></i> Set In Progress</button>
          <button type="button" class="admin-btn secondary" data-quick-action="resolved" data-gid="${safe(g.id)}"><i class="fas fa-circle-check"></i> Set Resolved</button>
          <button type="button" class="admin-btn-danger" data-delete-gid="${safe(g.id)}" title="Delete Complaint"><i class="fas fa-trash"></i> Delete</button>
        </div>
        <p class="upload-feedback" id="feedback-${safe(g.id)}" role="status" aria-live="polite"></p>
      </form>
    </div>
  </article>`;
}

/* This file is only emitted when the server has already authenticated the
   administrator, and the page then contains an empty #adminApp waiting to be
   filled. Booting straight into the dashboard is therefore the only correct
   starting point; a client-side flag would disagree with the PHP session. */
dashboard();
