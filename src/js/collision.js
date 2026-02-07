/**
 * Lablix - Hit Detection & Collision System (Phase 10)
 * Includes enemy collision (solid wall) and multilingual support
 */

const HIT_COOLDOWN = 1000; // Invulnerability time after hit (ms)
const KNOCKBACK_FORCE = 0.12;
const ENEMY_COLLISION_RADIUS = 1.0; // Collision radius for enemy character

function checkProjectileCollisions() {
    if (!gameState.isPlaying || gameState.isFalling) return;
    if (!gameState.playerBox) return;

    const now = performance.now();

    // Check if still in hit cooldown
    if (now - gameState.lastHitTime < HIT_COOLDOWN) {
        // Flash player box during invulnerability
        const flash = Math.sin(now * 0.03) > 0;
        if (gameState.playerBox.material) {
            gameState.playerBox.material.opacity = flash ? 0.4 : 1;
            gameState.playerBox.material.transparent = true;
        }
        return;
    } else if (gameState.playerBox.material) {
        gameState.playerBox.material.opacity = 1;
        gameState.playerBox.material.transparent = false;
    }

    const playerPos = gameState.playerBox.position;
    // Use box collision (AABB) instead of sphere for more accurate detection
    const boxHalfSize = BOX_SIZE / 2;

    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const projectile = gameState.projectiles[i];
        if (!projectile) continue;

        const projPos = projectile.position;
        const projRadius = PROJECTILE_RADIUS;

        // AABB vs Sphere collision
        // Find closest point on box to sphere center
        const closestX = Math.max(playerPos.x - boxHalfSize, Math.min(projPos.x, playerPos.x + boxHalfSize));
        const closestY = Math.max(playerPos.y - boxHalfSize, Math.min(projPos.y, playerPos.y + boxHalfSize));
        const closestZ = Math.max(playerPos.z - boxHalfSize, Math.min(projPos.z, playerPos.z + boxHalfSize));

        // Distance from closest point to sphere center
        const dx = projPos.x - closestX;
        const dy = projPos.y - closestY;
        const dz = projPos.z - closestZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < projRadius * projRadius) {
            // HIT!
            onPlayerHit(projectile, i);
            return; // Only one hit per frame
        }
    }
}

// Check collision between player box and enemy character
function checkEnemyCollision() {
    if (!gameState.isPlaying || gameState.isFalling) return;
    if (!gameState.playerBox || !gameState.enemy) return;

    const playerPos = gameState.playerBox.position;
    const enemyPos = gameState.enemy.position;
    const boxHalfSize = BOX_SIZE / 2;

    // Calculate distance between player and enemy (XZ plane only)
    const dx = playerPos.x - enemyPos.x;
    const dz = playerPos.z - enemyPos.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);

    // Combined collision radius (enemy radius + box half diagonal on XZ)
    const boxRadius = boxHalfSize * Math.sqrt(2);
    const minDist = ENEMY_COLLISION_RADIUS + boxRadius;

    if (distXZ < minDist) {
        // Collision! Push player back
        const overlap = minDist - distXZ;

        // Normalize direction
        const len = Math.sqrt(dx * dx + dz * dz);
        if (len > 0) {
            const nx = dx / len;
            const nz = dz / len;

            // Push player out of enemy
            gameState.playerBox.position.x += nx * overlap;
            gameState.playerBox.position.z += nz * overlap;

            // Bounce velocity (reverse and dampen)
            const dotProduct = gameState.velocity.x * nx + gameState.velocity.z * nz;
            if (dotProduct < 0) {
                // Only bounce if moving toward enemy
                gameState.velocity.x -= 2 * dotProduct * nx * 0.5;
                gameState.velocity.z -= 2 * dotProduct * nz * 0.5;

                // Dampen velocity
                gameState.velocity.x *= 0.5;
                gameState.velocity.z *= 0.5;
            }
        }
    }
}

