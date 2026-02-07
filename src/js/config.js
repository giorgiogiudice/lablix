/**
 * Lablix - Configuration and Constants
 */

const PLATFORM_WIDTH = 12;
const PLATFORM_DEPTH = 12;
const PLATFORM_HEIGHT = 0.5;
const PLATFORM_ELEVATION = 0;

const FRICTION = 0.92;
const ACCELERATION = 0.015;
const MAX_VELOCITY = 0.30;
const BOX_SIZE = 1;
const FALL_GRAVITY = 0.015;

const gameState = {
    score: 0,
    lives: 5,
    highScore: 0,
    currentScreen: 'start',
    isPlaying: false,
    isMobile: false,
    initialized: false,
    velocity: { x: 0, z: 0 },
    acceleration: { x: 0, z: 0 },
    isOnPlatform: true,
    isFalling: false,
    fallVelocity: 0,
    fallRotation: { x: 0, z: 0 },
    calibration: { beta: 0, gamma: 0 },
    gyro: { beta: 0, gamma: 0 },
    tilt: { x: 0, z: 0 },
    gyroReceived: false,
    playerBox: null,
    // Enemy & Combat (Phases 7-10)
    enemy: null,
    enemyPillar: null,
    projectiles: [],
    lastShotTime: 0,
    difficultyTier: 1,
    // Taunt system
    lastTauntTime: 0,
    currentTaunt: null,
    // Hit detection
    isHit: false,
    hitCooldown: 0,
    lastHitTime: 0
};

let scene, camera, renderer, platformEdges;
let grassBlades = [];
let wakeLock = null;
let tempQuaternion, rotationAxis;
let startScreen, calibrationScreen, gameContainer;
