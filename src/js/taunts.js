/**
 * Lablix - Taunt System (Phase 8)
 * With Web Speech API for voice taunts and multilingual support
 */

// Taunt cooldown in ms
const TAUNT_COOLDOWN = 1000;
const TAUNT_DISPLAY_TIME = 5000;

// Speech synthesis
let speechEnabled = true;
let speechVoice = null;
let currentAudio = null;
let tauntSpeaking = false;

function initSpeech() {
    if (!('speechSynthesis' in window)) {
        console.log('Speech synthesis not supported');
        speechEnabled = false;
        return;
    }

    // Get voices when available
    if (speechSynthesis.getVoices().length > 0) {
        updateSpeechVoice();
    }
    speechSynthesis.onvoiceschanged = updateSpeechVoice;
}

function updateSpeechVoice() {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return;

    const lang = typeof getLanguage === 'function' ? getLanguage() : 'en';
    const langConfig = LANGUAGES[lang];
    const preferredVoices = langConfig ? langConfig.voices : [];

    // Language codes to match (some devices use different codes)
    const langCodes = {
        'en': ['en-', 'en_'],
        'it': ['it-', 'it_', 'it']
    };
    const prefixes = langCodes[lang] || [lang];

    // Helper to check if voice matches language
    const matchesLang = (voice) => {
        const vl = voice.lang.toLowerCase();
        return prefixes.some(p => vl.startsWith(p));
    };

    // 1. Try preferred voices that match language
    for (const preferred of preferredVoices) {
        const found = voices.find(v => v.name.includes(preferred) && matchesLang(v));
        if (found) {
            speechVoice = found;
            console.log('Selected preferred voice:', found.name, found.lang);
            return;
        }
    }

    // 2. Any voice matching the language
    const langVoices = voices.filter(matchesLang);
    if (langVoices.length > 0) {
        // Prefer female voices for the enemy character
        speechVoice = langVoices.find(v =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('woman') ||
            v.name.toLowerCase().includes('alice') ||
            v.name.toLowerCase().includes('samantha')
        ) || langVoices[0];
        console.log('Selected language voice:', speechVoice.name, speechVoice.lang);
        return;
    }

    // 3. Ultimate fallback: English or first available
    speechVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    console.log('Fallback voice:', speechVoice?.name || 'default');
}

function speakTaunt(text) {
    if (!text) return;

    const lang = typeof getLanguage === 'function' ? getLanguage() : 'en';

    // Italian: play pre-generated MP3 if available
    if (lang === 'it' && typeof TAUNTS_AUDIO !== 'undefined' && TAUNTS_AUDIO[text]) {
        stopSpeech();
        tauntSpeaking = true;
        currentAudio = new Audio(TAUNTS_AUDIO[text]);
        currentAudio.volume = 0.85;
        currentAudio.onended = () => { tauntSpeaking = false; };
        currentAudio.onerror = () => { tauntSpeaking = false; };
        currentAudio.play().catch(() => { tauntSpeaking = false; });
        return;
    }

    // English / fallback: use Web Speech API
    if (!speechEnabled) return;
    if (!('speechSynthesis' in window)) return;

    speechSynthesis.cancel();
    tauntSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.2;
    utterance.volume = 0.8;
    utterance.onend = () => { tauntSpeaking = false; };
    utterance.onerror = () => { tauntSpeaking = false; };

    const langMap = { en: 'en-US', it: 'it-IT' };
    utterance.lang = langMap[lang] || 'en-US';

    if (speechVoice) {
        utterance.voice = speechVoice;
    }

    speechSynthesis.speak(utterance);
}

function stopSpeech() {
    tauntSpeaking = false;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
}

// Per-category taunt tracking via localStorage — no repeats until all used
function getPlayedTaunts(category) {
    try {
        var data = JSON.parse(localStorage.getItem('lablix_taunts_played') || '{}');
        return data[category] || [];
    } catch(e) { return []; }
}

function markTauntPlayed(category, index) {
    try {
        var data = JSON.parse(localStorage.getItem('lablix_taunts_played') || '{}');
        if (!data[category]) data[category] = [];
        data[category].push(index);
        localStorage.setItem('lablix_taunts_played', JSON.stringify(data));
    } catch(e) {}
}

function resetCategoryPlayed(category) {
    try {
        var data = JSON.parse(localStorage.getItem('lablix_taunts_played') || '{}');
        delete data[category];
        localStorage.setItem('lablix_taunts_played', JSON.stringify(data));
    } catch(e) {}
}

