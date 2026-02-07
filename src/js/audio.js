/**
 * Lablix - FX Audio System
 */

let fxStep, fxWosh, fxHit, fxCoin, fxFall;
let fxInitialized = false;
let stepTimerId = null;

function initFxAudio() {
    if (fxInitialized) return;

    fxStep = new Audio('audio/fx/step.mp3');
    fxWosh = new Audio('audio/fx/wosh.mp3');
    fxHit = new Audio('audio/fx/hit.mp3');
    fxCoin = new Audio('audio/fx/coin.mp3');
    fxFall = new Audio('audio/fx/fall.mp3');

    // Unlock all during user gesture
    [fxStep, fxWosh, fxHit, fxCoin, fxFall].forEach(function(a) {
        a.play().then(function() { a.pause(); a.currentTime = 0; }).catch(function(){});
    });

    fxInitialized = true;
}

function playWosh() {
    if (!fxWosh) return;
    var s = fxWosh.cloneNode();
    s.volume = 0.6;
    s.play().catch(function(){});
}

function playHit() {
    if (!fxHit) return;
    var s = fxHit.cloneNode();
    s.volume = 0.7;
    s.play().catch(function(){});
}

function playCoin() {
    if (!fxCoin) return;
    var s = fxCoin.cloneNode();
    s.volume = 0.5;
    s.play().catch(function(){});
}

function playFall() {
    if (!fxFall) return;
    var s = fxFall.cloneNode();
    s.volume = 0.45;
    s.play().catch(function(){});
}

function startStepLoop() {
    stopStepLoop();
    stepTick();
}

function stopStepLoop() {
    if (stepTimerId) {
        clearTimeout(stepTimerId);
        stepTimerId = null;
    }
}

function stepTick() {
    if (!gameState.isPlaying || gameState.isFalling || !fxStep) {
        stepTimerId = setTimeout(stepTick, 300);
        return;
    }

    var speed = Math.sqrt(
        gameState.velocity.x * gameState.velocity.x +
        gameState.velocity.z * gameState.velocity.z
    );

    // Only play if actually rolling (not gyro noise)
    if (speed > 0.02) {
        var s = fxStep.cloneNode();
        s.volume = 0.5;
        s.play().catch(function(){});

        // Faster = shorter gap (500ms slow, 100ms fast)
        var ratio = Math.min(1, speed / MAX_VELOCITY);
        stepTimerId = setTimeout(stepTick, Math.round(500 - ratio * 400));
    } else {
        // Not rolling — check again soon but don't play
        stepTimerId = setTimeout(stepTick, 200);
    }
}

function updateStepSound() {}

function stopAllFx() {
    stopStepLoop();
}
