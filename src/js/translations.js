/**
 * Lablix - Multilingual Translation System
 */

const LANGUAGES = {
    en: {
        code: 'en',
        name: 'English',
        flag: '🇬🇧',
        voices: ['Google US English', 'Google UK English Female', 'Microsoft Aria Online (Natural)', 'Samantha']
    },
    it: {
        code: 'it',
        name: 'Italiano',
        flag: '🇮🇹',
        voices: ['Google italiano', 'Microsoft Elsa', 'Alice', 'Federica']
    }
};

const TRANSLATIONS = {
    // UI Text
    ui: {
        title: {
            en: 'LABLIX',
            it: 'LABLIX'
        },
        tagline: {
            en: "Tilt to survive. Don't fall.",
            it: "Inclina per sopravvivere. Non cadere."
        },
        instruction1: {
            en: 'Tilt your phone to move',
            it: 'Inclina il telefono per muoverti'
        },
        instruction2: {
            en: "Don't fall off the edge",
            it: "Non cadere dal bordo"
        },
        instruction3: {
            en: 'Collect coins to score',
            it: 'Raccogli monete per fare punti'
        },
        calibrationHint: {
            en: 'This position will be your neutral (no tilt)',
            it: 'Questa posizione sarà la tua posizione neutra (senza inclinazione)'
        },
        play: {
            en: 'PLAY',
            it: 'GIOCA'
        },
        highScore: {
            en: 'High Score',
            it: 'Record'
        },
        score: {
            en: 'SCORE',
            it: 'PUNTI'
        },
        lives: {
            en: 'Lives',
            it: 'Vite'
        },
        calibrate: {
            en: 'CALIBRATE',
            it: 'CALIBRA'
        },
        calibrating: {
            en: 'Calibrating...',
            it: 'Calibrazione...'
        },
        calibrationInstructions: {
            en: 'Hold your device flat and steady',
            it: 'Tieni il dispositivo piatto e fermo'
        },
        exit: {
            en: 'EXIT',
            it: 'ESCI'
        },
        gameOver: {
            en: 'GAME OVER',
            it: 'FINE PARTITA'
        },
        youFell: {
            en: 'You Fell Off!',
            it: 'Sei Caduto!'
        },
        youWereHit: {
            en: 'You Were Hit!',
            it: 'Sei Stato Colpito!'
        },
        playAgain: {
            en: 'PLAY AGAIN',
            it: 'RIGIOCA'
        },
        mobileOnly: {
            en: 'This game requires a mobile device with gyroscope.',
            it: 'Questo gioco richiede un dispositivo mobile con giroscopio.'
        },
        gyroPermission: {
            en: 'Gyroscope permission is required to play.',
            it: 'È necessario il permesso del giroscopio per giocare.'
        },
        // Difficulty tiers
        tierLabel: {
            en: 'TIER',
            it: 'LIVELLO'
        },
        difficultyEasy: {
            en: 'EASY',
            it: 'FACILE'
        },
        difficultyMedium: {
            en: 'MEDIUM',
            it: 'MEDIO'
        },
        difficultyHard: {
            en: 'HARD',
            it: 'DIFFICILE'
        },
        difficultyBrutal: {
            en: 'BRUTAL',
            it: 'BRUTALE'
        },
        difficultyIncreased: {
            en: 'DIFFICULTY INCREASED',
            it: 'DIFFICOLTÀ AUMENTATA'
        },
        // Calibration screen
        holdFlat: {
            en: 'HOLD FLAT',
            it: 'TIENI PIATTO'
        },
        ready: {
            en: 'READY!',
            it: 'PRONTO!'
        },
        calibrationMsgFlat: {
            en: 'Great! This position is your neutral balance point',
            it: 'Perfetto! Questa posizione è il tuo punto di equilibrio'
        },
        calibrationMsgTilt: {
            en: 'Place your phone flat on a table or hold it level',
            it: 'Tieni il telefono in piano, come se volessi fotografare i piedi'
        },
        calibrationHintFlat: {
            en: 'Tap START NOW to begin!',
            it: 'Tocca INIZIA ORA per cominciare!'
        },
        calibrationHintTilt: {
            en: 'Tilt gently until the dot is centered',
            it: 'Inclina piano fino a centrare il punto'
        },
        gyroCheckFlat: {
            en: 'Perfect! Phone is level',
            it: 'Perfetto! Il telefono è in piano'
        },
        gyroNotDetected: {
            en: 'Not detected',
            it: 'Non rilevato'
        },
        gyroWaiting: {
            en: 'Waiting for gyroscope...',
            it: 'In attesa del giroscopio...'
        },
        startNow: {
            en: 'START NOW',
            it: 'INIZIA ORA'
        }
    }
};

