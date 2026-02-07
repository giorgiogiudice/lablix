/**
 * Lablix - Enemy Character System (Phase 7)
 * Angry woman who throws shoes at the player
 */

// Enemy constants
const ENEMY_SIZE = 1.2; // Bigger character
const ENEMY_BASE_SPEED = 0.025;
const ENEMY_SAFE_MARGIN = 1.8;
const ENEMY_MIN_PLAYER_DISTANCE = 4.5;

function createEnemy() {
    const enemy = new THREE.Group();

    // === BODY ===
    // Torso (dress shape - wider at bottom)
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.55, 1.2, 8);
    const dressMat = new THREE.MeshStandardMaterial({
        color: 0x8b0000, // Dark red dress
        roughness: 0.7
    });
    const torso = new THREE.Mesh(torsoGeo, dressMat);
    torso.position.y = 0.6;
    torso.castShadow = true;
    enemy.add(torso);

    // Upper body
    const upperGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.5, 8);
    const upper = new THREE.Mesh(upperGeo, dressMat);
    upper.position.y = 1.45;
    upper.castShadow = true;
    enemy.add(upper);

    // === HEAD ===
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const skinMat = new THREE.MeshStandardMaterial({
        color: 0xdeb887, // Skin tone
        roughness: 0.8
    });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.0;
    head.castShadow = true;
    enemy.add(head);

    // Hair (angry bun style)
    const hairMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9
    });
    const hairGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 2.05, -0.05);
    hair.scale.set(1, 0.9, 1);
    enemy.add(hair);

    // Hair bun
    const bunGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const bun = new THREE.Mesh(bunGeo, hairMat);
    bun.position.set(0, 2.3, -0.1);
    enemy.add(bun);

    // === ANGRY FACE ===
    // Eyes (angry, slanted)
    const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 2.02, 0.22);
    enemy.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 2.02, 0.22);
    enemy.add(rightEye);

    // Angry eyebrows
    const browGeo = new THREE.BoxGeometry(0.12, 0.025, 0.02);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.1, 2.1, 0.24);
    leftBrow.rotation.z = 0.3; // Angry slant
    enemy.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.1, 2.1, 0.24);
    rightBrow.rotation.z = -0.3; // Angry slant
    enemy.add(rightBrow);

    // Frowning mouth
    const mouthGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 12, Math.PI);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x8b0000 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 1.9, 0.24);
    mouth.rotation.x = Math.PI;
    mouth.rotation.z = Math.PI;
    enemy.add(mouth);

    // === ARMS ===
    const armGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 8);

    // Left arm (static)
    const leftArmGroup = new THREE.Group();
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.y = -0.25;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);
    leftArmGroup.position.set(-0.45, 1.5, 0);
    leftArmGroup.rotation.z = 0.3;
    enemy.add(leftArmGroup);

    // Left hand
    const handGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.55;
    leftArmGroup.add(leftHand);

    // Right arm (throwing arm)
    const rightArmGroup = new THREE.Group();
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.y = -0.25;
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);
    rightArmGroup.position.set(0.45, 1.5, 0);
    rightArmGroup.rotation.z = -0.3;
    enemy.add(rightArmGroup);
    enemy.userData.rightArm = rightArmGroup;

    // Right hand (holds shoe)
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.55;
    rightArmGroup.add(rightHand);
    enemy.userData.rightHand = rightHand;

    // Held shoe (visible during throw animation) - red high heel
    const heldShoeGroup = new THREE.Group();
    const heldShoeMat = new THREE.MeshStandardMaterial({
        color: 0xcc0033, // Red patent leather
        roughness: 0.3,
        metalness: 0.2
    });
    const heldSoleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    // Shoe body
    const heldShoeBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.07, 0.2),
        heldShoeMat
    );
    heldShoeBody.position.z = 0.05;
    heldShoeGroup.add(heldShoeBody);

    // Pointed toe
    const heldToe = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.1, 4),
        heldShoeMat
    );
    heldToe.rotation.x = Math.PI / 2;
    heldToe.rotation.y = Math.PI / 4;
    heldToe.position.z = 0.18;
    heldShoeGroup.add(heldToe);

    // Stiletto heel
    const heldHeel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.025, 0.12, 6),
        heldSoleMat
    );
    heldHeel.position.set(0, -0.06, -0.08);
    heldShoeGroup.add(heldHeel);

    // Heel back
    const heldHeelBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.06),
        heldShoeMat
    );
    heldHeelBack.position.set(0, 0.02, -0.08);
    heldShoeGroup.add(heldHeelBack);

    heldShoeGroup.position.set(0, -0.7, 0.15);
    heldShoeGroup.rotation.x = 0.3;
    heldShoeGroup.visible = false;
    rightArmGroup.add(heldShoeGroup);
    enemy.userData.heldShoe = heldShoeGroup;

    // === LEGS ===
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);

    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.2, -0.25, 0);
    leftLeg.castShadow = true;
    enemy.add(leftLeg);
    enemy.userData.leftLeg = leftLeg;

    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.2, -0.25, 0);
    rightLeg.castShadow = true;
    enemy.add(rightLeg);
    enemy.userData.rightLeg = rightLeg;

    // Feet (she has one shoe, throws the others)
    const footGeo = new THREE.BoxGeometry(0.12, 0.08, 0.2);
    const shoeMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.6
    });

    const leftFoot = new THREE.Mesh(footGeo, shoeMat);
    leftFoot.position.set(-0.2, -0.54, 0.05);
    enemy.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, shoeMat);
    rightFoot.position.set(0.2, -0.54, 0.05);
    enemy.add(rightFoot);

    // Position on platform
    const startX = (PLATFORM_WIDTH / 2) - ENEMY_SAFE_MARGIN;
    const startZ = (PLATFORM_DEPTH / 2) - ENEMY_SAFE_MARGIN;
    enemy.position.set(startX, 0, startZ);

    // Scale up the whole character
    enemy.scale.setScalar(ENEMY_SIZE);

    // Animation data
    enemy.userData.baseY = 0;
    enemy.userData.animTime = 0;
    enemy.userData.isAttacking = false;
    enemy.userData.attackTime = 0;
    enemy.userData.attackPhase = 0; // 0=idle, 1=wind-up, 2=throw, 3=follow-through
    enemy.userData.walkTimer = 0;
    enemy.userData.targetX = startX;
    enemy.userData.targetZ = startZ;

    scene.add(enemy);
    gameState.enemy = enemy;
}

