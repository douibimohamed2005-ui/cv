// js/view.js
const API = 'http://localhost:3000/api'
const token = localStorage.getItem('sc_token')
const user = (() => { try { return JSON.parse(localStorage.getItem('sc_user')) } catch { return null } })()
if (!token || !user) location.href = 'auth.html'

const params = new URLSearchParams(location.search)
const CV_ID = params.get('id')
const PRINT = params.get('print') === '1'
if (!CV_ID) location.href = 'dashboard.html'

function toast(msg, type = 'success') {
    const t = document.getElementById('toast')
    if (!t) return
    t.textContent = msg; t.className = 'toast ' + type + ' show'
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3500)
}

async function loadAndRender() {
    try {
        const res = await fetch(`${API}/cv/${CV_ID}`, { headers: { Authorization: 'Bearer ' + token } })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        const cv = data.cv
        const d = cv.data || {}
        const p = d.personal || {}

        // Set page title
        document.title = (p.name || cv.title || 'CV') + ' – SmartCV'
        document.getElementById('cvPageTitle').textContent = cv.title || 'Untitled CV'

        // Render professional CV
        const contacts = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean)
        document.getElementById('cvRender').innerHTML = `
      <div class="cv-header-block">
        <h1 class="cv-full-name">${p.name || 'Your Name'}</h1>
        <div class="cv-contact-row">${contacts.map(c => `<span>${c}</span>`).join('<span class="dot">·</span>')}</div>
      </div>
      <hr class="cv-hr"/>

      ${d.summary ? `
        <section class="cv-section">
          <div class="cv-section-title">Professional Summary</div>
          <p class="cv-text">${d.summary}</p>
        </section>`: ''}

      ${(d.experience || []).length ? `
        <section class="cv-section">
          <div class="cv-section-title">Work Experience</div>
          ${(d.experience || []).map(e => `
            <div class="cv-exp-block">
              <div class="cv-exp-row">
                <div>
                  <div class="cv-exp-title">${e.position || '—'}</div>
                  <div class="cv-exp-company">${e.company || ''}</div>
                </div>
                <div class="cv-exp-dates">${e.startDate || ''} – ${e.current ? 'Present' : e.endDate || ''}</div>
              </div>
              ${e.description ? `<p class="cv-exp-desc">${e.description}</p>` : ''}
            </div>`).join('')}
        </section>`: ''}

      ${(d.education || []).length ? `
        <section class="cv-section">
          <div class="cv-section-title">Education</div>
          ${(d.education || []).map(e => `
            <div class="cv-edu-row">
              <div>
                <div class="cv-exp-title">${e.degree || ''} ${e.field ? 'in ' + e.field : ''}</div>
                <div class="cv-exp-company">${e.institution || ''} ${e.gpa ? '· GPA: ' + e.gpa : ''}</div>
              </div>
              <div class="cv-exp-dates">${e.startDate || ''} ${e.endDate ? '– ' + e.endDate : ''}</div>
            </div>`).join('')}
        </section>`: ''}

      ${(d.skills || []).length ? `
        <section class="cv-section">
          <div class="cv-section-title">Skills</div>
          <div class="cv-skills">${(d.skills || []).map(s => `<span class="cv-skill-pill">${s}</span>`).join('')}</div>
        </section>`: ''}
    `
        if (PRINT) setTimeout(() => window.print(), 600)
    } catch (err) {
        document.getElementById('cvRender').innerHTML = `<p style="color:red;padding:40px">Error: ${err.message}</p>`
    }
}

function editCV() { location.href = `builder.html?id=${CV_ID}` }
function downloadPDF() { window.print() }
function goBack() { location.href = 'dashboard.html' }
window.editCV = editCV; window.downloadPDF = downloadPDF; window.goBack = goBack

function signOut() { localStorage.clear(); location.href = 'auth.html' }
window.signOut = signOut

// Init header
const user2 = user
const letter = (user2?.email?.[0] || 'U').toUpperCase()
document.addEventListener('DOMContentLoaded', () => {
    const a = document.getElementById('headerAvatar')
    const e = document.getElementById('headerEmail')
    if (a) a.textContent = letter
    if (e) e.textContent = user2?.email || ''
    loadAndRender()
})