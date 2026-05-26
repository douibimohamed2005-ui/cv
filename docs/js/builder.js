// js/builder.js
const API_BASE_URL = 'https://cv-pttb.onrender.com';
const API = `${API_BASE_URL}/api`;
const token = localStorage.getItem('sc_token')
const user = (() => { try { return JSON.parse(localStorage.getItem('sc_user')) } catch { return null } })()
if (!token || !user) location.href = 'auth.html'

const params = new URLSearchParams(location.search)
const EDIT_ID = params.get('id')

// ── State ─────────────────────────────────────────────
const state = {
  title: 'My CV', template: 'modern',
  personal: { 
    name: '', title: '', email: '', phone: '', location: '', 
    nationality: '', dob: '', linkedin: '', github: '', portfolio: '', photo: '' 
  },
  summary: '',
  experience: [], education: [], certifications: [],
  skills: { tech: [], soft: [] },
  languages: [], projects: [], volunteer: [], awards: [],
  interests: [], references: [], refRequest: false
}

// ID counters
const counters = { exp:0, edu:0, cert:0, lang:0, proj:0, vol:0, awd:0, ref:0 }
function genId(type) { return type + '_' + (++counters[type]); }

// ── Toast ─────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.getElementById('toast')
  if (!t) return
  
  let icon = '';
  if(type === 'success') icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  if(type === 'error') icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  if(type === 'warning') icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

  t.innerHTML = `${icon} <span>${msg}</span>`; 
  t.className = 'toast ' + type + ' show'
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3500)
}

// ── Header & Theme ────────────────────────────────────
function initHeader() {
  const letter = (user.email?.[0] || 'U').toUpperCase()
  const a = document.getElementById('headerAvatar')
  if (a) a.textContent = letter

  const savedTheme = localStorage.getItem('sc_theme') || 'light'
  document.documentElement.setAttribute('data-theme', savedTheme)
  updateThemeIcon(savedTheme)
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const newTheme = isDark ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('sc_theme', newTheme)
  updateThemeIcon(newTheme)
}
window.toggleTheme = toggleTheme

function updateThemeIcon(theme) {
  const svg = document.getElementById('iconMoon')
  if(!svg) return;
  if(theme === 'dark') {
    svg.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  } else {
    svg.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  }
}

// ── Multi-Step Logic ──────────────────────────────────
let currentStep = 1;
const totalSteps = 8;
const stepNames = ["Personal", "Summary", "Experience", "Education", "Skills", "Projects", "Vol/Awards", "Extras"];

function renderProgress() {
  const ul = document.getElementById('progressSteps');
  ul.innerHTML = stepNames.map((name, i) => {
    const s = i + 1;
    let cls = '';
    if (s === currentStep) cls = 'active';
    else if (s < currentStep) cls = 'completed';
    return `
      <li class="step-item ${cls}" onclick="goToStep(${s})">
        <div class="step-circle">${s < currentStep ? '✓' : s}</div>
        <span class="step-label">${name}</span>
      </li>
    `;
  }).join('');
}

function updateStepView() {
  for(let i=1; i<=totalSteps; i++) {
    const el = document.getElementById('step-' + i);
    if(el) {
      if(i === currentStep) el.classList.add('active');
      else el.classList.remove('active');
    }
  }
  
  document.getElementById('btnPrev').disabled = currentStep === 1;
  const nextBtn = document.getElementById('btnNext');
  const nextIcon = document.getElementById('nextIcon');
  
  if (currentStep === totalSteps) {
    nextBtn.innerHTML = `Finish <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"/></svg>`;
    nextBtn.classList.add('finish');
  } else {
    nextBtn.innerHTML = `Next <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 18 15 12 9 6"/></svg>`;
    nextBtn.classList.remove('finish');
  }
  
  renderProgress();
  // Scroll to top of form panel
  document.getElementById('stepsWrapper').scrollTo({top:0, behavior:'smooth'});
}

function nextStep() {
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepView();
  } else {
    saveCV();
  }
}
function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepView();
  }
}
function goToStep(s) {
  if(s >= 1 && s <= totalSteps) {
    currentStep = s;
    updateStepView();
  }
}
window.nextStep = nextStep; window.prevStep = prevStep; window.goToStep = goToStep;

// Toggle preview on mobile
document.getElementById('btnTogglePreview').addEventListener('click', () => {
  const p = document.getElementById('previewPanel');
  const f = document.getElementById('formPanel');
  if (p.style.display === 'flex') {
    p.style.display = 'none'; f.style.display = 'flex';
  } else {
    p.style.display = 'flex'; f.style.display = 'none';
  }
});

