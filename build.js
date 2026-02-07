#!/usr/bin/env node
/**
 * Lablix Build System
 * Concatenates source files, adds cache busting, outputs to dist/
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = __dirname; // Output to main lablix folder
const JS_FILES = [
    'config.js',
    'translations.js',  // Translations must come before modules that use them
    'scene.js',
    'input.js',
    'audio.js',
    'physics.js',
    'coin.js',
    'difficulty.js',
    'enemy.js',
    'taunts.js',
    'projectile.js',
    'collision.js',
    'ui.js',
    'game.js'
];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function build() {
    const timestamp = Date.now();
    console.log(`\n🔨 Building Lablix (${timestamp})...\n`);

    ensureDir(DIST_DIR);
    ensureDir(path.join(DIST_DIR, 'js'));
    ensureDir(path.join(DIST_DIR, 'css'));

    // Clean old timestamped files
    const jsDir = path.join(DIST_DIR, 'js');
    const cssDir = path.join(DIST_DIR, 'css');
    fs.readdirSync(jsDir).filter(f => f.startsWith('game.') && f.endsWith('.js')).forEach(f => {
        fs.unlinkSync(path.join(jsDir, f));
    });
    fs.readdirSync(cssDir).filter(f => f.startsWith('styles.') && f.endsWith('.css')).forEach(f => {
        fs.unlinkSync(path.join(cssDir, f));
    });

    // Bundle JS files with timestamp in filename
    const jsFilename = `game.${timestamp}.js`;
    let jsBundle = `/* Lablix ${timestamp} */\n`;

    // Embed taunts.json as a JS constant
    const tauntsJsonPath = path.join(SRC_DIR, 'data', 'taunts.json');
    if (fs.existsSync(tauntsJsonPath)) {
        const tauntsJson = fs.readFileSync(tauntsJsonPath, 'utf8');
        const tauntsData = JSON.parse(tauntsJson);
        jsBundle += `\n// ========== taunts.json (auto-embedded) ==========\n`;
        jsBundle += `const TAUNTS_DATA = ${tauntsJson};\n`;
        console.log(`  📦 Embedded taunts.json`);

        // Generate Italian text → audio filename map
        const audioMap = {};
        for (const [cat, val] of Object.entries(tauntsData)) {
            if (cat === 'difficulty_increase') {
                for (const [tier, langs] of Object.entries(val)) {
                    if (langs.it) {
                        langs.it.forEach((text, i) => {
                            audioMap[text] = `audio/taunts/it/difficulty_increase_${tier}_${String(i).padStart(2, '0')}.mp3?v=${timestamp}`;
                        });
                    }
                }
            } else if (val.it) {
                val.it.forEach((text, i) => {
                    audioMap[text] = `audio/taunts/it/${cat}_${String(i).padStart(2, '0')}.mp3?v=${timestamp}`;
                });
            }
        }
        jsBundle += `const TAUNTS_AUDIO = ${JSON.stringify(audioMap)};\n`;
        console.log(`  📦 Generated audio map (${Object.keys(audioMap).length} entries)`);
    }

    // Copy audio files to dist
    const audioSrcDir = path.join(SRC_DIR, 'audio');
    if (fs.existsSync(audioSrcDir)) {
        const audioDistDir = path.join(DIST_DIR, 'audio', 'taunts', 'it');
        ensureDir(audioDistDir);
        const audioFiles = fs.readdirSync(path.join(audioSrcDir, 'taunts', 'it')).filter(f => f.endsWith('.mp3'));
        audioFiles.forEach(f => {
            fs.copyFileSync(path.join(audioSrcDir, 'taunts', 'it', f), path.join(audioDistDir, f));
        });
        console.log(`  📦 Copied ${audioFiles.length} taunt audio files`);
    }

    // Copy images to dist
    const imgSrcDir = path.join(SRC_DIR, 'img');
    if (fs.existsSync(imgSrcDir)) {
        const imgDistDir = path.join(DIST_DIR, 'img');
        ensureDir(imgDistDir);
        const imgFiles = fs.readdirSync(imgSrcDir).filter(f => /\.(png|jpg|svg|ico|webp)$/i.test(f));
        imgFiles.forEach(f => {
            fs.copyFileSync(path.join(imgSrcDir, f), path.join(imgDistDir, f));
        });
        console.log(`  📦 Copied ${imgFiles.length} image files`);
    }

    // Copy music files to dist
    const musicSrcDir = path.join(SRC_DIR, 'audio', 'music');
    if (fs.existsSync(musicSrcDir)) {
        const musicDistDir = path.join(DIST_DIR, 'audio', 'music');
        ensureDir(musicDistDir);
        const musicFiles = fs.readdirSync(musicSrcDir).filter(f => f.endsWith('.mp3'));
        musicFiles.forEach(f => {
            fs.copyFileSync(path.join(musicSrcDir, f), path.join(musicDistDir, f));
        });
        console.log(`  📦 Copied ${musicFiles.length} music files`);
    }

    // Copy FX audio files to dist
    const fxSrcDir = path.join(SRC_DIR, 'audio', 'fx');
    if (fs.existsSync(fxSrcDir)) {
        const fxDistDir = path.join(DIST_DIR, 'audio', 'fx');
        ensureDir(fxDistDir);
        const fxFiles = fs.readdirSync(fxSrcDir).filter(f => f.endsWith('.mp3'));
        fxFiles.forEach(f => {
            fs.copyFileSync(path.join(fxSrcDir, f), path.join(fxDistDir, f));
        });
        console.log(`  📦 Copied ${fxFiles.length} FX audio files`);
    }

    for (const file of JS_FILES) {
        const filePath = path.join(SRC_DIR, 'js', file);
        if (fs.existsSync(filePath)) {
            console.log(`  📦 Adding ${file}`);
            jsBundle += `\n// ========== ${file} ==========\n`;
            jsBundle += fs.readFileSync(filePath, 'utf8');
            jsBundle += '\n';
        }
    }

    fs.writeFileSync(path.join(DIST_DIR, 'js', jsFilename), jsBundle);
    console.log(`  ✅ Created js/${jsFilename}`);

    // Copy CSS with timestamp in filename
    const cssFilename = `styles.${timestamp}.css`;
    const cssPath = path.join(SRC_DIR, 'css', 'styles.css');
    if (fs.existsSync(cssPath)) {
        fs.copyFileSync(cssPath, path.join(DIST_DIR, 'css', cssFilename));
        console.log(`  ✅ Created css/${cssFilename}`);
    }

    // Generate HTML with timestamped filenames
    const htmlTemplate = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');
    const html = htmlTemplate
        .replace(/\{\{VERSION\}\}/g, timestamp)
        .replace(/css\/styles\.css/g, `css/${cssFilename}`)
        .replace(/js\/game\.bundle\.js/g, `js/${jsFilename}`);

    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
    fs.writeFileSync(path.join(DIST_DIR, 'game.html'), html);
    console.log(`  ✅ Created index.html + game.html`);

    console.log(`\n✨ Build complete!\n`);
}

function watch() {
    console.log('👀 Watching for changes...\n');
    build();

    fs.watch(SRC_DIR, { recursive: true }, (eventType, filename) => {
        if (filename && !filename.includes('.swp')) {
            console.log(`\n📝 Changed: ${filename}`);
            build();
        }
    });
}

// Run
if (process.argv.includes('--watch')) {
    watch();
} else {
    build();
}
