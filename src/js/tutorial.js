/**
 * Lablix - Guided Tutorial
 * Runs on the real board right after calibration: tilt, the void, coins, Crazy Tracy's shoes.
 * Falls and shoe hits are free during the tutorial; the real game starts clean afterwards.
 */

const TUTORIAL_STEPS = ['tilt', 'void', 'coin', 'shoes', 'ready'];
const TUTORIAL_TILT_DISTANCE = 5;      // world units the box must travel in step 1
const TUTORIAL_VOID_MS = 4500;         // how long the "void" step stays up
const TUTORIAL_SHOES = 3;              // shoes Tracy throws in step 4
const TUTORIAL_SHOE_INTERVAL = 2200;   // ms between tutorial shoes (slower than tier 1)
const TUTORIAL_COUNTDOWN = 5;         // seconds of 5-4-3-2-1 before the real game starts

var tutorial = {
    active: false,
    step: -1,
    stepStart: 0,
    distance: 0,
    lastX: 0,
    lastZ: 0,
    shoesThrown: 0,
    hits: 0,
    onDone: null,
    timer: null,
    el: null
};

function isTutorialActive() {
    return tutorial.active;
}

/** The tutorial runs once: after it is completed (or skipped) the game starts straight away. */
function isTutorialDone() {
    try { return localStorage.getItem('lablix_tutorial_done') === '1'; } catch (e) { return false; }
}

function _tutorialText(key) {
    return typeof getText === 'function' ? getText('tutorial', key) : key;
}

function _buildTutorialCard() {
    if (tutorial.el) return tutorial.el;
    var el = document.createElement('div');
    el.id = 'tutorial-card';
    el.className = 'tutorial-card';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
        '<div class="tutorial-top">' +
            '<span class="tutorial-step"></span>' +
            '<button type="button" class="tutorial-skip"></button>' +
        '</div>' +
        '<div class="tutorial-icon" aria-hidden="true"></div>' +
        '<h2 class="tutorial-title"></h2>' +
        '<p class="tutorial-text"></p>' +
        '<div class="tutorial-count hidden" aria-hidden="true"></div>' +
        '<div class="tutorial-progress"><i></i></div>';
    el.querySelector('.tutorial-skip').addEventListener('click', function (e) {
        e.stopPropagation();
        finishTutorial();
    });
    document.getElementById('game-container').appendChild(el);
    tutorial.el = el;
    return el;
}

function _setProgress(fraction) {
    if (!tutorial.el) return;
    var bar = tutorial.el.querySelector('.tutorial-progress');
    var fill = bar.querySelector('i');
    if (fraction === null) {
        bar.classList.add('hidden');
    } else {
        bar.classList.remove('hidden');
        fill.style.width = Math.round(Math.max(0, Math.min(1, fraction)) * 100) + '%';
    }
}

function _renderStep() {
    var el = _buildTutorialCard();
    var name = TUTORIAL_STEPS[tutorial.step];
    var icons = { tilt: '📱', void: '🕳️', coin: '🪙', shoes: '👠', ready: '🏁' };
    var counted = TUTORIAL_STEPS.length - 1; // "ready" is not a numbered step
    el.querySelector('.tutorial-step').textContent = tutorial.step < counted
        ? (tutorial.step + 1) + ' / ' + counted
        : '';
    el.querySelector('.tutorial-skip').textContent = _tutorialText('skip');
    el.querySelector('.tutorial-skip').classList.toggle('hidden', name === 'ready');
    el.querySelector('.tutorial-count').classList.toggle('hidden', name !== 'ready');
    el.querySelector('.tutorial-icon').textContent = icons[name];
    el.querySelector('.tutorial-title').textContent = _tutorialText(name + 'Title');
    el.querySelector('.tutorial-text').textContent = _tutorialText(name + 'Text');
    el.dataset.step = name;
    // restart the entrance animation
    el.classList.remove('visible');
    void el.offsetWidth;
    el.classList.add('visible');
    _setProgress(name === 'tilt' || name === 'shoes' || name === 'void' ? 0 : null);
    _setEdgeWarning(name === 'void');
}

