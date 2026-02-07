# Lablix - Complete Game Design Document

## PROJECT STATUS: COMPLETE

All core phases (1-12) have been implemented. The game is fully playable.

---

## Game Overview

**Lablix** is a mobile-only 3D tilt-controlled survival game where players guide a rolling box across a perilous platform using device orientation. One wrong move sends the box plummeting off the edge to instant death. Collect coins while dodging high-heel shoes thrown by an angry woman who psychologically torments the player with harsh, voiced taunts. The game features realistic physics with momentum and inertia, progressive difficulty across 4 tiers, Web Speech API integration for spoken taunts, and **multilingual support** (English, Italian, Spanish, Chinese).

---

## Implemented Features Summary

### Core Gameplay
- **Gyroscope-based tilt controls** with calibration system
- **Physics-based movement** with inertia, friction, and momentum
- **No boundary collisions** - box can roll right off the platform edge
- **Quaternion-based rolling animation** matching movement direction
- **Instant death** when falling off platform
- **5 lives system** - lose 1 per hit, lose all on fall

### Enemy System
- **Angry woman character** built with Three.js primitives (dark red dress, black hair bun, angry face)
- **Walking animation** with leg/arm movement
- **Shoe-throwing animation** (wind-up, grab shoe, throw, follow-through)
- **Smooth LookAt** - character always faces the player
- **Larger character** (1.2x scale) for visibility

### Projectile System
- **Red high-heel shoes** as projectiles (Louboutin-style with red soles)
- **Stiletto heels** with pointed toe design
- **Realistic tumbling** rotation when thrown
- **Bounce physics** on platform with decreasing energy
- **Sliding with friction** until shoes fall off edges
- **Shoes never disappear** while on platform - must fall off
- **Dust particle effects** on bounce

### Taunt System
- **70+ taunts** across 7 categories (edge proximity, after hit, reckless movement, general mockery, near death, final death, fall off edge)
- **Web Speech API integration** for voiced taunts
- **Quality voice selection** prioritizing Google US English female voice
- **Higher pitch (1.2)** and faster rate (1.1) for angry delivery
- **Speech bubble UI** with fade animations
- **5-second cooldown** between taunts
- **Harshness scales** with difficulty tier (gentle → moderate → harsh → brutal)

### Progressive Difficulty
- **4 difficulty tiers** based on score:
  - Tier 1 (0-5 coins): EASY - 5s fire rate, 30% accuracy, gentle taunts
  - Tier 2 (6-15 coins): MEDIUM - 3s fire rate, 50% accuracy, moderate taunts
  - Tier 3 (16-30 coins): HARD - 2s fire rate, 70% accuracy, harsh taunts
  - Tier 4 (31+ coins): BRUTAL - 1.5s fire rate, 90% accuracy + predictive aiming, brutal taunts
- **Tier-up notification** with animation and game pause
- **Difficulty indicator UI** in bottom-right corner
- **Enemy speed and projectile speed** scale with tier

### Combat & Collision
- **AABB-sphere collision detection** for accurate hit detection
- **Enemy solid collision** - box cannot pass through the enemy (bounces back)
- **Invulnerability period** (1 second) after hit
- **Visual feedback**: red flash, screen shake, particle burst
- **Knockback force** applied to box on hit

### Coin System
- **Gold 3D coin** with metallic material
- **Spinning and hovering** animation
- **Random spawn** within safe platform bounds
- **Particle burst** on collection
- **Immediate respawn** after collection

### Screen Management
- **Screen Wake Lock API** with video fallback
- **Fullscreen mode** during gameplay
- **Orientation lock** (landscape)
- **Auto-reacquire** wake lock on visibility change

### UI/UX
- **Start screen** with high score display
- **Language selector** with flag and language name dropdown
- **Calibration screen** with instructions
- **HUD** with score, lives, and difficulty tier
- **Game over screen** with cause of death
- **Exit button** to return to start screen