// ── Bind Inputs ───────────────────────────────────────
function bindInputs() {
  const maps = {
    pName: 'name', pTitle: 'title', pEmail: 'email', pPhone: 'phone', 
    pLocation: 'location', pNationality: 'nationality', pDob: 'dob', 
    pLinkedin: 'linkedin', pGithub: 'github', pPortfolio: 'portfolio'
  };
  Object.entries(maps).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { state.personal[key] = el.value; syncPreview(); });
  });

  const sumEl = document.getElementById('pSummary');
  if (sumEl) sumEl.addEventListener('input', () => { state.summary = sumEl.value; syncPreview(); });
  
  document.getElementById('cvTitle').addEventListener('input', (e) => state.title = e.target.value);
}

// ── Photo Upload ──────────────────────────────────────
const photoInput = document.getElementById('photoInput');
if(photoInput) {
  photoInput.addEventListener('change', function() {
    const file = this.files[0];
    if(file) {
      if(file.size > 2 * 1024 * 1024) return toast('Image size must be less than 2MB', 'error');
      const reader = new FileReader();
      reader.onload = function(e) {
        state.personal.photo = e.target.result;
        updatePhotoPreview();
        syncPreview();
      };
      reader.readAsDataURL(file);
    }
  });
}

function updatePhotoPreview() {
  const wrap = document.getElementById('photoPreview');
  const img = document.getElementById('photoImg');
  if(state.personal.photo) {
    img.src = state.personal.photo;
    wrap.classList.add('has-img');
  } else {
    img.src = '';
    wrap.classList.remove('has-img');
  }
}

function removePhoto() {
  state.personal.photo = '';
  document.getElementById('photoInput').value = '';
  updatePhotoPreview();
  syncPreview();
}
window.removePhoto = removePhoto;

// ── Generic List Renderer ─────────────────────────────
function updateItem(arrName, id, field, value) {
  const item = state[arrName].find(x => x.id === id);
  if(item) { item[field] = value; syncPreview(); }
}
window.updateItem = updateItem;

function removeItem(arrName, id, renderFunc) {
  state[arrName] = state[arrName].filter(x => x.id !== id);
  renderFunc(); syncPreview();
}
window.removeItem = removeItem;

// ── Experience ────────────────────────────────────────
function addExp(data = {}) {
  state.experience.push({
    id: genId('exp'), company: data.company || '', position: data.position || '',
    startDate: data.startDate || '', endDate: data.endDate || '', current: !!data.current, description: data.description || ''
  });
  renderExpList(); syncPreview();
}
function renderExpList() {
  document.getElementById('expList').innerHTML = state.experience.map(e => `
    <div class="entry">
      <div class="entry-hd"><span class="entry-label">${e.position || e.company || 'New Experience'}</span>
        <button class="rm-btn" onclick="removeItem('experience', '${e.id}', renderExpList)"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
      <div class="grid2">
        <div class="field"><label>Position</label><input value="${e.position}" oninput="updateItem('experience','${e.id}','position',this.value); this.closest('.entry').querySelector('.entry-label').textContent=this.value || 'New Experience'"/></div>
        <div class="field"><label>Company</label><input value="${e.company}" oninput="updateItem('experience','${e.id}','company',this.value)"/></div>
        <div class="field"><label>Start Date</label><input type="month" value="${e.startDate}" oninput="updateItem('experience','${e.id}','startDate',this.value)"/></div>
        <div class="field"><label>End Date</label><input type="month" value="${e.endDate}" ${e.current ? 'disabled' : ''} oninput="updateItem('experience','${e.id}','endDate',this.value)"/></div>
      </div>
      <div class="cb-row"><input type="checkbox" id="cur_${e.id}" ${e.current ? 'checked' : ''} onchange="updateItem('experience','${e.id}','current',this.checked); renderExpList()"/><label for="cur_${e.id}">Currently working here</label></div>
      <div class="field" style="margin-top:10px"><label>Description</label><textarea oninput="updateItem('experience','${e.id}','description',this.value)">${e.description}</textarea></div>
    </div>`).join('');
}
window.addExp = addExp;

// ── Education ─────────────────────────────────────────
function addEdu(data = {}) {
  state.education.push({
    id: genId('edu'), institution: data.institution || '', degree: data.degree || '',
    field: data.field || '', startDate: data.startDate || '', endDate: data.endDate || '', gpa: data.gpa || ''
  });
  renderEduList(); syncPreview();
}
function renderEduList() {
  document.getElementById('eduList').innerHTML = state.education.map(e => `
    <div class="entry">
      <div class="entry-hd"><span class="entry-label">${e.institution || 'New Education'}</span>
        <button class="rm-btn" onclick="removeItem('education', '${e.id}', renderEduList)"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
      <div class="grid2">
        <div class="field"><label>Institution</label><input value="${e.institution}" oninput="updateItem('education','${e.id}','institution',this.value); this.closest('.entry').querySelector('.entry-label').textContent=this.value || 'New Education'"/></div>
        <div class="field"><label>Degree</label><input value="${e.degree}" placeholder="e.g. BSc" oninput="updateItem('education','${e.id}','degree',this.value)"/></div>
        <div class="field"><label>Field of Study</label><input value="${e.field}" placeholder="e.g. Computer Science" oninput="updateItem('education','${e.id}','field',this.value)"/></div>
        <div class="field"><label>GPA (optional)</label><input value="${e.gpa}" placeholder="3.8" oninput="updateItem('education','${e.id}','gpa',this.value)"/></div>
        <div class="field"><label>Start</label><input type="month" value="${e.startDate}" oninput="updateItem('education','${e.id}','startDate',this.value)"/></div>
        <div class="field"><label>End</label><input type="month" value="${e.endDate}" oninput="updateItem('education','${e.id}','endDate',this.value)"/></div>
      </div>
    </div>`).join('');
}
window.addEdu = addEdu;