// During the "void" step the (already red) edges turn bright and grow, so the danger line is unmistakable.
// The edges share one material, so its original colour is remembered once.
var _edgeOriginalColor = null;
function _setEdgeWarning(on) {
    if (typeof platformEdges === 'undefined' || !platformEdges.length) return;
    var mat = platformEdges[0].material;
    if (!mat || !mat.color) return;
    if (on) {
        if (_edgeOriginalColor === null) _edgeOriginalColor = mat.color.getHex();
        mat.color.setHex(0xffe066);
    } else if (_edgeOriginalColor !== null) {
        mat.color.setHex(_edgeOriginalColor);
        _edgeOriginalColor = null;
    }
    platformEdges.forEach(function (e) { e.scale.y = on ? 4 : 1; });
}

function _goToStep(i) {
    clearTimeout(tutorial.timer);
    tutorial.step = i;
    tutorial.stepStart = performance.now();
    var name = TUTORIAL_STEPS[i];

    if (name === 'tilt' && gameState.playerBox) {
        tutorial.distance = 0;
        tutorial.lastX = gameState.playerBox.position.x;
        tutorial.lastZ = gameState.playerBox.position.z;
    }
    if (name === 'coin' && typeof spawnCoinAtRandomPosition === 'function') {
        spawnCoinAtRandomPosition();
    }
    if (name === 'shoes') {
        tutorial.shoesThrown = 0;
        tutorial.hits = 0;
        gameState.lastShotTime = performance.now() - TUTORIAL_SHOE_INTERVAL + 1200;
    }
    if (name === 'void') {
        tutorial.timer = setTimeout(function () { _goToStep(i + 1); }, TUTORIAL_VOID_MS);
    }
    _renderStep();
    if (name === 'ready') _countdown(TUTORIAL_COUNTDOWN);
}

function _countdown(n) {
    if (!tutorial.active || !tutorial.el) return;
    if (n <= 0) { finishTutorial(); return; }
    var c = tutorial.el.querySelector('.tutorial-count');
    c.textContent = n;
    c.classList.remove('tick');
    void c.offsetWidth;
    c.classList.add('tick');
    tutorial.timer = setTimeout(function () { _countdown(n - 1); }, 1000);
}

function startTutorial(onDone) {
    tutorial.active = true;
    tutorial.onDone = onDone;
    _goToStep(0);
}

/** Called every frame from the game loop while the tutorial runs. */
function updateTutorial() {
    if (!tutorial.active || !gameState.playerBox) return;
    var name = TUTORIAL_STEPS[tutorial.step];

    if (name === 'tilt' && !gameState.isFalling) {
        var x = gameState.playerBox.position.x, z = gameState.playerBox.position.z;
        tutorial.distance += Math.hypot(x - tutorial.lastX, z - tutorial.lastZ);
        tutorial.lastX = x;
        tutorial.lastZ = z;
        _setProgress(tutorial.distance / TUTORIAL_TILT_DISTANCE);
        if (tutorial.distance >= TUTORIAL_TILT_DISTANCE) _goToStep(tutorial.step + 1);
    } else if (name === 'void') {
        _setProgress((performance.now() - tutorial.stepStart) / TUTORIAL_VOID_MS);
    } else if (name === 'shoes') {
        _setProgress(tutorial.shoesThrown / TUTORIAL_SHOES);
        // step ends once every tutorial shoe has been thrown and has left the board
        if (tutorial.shoesThrown >= TUTORIAL_SHOES && gameState.projectiles.length === 0) {
            _goToStep(tutorial.step + 1);
        }
    }
}

