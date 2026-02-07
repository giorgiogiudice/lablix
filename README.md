<p align="center">
  <img src="src/img/logo.png" alt="Lablix" width="200">
</p>

<h1 align="center">Lablix</h1>

<p align="center">
  <strong>A mobile 3D tilt-controlled survival game</strong><br>
  Tilt to survive. Don't fall. Dodge the shoes.
</p>

<p align="center">
  <a href="https://giorgiogiudice.com/lablix">Play Now</a>
</p>

---

## About

**Lablix** is a mobile-only 3D survival game where you tilt your phone to guide a rolling box across a floating platform in space. Collect coins, dodge high-heel shoes thrown by an angry woman, and try not to fall off the edge. She will taunt you the entire time.

The game runs entirely in the browser with no installs required — just open the link on your phone and play.

## Gameplay

- **Tilt your phone** to control the box — the physics simulate real momentum and inertia
- **Collect coins** to increase your score and unlock harder difficulty tiers
- **Dodge shoes** thrown by an angry woman who follows you around the platform
- **Don't fall off the edge** — there are no walls, and falling means instant death
- **5 lives** — each shoe hit costs one life, falling costs them all

## Features

### Core Mechanics
- Gyroscope-based tilt controls with calibration system
- Physics-based movement with inertia, friction, and momentum
- Quaternion-based rolling animation matching movement direction
- No boundary walls — the box can roll right off the edge

### Enemy System
- 3D angry woman character built with Three.js primitives
- Walking animation, shoe-throwing animation sequence
- Always faces and tracks the player
- Acts as a solid obstacle — the box bounces off her

### Projectile System
- Red high-heel stiletto shoes as projectiles
- Realistic tumbling rotation, bounce physics, and friction
- Shoes slide across the platform until they fall off the edge
- Predictive aiming at the highest difficulty tier

### Taunt System
- 70+ voiced taunts across 7 categories
- Pre-recorded Italian voice lines via ElevenLabs TTS
- Web Speech API fallback for English
- Taunts escalate in harshness with difficulty
- Per-category tracking ensures no repeats until all are used

### Progressive Difficulty
| Tier | Score | Fire Rate | Accuracy | Description |
|------|-------|-----------|----------|-------------|
| 1 | 0-5 | 5s | 30% | Easy |
| 2 | 6-15 | 3s | 50% | Medium |
| 3 | 16-30 | 2s | 70% | Hard |
| 4 | 31+ | 1.5s | 90% | Brutal |

### Visuals
- Animated space background with shooting stars, satellites, supernovas, and UFOs
- Canvas-generated grass texture on the platform
- Particle effects on coin collection, shoe bounces, and hits
- Glowing red platform edges

### Multilingual
- English and Italian language support
- Browser language auto-detection
- Language selector on the start screen
- All UI text and taunts translated

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Three.js](https://threejs.org/) (r150) | 3D rendering |
| Device Orientation API | Gyroscope input |
| Web Speech API | English voice synthesis |
| ElevenLabs TTS | Pre-recorded Italian voice lines |
| Screen Wake Lock API | Prevents screen dimming during play |
| Vanilla JavaScript (ES6+) | Game logic |
| HTML5 / CSS3 | UI and structure |
| localStorage | High scores, language preference, taunt tracking |

## Project Structure

```
lablix/
├── src/                    # Source files (edit these)
│   ├── index.html          # HTML template
│   ├── css/
│   │   └── styles.css      # All game styling
│   ├── js/
│   │   ├── config.js       # Constants & game state
│   │   ├── translations.js # i18n translations
│   │   ├── scene.js        # Three.js scene, starfield, grass texture
│   │   ├── input.js        # Gyroscope, wake lock, fullscreen
│   │   ├── audio.js        # Sound effects system
│   │   ├── physics.js      # Movement, falling, edge detection
│   │   ├── coin.js         # Coin spawning & collection
│   │   ├── difficulty.js   # Progressive difficulty & tier UI
│   │   ├── enemy.js        # Angry woman character & animations
│   │   ├── taunts.js       # Taunt system & speech
│   │   ├── projectile.js   # Shoe projectile system
│   │   ├── collision.js    # Hit detection & damage effects
│   │   ├── ui.js           # HUD & game over screen
│   │   └── game.js         # Main game loop & screen management
│   ├── data/
│   │   └── taunts.json     # All taunt text (EN + IT)
│   ├── audio/
│   │   ├── fx/             # Sound effects (step, coin, hit, fall, wosh)
│   │   └── taunts/it/      # Pre-recorded Italian voice lines
│   └── img/
│       └── logo.png        # Game logo
├── build.js                # Build system (concatenation + cache busting)
├── package.json            # npm scripts
└── Lablix.md               # Detailed game design document
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (any recent version)

### Build

```bash
# Clone the repository
git clone https://github.com/giorgiogiudice/lablix.git
cd lablix

# Build once
node build.js

# Or watch for changes during development
node build.js --watch
```

The build system concatenates all JS modules in dependency order, applies cache busting via timestamps, copies assets, and generates `index.html`.

### Serve Locally

Serve the root directory with any static file server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Then open `http://localhost:8000` on your phone (same Wi-Fi network) or use your browser's device emulation with gyroscope simulation.

### Play

The game requires a mobile device with a gyroscope. Open the URL, grant gyroscope permission, calibrate by holding your phone flat, and tap **Start Now**.

## How the Build Works

The build script (`build.js`):
1. Concatenates all JS source files in dependency order into a single bundle
2. Embeds `taunts.json` as an inline JS constant (no runtime fetch)
3. Generates an audio filename map for Italian voice lines
4. Copies audio, image, and CSS assets
5. Applies cache busting via timestamp-based filenames (`game.{ts}.js`, `styles.{ts}.css`)
6. Outputs `index.html` with the correct asset references

No external build tools (webpack, vite, etc.) are needed — just Node.js.

## Credits

**Ideator & Creator**: [Giorgio Giudice](https://giorgiogiudice.com)

## License

All rights reserved. This project is shared for educational and portfolio purposes. See the code, learn from it, but please don't redistribute or deploy copies without permission.
