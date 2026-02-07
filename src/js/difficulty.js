/**
 * Lablix - Progressive Difficulty System (Phase 11)
 * With multilingual support
 */

// Difficulty tier configuration
const DIFFICULTY_CONFIG = {
    1: {
        nameKey: 'difficultyEasy',
        color: '#4ade80',
        fireRate: 5000,
        accuracy: 0.3,
        enemySpeed: 0.02,
        projectileSpeed: 0.10,
        tauntChance: 0.004
    },
    2: {
        nameKey: 'difficultyMedium',
        color: '#fbbf24',
        fireRate: 3000,
        accuracy: 0.5,
        enemySpeed: 0.03,
        projectileSpeed: 0.12,
        tauntChance: 0.005
    },
    3: {
        nameKey: 'difficultyHard',
        color: '#f97316',
        fireRate: 2000,
        accuracy: 0.7,
        enemySpeed: 0.04,
        projectileSpeed: 0.14,
        tauntChance: 0.006
    },
    4: {
        nameKey: 'difficultyBrutal',
        color: '#ef4444',
        fireRate: 1500,
        accuracy: 0.9,
        enemySpeed: 0.05,
        projectileSpeed: 0.16,
        tauntChance: 0.008
    }
};

// Score thresholds for each tier
const TIER_THRESHOLDS = [0, 6, 16, 31]; // Tier 1: 0-5, Tier 2: 6-15, Tier 3: 16-30, Tier 4: 31+

let lastDisplayedTier = 0;
let difficultyIndicator = null;

function calculateDifficultyTier() {
    const score = gameState.score;
    if (score >= TIER_THRESHOLDS[3]) return 4;
    if (score >= TIER_THRESHOLDS[2]) return 3;
    if (score >= TIER_THRESHOLDS[1]) return 2;
    return 1;
}

function getDifficultyConfig() {
    const tier = calculateDifficultyTier();
    return DIFFICULTY_CONFIG[tier];
}

function getDifficultyName(tier) {
    const config = DIFFICULTY_CONFIG[tier];
    if (typeof getText === 'function') {
        return getText('ui', config.nameKey);
    }
    // Fallback
    const fallbacks = { 1: 'EASY', 2: 'MEDIUM', 3: 'HARD', 4: 'BRUTAL' };
    return fallbacks[tier];
}

function initDifficultyUI() {
    // Create difficulty indicator if it doesn't exist
    if (!difficultyIndicator) {
        difficultyIndicator = document.createElement('div');
        difficultyIndicator.id = 'difficulty-indicator';
    }

    const container = document.getElementById('game-container');
    if (container && !document.getElementById('difficulty-indicator')) {
        container.appendChild(difficultyIndicator);
    }

    updateDifficultyUI();
}

function updateDifficultyUI() {
    const tier = calculateDifficultyTier();
    const config = DIFFICULTY_CONFIG[tier];

    if (!difficultyIndicator) return;

    const tierLabel = typeof getText === 'function' ? getText('ui', 'tierLabel') : 'TIER';
    const tierName = getDifficultyName(tier);

    // Update tier display
    difficultyIndicator.className = `tier-${tier}`;
    difficultyIndicator.innerHTML = `<span class="tier-label">${tierLabel} ${tier}</span><span class="tier-name">${tierName}</span>`;
    difficultyIndicator.style.borderColor = config.color;
    difficultyIndicator.style.color = config.color;

    // Check if tier increased
    if (tier > lastDisplayedTier && lastDisplayedTier > 0) {
        onDifficultyIncrease(tier, config);
    }

    lastDisplayedTier = tier;
    gameState.difficultyTier = tier;
}

let gamePausedForTierUp = false;
let tierUpShootCooldown = 0;

