/**
 * Lablix - UI System
 * With multilingual support
 */

function showScreen(name) {
    gameState.currentScreen = name;
    startScreen.classList.add('hidden');
    calibrationScreen.classList.add('hidden');
    gameContainer.classList.add('hidden');
    document.getElementById('desktop-message').classList.add('hidden');

    if (name === 'start') startScreen.classList.remove('hidden');
    else if (name === 'calibration') calibrationScreen.classList.remove('hidden');
    else if (name === 'game') gameContainer.classList.remove('hidden');
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.querySelectorAll('.heart').forEach((h, i) => {
        h.classList.toggle('lost', i >= gameState.lives);
    });
}

function showGameOver(msg) {
    gameState.isPlaying = false;
    releaseWakeLock();

    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('lablix_highscore', gameState.highScore);
    }

    // Get translated text
    const gameOverTitle = typeof getText === 'function' ? getText('ui', 'gameOver') : 'GAME OVER';
    const scoreLabel = typeof getText === 'function' ? getText('ui', 'score') : 'SCORE';
    const highScoreLabel = typeof getText === 'function' ? getText('ui', 'highScore') : 'High Score';
    const playAgainLabel = typeof getText === 'function' ? getText('ui', 'playAgain') : 'PLAY AGAIN';

    const exitLabel = typeof getText === 'function' ? getText('ui', 'exit') : 'EXIT';

    const overlay = document.createElement('div');
    overlay.id = 'game-over-overlay';
    overlay.innerHTML = `
        <div class="game-over-content">
            <h1 class="game-over-title">${gameOverTitle}</h1>
            <div class="game-over-cause">${msg}</div>
            <div class="game-over-score">${scoreLabel}: ${gameState.score}</div>
            <div class="game-over-highscore">${highScoreLabel}: ${gameState.highScore}</div>
            <button id="restart-button" class="game-button">${playAgainLabel}</button>
            <button id="quit-button" class="game-button secondary">${exitLabel}</button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('restart-button').onclick = () => {
        overlay.remove();
        restartGame();
    };

    document.getElementById('quit-button').onclick = () => {
        overlay.remove();
        onExitClick();
    };
}

// Get translated death message
function getDeathMessage(type) {
    if (typeof getText === 'function') {
        if (type === 'fall') {
            return getText('ui', 'youFell');
        } else if (type === 'hit') {
            return getText('ui', 'youWereHit');
        }
    }
    // Fallback
    return type === 'fall' ? 'You Fell Off!' : 'You Were Hit!';
}
