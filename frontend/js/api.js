// js/api.js  ─  Shared API helper
// Import this in every page:  <script src="../js/api.js"></script>

const API = 'http://localhost:3000/api'

// ── Auth helpers ──────────────────────────────────────
export function getToken() { return localStorage.getItem('sc_token') }
export function getUser() {
    try { return JSON.parse(localStorage.getItem('sc_user')) } catch { return null }
}
export function isLoggedIn() { return !!getToken() }

export function logout() {
    localStorage.removeItem('sc_token')
    localStorage.removeItem('sc_user')
    location.href = '../html/auth.html'
}

// ── Base fetch with auth header ───────────────────────
async function apiFetch(url, options = {}) {
    const token = getToken()
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (token) headers['Authorization'] = 'Bearer ' + token

    const res = await fetch(API + url, { ...options, headers })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
}

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
    register: (email, password) =>
        apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
    login: (email, password) =>
        apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => apiFetch('/auth/me'),
}

// ── Profile ───────────────────────────────────────────
export const profileAPI = {
    get: (userId) => apiFetch(`/profile/${userId}`),
    update: (userId, data) =>
        apiFetch(`/profile/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
    uploadImage: (formData) => {
        const token = getToken()
        return fetch(API + '/profile/upload-image', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token },
            body: formData, // DO NOT set Content-Type — browser sets multipart boundary
        }).then(r => r.json())
    },
}

// ── CVs ───────────────────────────────────────────────
export const cvAPI = {
    create: (data) =>
        apiFetch('/cv/create', { method: 'POST', body: JSON.stringify(data) }),
    getAll: (userId) => apiFetch(`/cv/user/${userId}`),
    getOne: (id) => apiFetch(`/cv/${id}`),
    update: (id, data) =>
        apiFetch(`/cv/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) =>
        apiFetch(`/cv/${id}`, { method: 'DELETE' }),
}

// ── Utility: redirect if not logged in ───────────────
export function requireLogin() {
    if (!isLoggedIn()) {
        location.href = '../html/auth.html'
        return false
    }
    return true
}

// ── Utility: format date ─────────────────────────────
export function fmtDate(dt) {
    if (!dt) return '—'
    return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Utility: toast ────────────────────────────────────
export function toast(msg, type = 'success') {
    let el = document.getElementById('_toast')
    if (!el) {
        el = document.createElement('div')
        el.id = '_toast'
        el.style.cssText = `position:fixed;top:24px;right:24px;z-index:9999;padding:12px 20px;
      border-radius:12px;font:600 14px 'Plus Jakarta Sans',sans-serif;color:#fff;
      box-shadow:0 8px 24px rgba(0,0,0,.2);transition:.3s;transform:translateX(120%)`
        document.body.appendChild(el)
    }
    el.textContent = msg
    el.style.background = type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#059669'
    el.style.transform = 'translateX(0)'
    clearTimeout(el._t)
    el._t = setTimeout(() => { el.style.transform = 'translateX(120%)' }, 3500)
}