/**
 * Lablix - Input Handling (Gyroscope)
 */

function isMobileDevice() {
    const ua = navigator.userAgent || '';
    const mobile = /android|iphone|ipad|ipod|mobile|tablet/i.test(ua.toLowerCase());
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return mobile || (touch && window.innerWidth < 1024);
}

async function requestGyroPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            return (await DeviceOrientationEvent.requestPermission()) === 'granted';
        } catch (e) { return false; }
    }
    return typeof DeviceOrientationEvent !== 'undefined';
}

function startGyroscope() {
    gameState.gyroReceived = false;
    window.addEventListener('deviceorientation', onDeviceOrientation, true);

    setTimeout(() => {
        if (!gameState.gyroReceived) {
            const el = document.getElementById('gyro-check');
            var notDetected = typeof getText === 'function' ? getText('ui', 'gyroNotDetected') : 'Not detected';
            if (el) { el.textContent = notDetected; el.className = 'error'; }
        }
    }, 2000);
}

function onDeviceOrientation(e) {
    if (e.beta === null && e.gamma === null) return;
    gameState.gyro.beta = e.beta || 0;
    gameState.gyro.gamma = e.gamma || 0;
    gameState.gyroReceived = true;

    if (gameState.currentScreen !== 'calibration') return;

    var beta = gameState.gyro.beta;
    var gamma = gameState.gyro.gamma;
    var isFlat = Math.abs(beta) < 5 && Math.abs(gamma) < 5;

    // Update gyro status text
    var el = document.getElementById('gyro-check');
    if (el) {
        var flatText = typeof getText === 'function' ? getText('ui', 'gyroCheckFlat') : 'Perfect! Phone is level';
        el.textContent = isFlat ? flatText : 'β:' + beta.toFixed(0) + '° γ:' + gamma.toFixed(0) + '°';
        el.className = isFlat ? 'working' : '';
    }

    // Move tilt dot (clamp to circle bounds)
    var dot = document.getElementById('tilt-dot');
    if (dot) {
        var maxOffset = 90; // half of 200px container minus dot radius
        var dx = Math.max(-1, Math.min(1, gamma / 30)) * maxOffset;
        var dy = Math.max(-1, Math.min(1, beta / 30)) * maxOffset;
        dot.style.left = 'calc(50% + ' + dx + 'px)';
        dot.style.top = 'calc(50% + ' + dy + 'px)';
        dot.className = isFlat ? 'tilt-dot centered' : 'tilt-dot';
    }

    // Tilt the phone icon to mirror actual tilt
    var icon = document.getElementById('phone-icon');
    if (icon) {
        icon.style.transform = 'rotate(' + Math.max(-20, Math.min(20, gamma)) + 'deg)';
    }

    // Background color and title
    var screen = document.getElementById('calibration-screen');
    var title = document.getElementById('calibration-title');
    var hint = document.getElementById('tilt-hint');
    var msg = document.getElementById('calibration-msg');

    if (screen) {
        if (isFlat) {
            screen.classList.add('level-ok');
        } else {
            screen.classList.remove('level-ok');
        }
    }

    if (title) {
        var readyText = typeof getText === 'function' ? getText('ui', 'ready') : 'READY!';
        var holdText = typeof getText === 'function' ? getText('ui', 'holdFlat') : 'HOLD FLAT';
        title.textContent = isFlat ? readyText : holdText;
        title.style.color = isFlat ? '#4ade80' : '#fff';
    }

    if (msg) {
        var msgFlat = typeof getText === 'function' ? getText('ui', 'calibrationMsgFlat') : 'Great! This position is your neutral balance point';
        var msgTilt = typeof getText === 'function' ? getText('ui', 'calibrationMsgTilt') : 'Place your phone flat on a table or hold it level';
        msg.textContent = isFlat ? msgFlat : msgTilt;
    }

    if (hint) {
        var hintFlat = typeof getText === 'function' ? getText('ui', 'calibrationHintFlat') : 'Tap START NOW to begin!';
        var hintTilt = typeof getText === 'function' ? getText('ui', 'calibrationHintTilt') : 'Tilt gently until the dot is centered';
        hint.textContent = isFlat ? hintFlat : hintTilt;
    }

    // Show/hide start button
    var btn = document.getElementById('calibrate-button');
    if (btn) {
        if (isFlat) {
            btn.classList.add('calibrate-visible');
            btn.classList.remove('calibrate-hidden');
        } else {
            btn.classList.remove('calibrate-visible');
            btn.classList.add('calibrate-hidden');
        }
    }
}

async function requestWakeLock() {
    // Release any existing lock first
    if (wakeLock) {
        try { await wakeLock.release(); } catch (e) {}
        wakeLock = null;
    }

    // Try Wake Lock API
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake lock acquired');

            // Re-acquire on visibility change
            wakeLock.addEventListener('release', () => {
                console.log('Wake lock released');
                // Try to re-acquire if still playing
                if (gameState.isPlaying && document.visibilityState === 'visible') {
                    requestWakeLock();
                }
            });
            return true;
        } catch (e) {
            console.log('Wake lock failed:', e.message);
        }
    }

    // Fallback: create invisible video to keep screen on
    if (!window._noSleepVideo) {
        const video = document.createElement('video');
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.style.position = 'fixed';
        video.style.top = '-1px';
        video.style.left = '-1px';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0.01';

        // Tiny webm video (transparent 1x1 pixel, 1 second)
        video.src = 'data:video/webm;base64,GkXfowEAAAAAAAAfQoaBAUL3gQFC8oEEQvOBCEKChHdlYm1Ch4EEQoWBAhhTgGcBAAAAAAAB5BFNm3RALE27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEuTbuMU6uEHFO7a1OsggI+7AEAAAAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmAQAAAAAAAEMq17GDD0JATYCMTGF2ZjU4LjI5LjEwMFdBjUxhdmY1OC4yOS4xMDBzpJAAAAAAAAAWVK5rAQAAAAAAACvXsYMPQkBNgIxMYXZmNTguMjkuMTAwV0markup+IGxhdmY1OC4yOS4xMDAAAAAAAA==';

        document.body.appendChild(video);
        window._noSleepVideo = video;
    }

    try {
        await window._noSleepVideo.play();
        console.log('NoSleep video fallback active');
        return true;
    } catch (e) {
        console.log('NoSleep fallback failed:', e.message);
    }

    return false;
}

async function releaseWakeLock() {
    if (wakeLock) {
        try { await wakeLock.release(); } catch (e) {}
        wakeLock = null;
    }

    if (window._noSleepVideo) {
        window._noSleepVideo.pause();
    }
}

async function enterFullscreen() {
    try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
    } catch (e) {}
}

function exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
}

function lockOrientation() {
    if (screen.orientation?.lock) screen.orientation.lock('portrait').catch(() => {});
}

function unlockOrientation() {
    if (screen.orientation?.unlock) screen.orientation.unlock();
}