/** Tracy only throws during the shoes step, slowly, and only a few shoes. */
function tutorialShouldShoot(now) {
    if (TUTORIAL_STEPS[tutorial.step] !== 'shoes') return false;
    if (tutorial.shoesThrown >= TUTORIAL_SHOES) return false;
    if (now - gameState.lastShotTime < TUTORIAL_SHOE_INTERVAL) return false;
    tutorial.shoesThrown++;
    return true;
}

function tutorialOnCoin() {
    if (TUTORIAL_STEPS[tutorial.step] === 'coin') _goToStep(tutorial.step + 1);
}

function tutorialOnHit() {
    tutorial.hits++;
    if (!tutorial.el) return;
    var text = tutorial.el.querySelector('.tutorial-text');
    text.textContent = _tutorialText('shoesHit');
    tutorial.el.classList.remove('shake');
    void tutorial.el.offsetWidth;
    tutorial.el.classList.add('shake');
}

/** A fall during the tutorial: let the box drop, then put it back. No lives lost. */
function tutorialOnFall() {
    if (typeof stopAllFx === 'function') stopAllFx();
    if (typeof playFall === 'function') playFall();
    gameState.isFalling = true;
    gameState.fallVelocity = 0;
    gameState.fallRotation.x = (Math.random() - 0.5) * 0.1;
    gameState.fallRotation.z = (Math.random() - 0.5) * 0.1;
    if (typeof clearAllProjectiles === 'function') clearAllProjectiles();

    if (tutorial.el && TUTORIAL_STEPS[tutorial.step] !== 'ready') {
        tutorial.el.querySelector('.tutorial-text').textContent = _tutorialText('fellText');
        tutorial.el.classList.remove('shake');
        void tutorial.el.offsetWidth;
        tutorial.el.classList.add('shake');
    }

    setTimeout(function () {
        if (!tutorial.active) return;
        _respawnBox();
        // the shoes step restarts cleanly after a fall
        var step = TUTORIAL_STEPS[tutorial.step];
        if (step === 'shoes') _goToStep(tutorial.step);
        else if (step !== 'ready') _renderStep();
    }, 1400);
}

function _respawnBox() {
    gameState.isFalling = false;
    gameState.fallVelocity = 0;
    gameState.isOnPlatform = true;
    gameState.velocity = { x: 0, z: 0 };
    if (gameState.playerBox) {
        gameState.playerBox.position.set(0, PLATFORM_ELEVATION + BOX_SIZE / 2 + 0.01, 0);
        gameState.playerBox.quaternion.set(0, 0, 0, 1);
    }
    tutorial.lastX = 0;
    tutorial.lastZ = 0;
    camera.position.set(0, 18, 14);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
}

function finishTutorial() {
    if (!tutorial.active) return;
    clearTimeout(tutorial.timer);
    tutorial.active = false;
    tutorial.step = -1;
    _setEdgeWarning(false);
    if (tutorial.el) {
        tutorial.el.classList.remove('visible');
        tutorial.el.dataset.step = '';
    }
    try { localStorage.setItem('lablix_tutorial_done', '1'); } catch (e) {}

    // clean slate for the real game
    if (gameState.isFalling) _respawnBox();
    if (typeof clearAllProjectiles === 'function') clearAllProjectiles();
    if (typeof resetCombatState === 'function') resetCombatState();
    resetGameState();
    if (typeof resetDifficulty === 'function') resetDifficulty();
    if (typeof resetEnemy === 'function') resetEnemy();
    if (typeof spawnCoinAtRandomPosition === 'function') spawnCoinAtRandomPosition();

    var done = tutorial.onDone;
    tutorial.onDone = null;
    if (typeof done === 'function') done();
}

/** Leaving the game mid-tutorial (EXIT button) must not leave it half-running. */
function abortTutorial() {
    if (!tutorial.active) return;
    clearTimeout(tutorial.timer);
    tutorial.active = false;
    tutorial.step = -1;
    tutorial.onDone = null;
    _setEdgeWarning(false);
    if (tutorial.el) tutorial.el.classList.remove('visible');
}
