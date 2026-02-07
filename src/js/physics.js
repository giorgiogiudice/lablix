/**
 * Lablix - Physics System
 */

function updatePhysics() {
    if (!gameState.playerBox || !gameState.isOnPlatform) return;

    // Tilt input
    const tiltBeta = gameState.gyro.beta - gameState.calibration.beta;
    const tiltGamma = gameState.gyro.gamma - gameState.calibration.gamma;
    gameState.tilt.x = Math.max(-1, Math.min(1, tiltGamma / 60));
    gameState.tilt.z = Math.max(-1, Math.min(1, tiltBeta / 60));

    // Apply acceleration
    gameState.velocity.x += gameState.tilt.x * ACCELERATION;
    gameState.velocity.z += gameState.tilt.z * ACCELERATION;

    // Apply friction
    gameState.velocity.x *= FRICTION;
    gameState.velocity.z *= FRICTION;

    // Clamp velocity
    const speed = Math.sqrt(gameState.velocity.x ** 2 + gameState.velocity.z ** 2);
    if (speed > MAX_VELOCITY) {
        gameState.velocity.x *= MAX_VELOCITY / speed;
        gameState.velocity.z *= MAX_VELOCITY / speed;
    }

    // Stop tiny movements
    if (Math.abs(gameState.velocity.x) < 0.0001) gameState.velocity.x = 0;
    if (Math.abs(gameState.velocity.z) < 0.0001) gameState.velocity.z = 0;

    // Update position
    gameState.playerBox.position.x += gameState.velocity.x;
    gameState.playerBox.position.z += gameState.velocity.z;

    // Rolling with quaternions
    updateBoxRotation();

    // Edge check
    checkEdges();
}

function updateBoxRotation() {
    const vx = gameState.velocity.x, vz = gameState.velocity.z;
    const spd = Math.sqrt(vx * vx + vz * vz);
    if (spd > 0.0001) {
        const angle = spd / (BOX_SIZE / 2);
        rotationAxis.set(vz, 0, -vx).normalize();
        tempQuaternion.setFromAxisAngle(rotationAxis, angle);
        gameState.playerBox.quaternion.premultiply(tempQuaternion);
    }
}

function checkEdges() {
    const hw = PLATFORM_WIDTH / 2, hd = PLATFORM_DEPTH / 2;
    const px = gameState.playerBox.position.x, pz = gameState.playerBox.position.z;
    if (px < -hw || px > hw || pz < -hd || pz > hd) {
        gameState.isOnPlatform = false;
        onFallOff();
    }
}

function onFallOff() {
    stopAllFx();
    playFall();
    gameState.isFalling = true;
    gameState.fallVelocity = 0;
    gameState.lives = 0;
    gameState.fallRotation.x = (Math.random() - 0.5) * 0.1;
    gameState.fallRotation.z = (Math.random() - 0.5) * 0.1;

    // Trigger fall taunt and clear projectiles
    triggerFallTaunt();
    clearAllProjectiles();

    // Show game over with translated message
    setTimeout(() => {
        const msg = typeof getDeathMessage === 'function' ? getDeathMessage('fall') : 'You Fell Off!';
        showGameOver(msg);
    }, 2500);
}

function updateFalling() {
    if (!gameState.isFalling || !gameState.playerBox) return;

    gameState.fallVelocity += FALL_GRAVITY;
    gameState.playerBox.position.y -= gameState.fallVelocity;
    gameState.playerBox.position.x += gameState.velocity.x * 0.5;
    gameState.playerBox.position.z += gameState.velocity.z * 0.5;

    // Tumble
    const axis = new THREE.Vector3(gameState.fallRotation.x, 0, gameState.fallRotation.z);
    if (axis.length() > 0) {
        tempQuaternion.setFromAxisAngle(axis.normalize(), 0.1);
        gameState.playerBox.quaternion.premultiply(tempQuaternion);
    }

    // Camera follows
    if (gameState.playerBox.position.y > -20) {
        camera.position.y = Math.max(10, 18 + gameState.playerBox.position.y * 0.3);
        camera.lookAt(
            gameState.playerBox.position.x * 0.3,
            Math.max(-5, gameState.playerBox.position.y * 0.5),
            gameState.playerBox.position.z * 0.3
        );
    }
}
