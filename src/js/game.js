/**
 * Lablix - Main Game Controller
 * With multilingual support
 */

function init() {
    if (gameState.initialized) return;
    gameState.initialized = true;

    // Initialize language system first
    if (typeof initLanguage === 'function') {
        initLanguage();
    }

    startScreen = document.getElementById('start-screen');
    calibrationScreen = document.getElementById('calibration-screen');
    gameContainer = document.getElementById('game-container');

    gameState.highScore = parseInt(localStorage.getItem('lablix_highscore') || '0');
    document.getElementById('high-score').textContent = gameState.highScore;

    gameState.isMobile = isMobileDevice();

    // Initialize language selector on start screen
    if (typeof initLanguageSelector === 'function') {
        initLanguageSelector();
    }

    // Update all text with current language
    if (typeof updateAllText === 'function') {
        updateAllText();
    }

    if (!gameState.isMobile) {
        document.getElementById('desktop-message').classList.remove('hidden');
        return;
    }

    showScreen('start');

    document.getElementById('start-button').addEventListener('click', onStartClick);
    document.getElementById('calibrate-button').addEventListener('click', onCalibrateClick);
    document.getElementById('calibration-exit-button').addEventListener('click', onCalibrationExitClick);
    document.getElementById('exit-button').addEventListener('click', onExitClick);
}

async function onStartClick() {
    // Start background music on first play (user gesture context)
    if (typeof _startBgm === 'function') _startBgm();

    const hasPermission = await requestGyroPermission();
    if (!hasPermission) {
        const msg = typeof getText === 'function' ? getText('ui', 'gyroPermission') : 'Gyroscope permission is required to play.';
        alert(msg);
        return;
    }

    startGyroscope();
    await new Promise(r => setTimeout(r, 100));
    await enterFullscreen();
    lockOrientation();
    showScreen('calibration');
}

function onCalibrationExitClick() {
    exitFullscreen();
    unlockOrientation();
    window.removeEventListener('deviceorientation', onDeviceOrientation);
    if (typeof _bgm !== 'undefined') _bgm.pause();

    // Reset calibration UI state
    document.getElementById('calibrate-button').classList.remove('calibrate-visible');
    document.getElementById('calibrate-button').classList.add('calibrate-hidden');
    var guide = document.getElementById('calibration-guide');
    if (guide) guide.classList.remove('hidden');
    document.getElementById('calibration-status').classList.add('hidden');
    var screen = document.getElementById('calibration-screen');
    if (screen) screen.classList.remove('level-ok');

    showScreen('start');
}

function onCalibrateClick() {
    // Re-enter fullscreen + lock (user may have exited during calibration)
    enterFullscreen();
    lockOrientation();

    // Resume music if it was paused
    if (typeof _startBgm === 'function') _startBgm();

    document.getElementById('calibrate-button').classList.add('hidden');
    document.getElementById('calibrate-button').classList.remove('calibrate-visible');
    document.getElementById('calibration-guide').classList.add('hidden');
    document.getElementById('calibration-status').classList.remove('hidden');

    // Init FX audio here (direct user gesture context, before setTimeout)
    initFxAudio();

    setTimeout(() => {
        gameState.calibration.beta = gameState.gyro.beta;
        gameState.calibration.gamma = gameState.gyro.gamma;
        startGame();
    }, 1000);
}

function onExitClick() {
    gameState.isPlaying = false;
    releaseWakeLock();
    exitFullscreen();
    unlockOrientation();

    // Stop music and speech
    if (typeof _bgm !== 'undefined') _bgm.pause();
    if (typeof stopSpeech === 'function') stopSpeech();

    window.removeEventListener('deviceorientation', onDeviceOrientation);
    document.getElementById('calibrate-button').classList.remove('hidden');
    document.getElementById('calibrate-button').classList.add('calibrate-hidden');
    document.getElementById('calibrate-button').classList.remove('calibrate-visible');
    var guide = document.getElementById('calibration-guide');
    if (guide) guide.classList.remove('hidden');
    document.getElementById('calibration-status').classList.add('hidden');

    showScreen('start');

    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('lablix_highscore', gameState.highScore);
        document.getElementById('high-score').textContent = gameState.highScore;
    }
}

let visibilityListenerAdded = false;