// ── Certifications ────────────────────────────────────
function addCert(data = {}) {
  state.certifications.push({
    id: genId('cert'), name: data.name || '', issuer: data.issuer || '', date: data.date || '', link: data.link || ''
  });
  renderCertList(); syncPreview();
}
function renderCertList() {
  document.getElementById('certList').innerHTML = state.certifications.map(c => `
    <div class="entry">
      <div class="entry-hd"><span class="entry-label">${c.name || 'New Certification'}</span>
        <button class="rm-btn" onclick="removeItem('certifications', '${c.id}', renderCertList)"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
      <div class="grid2">
        <div class="field"><label>Name</label><input value="${c.name}" oninput="updateItem('certifications','${c.id}','name',this.value)"/></div>
        <div class="field"><label>Organization/Issuer</label><input value="${c.issuer}" oninput="updateItem('certifications','${c.id}','issuer',this.value)"/></div>
        <div class="field"><label>Date Obtained</label><input type="month" value="${c.date}" oninput="updateItem('certifications','${c.id}','date',this.value)"/></div>
        <div class="field"><label>Link (Optional)</label><input value="${c.link}" oninput="updateItem('certifications','${c.id}','link',this.value)"/></div>
      </div>
    </div>`).join('');
}
window.addCert = addCert;

// ── Skills & Interests ────────────────────────────────
function addSkill(e, type) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const val = e.target.value.trim();
  if (!val || state.skills[type].includes(val)) return;
  state.skills[type].push(val); 
  e.target.value = ''; 
  renderSkills(type); syncPreview();
}
function removeSkill(type, s) { 
  state.skills[type] = state.skills[type].filter(x => x !== s); 
  renderSkills(type); syncPreview(); 
}
function renderSkills(type) {
  document.getElementById(type + 'SkillsWrap').innerHTML = state.skills[type].map(s =>
    `<div class="skill-tag">${s}<button onclick="removeSkill('${type}', '${s}')"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`
  ).join('');
}
window.addSkill = addSkill; window.removeSkill = removeSkill;

function addInterest(e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const val = e.target.value.trim();
  if (!val || state.interests.includes(val)) return;
  state.interests.push(val); 
  e.target.value = ''; 
  renderInterests(); syncPreview();
}
function removeInterest(s) { 
  state.interests = state.interests.filter(x => x !== s); 
  renderInterests(); syncPreview(); 
}
function renderInterests() {
  document.getElementById('interestWrap').innerHTML = state.interests.map(s =>
    `<div class="skill-tag">${s}<button onclick="removeInterest('${s}')"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>`
  ).join('');
}
window.addInterest = addInterest; window.removeInterest = removeInterest;

