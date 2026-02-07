/**
 * Lablix - Projectile System (Phase 9)
 * Shoes that bounce and slide until they fall off the platform
 */

const SHOE_LENGTH = 0.5;
const SHOE_WIDTH = 0.2;
const SHOE_HEIGHT = 0.15;
const HEEL_HEIGHT = 0.25;
const PROJECTILE_RADIUS = 0.3; // For collision detection
const PROJECTILE_GRAVITY = 0.005;
const PROJECTILE_BOUNCE = 0.4;
const PROJECTILE_FRICTION = 0.992; // Higher = slides much longer
const MIN_SLIDE_SPEED = 0.008; // Minimum speed to keep sliding

function createProjectile() {
    if (!gameState.enemy || !gameState.playerBox) return;

    const gunPos = getEnemyGunPosition();
    const accuracy = getAccuracyForTier();
    const projectileSpeed = getProjectileSpeedForTier();

    // Create high heel shoe geometry
    const shoeGroup = new THREE.Group();

    // Shoe colors - red high heel
    const shoeMat = new THREE.MeshStandardMaterial({
        color: 0xcc0033, // Red patent leather
        roughness: 0.3,
        metalness: 0.2
    });
    const soleMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9
    });

    // Main shoe body (front part, angled up toward heel)
    const bodyGeo = new THREE.BoxGeometry(SHOE_WIDTH, SHOE_HEIGHT, SHOE_LENGTH * 0.7);
    const body = new THREE.Mesh(bodyGeo, shoeMat);
    body.position.set(0, SHOE_HEIGHT / 2, SHOE_LENGTH * 0.15);
    body.rotation.x = 0.15; // Slight upward angle
    shoeGroup.add(body);

    // Pointed toe
    const toeGeo = new THREE.ConeGeometry(SHOE_WIDTH * 0.5, SHOE_LENGTH * 0.3, 4);
    const toe = new THREE.Mesh(toeGeo, shoeMat);
    toe.rotation.x = Math.PI / 2;
    toe.rotation.y = Math.PI / 4;
    toe.position.set(0, SHOE_HEIGHT * 0.4, SHOE_LENGTH * 0.55);
    shoeGroup.add(toe);

    // Heel back (connects to stiletto)
    const heelBackGeo = new THREE.BoxGeometry(SHOE_WIDTH * 0.9, SHOE_HEIGHT * 1.2, SHOE_LENGTH * 0.2);
    const heelBack = new THREE.Mesh(heelBackGeo, shoeMat);
    heelBack.position.set(0, SHOE_HEIGHT * 0.6 + HEEL_HEIGHT * 0.3, -SHOE_LENGTH * 0.35);
    shoeGroup.add(heelBack);

    // Stiletto heel (high heel)
    const stilettoGeo = new THREE.CylinderGeometry(0.03, 0.05, HEEL_HEIGHT, 8);
    const stiletto = new THREE.Mesh(stilettoGeo, soleMat);
    stiletto.position.set(0, HEEL_HEIGHT / 2, -SHOE_LENGTH * 0.35);
    shoeGroup.add(stiletto);

    // Heel tip (bottom of stiletto)
    const heelTipGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.03, 8);
    const heelTip = new THREE.Mesh(heelTipGeo, soleMat);
    heelTip.position.set(0, 0.015, -SHOE_LENGTH * 0.35);
    shoeGroup.add(heelTip);

    // Sole (angled from toe to heel)
    const soleGeo = new THREE.BoxGeometry(SHOE_WIDTH * 0.95, 0.03, SHOE_LENGTH * 0.75);
    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.set(0, 0.05, SHOE_LENGTH * 0.1);
    sole.rotation.x = 0.2;
    shoeGroup.add(sole);

    // Inner sole (red bottom like Louboutin)
    const innerSoleMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.4
    });
    const innerSole = new THREE.Mesh(soleGeo.clone(), innerSoleMat);
    innerSole.position.set(0, 0.02, SHOE_LENGTH * 0.1);
    innerSole.rotation.x = 0.2;
    shoeGroup.add(innerSole);

    shoeGroup.position.set(gunPos.x, gunPos.y, gunPos.z);
    shoeGroup.castShadow = true;

    // Calculate direction to player with accuracy variance
    const targetX = gameState.playerBox.position.x;
    const targetZ = gameState.playerBox.position.z;
    const targetY = BOX_SIZE / 2;

    const inaccuracyRange = (1 - accuracy) * 3;
    const offsetX = (Math.random() - 0.5) * inaccuracyRange;
    const offsetZ = (Math.random() - 0.5) * inaccuracyRange;

    let predictedX = targetX + offsetX;
    let predictedZ = targetZ + offsetZ;

    // Tier 4: predictive aiming
    if (gameState.difficultyTier >= 4) {
        const predictionTime = 1.0;
        predictedX = targetX + gameState.velocity.x * predictionTime * 60 + offsetX * 0.3;
        predictedZ = targetZ + gameState.velocity.z * predictionTime * 60 + offsetZ * 0.3;
    }

    const dx = predictedX - gunPos.x;
    const dy = targetY - gunPos.y;
    const dz = predictedZ - gunPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Set velocity with arc
    shoeGroup.userData.velocity = {
        x: (dx / distance) * projectileSpeed,
        y: (dy / distance) * projectileSpeed + 0.08, // Higher arc for thrown shoe
        z: (dz / distance) * projectileSpeed
    };

    // Rotation velocity (tumbling shoe)
    shoeGroup.userData.rotVelocity = {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.3
    };

    shoeGroup.userData.spawnTime = performance.now();
    shoeGroup.userData.onPlatform = false;
    shoeGroup.userData.bounceCount = 0;

    scene.add(shoeGroup);
    gameState.projectiles.push(shoeGroup);

    // Trigger attack animation
    triggerEnemyAttack();
}