function startGame() {
    if (typeof THREE === 'undefined') {
        alert('Error: Three.js failed to load.');
        return;
    }

    tempQuaternion = new THREE.Quaternion();
    rotationAxis = new THREE.Vector3();

    initThreeJS();
    showScreen('game');
    resetGameState();

    // Reset camera (fixes skewed view after exit during fall)
    camera.position.set(0, 18, 14);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    createCoin();    // Spawn first coin

    // Create enemy if first time, always reset position
    if (!gameState.enemy) {
        createEnemy();
    }
    resetEnemy();

    // Initialize difficulty UI
    initDifficultyUI();

    // Initialize speech synthesis
    if (typeof initSpeech === 'function') {
        initSpeech();
    }

    requestWakeLock();

    // Only add global listeners once
    if (!visibilityListenerAdded) {
        visibilityListenerAdded = true;
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && gameState.isPlaying) {
                requestWakeLock();
            }
        });

        // Re-enter fullscreen on tap if user exited it during gameplay/calibration
        document.addEventListener('click', () => {
            if (gameState.currentScreen === 'game' || gameState.currentScreen === 'calibration') {
                if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                    enterFullscreen();
                    lockOrientation();
                }
            }
        });
    }

    gameState.isPlaying = true;
    startStepLoop();

    // Grace period: no shooting for 1.5s so player can orient
    gameState.lastShotTime = performance.now() + 500;

    // Enemy taunts immediately at game start
    const startTaunt = getRandomTaunt('general_mockery');
    showTaunt(startTaunt, true);

    animate();
}

function resetGameState() {
    gameState.score = 0;
    gameState.lives = 5;
    gameState.velocity = { x: 0, z: 0 };
    gameState.isOnPlatform = true;
    gameState.isFalling = false;
    gameState.fallVelocity = 0;
    updateUI();

    if (gameState.playerBox) {
        gameState.playerBox.position.set(0, PLATFORM_ELEVATION + BOX_SIZE / 2 + 0.01, 0);
        gameState.playerBox.quaternion.set(0, 0, 0, 1);
    }
}

function restartGame() {
    // Resume background music
    if (typeof _startBgm === 'function') _startBgm();

    // Reset game state
    gameState.isFalling = false;
    gameState.fallVelocity = 0;
    gameState.fallRotation = { x: 0, z: 0 };
    resetGameState();

    // Reset combat state
    resetCombatState();
    clearAllProjectiles();

    // Reset enemy position
    resetEnemy();

    // Reset difficulty
    resetDifficulty();

    // Respawn coin
    createCoin();

    // Re-request wake lock
    requestWakeLock();

    // Fully reset camera (after all state resets, right before animate)
    camera.position.set(0, 18, 14);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    gameState.isPlaying = true;
    startStepLoop();

    // Grace period: no shooting for 1.5s so player can orient
    gameState.lastShotTime = performance.now() + 1500;

    // Enemy taunts immediately on restart
    const startTaunt = getRandomTaunt('general_mockery');
    showTaunt(startTaunt, true);

    animate();
}

function animate() {
    if (!gameState.isPlaying) return;
    requestAnimationFrame(animate);

    // Check if paused for tier-up notification
    const pausedForTierUp = typeof isGamePausedForTierUp === 'function' && isGamePausedForTierUp();

    if (gameState.isFalling) {
        updateFalling();
    } else if (!pausedForTierUp) {
        // Only update gameplay when not paused for tier-up
        updatePhysics();
        updateStepSound();
        checkEnemyCollision(); // Check collision with enemy (solid wall)
        updateCoin();
        updateEnemy();
        checkEnemyShooting();
        updateProjectiles();
        checkProjectileCollisions();
        checkTauntTriggers();
        updateDifficultyUI();
    } else {
        // Still update difficulty UI to track when pause ends
        updateDifficultyUI();
    }

    // Animate background (shooting stars, aliens, etc.)
    updateBackground();

    // Edge pulse animation (always runs for visual continuity)
    const pulse = 0.7 + Math.sin(performance.now() * 0.003) * 0.3;
    platformEdges.forEach(e => e.material.opacity = pulse);

    renderer.render(scene, camera);
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', init);
if (document.readyState !== 'loading') init();