### Multilingual Support
- **4 languages**: English, Italian, Spanish, Chinese
- **Browser language detection** - automatically selects language based on browser settings
- **Language selector** on start screen with flags and native language names
- **All UI text translated**: buttons, labels, instructions, game over messages
- **All 70+ taunts translated** into all 4 languages
- **Voice synthesis per language** - uses appropriate voice for selected language
- **Language preference saved** to localStorage

---

## Technical Stack

- **Three.js** (r150+) - 3D rendering
- **Web Speech API** - Voice synthesis for taunts
- **Device Orientation API** - Gyroscope input
- **Screen Wake Lock API** - Screen management (with video fallback)
- **Vanilla JavaScript (ES6+)** - Game logic
- **HTML5/CSS3** - UI and structure
- **LocalStorage** - High score persistence

---

## Project Structure

```
lablix/
├── index.html          # Entry point (loads from dist/)
├── package.json        # npm scripts
├── build.js            # Build system
├── Lablix.md           # This document
├── src/                # SOURCE FILES (edit these!)
│   ├── index.html
│   ├── css/
│   │   └── styles.css    # All game styling including speech bubbles, difficulty UI, language selector
│   └── js/
│       ├── config.js       # Constants & game state
│       ├── translations.js # Multilingual translations (EN, IT, ES, ZH)
│       ├── scene.js        # Three.js scene setup (platform, lights, camera)
│       ├── input.js        # Gyroscope & wake lock handling
│       ├── physics.js      # Physics calculations & falling
│       ├── coin.js         # Coin spawning & collection
│       ├── difficulty.js   # Progressive difficulty system & UI
│       ├── enemy.js        # Angry woman character & animations
│       ├── taunts.js       # Taunt system & Web Speech API
│       ├── projectile.js   # High-heel shoe projectile system
│       ├── collision.js    # Hit detection, damage effects, enemy collision
│       ├── ui.js           # UI updates & game over
│       └── game.js         # Main game loop
└── dist/               # BUILD OUTPUT (auto-generated)
    ├── index.html
    ├── css/styles.css
    └── js/game.bundle.js
```

---

## Build System

**Commands:**
```bash
node build.js          # Build once
node build.js --watch  # Watch mode (auto-rebuild)
npm run build          # Same as above
npm run dev            # Watch mode
```

The build system:
- Concatenates all JS files in dependency order
- Applies cache busting via timestamp version
- Copies CSS and generates index.html

---

## Current Physics Values

Located in `src/js/config.js`:
```javascript
FRICTION = 0.92
ACCELERATION = 0.010
MAX_VELOCITY = 0.20
PLATFORM_WIDTH = 10
PLATFORM_DEPTH = 10
```

---

## Implementation Phases (All Complete)

### Phase 1: Basic 3D Scene & Platform ✅
- Three.js scene with camera, lights, renderer
- Green platform with red glowing edges
- Starfield void background
- Mobile detection
- HUD with score and lives display
- Build system with cache busting

### Phase 2: The Box & Basic Physics ✅
- Cardboard-textured 3D box
- Physics-based movement with inertia and friction
- No boundary collisions (box can go off edge)
- Edge detection system

### Phase 3: Death System - Falling Off Edge ✅
- Box falls into void when crossing platform edge
- Gravity physics with accelerating fall
- Camera follows falling box
- Tumbling rotation during fall
- Game over screen after fall
- Restart functionality

### Phase 4: Gyroscope Integration & Calibration ✅
- Device orientation permission request (iOS compatible)
- Calibration screen with instructions
- Tilt-to-acceleration mapping
- Screen Wake Lock API integration
- Fullscreen and orientation lock

### Phase 5: Box Rolling Animation ✅
- Quaternion-based rotation
- Rotation matches movement direction and speed
- Tumbling effect when falling

### Phase 6: Coin System ✅
- Gold 3D coin with metallic material
- Spinning and hovering animation
- Random spawn within safe platform bounds
- Collision detection with box
- Score increment on collection
- Particle burst effect on collection