function updateProjectiles() {
    if (!gameState.isPlaying) return;

    const toRemove = [];
    const hw = PLATFORM_WIDTH / 2;
    const hd = PLATFORM_DEPTH / 2;
    const platformSurface = SHOE_HEIGHT / 2;

    gameState.projectiles.forEach((shoe, index) => {
        if (!shoe) return;

        const vel = shoe.userData.velocity;
        const rotVel = shoe.userData.rotVelocity;

        // Apply gravity
        vel.y -= PROJECTILE_GRAVITY;

        // Apply friction when on platform
        if (shoe.userData.onPlatform) {
            vel.x *= PROJECTILE_FRICTION;
            vel.z *= PROJECTILE_FRICTION;
            // Slow down rotation when on ground
            rotVel.x *= 0.95;
            rotVel.y *= 0.98;
            rotVel.z *= 0.95;
        }

        // Update position
        shoe.position.x += vel.x;
        shoe.position.y += vel.y;
        shoe.position.z += vel.z;

        // Update rotation (tumbling)
        shoe.rotation.x += rotVel.x;
        shoe.rotation.y += rotVel.y;
        shoe.rotation.z += rotVel.z;

        const px = shoe.position.x;
        const pz = shoe.position.z;
        const py = shoe.position.y;

        // Is over platform?
        const overPlatform = px > -hw && px < hw && pz > -hd && pz < hd;

        if (overPlatform) {
            // Bounce on platform surface
            if (py <= platformSurface && vel.y < 0) {
                shoe.position.y = platformSurface;
                vel.y = -vel.y * PROJECTILE_BOUNCE;
                shoe.userData.bounceCount++;
                shoe.userData.onPlatform = true;

                // Add some horizontal scatter on bounce
                vel.x += (Math.random() - 0.5) * 0.015;
                vel.z += (Math.random() - 0.5) * 0.015;

                // Increase rotation on bounce
                rotVel.x += (Math.random() - 0.5) * 0.08;
                rotVel.z += (Math.random() - 0.5) * 0.08;

                // Create bounce effect
                if (shoe.userData.bounceCount <= 3) {
                    createBounceEffect(px, pz);
                }

                // If barely bouncing, stay on ground
                if (Math.abs(vel.y) < 0.012) {
                    vel.y = 0;
                    shoe.position.y = platformSurface;
                }
            }

            // CRITICAL: If shoe is moving too slowly on platform, push it toward nearest edge
            const horizontalSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
            if (shoe.userData.onPlatform && horizontalSpeed < MIN_SLIDE_SPEED) {
                // Find nearest edge and push toward it
                const distToLeft = px + hw;
                const distToRight = hw - px;
                const distToFront = pz + hd;
                const distToBack = hd - pz;

                const minDist = Math.min(distToLeft, distToRight, distToFront, distToBack);
                const pushForce = 0.012;

                if (minDist === distToLeft) {
                    vel.x = -pushForce;
                } else if (minDist === distToRight) {
                    vel.x = pushForce;
                } else if (minDist === distToFront) {
                    vel.z = -pushForce;
                } else {
                    vel.z = pushForce;
                }

                // Add slight random wobble
                vel.x += (Math.random() - 0.5) * 0.003;
                vel.z += (Math.random() - 0.5) * 0.003;
            }
        } else {
            // Off platform - fall into void
            shoe.userData.onPlatform = false;

            // Only remove when fallen far enough
            if (py < -20) {
                toRemove.push(index);
                return;
            }
        }

        // NEVER remove shoes while on or near platform - they MUST fall off
        // Only remove if fallen deep into void
        if (py < -20) {
            toRemove.push(index);
        }
    });

    // Remove fallen shoes
    toRemove.sort((a, b) => b - a).forEach(index => {
        removeProjectile(index);
    });
}

