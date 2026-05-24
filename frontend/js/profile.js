// js/profile.js
const API = 'http://localhost:3000/api'
const token = localStorage.getItem('sc_token')
const user = (() => { try { return JSON.parse(localStorage.getItem('sc_user')) } catch { return null } })()
if (!token || !user) location.href = 'auth.html'

function toast(msg, type = 'success') {
    const t = document.getElementById('toast')
    if (!t) return
    t.textContent = msg; t.className = 'toast ' + type + ' show'
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3500)
}

// ── Header ────────────────────────────────────────────
function initHeader() {
    const letter = (user.email?.[0] || 'U').toUpperCase()
    const a = document.getElementById('headerAvatar')
    const e = document.getElementById('headerEmail')
    if (a) a.textContent = letter
    if (e) e.textContent = user.email || ''
}

// ── Load profile ──────────────────────────────────────
async function loadProfile() {
    try {
        const res = await fetch(`${API}/profile/${user.id}`, { headers: { Authorization: 'Bearer ' + token } })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        const p = data.profile
        document.getElementById('pFullName').value = p.full_name || ''
        document.getElementById('pBio').value = p.bio || ''
        document.getElementById('pPhone').value = p.phone || ''
        document.getElementById('pAddress').value = p.address || ''
        document.getElementById('pRole').value = p.role || ''
        document.getElementById('pEmail').textContent = p.email || user.email || ''

        if (p.avatar_url) {
            const avatarImg = document.getElementById('avatarImg')
            const avatarInitial = document.getElementById('avatarInitial')
            if (avatarImg) { avatarImg.src = `http://localhost:3000${p.avatar_url}`; avatarImg.style.display = 'block' }
            if (avatarInitial) avatarInitial.style.display = 'none'
        }
    } catch (err) {
        toast('Failed to load profile: ' + err.message, 'error')
    }
}

// ── Save profile ──────────────────────────────────────
async function saveProfile() {
    const payload = {
        full_name: document.getElementById('pFullName').value.trim(),
        bio: document.getElementById('pBio').value.trim(),
        phone: document.getElementById('pPhone').value.trim(),
        address: document.getElementById('pAddress').value.trim(),
        role: document.getElementById('pRole').value.trim(),
    }
    const btn = document.getElementById('btnSave')
    btn.disabled = true; btn.textContent = 'Saving…'
    try {
        const res = await fetch(`${API}/profile/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast('Profile saved ✓')
    } catch (err) {
        toast('Save failed: ' + err.message, 'error')
    } finally {
        btn.disabled = false; btn.textContent = 'Save Changes'
    }
}
window.saveProfile = saveProfile

// ── Upload avatar ─────────────────────────────────────
function triggerUpload() { document.getElementById('avatarInput').click() }
window.triggerUpload = triggerUpload

async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast('Image must be under 3MB', 'error'); return }

    const formData = new FormData()
    formData.append('avatar', file)

    const btn = document.getElementById('btnUpload')
    if (btn) { btn.disabled = true; btn.textContent = 'Uploading…' }

    try {
        const res = await fetch(`${API}/profile/upload-image`, {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token },
            body: formData
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        // Show new avatar
        const avatarImg = document.getElementById('avatarImg')
        const avatarInitial = document.getElementById('avatarInitial')
        if (avatarImg) {
            avatarImg.src = `http://localhost:3000${data.avatar_url}?t=${Date.now()}`
            avatarImg.style.display = 'block'
        }
        if (avatarInitial) avatarInitial.style.display = 'none'
        toast('Profile photo updated ✓')
    } catch (err) {
        toast('Upload failed: ' + err.message, 'error')
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Change Photo' }
    }
}
window.handleAvatarUpload = handleAvatarUpload

function signOut() { localStorage.clear(); location.href = 'auth.html' }
window.signOut = signOut

initHeader()
loadProfile()