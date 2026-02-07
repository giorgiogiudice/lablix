/**
 * Lablix - Three.js Scene Setup
 * Universe background with animated cosmic events
 */

var bgEffects = [];

function initThreeJS() {
    if (scene) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020010);
    scene.fog = new THREE.Fog(0x020010, 30, 80);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(aspect < 1 ? 75 : 60, aspect, 0.1, 1000);
    camera.position.set(0, 18, 14);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    gameContainer.appendChild(renderer.domElement);

    createLighting();
    createPlatform();
    createGrassBlades();
    createStarfield();
    createPlayerBox();

    window.addEventListener('resize', onWindowResize);
}

function createLighting() {
    scene.add(new THREE.AmbientLight(0x404060, 0.5));

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x667eea, 0.4);
    rimLight.position.set(-10, 5, -10);
    scene.add(rimLight);
}

// ========== GRASS PLATFORM ==========

function createGrassTexture() {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#4a9e3e';
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}

function createPlatform() {
    var platformGeo = new THREE.BoxGeometry(PLATFORM_WIDTH, PLATFORM_HEIGHT, PLATFORM_DEPTH);

    // Grass on top, dirt on sides
    var grassTex = createGrassTexture();
    var topMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95 });
    var sideMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });

    // BoxGeometry faces: +x, -x, +y, -y, +z, -z
    var mats = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    var platform = new THREE.Mesh(platformGeo, mats);
    platform.position.y = -PLATFORM_HEIGHT / 2;
    platform.receiveShadow = true;
    scene.add(platform);

    var edgeMat = new THREE.MeshBasicMaterial({ color: 0xff4757, transparent: true, opacity: 0.9 });
    platformEdges = [];

    var addEdge = function(w, d, x, z) {
        var edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), edgeMat);
        edge.position.set(x, 0, z);
        scene.add(edge);
        platformEdges.push(edge);
    };

    addEdge(PLATFORM_WIDTH + 0.3, 0.15, 0, PLATFORM_DEPTH / 2 + 0.075);
    addEdge(PLATFORM_WIDTH + 0.3, 0.15, 0, -PLATFORM_DEPTH / 2 - 0.075);
    addEdge(0.15, PLATFORM_DEPTH, -PLATFORM_WIDTH / 2 - 0.075, 0);
    addEdge(0.15, PLATFORM_DEPTH, PLATFORM_WIDTH / 2 + 0.075, 0);
}

// ========== 3D GRASS BLADES ==========

function createGrassBlades() {
    grassBlades = [];
    var bladeCount = 200;
    var bladeGeo = new THREE.PlaneGeometry(0.08, 0.4);
    // Shift geometry so bottom edge is at origin (pivot from base)
    bladeGeo.translate(0, 0.2, 0);

    for (var i = 0; i < bladeCount; i++) {
        var green = 0.25 + Math.random() * 0.35;
        var mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.1 + Math.random() * 0.1, green, 0.05 + Math.random() * 0.08),
            side: THREE.DoubleSide,
            roughness: 0.8
        });

        var blade = new THREE.Mesh(bladeGeo, mat);
        blade.position.set(
            (Math.random() - 0.5) * (PLATFORM_WIDTH - 0.5),
            0.01,
            (Math.random() - 0.5) * (PLATFORM_DEPTH - 0.5)
        );
        blade.rotation.y = Math.random() * Math.PI;
        scene.add(blade);
        grassBlades.push(blade);
    }
}

function updateGrassBlades() {
    var time = performance.now() * 0.001;
    for (var i = 0; i < grassBlades.length; i++) {
        var blade = grassBlades[i];
        blade.rotation.z = Math.sin(time * 1.5 + blade.position.x * 2 + blade.position.z * 2) * 0.15;
    }
}

// ========== STARFIELD ==========