function updateEnemy() {
    if (!gameState.enemy || !gameState.playerBox || gameState.isFalling) return;

    const enemy = gameState.enemy;
    const now = performance.now();
    const deltaTime = 0.016;

    enemy.userData.animTime += deltaTime;
    enemy.userData.walkTimer += deltaTime;

    // Choose new target periodically
    if (enemy.userData.walkTimer > 2.5 + Math.random() * 2) {
        enemy.userData.walkTimer = 0;
        pickNewEnemyTarget();
    }

    // Move toward target
    const dx = enemy.userData.targetX - enemy.position.x;
    const dz = enemy.userData.targetZ - enemy.position.z;
    const distToTarget = Math.sqrt(dx * dx + dz * dz);

    if (distToTarget > 0.1 && !enemy.userData.isAttacking) {
        const enemySpeed = typeof getEnemySpeedForTier === 'function' ? getEnemySpeedForTier() : ENEMY_BASE_SPEED;
        const moveX = (dx / distToTarget) * enemySpeed;
        const moveZ = (dz / distToTarget) * enemySpeed;

        enemy.position.x += moveX;
        enemy.position.z += moveZ;

        // Walking animation
        const walkCycle = Math.sin(enemy.userData.animTime * 6);
        if (enemy.userData.leftLeg) {
            enemy.userData.leftLeg.rotation.x = walkCycle * 0.25;
        }
        if (enemy.userData.rightLeg) {
            enemy.userData.rightLeg.rotation.x = -walkCycle * 0.25;
        }
    } else {
        // Idle
        if (enemy.userData.leftLeg) enemy.userData.leftLeg.rotation.x = 0;
        if (enemy.userData.rightLeg) enemy.userData.rightLeg.rotation.x = 0;
    }

    // Keep on platform
    const hw = PLATFORM_WIDTH / 2 - ENEMY_SAFE_MARGIN;
    const hd = PLATFORM_DEPTH / 2 - ENEMY_SAFE_MARGIN;
    enemy.position.x = Math.max(-hw, Math.min(hw, enemy.position.x));
    enemy.position.z = Math.max(-hd, Math.min(hd, enemy.position.z));

    // Face the player
    const playerDx = gameState.playerBox.position.x - enemy.position.x;
    const playerDz = gameState.playerBox.position.z - enemy.position.z;
    const targetAngle = Math.atan2(playerDx, playerDz);

    let angleDiff = targetAngle - enemy.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    enemy.rotation.y += angleDiff * 0.08;

    // Throwing animation with shoe removal
    if (enemy.userData.isAttacking && enemy.userData.rightArm) {
        const elapsed = now - enemy.userData.attackTime;
        const arm = enemy.userData.rightArm;
        const leftLeg = enemy.userData.leftLeg;
        const heldShoe = enemy.userData.heldShoe;

        if (elapsed < 300) {
            // Phase 1: Bend down to grab shoe from foot
            const progress = elapsed / 300;
            // Bend body forward
            enemy.children[0].rotation.x = 0.3 * progress; // torso
            enemy.children[1].rotation.x = 0.2 * progress; // upper body
            // Lift left leg
            if (leftLeg) leftLeg.rotation.x = -0.8 * progress;
            // Reach down with arm
            arm.rotation.x = 1.2 * progress;
            arm.rotation.z = -0.3 + 0.3 * progress;
            // Show held shoe at end
            if (progress > 0.7 && heldShoe) heldShoe.visible = true;
        } else if (elapsed < 500) {
            // Phase 2: Stand up with shoe
            const progress = (elapsed - 300) / 200;
            enemy.children[0].rotation.x = 0.3 * (1 - progress);
            enemy.children[1].rotation.x = 0.2 * (1 - progress);
            if (leftLeg) leftLeg.rotation.x = -0.8 * (1 - progress);
            arm.rotation.x = 1.2 - 2.7 * progress; // Go from reaching down to behind head
            arm.rotation.z = 0 - 0.5 * progress;
        } else if (elapsed < 650) {
            // Phase 3: Throw!
            const progress = (elapsed - 500) / 150;
            arm.rotation.x = -1.5 + 3.0 * progress;
            arm.rotation.z = -0.5 + 0.2 * progress;
            // Hide shoe when thrown (halfway through throw)
            if (progress > 0.3 && heldShoe) heldShoe.visible = false;
        } else if (elapsed < 900) {
            // Phase 4: Follow-through
            const progress = (elapsed - 650) / 250;
            arm.rotation.x = 1.5 - 1.5 * progress;
            arm.rotation.z = -0.3;
        } else {
            // Reset everything
            arm.rotation.x = 0;
            arm.rotation.z = -0.3;
            enemy.children[0].rotation.x = 0;
            enemy.children[1].rotation.x = 0;
            if (leftLeg) leftLeg.rotation.x = 0;
            if (heldShoe) heldShoe.visible = false;
            enemy.userData.isAttacking = false;
        }
    }

    // Slight body movement
    enemy.position.y = enemy.userData.baseY + Math.sin(enemy.userData.animTime * 2) * 0.02;
}