// Current language
let currentLanguage = 'en';

function initLanguage() {
    // Check localStorage first
    const saved = localStorage.getItem('lablix_language');
    if (saved && LANGUAGES[saved]) {
        currentLanguage = saved;
        return;
    }

    // Detect browser language
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();

    if (LANGUAGES[langCode]) {
        currentLanguage = langCode;
    } else {
        currentLanguage = 'en';
    }

    localStorage.setItem('lablix_language', currentLanguage);
}

function setLanguage(langCode) {
    if (!LANGUAGES[langCode]) return;
    currentLanguage = langCode;
    localStorage.setItem('lablix_language', currentLanguage);
    updateAllText();
    updateVoiceForLanguage();
}

function getLanguage() {
    return currentLanguage;
}

function getText(category, key) {
    const cat = TRANSLATIONS[category];
    if (!cat) return key;
    const item = cat[key];
    if (!item) return key;
    return item[currentLanguage] || item['en'] || key;
}

function getTaunt(category) {
    if (typeof TAUNTS_DATA === 'undefined') return null;
    const cat = TAUNTS_DATA[category];
    if (!cat) return null;

    const taunts = cat[currentLanguage] || cat['en'];
    if (!taunts || taunts.length === 0) return null;
    return taunts[Math.floor(Math.random() * taunts.length)];
}

function getDifficultyTaunt(tier) {
    if (typeof TAUNTS_DATA === 'undefined') return null;
    const taunts = TAUNTS_DATA.difficulty_increase[tier];
    if (!taunts) return null;
    const pool = taunts[currentLanguage] || taunts['en'];
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

function updateAllText() {
    // Update all UI elements with data-i18n="category.key" attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const parts = el.dataset.i18n.split('.');
        if (parts.length === 2) {
            el.textContent = getText(parts[0], parts[1]);
        }
    });

    // Update all UI elements with data-i18n-key="key" attribute (uses 'ui' category)
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.dataset.i18nKey;
        el.textContent = getText('ui', key);
    });

    // Update language selector display
    const selector = document.getElementById('language-selector');
    if (selector) {
        const lang = LANGUAGES[currentLanguage];
        const display = selector.querySelector('.lang-display');
        if (display) {
            display.innerHTML = `${lang.flag} ${lang.name}`;
        }
    }
}

function initLanguageSelector() {
    const selector = document.getElementById('language-selector');
    if (!selector) return;

    const display = selector.querySelector('.lang-display');
    const options = selector.querySelectorAll('.lang-option');

    // Update display with current language
    const lang = LANGUAGES[currentLanguage];
    if (display && lang) {
        display.textContent = `${lang.flag} ${lang.name}`;
    }

    // Update selected state
    options.forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.lang === currentLanguage);
    });

    // Toggle dropdown on click
    if (display) {
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            selector.classList.toggle('open');
        });
    }

    // Select language on option click
    options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const langCode = opt.dataset.lang;
            setLanguage(langCode);
            selector.classList.remove('open');

            // Update display
            const newLang = LANGUAGES[langCode];
            if (display && newLang) {
                display.textContent = `${newLang.flag} ${newLang.name}`;
            }

            // Update selected state
            options.forEach(o => o.classList.toggle('selected', o.dataset.lang === langCode));
        });
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!selector.contains(e.target)) {
            selector.classList.remove('open');
        }
    });
}

function updateVoiceForLanguage() {
    // This will be called to update the speech voice
    if (typeof updateSpeechVoice === 'function') {
        updateSpeechVoice();
    }
}