function createStarfield() {
    // Dense starfield — white/blue/warm stars at varying depths
    var count = 1200;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var sizes = new Float32Array(count);

    for (var i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 140;
        pos[i * 3 + 1] = -10 - Math.random() * 60;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 140;

        // Star color variety
        var t = Math.random();
        if (t < 0.6) {
            // White
            colors[i * 3] = 0.9 + Math.random() * 0.1;
            colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
            colors[i * 3 + 2] = 1.0;
        } else if (t < 0.8) {
            // Blue
            colors[i * 3] = 0.4 + Math.random() * 0.2;
            colors[i * 3 + 1] = 0.5 + Math.random() * 0.2;
            colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
        } else if (t < 0.9) {
            // Warm yellow
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
            colors[i * 3 + 2] = 0.4 + Math.random() * 0.3;
        } else {
            // Red giant
            colors[i * 3] = 0.9 + Math.random() * 0.1;
            colors[i * 3 + 1] = 0.3 + Math.random() * 0.2;
            colors[i * 3 + 2] = 0.2 + Math.random() * 0.1;
        }

        sizes[i] = 0.2 + Math.random() * 0.6;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        size: 0.4, vertexColors: true, opacity: 0.8, transparent: true
    })));

    // Faint nebula glow blobs
    var nebColors = [0x331155, 0x112244, 0x220033, 0x0a1133];
    for (var n = 0; n < 5; n++) {
        var nebGeo = new THREE.SphereGeometry(5 + Math.random() * 8, 12, 12);
        var nebMat = new THREE.MeshBasicMaterial({
            color: nebColors[n % nebColors.length],
            transparent: true,
            opacity: 0.15 + Math.random() * 0.1
        });
        var neb = new THREE.Mesh(nebGeo, nebMat);
        neb.position.set(
            (Math.random() - 0.5) * 80,
            -20 - Math.random() * 30,
            (Math.random() - 0.5) * 80
        );
        scene.add(neb);
    }
}

// ========== BACKGROUND EFFECTS ==========

function spawnBgEffect() {
    var roll = Math.random();

    if (roll < 0.35) {
        spawnShootingStar();
    } else if (roll < 0.55) {
        spawnSatellite();
    } else if (roll < 0.70) {
        spawnSupernova();
    } else if (roll < 0.85) {
        spawnAlien();
    } else {
        spawnAbsurdThing();
    }
}

function spawnShootingStar() {
    var geo = new THREE.BufferGeometry();
    var len = 2 + Math.random() * 3;
    var dx = (Math.random() - 0.5) * 0.8;
    var dy = -0.3 - Math.random() * 0.4;
    var dz = (Math.random() - 0.5) * 0.8;
    var mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
    dx /= mag; dy /= mag; dz /= mag;

    var verts = new Float32Array([0, 0, 0, -dx * len, -dy * len, -dz * len]);
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));

    var mat = new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.9
    });
    var line = new THREE.Line(geo, mat);

    var sx = (Math.random() - 0.5) * 80;
    var sy = -12 - Math.random() * 20;
    var sz = (Math.random() - 0.5) * 80;
    line.position.set(sx, sy, sz);

    var speed = 0.6 + Math.random() * 0.8;
    scene.add(line);
    bgEffects.push({
        obj: line, type: 'shootingStar', life: 1,
        vx: dx * speed, vy: dy * speed, vz: dz * speed, decay: 0.012 + Math.random() * 0.008
    });
}

function spawnSatellite() {
    var group = new THREE.Group();

    // Body
    var body = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xaaaaaa })
    );
    group.add(body);

    // Solar panels
    var panelMat = new THREE.MeshBasicMaterial({ color: 0x2244aa });
    var lp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.25), panelMat);
    lp.position.x = -0.4;
    group.add(lp);
    var rp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.25), panelMat);
    rp.position.x = 0.4;
    group.add(rp);

    // Blinking light
    var light = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    light.position.y = 0.1;
    group.add(light);

    var sx = (Math.random() - 0.5) * 60;
    var sy = -15 - Math.random() * 15;
    var sz = (Math.random() - 0.5) * 60;
    group.position.set(sx, sy, sz);

    var angle = Math.random() * Math.PI * 2;
    var speed = 0.03 + Math.random() * 0.03;
    scene.add(group);
    bgEffects.push({
        obj: group, type: 'satellite', life: 1,
        vx: Math.cos(angle) * speed, vy: 0, vz: Math.sin(angle) * speed,
        decay: 0.001, blink: light
    });
}

