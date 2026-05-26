// js/dashboard.js
const API_BASE_URL = 'https://cv-pttb.onrender.com';
const API = `${API_BASE_URL}/api`;
const user = (() => { try { return JSON.parse(localStorage.getItem('sc_user')) } catch { return null } })()
const token = localStorage.getItem('sc_token')

if (!token || !user) { location.href = 'auth.html' }

const TEMPLATE_COLORS = {
  professional: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
  executive: 'linear-gradient(135deg,#374151,#111827)',
  creative: 'linear-gradient(135deg,#7C3AED,#A855F7)',
  modern: 'linear-gradient(135deg,#059669,#10B981)',
  minimal: 'linear-gradient(135deg,#EC4899,#DB2777)',
}

// ── Header ────────────────────────────────────────────
function initHeader() {
  const letter = (user.email?.[0] || 'U').toUpperCase()
  const avatarEl = document.getElementById('headerAvatar')
  const emailEl = document.getElementById('headerEmail')
  if (avatarEl) avatarEl.textContent = letter
  if (emailEl) emailEl.textContent = user.email || ''
}

// ── Toast ─────────────────────────────────────────────
function toast(msg, type = 'success') {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.className = 'toast ' + type + ' show'
  clearTimeout(t._t)
  t._t = setTimeout(() => t.classList.remove('show'), 3500)
}

// ── Format date ───────────────────────────────────────
function fmtDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Completion ring color ─────────────────────────────
function completionColor(pct) {
  if (pct >= 80) return '#059669'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}

// ── Fetch & render CVs ───────────────────────────────
async function loadCVs() {
  const grid = document.getElementById('cvGrid')
  grid.innerHTML = `<div class="loading-state"><div class="spinner-lg"></div><p>Loading your CVs…</p></div>`

  try {
    const res = await fetch(`${API}/cv/user/${user.id}`, {
      headers: { Authorization: 'Bearer ' + token }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)

    const cvs = data.cvs || []
    updateStats(cvs)

    if (!cvs.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="40" height="40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <h2>No CVs yet</h2>
          <p>Create your first CV to get started</p>
          <button class="btn-new" onclick="location.href='builder.html'">+ New CV</button>
        </div>`
      return
    }

    grid.innerHTML = cvs.map((cv, i) => renderCard(cv, i)).join('')

  } catch (err) {
    grid.innerHTML = `<div class="error-state"><p>⚠ ${err.message}</p><button onclick="loadCVs()">Retry</button></div>`
  }
}

function updateStats(cvs) {
  document.getElementById('statTotal').textContent = cvs.length
  document.getElementById('statComplete').textContent = cvs.filter(c => c.completion >= 80).length
  document.getElementById('statDraft').textContent = cvs.filter(c => c.completion < 80).length
}

function renderCard(cv, i) {
  const color = TEMPLATE_COLORS[cv.template] || TEMPLATE_COLORS.professional
  const pct = cv.completion ?? 0
  const ring = completionColor(pct)
  const status = pct >= 80 ? 'Complete' : 'Draft'
  const statusCls = pct >= 80 ? 'badge-complete' : 'badge-draft'

  return `
  <div class="cv-card" style="animation-delay:${i * 0.06}s" data-id="${cv.id}">
    <div class="cv-card-banner" style="background:${color}; cursor:pointer;" onclick="editCV(${cv.id})">
      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="36" height="36">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <span class="badge ${statusCls}">${status}</span>
    </div>

    <div class="cv-card-body" style="cursor:pointer;" onclick="editCV(${cv.id})">
      <h3 class="cv-title">${cv.title || 'Untitled CV'}</h3>
      <p class="cv-sub">${cv.template || 'professional'} template</p>

      <div class="completion-row">
        <div class="completion-bar-wrap">
          <div class="completion-bar" style="width:${pct}%;background:${ring}"></div>
        </div>
        <span class="completion-pct" style="color:${ring}">${pct}%</span>
      </div>

      <p class="cv-date">Updated ${fmtDate(cv.updated_at || cv.created_at)}</p>
    </div>

    <div class="cv-card-footer">
      <button class="card-btn btn-open"   onclick="openCV(${cv.id})"    title="Open">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Open
      </button>
      <button class="card-btn btn-edit"   onclick="editCV(${cv.id})"    title="Edit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Edit
      </button>
      <button class="card-btn btn-export" onclick="exportPDF(${cv.id})" title="Export PDF">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        PDF
      </button>
      <button class="card-btn btn-delete" onclick="confirmDelete(${cv.id},'${(cv.title || '').replace(/'/g, "\\'")}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
      </button>
    </div>
  </div>`
}

// ── Actions ───────────────────────────────────────────
function openCV(id) { location.href = `view.html?id=${id}` }
function editCV(id) { location.href = `builder.html?id=${id}` }
window.openCV = openCV
window.editCV = editCV

function exportPDF(id) {
  // Opens the view page which has a print button
  window.open(`view.html?id=${id}&print=1`, '_blank')
}
window.exportPDF = exportPDF

let deleteTarget = null
function confirmDelete(id, title) {
  deleteTarget = id
  document.getElementById('deleteTitle').textContent = title || 'this CV'
  document.getElementById('deleteOverlay').classList.add('show')
}
window.confirmDelete = confirmDelete

function closeModal() {
  document.getElementById('deleteOverlay').classList.remove('show')
  deleteTarget = null
}
window.closeModal = closeModal

async function doDelete() {
  if (!deleteTarget) return
  try {
    const res = await fetch(`${API}/cv/${deleteTarget}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    })
    if (!res.ok) throw new Error((await res.json()).error)
    toast('CV deleted')
    closeModal()
    loadCVs()
  } catch (err) {
    toast(err.message, 'error')
  }
}
window.doDelete = doDelete

function signOut() {
  localStorage.clear()
  location.href = 'auth.html'
}
window.signOut = signOut

// ── Init ─────────────────────────────────────────────
initHeader()
loadCVs()