function createBounceEffect(x, z) {
    // Small dust particles on bounce
    for (let i = 0; i < 3; i++) {
        const geo = new THREE.SphereGeometry(0.04, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x8B7355,
            transparent: true,
            opacity: 0.8
        });
        const dust = new THREE.Mesh(geo, mat);
        dust.position.set(x, 0.1, z);

        const angle = (i / 3) * Math.PI * 2 + Math.random();
        dust.userData.velocity = {
            x: Math.cos(angle) * 0.05,
            y: 0.04,
            z: Math.sin(angle) * 0.05
        };
        dust.userData.life = 1;
        scene.add(dust);

        function animateDust() {
            dust.userData.life -= 0.06;
            dust.userData.velocity.y -= 0.003;
            dust.position.x += dust.userData.velocity.x;
            dust.position.y += dust.userData.velocity.y;
            dust.position.z += dust.userData.velocity.z;
            dust.material.opacity = dust.userData.life * 0.8;
            dust.scale.setScalar(0.5 + dust.userData.life * 0.5);

            if (dust.userData.life > 0) {
                requestAnimationFrame(animateDust);
            } else {
                scene.remove(dust);
            }
        }
        animateDust();
    }
}

function removeProjectile(index) {
    const shoe = gameState.projectiles[index];
    if (shoe) {
        scene.remove(shoe);
        gameState.projectiles.splice(index, 1);
    }
}

function clearAllProjectiles() {
    gameState.projectiles.forEach(shoe => {
        if (shoe) scene.remove(shoe);
    });
    gameState.projectiles = [];
}

function checkEnemyShooting() {
    if (!gameState.isPlaying || gameState.isFalling) return;
    if (!gameState.enemy) return;

    // Check if shooting is allowed (not during tier-up cooldown)
    if (typeof canEnemyShoot === 'function' && !canEnemyShoot()) return;

    const now = performance.now();
    const fireRate = getFireRateForTier();

    if (now - gameState.lastShotTime >= fireRate) {
        gameState.lastShotTime = now;
        createProjectile();
        playWosh();
    }
}