function pickNewEnemyTarget() {
    if (!gameState.enemy || !gameState.playerBox) return;

    const hw = PLATFORM_WIDTH / 2 - ENEMY_SAFE_MARGIN;
    const hd = PLATFORM_DEPTH / 2 - ENEMY_SAFE_MARGIN;
    const playerX = gameState.playerBox.position.x;
    const playerZ = gameState.playerBox.position.z;

    let attempts = 0;
    let targetX, targetZ;
    do {
        targetX = (Math.random() * 2 - 1) * hw;
        targetZ = (Math.random() * 2 - 1) * hd;
        attempts++;
    } while (
        attempts < 20 &&
        Math.sqrt((targetX - playerX) ** 2 + (targetZ - playerZ) ** 2) < ENEMY_MIN_PLAYER_DISTANCE
    );

    gameState.enemy.userData.targetX = targetX;
    gameState.enemy.userData.targetZ = targetZ;
}

function triggerEnemyAttack() {
    if (!gameState.enemy) return;
    gameState.enemy.userData.isAttacking = true;
    gameState.enemy.userData.attackTime = performance.now();
}

function getEnemyGunPosition() {
    if (!gameState.enemy) return { x: 0, y: 0, z: 0 };

    const enemy = gameState.enemy;
    // Hand position when throwing (accounting for scale)
    const handOffset = new THREE.Vector3(0.5 * ENEMY_SIZE, 1.8 * ENEMY_SIZE, 0.3 * ENEMY_SIZE);
    handOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), enemy.rotation.y);

    return {
        x: enemy.position.x + handOffset.x,
        y: enemy.position.y + handOffset.y,
        z: enemy.position.z + handOffset.z
    };
}

function resetEnemy() {
    if (!gameState.enemy) return;

    // Pick a random corner far from the player (who starts at 0,0)
    var corners = [
        { x:  1, z:  1 },
        { x:  1, z: -1 },
        { x: -1, z:  1 },
        { x: -1, z: -1 }
    ];
    var pick = corners[Math.floor(Math.random() * corners.length)];
    var startX = pick.x * ((PLATFORM_WIDTH / 2) - ENEMY_SAFE_MARGIN);
    var startZ = pick.z * ((PLATFORM_DEPTH / 2) - ENEMY_SAFE_MARGIN);

    gameState.enemy.position.set(startX, 0, startZ);
    gameState.enemy.rotation.y = 0;
    gameState.enemy.userData.targetX = startX;
    gameState.enemy.userData.targetZ = startZ;
    gameState.enemy.userData.walkTimer = 0;
    gameState.enemy.userData.animTime = 0;
    gameState.enemy.userData.isAttacking = false;

    if (gameState.enemy.userData.leftLeg) gameState.enemy.userData.leftLeg.rotation.x = 0;
    if (gameState.enemy.userData.rightLeg) gameState.enemy.userData.rightLeg.rotation.x = 0;
    if (gameState.enemy.userData.rightArm) {
        gameState.enemy.userData.rightArm.rotation.x = 0;
        gameState.enemy.userData.rightArm.rotation.z = -0.3;
    }
}
