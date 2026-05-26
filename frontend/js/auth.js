// js/auth.js
const API_BASE_URL = 'https://cv-pttb.onrender.com';
const API = `${API_BASE_URL}/api`;

// Redirect if already logged in
if (localStorage.getItem('sc_token')) {
    const p = new URLSearchParams(window.location.search);
    location.href = p.get('redirect') === 'review' ? '../index.html?action=review' : 'dashboard.html';
}

function switchTab(tab) {
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login')
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register')
    document.getElementById('panelLogin').classList.toggle('active', tab === 'login')
    document.getElementById('panelRegister').classList.toggle('active', tab === 'register')
    document.getElementById('tagline').textContent =
        tab === 'login' ? 'Sign in to your account' : 'Create your free account'
    document.getElementById('switchText').innerHTML =
        tab === 'login'
            ? `Don't have an account? <button onclick="switchTab('register')">Sign Up</button>`
            : `Already have an account? <button onclick="switchTab('login')">Sign In</button>`
}
window.switchTab = switchTab

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast')
    t.textContent = msg
    t.className = 'toast ' + type + ' show'
    clearTimeout(t._t)
    t._t = setTimeout(() => t.classList.remove('show'), 3500)
}
window.showToast = showToast

function setLoading(btn, on, label) {
    btn.disabled = on
    btn.innerHTML = on ? '<div class="spinner"></div>' : label
}

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }
function showErr(id, on) { document.getElementById(id)?.classList.toggle('show', on) }
function markErr(id, on) { document.getElementById(id)?.classList.toggle('err', on) }

// ── LOGIN ─────────────────────────────────────────────
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim()
    const pass = document.getElementById('loginPass').value
    let ok = true
    if (!validateEmail(email)) { showErr('loginEmailErr', true); markErr('loginEmail', true); ok = false }
    else { showErr('loginEmailErr', false); markErr('loginEmail', false) }
    if (pass.length < 6) { showErr('loginPassErr', true); markErr('loginPass', true); ok = false }
    else { showErr('loginPassErr', false); markErr('loginPass', false) }
    if (!ok) return

    const btn = document.getElementById('btnLogin')
    setLoading(btn, true, 'Sign In')
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        })
        const data = await res.json()
        if (!res.ok) { showToast(data.error || 'Login failed', 'error'); setLoading(btn, false, 'Sign In'); return }

        localStorage.setItem('sc_token', data.access_token)
        localStorage.setItem('sc_user', JSON.stringify(data.user))
        showToast('Welcome back! 🎉')
        setTimeout(() => {
            const p = new URLSearchParams(window.location.search);
            location.href = p.get('redirect') === 'review' ? '../index.html?action=review' : 'dashboard.html';
        }, 800)
    } catch {
        showToast('Cannot connect to server. Is the backend running on port 3000?', 'error')
        setLoading(btn, false, 'Sign In')
    }
}
window.handleLogin = handleLogin

// ── REGISTER ──────────────────────────────────────────
async function handleRegister() {
    const email = document.getElementById('regEmail').value.trim()
    const pass = document.getElementById('regPass').value
    let ok = true
    if (!validateEmail(email)) { showErr('regEmailErr', true); markErr('regEmail', true); ok = false }
    else { showErr('regEmailErr', false); markErr('regEmail', false) }
    if (pass.length < 6) { showErr('regPassErr', true); markErr('regPass', true); ok = false }
    else { showErr('regPassErr', false); markErr('regPass', false) }
    if (!ok) return

    const btn = document.getElementById('btnRegister')
    setLoading(btn, true, 'Create Account')
    try {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        })
        const data = await res.json()
        if (!res.ok) { showToast(data.error || 'Registration failed', 'error'); setLoading(btn, false, 'Create Account'); return }

        showToast('Account created! Signing you in…')
        // Auto-login
        const lr = await fetch(`${API}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        })
        const ld = await lr.json()
        if (lr.ok) {
            localStorage.setItem('sc_token', ld.access_token)
            localStorage.setItem('sc_user', JSON.stringify(ld.user))
        }
        setTimeout(() => {
            const p = new URLSearchParams(window.location.search);
            location.href = p.get('redirect') === 'review' ? '../index.html?action=review' : 'dashboard.html';
        }, 900)
    } catch {
        showToast('Cannot connect to server. Is the backend running on port 3000?', 'error')
        setLoading(btn, false, 'Create Account')
    }
}
window.handleRegister = handleRegister

document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return
    document.getElementById('panelLogin').classList.contains('active') ? handleLogin() : handleRegister()
})