function onDifficultyIncrease(tier, config) {
    // Pause the game during tier-up
    gamePausedForTierUp = true;

    // Clear all projectiles so no shoe hits the player when the game resumes
    if (typeof clearAllProjectiles === 'function') {
        clearAllProjectiles();
    }

    // Reset player velocity so they start stable
    gameState.velocity.x = 0;
    gameState.velocity.z = 0;

    // Move enemy to the far corner opposite the player for breathing room
    if (gameState.enemy && gameState.playerBox) {
        const hw = PLATFORM_WIDTH / 2 - ENEMY_SAFE_MARGIN;
        const hd = PLATFORM_DEPTH / 2 - ENEMY_SAFE_MARGIN;
        const px = gameState.playerBox.position.x;
        const pz = gameState.playerBox.position.z;
        const farX = px >= 0 ? -hw : hw;
        const farZ = pz >= 0 ? -hd : hd;
        gameState.enemy.position.x = farX;
        gameState.enemy.position.z = farZ;
        gameState.enemy.userData.targetX = farX;
        gameState.enemy.userData.targetZ = farZ;
    }

    // Show tier up notification
    showTierUpNotification(tier, config);

    // Visual feedback - flash the indicator
    if (difficultyIndicator) {
        difficultyIndicator.classList.add('tier-up');
        setTimeout(function() {
            difficultyIndicator.classList.remove('tier-up');
        }, 1000);
    }

    // Wait for current taunt to finish, then play tier-up taunt, then resume
    waitForTauntThenPlayTierUp(tier);
}

function waitForTauntThenPlayTierUp(tier) {
    if (tauntSpeaking) {
        setTimeout(function() { waitForTauntThenPlayTierUp(tier); }, 100);
        return;
    }

    // Current taunt done — now play the difficulty taunt
    var taunt = typeof getDifficultyTaunt === 'function' ? getDifficultyTaunt(tier) : null;
    if (taunt) {
        showTaunt(taunt, true);
        waitForTierTauntThenResume();
    } else {
        gamePausedForTierUp = false;
        tierUpShootCooldown = performance.now() + 1000;
    }
}

function waitForTierTauntThenResume() {
    if (tauntSpeaking) {
        setTimeout(waitForTierTauntThenResume, 100);
        return;
    }
    // Tier-up taunt finished — hide notification and resume game
    hideTierUpNotification();
    tierUpShootCooldown = performance.now() + 1000;
    gamePausedForTierUp = false;
}

function canEnemyShoot() {
    return performance.now() > tierUpShootCooldown;
}

function isGamePausedForTierUp() {
    return gamePausedForTierUp;
}

var activeTierNotification = null;

function showTierUpNotification(tier, config) {
    // Remove any existing notification
    hideTierUpNotification();

    const notification = document.createElement('div');
    notification.className = 'tier-up-notification';
    notification.style.color = config.color;

    const increasedText = typeof getText === 'function' ? getText('ui', 'difficultyIncreased') : 'DIFFICULTY INCREASED';
    const tierName = getDifficultyName(tier);

    notification.innerHTML = `
        <div class="tier-up-icon">⚠️</div>
        <div class="tier-up-text">${increasedText}</div>
        <div class="tier-up-name">${tierName}</div>
    `;

    const container = document.getElementById('game-container');
    if (container) {
        container.appendChild(notification);
        activeTierNotification = notification;

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('visible');
        });
    }
}

function hideTierUpNotification() {
    if (activeTierNotification) {
        activeTierNotification.classList.remove('visible');
        var el = activeTierNotification;
        setTimeout(function() { el.remove(); }, 500);
        activeTierNotification = null;
    }
}

// triggerDifficultyTaunt is now handled by waitForTauntThenPlayTierUp

function getEnemySpeedForTier() {
    const config = getDifficultyConfig();
    return config.enemySpeed;
}

function getProjectileSpeedForTier() {
    const config = getDifficultyConfig();
    return config.projectileSpeed;
}

function getFireRateForTier() {
    const config = getDifficultyConfig();
    return config.fireRate;
}

function getAccuracyForTier() {
    const config = getDifficultyConfig();
    return config.accuracy;
}

function getTauntChanceForTier() {
    const config = getDifficultyConfig();
    return config.tauntChance;
}

function resetDifficulty() {
    lastDisplayedTier = 0;
    gameState.difficultyTier = 1;
    gamePausedForTierUp = false;
    updateDifficultyUI();
}