// ── Languages ─────────────────────────────────────────
function addLang(data = {}) {
  state.languages.push({
    id: genId('lang'), language: data.language || '', proficiency: data.proficiency || 'Beginner'
  });
  renderLangList(); syncPreview();
}
function renderLangList() {
  document.getElementById('langList').innerHTML = state.languages.map(l => `
    <div class="entry" style="display:flex; gap:12px; align-items:center;">
      <div class="field" style="flex:1; margin:0;"><label>Language</label><input value="${l.language}" oninput="updateItem('languages','${l.id}','language',this.value)"/></div>
      <div class="field" style="flex:1; margin:0;"><label>Proficiency</label>
        <select onchange="updateItem('languages','${l.id}','proficiency',this.value)">
          ${['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'].map(p => `<option value="${p}" ${l.proficiency===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
      <button class="rm-btn" style="margin-top:20px;" onclick="removeItem('languages', '${l.id}', renderLangList)"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
    </div>`).join('');
}
window.addLang = addLang;

// ── Projects ──────────────────────────────────────────
function addProj(data = {}) {
  state.projects.push({
    id: genId('proj'), title: data.title || '', tech: data.tech || '', 
    link: data.link || '', github: data.github || '',
    startDate: data.startDate || '', endDate: data.endDate || '', description: data.description || ''
  });
  renderProjList(); syncPreview();
}
function renderProjList() {
  document.getElementById('projList').innerHTML = state.projects.map(p => `
    <div class="entry">
      <div class="entry-hd"><span class="entry-label">${p.title || 'New Project'}</span>
        <button class="rm-btn" onclick="removeItem('projects', '${p.id}', renderProjList)"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
      <div class="grid2">
        <div class="field"><label>Title</label><input value="${p.title}" oninput="updateItem('projects','${p.id}','title',this.value)"/></div>
        <div class="field"><label>Technologies Used</label><input value="${p.tech}" placeholder="React, Node.js..." oninput="updateItem('projects','${p.id}','tech',this.value)"/></div>
        <div class="field"><label>Live Link</label><input value="${p.link}" oninput="updateItem('projects','${p.id}','link',this.value)"/></div>
        <div class="field"><label>GitHub Link</label><input value="${p.github}" oninput="updateItem('projects','${p.id}','github',this.value)"/></div>
        <div class="field"><label>Start Date</label><input type="month" value="${p.startDate}" oninput="updateItem('projects','${p.id}','startDate',this.value)"/></div>
        <div class="field"><label>End Date</label><input type="month" value="${p.endDate}" oninput="updateItem('projects','${p.id}','endDate',this.value)"/></div>
      </div>
      <div class="field" style="margin-top:10px"><label>Description</label><textarea oninput="updateItem('projects','${p.id}','description',this.value)">${p.description}</textarea></div>
    </div>`).join('');
}
window.addProj = addProj;

// ── Volunteer & Awards ────────────────────────────────
function addVol(data = {}) {
  state.volunteer.push({
    id: genId('vol'), org: data.org || '', role: data.role || '', dates: data.dates || '', description: data.description || ''
  });
  renderVolList(); syncPreview();
}
function renderVolList() {
  document.getElementById('volList').innerHTML = state.volunteer.map(v => `
    <div class="entry">
      <div class="entry-hd"><span class="entry-label">${v.org || 'New Volunteer Work'}</span>
        <button class="rm-btn" onclick="removeItem('volunteer', '${v.id}', renderVolList)"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
      <div class="grid2">
        <div class="field"><label>Organization</label><input value="${v.org}" oninput="updateItem('volunteer','${v.id}','org',this.value)"/></div>
        <div class="field"><label>Role</label><input value="${v.role}" oninput="updateItem('volunteer','${v.id}','role',this.value)"/></div>
        <div class="field"><label>Dates</label><input value="${v.dates}" placeholder="e.g. 2021 - 2022" oninput="updateItem('volunteer','${v.id}','dates',this.value)"/></div>
      </div>
      <div class="field" style="margin-top:10px"><label>Description</label><textarea style="height:60px" oninput="updateItem('volunteer','${v.id}','description',this.value)">${v.description}</textarea></div>
    </div>`).join('');
}
window.addVol = addVol;

function addAward(data = {}) {
  state.awards.push({
    id: genId('awd'), title: data.title || '', org: data.org || '', date: data.date || '', description: data.description || ''
  });
  renderAwardList(); syncPreview();
}
function renderAwardList() {
  document.getElementById('awardList').innerHTML = state.awards.map(a => `
    <div class="entry">
      <div class="entry-hd"><span class="entry-label">${a.title || 'New Award'}</span>
        <button class="rm-btn" onclick="removeItem('awards', '${a.id}', renderAwardList)"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
      <div class="grid2">
        <div class="field"><label>Award Title</label><input value="${a.title}" oninput="updateItem('awards','${a.id}','title',this.value)"/></div>
        <div class="field"><label>Organization</label><input value="${a.org}" oninput="updateItem('awards','${a.id}','org',this.value)"/></div>
        <div class="field"><label>Date</label><input value="${a.date}" placeholder="e.g. May 2023" oninput="updateItem('awards','${a.id}','date',this.value)"/></div>
      </div>
      <div class="field" style="margin-top:10px"><label>Description</label><textarea style="height:60px" oninput="updateItem('awards','${a.id}','description',this.value)">${a.description}</textarea></div>
    </div>`).join('');
}
window.addAward = addAward;

// ── References ────────────────────────────────────────
function toggleRefRequest(checked) {
  state.refRequest = checked;
  document.getElementById('refListWrapper').style.display = checked ? 'none' : 'block';
  syncPreview();
}
window.toggleRefRequest = toggleRefRequest;

function addRef(data = {}) {
  state.references.push({
    id: genId('ref'), name: data.name || '', position: data.position || '', company: data.company || '', phone: data.phone || '', email: data.email || ''
  });
  renderRefList(); syncPreview();
}
function renderRefList() {
  document.getElementById('refList').innerHTML = state.references.map(r => `
    <div class="entry">
      <div class="entry-hd"><span class="entry-label">${r.name || 'New Reference'}</span>
        <button class="rm-btn" onclick="removeItem('references', '${r.id}', renderRefList)"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
      <div class="grid2">
        <div class="field"><label>Name</label><input value="${r.name}" oninput="updateItem('references','${r.id}','name',this.value)"/></div>
        <div class="field"><label>Position</label><input value="${r.position}" oninput="updateItem('references','${r.id}','position',this.value)"/></div>
        <div class="field"><label>Company</label><input value="${r.company}" oninput="updateItem('references','${r.id}','company',this.value)"/></div>
        <div class="field"><label>Phone</label><input value="${r.phone}" oninput="updateItem('references','${r.id}','phone',this.value)"/></div>
        <div class="field"><label>Email</label><input value="${r.email}" oninput="updateItem('references','${r.id}','email',this.value)"/></div>
      </div>
    </div>`).join('');
}
window.addRef = addRef;

// ── Template Selection ────────────────────────────────
function changeTemplate(val) {
  state.template = val;
  syncPreview();
}
window.changeTemplate = changeTemplate;

// ── Template Engine & Preview ─────────────────────────
function syncPreview() {
  const s = state;
  const p = s.personal;
  
  // Format dates helper
  const fmtDate = (d) => {
    if(!d) return '';
    try {
      const date = new Date(d);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  const contacts = [
    p.email ? `<span class="c-item">✉ ${p.email}</span>` : '',
    p.phone ? `<span class="c-item">☎ ${p.phone}</span>` : '',
    p.location ? `<span class="c-item">📍 ${p.location}</span>` : '',
    p.linkedin ? `<span class="c-item">in/ ${p.linkedin.replace('https://','')}</span>` : '',
    p.github ? `<span class="c-item">GH/ ${p.github.replace('https://','')}</span>` : '',
    p.portfolio ? `<span class="c-item">🌍 ${p.portfolio.replace('https://','')}</span>` : '',
  ].filter(Boolean).join('');

  // Building sections
  let leftCol = '';
  let rightCol = '';
  let fullBody = '';

  const summarySec = s.summary ? `<div class="cv-section"><h3 class="sec-title">Profile</h3><p class="sec-text">${s.summary}</p></div>` : '';
  
  const expSec = s.experience.length ? `
    <div class="cv-section">
      <h3 class="sec-title">Experience</h3>
      <div class="sec-content">
        ${s.experience.map(e => `
          <div class="exp-item">
            <div class="item-hdr">
              <span class="item-title">${e.position}</span>
              <span class="item-date">${fmtDate(e.startDate)} – ${e.current ? 'Present' : fmtDate(e.endDate)}</span>
            </div>
            <div class="item-sub">${e.company}</div>
            ${e.description ? `<p class="item-desc">${e.description.replace(/\n/g, '<br>')}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const eduSec = s.education.length ? `
    <div class="cv-section">
      <h3 class="sec-title">Education</h3>
      <div class="sec-content">
        ${s.education.map(e => `
          <div class="exp-item">
            <div class="item-hdr">
              <span class="item-title">${e.degree} ${e.field ? 'in '+e.field : ''}</span>
              <span class="item-date">${fmtDate(e.startDate)} – ${fmtDate(e.endDate)}</span>
            </div>
            <div class="item-sub">${e.institution}</div>
            ${e.gpa ? `<div class="item-desc">GPA: ${e.gpa}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const projSec = s.projects.length ? `
    <div class="cv-section">
      <h3 class="sec-title">Projects</h3>
      <div class="sec-content">
        ${s.projects.map(p => `
          <div class="exp-item">
            <div class="item-hdr">
              <span class="item-title">${p.title}</span>
              <span class="item-date">${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}</span>
            </div>
            <div class="item-sub">
              ${p.tech ? `<span style="font-weight:600; color:#475569;">Tech: ${p.tech}</span>` : ''}
              ${p.link ? ` | <a href="${p.link}">Live</a>` : ''}
              ${p.github ? ` | <a href="${p.github}">GitHub</a>` : ''}
            </div>
            ${p.description ? `<p class="item-desc">${p.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const skillsSec = (s.skills.tech.length || s.skills.soft.length) ? `
    <div class="cv-section">
      <h3 class="sec-title">Skills</h3>
      ${s.skills.tech.length ? `
        <div class="skill-group">
          <strong>Technical:</strong>
          <div class="tags-wrap">${s.skills.tech.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
      ` : ''}
      ${s.skills.soft.length ? `
        <div class="skill-group" style="margin-top:8px;">
          <strong>Soft Skills:</strong>
          <div class="tags-wrap">${s.skills.soft.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
      ` : ''}
    </div>` : '';

  const certSec = s.certifications.length ? `
    <div class="cv-section">
      <h3 class="sec-title">Certifications</h3>
      <ul class="clean-list">
        ${s.certifications.map(c => `<li><strong>${c.name}</strong> – ${c.issuer} <em>(${fmtDate(c.date)})</em></li>`).join('')}
      </ul>
    </div>` : '';

  const langSec = s.languages.length ? `
    <div class="cv-section">
      <h3 class="sec-title">Languages</h3>
      <ul class="clean-list">
        ${s.languages.map(l => `<li><strong>${l.language}</strong>: ${l.proficiency}</li>`).join('')}
      </ul>
    </div>` : '';

  const awdSec = s.awards.length ? `
    <div class="cv-section">
      <h3 class="sec-title">Awards</h3>
      <ul class="clean-list">
        ${s.awards.map(a => `<li><strong>${a.title}</strong> (${a.org}) – <em>${a.date}</em><br><span style="font-size:0.9em;color:#666;">${a.description}</span></li>`).join('')}
      </ul>
    </div>` : '';

  const volSec = s.volunteer.length ? `
    <div class="cv-section">
      <h3 class="sec-title">Volunteer Work</h3>
      <div class="sec-content">
        ${s.volunteer.map(v => `
          <div class="exp-item">
            <div class="item-hdr"><span class="item-title">${v.role}</span><span class="item-date">${v.dates}</span></div>
            <div class="item-sub">${v.org}</div>
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const intSec = s.interests.length ? `
    <div class="cv-section">
      <h3 class="sec-title">Interests</h3>
      <div class="tags-wrap">${s.interests.map(i => `<span class="tag">${i}</span>`).join('')}</div>
    </div>` : '';

  let refHtml = '';
  if(s.refRequest) {
    refHtml = `<div class="cv-section"><h3 class="sec-title">References</h3><p class="sec-text">References available upon request.</p></div>`;
  } else if(s.references.length) {
    refHtml = `<div class="cv-section"><h3 class="sec-title">References</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        ${s.references.map(r => `
          <div>
            <strong>${r.name}</strong><br>
            <span style="font-size:0.9em;color:#555;">${r.position} at ${r.company}</span><br>
            <span style="font-size:0.85em;color:#666;">${r.phone} | ${r.email}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // Choose layout based on template
  const isTwoCol = ['modern', 'creative'].includes(s.template);

  if (isTwoCol) {
    leftCol = summarySec + expSec + projSec + eduSec + volSec + refHtml;
    rightCol = skillsSec + certSec + langSec + awdSec + intSec;
    fullBody = `<div class="cv-body-2col"><div class="cv-main">${leftCol}</div><div class="cv-side">${rightCol}</div></div>`;
  } else {
    // Single column for Executive / Minimal
    fullBody = `<div class="cv-body-1col">` + summarySec + expSec + eduSec + skillsSec + projSec + certSec + langSec + volSec + awdSec + intSec + refHtml + `</div>`;
  }

  // --- Templates CSS ---
  const tplStyles = {
    modern: `
      .cv-sheet { font-family: 'Inter', sans-serif; color: #1e293b; line-height:1.5; }
      .cv-header { background: #0f172a; color: #fff; padding: 40px; display:flex; align-items:center; gap:24px; }
      .cv-photo { width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid #334155; }
      .cv-name { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
      .cv-title { font-size: 16px; font-weight: 500; color: #94a3b8; margin-bottom: 16px; }
      .cv-contacts { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #cbd5e1; }
      .c-item { display:flex; align-items:center; gap:4px; }
      .cv-body-2col { display: flex; }
      .cv-main { flex: 2; padding: 40px; }
      .cv-side { flex: 1; background: #f8fafc; padding: 40px; border-left: 1px solid #e2e8f0; }
      .sec-title { font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 16px; margin-top:24px; }
      .cv-section:first-child .sec-title { margin-top: 0; }
      .exp-item { margin-bottom: 20px; }
      .item-hdr { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
      .item-title { font-weight: 700; font-size: 14px; }
      .item-date { font-size: 12px; color: #64748b; font-weight: 500; }
      .item-sub { font-size: 13px; color: #3b82f6; font-weight: 600; margin-bottom: 6px; }
      .item-desc { font-size: 12px; color: #475569; }
      .sec-text { font-size: 13px; color: #475569; }
      .tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top:4px; }
      .tag { background: #e2e8f0; color: #334155; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
      .clean-list { list-style: none; padding: 0; margin: 0; font-size:12px; color:#475569; }
      .clean-list li { margin-bottom: 8px; position: relative; padding-left: 12px; }
      .clean-list li::before { content: "•"; position: absolute; left: 0; color: #3b82f6; }
    `,
    creative: `
      .cv-sheet { font-family: 'Outfit', sans-serif; color: #2d3748; line-height:1.6; }
      .cv-header { background: #ffffff; padding: 40px; display:flex; align-items:center; gap:30px; border-bottom:4px solid #7c3aed; }
      .cv-photo { width:120px; height:120px; border-radius:16px; object-fit:cover; box-shadow:8px 8px 0px rgba(124, 58, 237, 0.2); }
      .cv-name { font-size: 38px; font-weight: 800; color: #1a202c; line-height:1.1; margin-bottom: 8px; }
      .cv-title { font-size: 18px; font-weight: 600; color: #7c3aed; margin-bottom: 16px; text-transform:uppercase; letter-spacing:2px; }
      .cv-contacts { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; font-weight:500; color: #4a5568; }
      .cv-body-2col { display: flex; }
      .cv-main { flex: 2; padding: 40px; }
      .cv-side { flex: 1; background: #faf5ff; padding: 40px; border-left: 1px dashed #e9d8fd; }
      .sec-title { font-size: 18px; font-weight: 800; color: #7c3aed; margin-bottom: 20px; margin-top:32px; display:flex; align-items:center; gap:8px;}
      .cv-section:first-child .sec-title { margin-top: 0; }
      .exp-item { margin-bottom: 24px; position:relative; padding-left:16px; border-left:2px solid #e9d8fd; }
      .item-hdr { display: flex; flex-direction:column; margin-bottom: 4px; }
      .item-title { font-weight: 700; font-size: 15px; color:#1a202c; }
      .item-date { font-size: 11px; color: #805ad5; font-weight: 700; background:#ebf4ff; display:inline-block; padding:2px 8px; border-radius:4px; align-self:flex-start; margin-top:4px;}
      .item-sub { font-size: 14px; color: #4a5568; font-weight: 600; margin-bottom: 8px; }
      .item-desc { font-size: 13px; color: #4a5568; }
      .tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
      .tag { background: #fff; border:1px solid #d6bcfa; color: #6b46c1; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; box-shadow:2px 2px 0px rgba(124,58,237,0.1); }
      .clean-list { list-style: none; padding: 0; margin: 0; font-size:13px; }
      .clean-list li { margin-bottom: 12px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;}
    `,
    executive: `
      .cv-sheet { font-family: 'Times New Roman', serif; color: #222; line-height:1.5; padding:60px; }
      .cv-header { text-align:center; margin-bottom:30px; border-bottom:2px solid #111; padding-bottom:20px; }
      .cv-name { font-size: 28px; font-weight: bold; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
      .cv-contacts { display: flex; justify-content:center; flex-wrap: wrap; gap: 16px; font-size: 12px; font-family:'Inter', sans-serif; color:#444; }
      .cv-photo { display:none; } /* Hidden in executive */
      .cv-body-1col { max-width:800px; margin:0 auto; }
      .sec-title { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 16px; margin-top:24px; color:#111; }
      .exp-item { margin-bottom: 16px; }
      .item-hdr { display: flex; justify-content: space-between; align-items: baseline; }
      .item-title { font-weight: bold; font-size: 14px; }
      .item-date { font-family: 'Inter', sans-serif; font-size: 11px; color: #555; }
      .item-sub { font-size: 13px; font-style: italic; margin-bottom: 4px; }
      .item-desc { font-size: 13px; }
      .tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
      .tag { font-family: 'Inter', sans-serif; background: #eee; color: #333; padding: 2px 8px; font-size: 11px; }
      .clean-list { margin:0; padding-left:20px; font-size:13px; }
    `,
    minimal: `
      .cv-sheet { font-family: 'Plus Jakarta Sans', sans-serif; color: #374151; line-height:1.6; padding:50px; background:#fafafa; }
      .cv-header { margin-bottom:40px; display:flex; align-items:center; gap:30px;}
      .cv-photo { width:90px; height:90px; border-radius:50%; object-fit:cover; }
      .cv-name { font-size: 32px; font-weight: 300; letter-spacing:-1px; color:#111827; margin-bottom:4px; }
      .cv-title { font-size: 15px; font-weight: 500; color: #6b7280; margin-bottom: 16px; }
      .cv-contacts { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: #6b7280; }
      .sec-title { font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; margin-top:40px; }
      .cv-section:first-child .sec-title { margin-top: 0; }
      .exp-item { margin-bottom: 24px; display:grid; grid-template-columns: 140px 1fr; gap:20px; }
      .item-hdr { display:flex; flex-direction:column; }
      .item-date { font-size: 12px; color: #9ca3af; font-weight: 500; }
      .item-title { font-weight: 600; font-size: 15px; color:#111827; margin-bottom:2px;}
      .item-sub { font-size: 14px; color: #4b5563; margin-bottom: 8px; }
      .item-desc { font-size: 13px; color: #6b7280; }
      .tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
      .tag { color: #4b5563; font-size: 12px; font-weight: 500; border:1px solid #e5e7eb; padding:2px 8px; border-radius:4px; }
      .clean-list { list-style:none; padding:0; font-size:13px; display:grid; grid-template-columns:1fr 1fr; gap:8px;}
    `
  };

  const css = `<style>${tplStyles[s.template] || tplStyles.modern}</style>`;

  const headerHtml = `
    <div class="cv-header">
      ${p.photo && s.template !== 'executive' ? `<img src="${p.photo}" class="cv-photo"/>` : ''}
      <div>
        <div class="cv-name">${p.name || 'Your Name'}</div>
        ${p.title ? `<div class="cv-title">${p.title}</div>` : ''}
        <div class="cv-contacts">${contacts}</div>
      </div>
    </div>
  `;

  document.getElementById('cvSheet').innerHTML = css + headerHtml + fullBody;
}

// ── Save/Load Logic ───────────────────────────────────
async function saveCV() {
  state.title = document.getElementById('cvTitle')?.value || 'My CV'
  
  const payload = {
    title: state.title,
    template: state.template,
    data: state
  }

  const btn = document.getElementById('btnSave')
  const originalHtml = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = 'Saving…'

  try {
    let res, data
    if (EDIT_ID) {
      res = await fetch(`${API}/cv/${EDIT_ID}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(payload) })
    } else {
      res = await fetch(`${API}/cv/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(payload) })
    }
    data = await res.json()
    if (!res.ok) throw new Error(data.error)

    toast('CV Saved Successfully!')
    if(!EDIT_ID) {
      // Redirect to edit mode so subsequent saves update instead of creating new
      history.replaceState(null, '', `?id=${data.cv.id}`);
    }
  } catch (err) {
    toast('Save failed: ' + err.message, 'error')
  } finally {
    btn.disabled = false; btn.innerHTML = originalHtml;
  }
}
window.saveCV = saveCV

async function loadCV(id) {
  try {
    const res = await fetch(`${API}/cv/${id}`, { headers: { Authorization: 'Bearer ' + token } })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    const d = data.cv.data || {}
    document.getElementById('cvTitle').value = data.cv.title || 'My CV'
    document.getElementById('cvTemplate').value = data.cv.template || 'modern'
    
    Object.assign(state, d);
    
    // Repopulate simple fields
    const maps = {
      pName: 'name', pTitle: 'title', pEmail: 'email', pPhone: 'phone', 
      pLocation: 'location', pNationality: 'nationality', pDob: 'dob', 
      pLinkedin: 'linkedin', pGithub: 'github', pPortfolio: 'portfolio'
    };
    Object.entries(maps).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if(el && state.personal[key]) el.value = state.personal[key];
    });

    if (state.summary) document.getElementById('pSummary').value = state.summary;
    if (state.refRequest) document.getElementById('refRequest').checked = true;

    // Repopulate dynamic lists
    updatePhotoPreview();
    renderExpList();
    renderEduList();
    renderCertList();
    renderProjList();
    renderVolList();
    renderAwardList();
    renderRefList();
    renderLangList();
    renderSkills('tech');
    renderSkills('soft');
    renderInterests();

    toggleRefRequest(state.refRequest);
    syncPreview()
  } catch (err) {
    toast('Failed to load CV: ' + err.message, 'error')
  }
}

// ── PDF Export ────────────────────────────────────────
function downloadPDF() {
  const element = document.getElementById('cvSheet');
  // Temporary remove box-shadow for clean print
  const originalShadow = element.style.boxShadow;
  element.style.boxShadow = 'none';

  const opt = {
    margin:       0,
    filename:     `${state.personal.name || 'SmartCV'}.pdf`.replace(/\s+/g, '_'),
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  toast('Generating PDF...', 'success');
  
  html2pdf().set(opt).from(element).save().then(() => {
    element.style.boxShadow = originalShadow;
    toast('PDF Downloaded!', 'success');
  }).catch(err => {
    element.style.boxShadow = originalShadow;
    toast('Error generating PDF', 'error');
    console.error(err);
  });
}
window.downloadPDF = downloadPDF;

// ── AI Magic ──────────────────────────────────────────
async function aiGenerate() {
  if (!state.personal.name) { toast('Add your name first', 'warning'); return }
  const btn = document.getElementById('btnAI')
  btn.disabled = true; btn.innerHTML = 'Generating…'
  try {
    const res = await fetch(`${API.replace('/api', '')}/api/ai/summary`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ cv: state })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    state.summary = data.summary
    document.getElementById('pSummary').value = data.summary
    syncPreview()
    toast('Summary generated ✨')
  } catch (err) {
    state.summary = `Dynamic and results-driven professional with expertise in ${state.skills.tech.slice(0,3).join(', ') || 'various technologies'}. Proven track record of delivering high-quality projects like ${state.projects[0]?.title || 'innovative solutions'}. Passionate about continuous learning and contributing to organizational success.`
    document.getElementById('pSummary').value = state.summary
    syncPreview()
    toast('Generated generic summary', 'warning')
  } finally {
    btn.disabled = false; btn.innerHTML = '✦ AI Magic'
  }
}
window.aiGenerate = aiGenerate

// ── Init ─────────────────────────────────────────────
initHeader()
bindInputs()
updateStepView()
syncPreview()
if (EDIT_ID) loadCV(EDIT_ID)