function spawnSupernova() {
    var geo = new THREE.SphereGeometry(0.1, 12, 12);
    var mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.15, 1, 0.7),
        transparent: true, opacity: 1
    });
    var sphere = new THREE.Mesh(geo, mat);

    sphere.position.set(
        (Math.random() - 0.5) * 70,
        -15 - Math.random() * 25,
        (Math.random() - 0.5) * 70
    );
    scene.add(sphere);
    bgEffects.push({
        obj: sphere, type: 'supernova', life: 1,
        decay: 0.008, scale: 0.1, maxScale: 3 + Math.random() * 4
    });
}

function spawnAlien() {
    var group = new THREE.Group();

    // Saucer body
    var saucerMat = new THREE.MeshBasicMaterial({ color: 0x66ff66, transparent: true, opacity: 0.8 });
    var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), saucerMat);
    group.add(disc);

    // Dome
    var dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xaaffaa, transparent: true, opacity: 0.5 })
    );
    dome.position.y = 0.05;
    group.add(dome);

    // Beam
    var beamGeo = new THREE.CylinderGeometry(0.05, 0.3, 1.5, 8, 1, true);
    var beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({
        color: 0x44ff44, transparent: true, opacity: 0.25
    }));
    beam.position.y = -0.8;
    group.add(beam);

    // Blinking lights around rim
    for (var i = 0; i < 6; i++) {
        var a = (i / 6) * Math.PI * 2;
        var bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 6, 6),
            new THREE.MeshBasicMaterial({ color: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff][i] })
        );
        bulb.position.set(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55);
        group.add(bulb);
    }

    var sx = (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 20);
    var sy = -12 - Math.random() * 15;
    var sz = (Math.random() - 0.5) * 50;
    group.position.set(sx, sy, sz);

    var speed = 0.08 + Math.random() * 0.1;
    var dir = sx > 0 ? -1 : 1;
    scene.add(group);
    bgEffects.push({
        obj: group, type: 'alien', life: 1,
        vx: dir * speed, vy: Math.sin(Math.random()) * 0.01, vz: (Math.random() - 0.5) * 0.03,
        decay: 0.0015, wobble: 0
    });
}

function spawnAbsurdThing() {
    var group = new THREE.Group();
    var kind = Math.floor(Math.random() * 5);

    if (kind === 0) {
        // Rubber duck
        var duckBody = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xffdd00 })
        );
        group.add(duckBody);
        var duckHead = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffdd00 })
        );
        duckHead.position.set(0.2, 0.2, 0);
        group.add(duckHead);
        var beak = new THREE.Mesh(
            new THREE.ConeGeometry(0.06, 0.15, 6),
            new THREE.MeshBasicMaterial({ color: 0xff8800 })
        );
        beak.rotation.z = -Math.PI / 2;
        beak.position.set(0.38, 0.2, 0);
        group.add(beak);
    } else if (kind === 1) {
        // Giant pizza slice
        var pizzaGeo = new THREE.CylinderGeometry(0, 0.5, 0.06, 3);
        var pizzaMat = new THREE.MeshBasicMaterial({ color: 0xdaa520 });
        group.add(new THREE.Mesh(pizzaGeo, pizzaMat));
        // Pepperoni
        for (var p = 0; p < 3; p++) {
            var pep = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xcc2200 })
            );
            pep.position.set((Math.random() - 0.5) * 0.2, 0.04, (Math.random() - 0.3) * 0.2);
            group.add(pep);
        }
    } else if (kind === 2) {
        // Toilet
        var bowl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.15, 0.3, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        group.add(bowl);
        var tank = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.25, 0.12),
            new THREE.MeshBasicMaterial({ color: 0xeeeeee })
        );
        tank.position.set(0, 0.1, -0.15);
        group.add(tank);
        var lid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12),
            new THREE.MeshBasicMaterial({ color: 0xdddddd })
        );
        lid.position.y = 0.16;
        lid.rotation.x = -0.5;
        group.add(lid);
    } else if (kind === 3) {
        // Giant eyeball
        var eyeball = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xffeedd })
        );
        group.add(eyeball);
        var iris = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0x2266aa })
        );
        iris.position.z = 0.28;
        group.add(iris);
        var pupil = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        pupil.position.z = 0.34;
        group.add(pupil);
    } else {
        // Banana
        var bananaMat = new THREE.MeshBasicMaterial({ color: 0xffe135 });
        var seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8), bananaMat);
        seg1.rotation.z = 0.2;
        group.add(seg1);
        var seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.3, 8), bananaMat);
        seg2.position.set(0.05, 0.28, 0);
        seg2.rotation.z = -0.2;
        group.add(seg2);
        var tip = new THREE.Mesh(
            new THREE.ConeGeometry(0.05, 0.1, 6),
            new THREE.MeshBasicMaterial({ color: 0x6b4226 })
        );
        tip.position.set(0.02, 0.45, 0);
        group.add(tip);
    }

    var sx = (Math.random() - 0.5) * 70;
    var sy = -10 - Math.random() * 25;
    var sz = (Math.random() - 0.5) * 70;
    group.position.set(sx, sy, sz);
    group.scale.setScalar(0.8 + Math.random() * 0.5);

    var speed = 0.02 + Math.random() * 0.04;
    var angle = Math.random() * Math.PI * 2;
    scene.add(group);
    bgEffects.push({
        obj: group, type: 'absurd', life: 1,
        vx: Math.cos(angle) * speed, vy: (Math.random() - 0.5) * 0.01, vz: Math.sin(angle) * speed,
        decay: 0.0012, spin: (Math.random() - 0.5) * 0.05
    });
}

