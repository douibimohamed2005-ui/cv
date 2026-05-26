// theme.js - Shared dark mode handler
function applyTheme(isDark) {
    const r = document.documentElement.style;
    // Core colors
    r.setProperty('--tx', isDark ? '#f1f5f9' : '#1a1a2e');
    r.setProperty('--mt', isDark ? '#94a3b8' : '#6b7280');
    r.setProperty('--bd', isDark ? '#334155' : '#e5e7eb');
    r.setProperty('--bg', isDark ? '#0f172a' : '#f8f8fc');
    r.setProperty('--wh', isDark ? '#1e293b' : '#ffffff');
    
    // index.html specific colors
    r.setProperty('--nav-bg', isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, .92)');
    r.setProperty('--hero-bg', isDark ? 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #2e1065 100%)' : 'linear-gradient(160deg, #f0f4ff 0%, #fdf2fc 40%, #ede9fe 70%, #fce7f3 100%)');
    r.setProperty('--btn-bg', isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)');
    r.setProperty('--btn-hover-bg', isDark ? '#1e1b4b' : '#f3f0ff');
    
    // Apply background to body just in case it's overridden
    if (document.body) {
        document.body.style.background = isDark ? '#0f172a' : '#f8f8fc';
        updateIcon(isDark);
    } else {
        // If script runs in <head> before body exists, body will pick up var(--bg) natively if CSS uses it.
        // We'll also attach a listener to make sure it's applied when body loads.
        window.addEventListener('DOMContentLoaded', () => {
            document.body.style.background = isDark ? '#0f172a' : '#f8f8fc';
            updateIcon(isDark);
        });
    }
}

function updateIcon(isDark) {
    const btn = document.getElementById('themeBtn');
    if (btn) {
        btn.innerHTML = isDark 
            ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
            : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    }
}

// Check initial state
let currentTheme = localStorage.getItem('sc_theme') === 'dark';
applyTheme(currentTheme);

// Expose a global toggle function for buttons
window.toggleTheme = function() {
    currentTheme = !currentTheme;
    localStorage.setItem('sc_theme', currentTheme ? 'dark' : 'light');
    applyTheme(currentTheme);
};

// Auto-inject a floating theme button on pages that don't have one
window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('themeBtn')) {
        const style = document.createElement('style');
        style.textContent = `
            .global-theme-btn {
                position: fixed;
                bottom: 24px;
                left: 24px;
                background: var(--nav-bg, var(--wh, #ffffff));
                border: 1.5px solid var(--bd, #e5e7eb);
                width: 44px;
                height: 44px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: var(--mt, #6b7280);
                transition: .2s;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .global-theme-btn:hover {
                color: var(--tx, #1a1a2e);
                border-color: #7C3AED;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);

        const btn = document.createElement('button');
        btn.className = 'global-theme-btn';
        btn.id = 'themeBtn';
        btn.title = 'Toggle Dark Mode';
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>`;
        btn.onclick = window.toggleTheme;
        document.body.appendChild(btn);
    }
});