### Phase 7: Enemy Character ✅
- Angry woman character (Three.js primitives)
- Dark red dress, black hair with bun, angry face
- Larger character (1.2x scale)
- Walking animation with leg/arm movement
- Character faces the player (smooth LookAt)
- Shoe-throwing animation sequence

### Phase 8: Taunt System ✅
- 70+ taunts across 7 categories
- Web Speech API integration with Google US English voice
- Speech bubble UI with fade animations
- Trigger detection (edge proximity, hits, reckless movement)
- 5-second cooldown between taunts
- Harshness scales with difficulty tier

### Phase 9: Projectile System ✅
- Red high-heel shoes (Louboutin-style with stiletto and red sole)
- Realistic tumbling rotation when thrown
- Bounce physics on platform
- Sliding with friction until falling off edges
- Shoes never disappear while on platform
- Dust particle effects on bounce
- Predictive aiming at tier 4

### Phase 10: Hit Detection & Lives ✅
- AABB-sphere collision detection
- Invulnerability period after hit (1 second)
- Visual feedback (red flash, screen shake, particles)
- Knockback force applied to box
- Taunt triggers on hit
- Game over at 0 lives

### Phase 11: Progressive Difficulty ✅
- 4 difficulty tiers based on score
- Tier-up notification with game pause
- Difficulty indicator UI
- Fire rate, accuracy, enemy speed, projectile speed all scale
- Taunt harshness escalates per tier
- Predictive aiming at tier 4

### Phase 12: Screen Wake Lock ✅
- Screen Wake Lock API with video fallback
- Wake lock acquired on game start
- Released on game over/exit
- Re-acquired on visibility change
- Works on Android and iOS

---

## Game Balance

### Lives System
- 5 lives total provides buffer for learning
- Falling = instant death keeps stakes high
- Hits = -1 life allows recovery from mistakes

### Platform Size
- 10x10 units - large enough for movement, small enough for tension

### Coin Spawn Safety
- 15% margin from edges prevents unfair deaths
- Minimum distance from player on spawn

### Projectile Physics
- Shoes bounce with decreasing energy (0.4 bounce factor)
- High friction (0.992) for long sliding
- Push toward nearest edge when speed drops below threshold
- Never removed until falling off platform

### Knockback
- Noticeable but not excessive
- Adds strategic element near edges

---

## Voice Configuration

Located in `src/js/translations.js` (language-specific voices):
```javascript
const LANGUAGES = {
    en: {
        name: 'English', flag: '🇬🇧',
        voices: ['Google US English', 'Google UK English Female', 'Samantha']
    },
    it: {
        name: 'Italiano', flag: '🇮🇹',
        voices: ['Google italiano', 'Microsoft Elsa', 'Alice', 'Federica']
    },
    es: {
        name: 'Español', flag: '🇪🇸',
        voices: ['Google español', 'Microsoft Helena', 'Monica', 'Paulina']
    },
    zh: {
        name: '中文', flag: '🇨🇳',
        voices: ['Google 普通话', 'Microsoft Huihui', 'Ting-Ting', 'Meijia']
    }
};
```

Voice settings for angry delivery (in `src/js/taunts.js`):
```javascript
utterance.rate = 1.1;   // Slightly faster
utterance.pitch = 1.2;  // Higher pitch
utterance.volume = 0.8;
```

---

## Success Metrics

The game achieves:
- ✅ Players can survive to 10+ coins with practice
- ✅ Falling feels like player's fault
- ✅ Enemy taunts are funny/motivating
- ✅ Controls feel responsive and fair
- ✅ Difficulty progression feels natural
- ✅ "Just one more try" appeal
- ✅ Smooth performance on mobile
- ✅ Cache busting works reliably
- ✅ Multilingual support works seamlessly
- ✅ Enemy acts as solid obstacle

---

## Code Guidelines

- **Modularization**: Each file handles one concern (max ~300 lines each)
- **No external dependencies** except Three.js
- **All game state** centralized in `config.js`
- **Build system** concatenates files in dependency order

---

**Lablix** - A skill-based survival game with personality, where deaths feel earned and victories feel rewarding!