// ========== UPDATE BACKGROUND ==========

var lastBgSpawnTime = 0;

function updateBackground() {
    var now = performance.now();

    // Spawn new effects periodically
    if (now - lastBgSpawnTime > 600 + Math.random() * 1200) {
        lastBgSpawnTime = now;
        spawnBgEffect();
    }

    // Cap active effects
    while (bgEffects.length > 25) {
        var old = bgEffects.shift();
        scene.remove(old.obj);
    }

    for (var i = bgEffects.length - 1; i >= 0; i--) {
        var e = bgEffects[i];
        e.life -= e.decay;

        if (e.life <= 0) {
            scene.remove(e.obj);
            bgEffects.splice(i, 1);
            continue;
        }

        // Move
        e.obj.position.x += e.vx || 0;
        e.obj.position.y += e.vy || 0;
        e.obj.position.z += e.vz || 0;

        if (e.type === 'shootingStar') {
            e.obj.material.opacity = e.life;
        } else if (e.type === 'satellite') {
            // Blink light
            if (e.blink) {
                e.blink.visible = Math.sin(now * 0.008) > 0;
            }
            e.obj.rotation.y += 0.005;
        } else if (e.type === 'supernova') {
            e.scale = Math.min(e.scale + 0.06, e.maxScale);
            e.obj.scale.setScalar(e.scale);
            e.obj.material.opacity = e.life * 0.8;
        } else if (e.type === 'alien') {
            e.wobble += 0.05;
            e.obj.position.y += Math.sin(e.wobble) * 0.02;
            e.obj.rotation.y += 0.02;
        } else if (e.type === 'absurd') {
            e.obj.rotation.x += e.spin || 0;
            e.obj.rotation.y += (e.spin || 0) * 0.7;
        }
    }
}

// ========== PLAYER BOX ==========

function createPlayerBox() {
    const boxGeo = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#c4a574';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#a08050';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 124, 124);
    ctx.beginPath(); ctx.moveTo(0, 64); ctx.lineTo(128, 64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 128); ctx.stroke();

    const boxMat = new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(canvas), roughness: 0.8
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(0, BOX_SIZE / 2 + 0.01, 0);
    box.castShadow = true;
    scene.add(box);
    gameState.playerBox = box;
}

function onWindowResize() {
    const a = window.innerWidth / window.innerHeight;
    camera.aspect = a;
    camera.fov = a < 1 ? 75 : 60;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
