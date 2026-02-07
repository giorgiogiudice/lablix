/**
 * Lablix - Coin System
 */

let currentCoin = null;
const COIN_RADIUS = 0.4;
const COIN_HEIGHT = 0.1;
const COIN_MARGIN = 1.5;  // Min distance from edges
const MIN_DISTANCE_FROM_BOX = 2;  // Min spawn distance from player

function createCoin() {
    if (currentCoin) {
        scene.remove(currentCoin);
    }

    // Create coin geometry (cylinder)
    const geometry = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, COIN_HEIGHT, 32);

    // Gold material with glow
    const material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0xffa500,
        emissiveIntensity: 0.3
    });

    currentCoin = new THREE.Mesh(geometry, material);
    currentCoin.rotation.x = Math.PI / 2;  // Lay flat, facing up
    currentCoin.castShadow = true;

    // Spawn at random safe position
    spawnCoinAtRandomPosition();

    scene.add(currentCoin);
}

function spawnCoinAtRandomPosition() {
    if (!currentCoin) return;

    const safeWidth = PLATFORM_WIDTH / 2 - COIN_MARGIN;
    const safeDepth = PLATFORM_DEPTH / 2 - COIN_MARGIN;

    let attempts = 0;
    let x, z;

    // Find position not too close to player
    do {
        x = (Math.random() * 2 - 1) * safeWidth;
        z = (Math.random() * 2 - 1) * safeDepth;
        attempts++;
    } while (
        attempts < 20 &&
        gameState.playerBox &&
        distanceToBox(x, z) < MIN_DISTANCE_FROM_BOX
    );

    currentCoin.position.set(x, COIN_RADIUS + 0.05, z);
}

function distanceToBox(x, z) {
    if (!gameState.playerBox) return Infinity;
    const dx = x - gameState.playerBox.position.x;
    const dz = z - gameState.playerBox.position.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function updateCoin() {
    if (!currentCoin || !gameState.playerBox || gameState.isFalling) return;

    // Rotate coin
    currentCoin.rotation.z += 0.03;

    // Hover animation
    currentCoin.position.y = COIN_RADIUS + 0.05 + Math.sin(performance.now() * 0.005) * 0.15;

    // Check collision with player
    const dx = currentCoin.position.x - gameState.playerBox.position.x;
    const dz = currentCoin.position.z - gameState.playerBox.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < (BOX_SIZE / 2 + COIN_RADIUS)) {
        collectCoin();
    }
}

function collectCoin() {
    playCoin();
    gameState.score++;
    updateUI();

    // Spawn particle effect
    createCoinParticles(currentCoin.position.x, currentCoin.position.z);

    // Spawn new coin
    spawnCoinAtRandomPosition();
}

function createCoinParticles(x, z) {
    const particleCount = 12;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.08, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);

        const angle = (i / particleCount) * Math.PI * 2;
        particle.position.set(x, 0.5, z);
        particle.userData.velocity = {
            x: Math.cos(angle) * 0.1,
            y: 0.15 + Math.random() * 0.1,
            z: Math.sin(angle) * 0.1
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
                p.userData.life -= 0.03;
                p.userData.velocity.y -= 0.008;  // Gravity
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

function removeCoin() {
    if (currentCoin) {
        scene.remove(currentCoin);
        currentCoin = null;
    }
}