function onPlayerHit(projectile, projectileIndex) {
    playHit();
    const now = performance.now();
    gameState.lastHitTime = now;
    gameState.isHit = true;

    // Reduce lives
    gameState.lives--;
    updateUI();

    // Calculate knockback direction (from projectile to player)
    const knockbackX = projectile.userData.velocity.x * KNOCKBACK_FORCE * 10;
    const knockbackZ = projectile.userData.velocity.z * KNOCKBACK_FORCE * 10;

    // Apply knockback
    gameState.velocity.x += knockbackX;
    gameState.velocity.z += knockbackZ;

    // Remove the projectile
    removeProjectile(projectileIndex);

    // Visual feedback
    createHitEffect(gameState.playerBox.position);
    triggerScreenShake();
    flashPlayerRed();

    // Trigger taunt
    triggerHitTaunt();

    // Check for game over
    if (gameState.lives <= 0) {
        onShotDeath();
    }

    // Reset hit state after cooldown
    setTimeout(() => {
        gameState.isHit = false;
    }, HIT_COOLDOWN);
}

function createHitEffect(position) {
    // Create impact particles
    const particleCount = 8;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);

        const angle = (i / particleCount) * Math.PI * 2;
        particle.position.set(
            position.x,
            position.y,
            position.z
        );
        particle.userData.velocity = {
            x: Math.cos(angle) * 0.15,
            y: 0.1 + Math.random() * 0.1,
            z: Math.sin(angle) * 0.15
        };
        particle.userData.life = 1;

        scene.add(particle);
        particles.push(particle);
    }

    // Animate particles
    function animateParticles() {
        let alive = false;
        particles.forEach(p => {
            if (p.userData.life > 0) {
                alive = true;
                p.userData.life -= 0.04;
                p.userData.velocity.y -= 0.01; // Gravity
                p.position.x += p.userData.velocity.x;
                p.position.y += p.userData.velocity.y;
                p.position.z += p.userData.velocity.z;
                p.material.opacity = p.userData.life;
                p.scale.setScalar(p.userData.life);
            }
        });

        if (alive) {
            requestAnimationFrame(animateParticles);
        } else {
            particles.forEach(p => scene.remove(p));
        }
    }
    animateParticles();
}

function triggerScreenShake() {
    const container = document.getElementById('game-container');
    if (!container) return;

    container.classList.add('screen-shake');
    setTimeout(() => {
        container.classList.remove('screen-shake');
    }, 300);
}

function flashPlayerRed() {
    if (!gameState.playerBox) return;

    // Store original color
    const originalColor = gameState.playerBox.material.color.getHex();

    // Flash red
    gameState.playerBox.material.color.setHex(0xff0000);
    gameState.playerBox.material.emissive = new THREE.Color(0xff0000);
    gameState.playerBox.material.emissiveIntensity = 0.5;

    // Restore after brief delay
    setTimeout(() => {
        if (gameState.playerBox && gameState.playerBox.material) {
            gameState.playerBox.material.color.setHex(originalColor);
            gameState.playerBox.material.emissive = new THREE.Color(0x000000);
            gameState.playerBox.material.emissiveIntensity = 0;
        }
    }, 150);
}

function onShotDeath() {
    stopAllFx();
    gameState.isPlaying = false;

    // Trigger death taunt
    triggerDeathTaunt();

    // Clear projectiles
    clearAllProjectiles();

    // Show game over after brief delay with translated message
    setTimeout(() => {
        const msg = typeof getDeathMessage === 'function' ? getDeathMessage('hit') : 'You Were Hit!';
        showGameOver(msg);
    }, 1500);
}

function resetCombatState() {
    gameState.projectiles = [];
    gameState.lastShotTime = performance.now() + 1500; // Grace period before first shot
    gameState.lastHitTime = 0;
    gameState.isHit = false;
    gameState.hitCooldown = 0;
    gameState.difficultyTier = 1;

    // Reset taunt state
    gameState.lastTauntTime = 0;
    hideTaunt();
}
