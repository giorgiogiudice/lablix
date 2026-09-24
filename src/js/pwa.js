/**
 * Lablix - Offline play & install to home screen
 */

let deferredInstallPrompt = null;

function isStandalone() {
    return window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
}

function isIOS() {
    const ua = navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function showOfflineReady() {
    const el = document.getElementById('offline-status');
    if (el) el.classList.remove('hidden');
}

let swRegistration = null;
let swLastCheck = 0;
const SW_CHECK_EVERY_MS = 10 * 60 * 1000;

/** Ask the server for a newer version (cheap: sw.js is a few KB and never HTTP-cached). */
function checkForUpdate(force) {
    if (!swRegistration || navigator.onLine === false) return;
    const now = Date.now();
    if (!force && now - swLastCheck < 30000) return;
    swLastCheck = now;
    swRegistration.update().catch(() => {});
}

/** A downloaded update is swapped in only while idle on the start screen, never mid-game. */
function applyWaitingUpdate() {
    const reg = swRegistration;
    if (!reg || !reg.waiting || !navigator.serviceWorker.controller) return;
    if (gameState.isPlaying || gameState.currentScreen !== 'start') return;
    sessionStorage.setItem('lablix_sw_update', '1');
    reg.waiting.postMessage('skipWaiting');
}

function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        // The new version took over: reload into it (only ever requested from the idle start screen)
        if (reloading || !sessionStorage.getItem('lablix_sw_update')) return;
        reloading = true;
        sessionStorage.removeItem('lablix_sw_update');
        location.reload();
    });
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
            swRegistration = reg;
            reg.addEventListener('updatefound', () => {
                const sw = reg.installing;
                if (sw) sw.addEventListener('statechange', () => { if (sw.state === 'installed') applyWaitingUpdate(); });
            });
            applyWaitingUpdate();
            checkForUpdate(true);
        }).catch(() => {});
        navigator.serviceWorker.ready.then(showOfflineReady).catch(() => {});
    });
    // Installed apps are often resumed rather than reopened: check again whenever it comes back
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') { checkForUpdate(false); applyWaitingUpdate(); }
    });
    window.addEventListener('online', () => checkForUpdate(true));
    setInterval(() => { if (document.visibilityState === 'visible') checkForUpdate(false); }, SW_CHECK_EVERY_MS);
}

function openInstallHelp() {
    const overlay = document.getElementById('install-help');
    const msg = document.getElementById('install-help-msg');
    if (!overlay || !msg) return;
    const key = isIOS() ? 'installIOS' : 'installGeneric';
    msg.dataset.i18n = 'ui.' + key;
    msg.textContent = getText('ui', key);
    overlay.classList.remove('hidden');
}

function initInstallButton() {
    const btn = document.getElementById('install-button');
    const overlay = document.getElementById('install-help');
    if (!btn) return;

    if (!isStandalone()) btn.classList.remove('hidden');

    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (deferredInstallPrompt) {
            const prompt = deferredInstallPrompt;
            deferredInstallPrompt = null;
            prompt.prompt();
            try {
                const choice = await prompt.userChoice;
                if (choice && choice.outcome === 'accepted') btn.classList.add('hidden');
            } catch (err) {}
            return;
        }
        openInstallHelp();
    });

    if (overlay) {
        overlay.addEventListener('click', () => overlay.classList.add('hidden'));
    }
}

// Registered early: Chrome can fire this before the start screen is built
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
});
window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const btn = document.getElementById('install-button');
    if (btn) btn.classList.add('hidden');
});

initServiceWorker();