function getRandomTaunt(category) {
    if (typeof TAUNTS_DATA === 'undefined') return null;
    var lang = typeof getLanguage === 'function' ? getLanguage() : 'en';
    var cat = TAUNTS_DATA[category];
    if (!cat) return null;
    var taunts = cat[lang] || cat['en'];
    if (!taunts || taunts.length === 0) return null;

    var played = getPlayedTaunts(category);

    // Build list of unplayed indices
    var available = [];
    for (var i = 0; i < taunts.length; i++) {
        if (played.indexOf(i) === -1) available.push(i);
    }

    // All played — reset and use full list
    if (available.length === 0) {
        resetCategoryPlayed(category);
        available = [];
        for (var j = 0; j < taunts.length; j++) available.push(j);
    }

    var pick = available[Math.floor(Math.random() * available.length)];
    markTauntPlayed(category, pick);
    return taunts[pick];
}

function showTaunt(text, force) {
    if (!text) return;

    const now = performance.now();

    // Normal taunts must wait for current speech to finish
    if (!force && tauntSpeaking) return;

    // Check cooldown (force bypasses)
    if (!force && now - gameState.lastTauntTime < TAUNT_COOLDOWN) return;
    gameState.lastTauntTime = now;

    // Remove existing taunt
    hideTaunt();

    // Create speech bubble
    const bubble = document.createElement('div');
    bubble.id = 'enemy-taunt';
    bubble.className = 'speech-bubble';
    bubble.textContent = text;

    document.getElementById('game-container').appendChild(bubble);
    gameState.currentTaunt = bubble;

    // Speak the taunt
    speakTaunt(text);

    // Animate in
    requestAnimationFrame(() => {
        bubble.classList.add('visible');
    });

    // Auto-hide after display time
    setTimeout(() => {
        hideTaunt();
    }, TAUNT_DISPLAY_TIME);
}

function hideTaunt() {
    const existing = document.getElementById('enemy-taunt');
    if (existing) {
        existing.classList.remove('visible');
        setTimeout(() => existing.remove(), 300);
    }
    gameState.currentTaunt = null;
}

function triggerTaunt(category) {
    const taunt = getRandomTaunt(category);
    showTaunt(taunt);
}

// Check for taunt triggers based on game state
function checkTauntTriggers() {
    if (!gameState.isPlaying || gameState.isFalling) return;
    if (!gameState.playerBox) return;

    const now = performance.now();
    if (now - gameState.lastTauntTime < TAUNT_COOLDOWN) return;

    const px = gameState.playerBox.position.x;
    const pz = gameState.playerBox.position.z;
    const hw = PLATFORM_WIDTH / 2;
    const hd = PLATFORM_DEPTH / 2;

    // Edge margin (15% of platform size)
    const edgeMargin = Math.min(hw, hd) * 0.15;

    // Check edge proximity
    const nearEdge = (
        px < -hw + edgeMargin ||
        px > hw - edgeMargin ||
        pz < -hd + edgeMargin ||
        pz > hd - edgeMargin
    );

    if (nearEdge) {
        triggerTaunt('edge_proximity');
        return;
    }

    // Check reckless movement (high velocity)
    const speed = Math.sqrt(
        gameState.velocity.x ** 2 +
        gameState.velocity.z ** 2
    );

    if (speed > MAX_VELOCITY * 0.8) {
        if (Math.random() < 0.05) {
            triggerTaunt('reckless_movement');
            return;
        }
    }

    // Check near death
    if (gameState.lives === 1 && Math.random() < 0.015) {
        triggerTaunt('near_death');
        return;
    }

    // Random general mockery
    const tauntChance = typeof getTauntChanceForTier === 'function' ? getTauntChanceForTier() : 0.001;
    if (Math.random() < tauntChance) {
        triggerTaunt('general_mockery');
    }
}

function triggerFallTaunt() {
    // Force interrupt — fall is critical
    const taunt = getRandomTaunt('fall_off_edge');
    showTaunt(taunt, true);
}

function triggerHitTaunt() {
    // Don't interrupt ongoing taunt — only fall/death can interrupt
    const taunt = getRandomTaunt('after_hit');
    showTaunt(taunt);
}

function triggerDeathTaunt() {
    // Force interrupt — death is critical
    const taunt = getRandomTaunt('final_death');
    showTaunt(taunt, true);
}
