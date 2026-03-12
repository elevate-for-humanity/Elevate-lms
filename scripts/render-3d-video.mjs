/**
 * Render 3D HVAC condenser walkthrough video using Puppeteer + Three.js
 * 
 * Captures frames from a headless browser rendering the GLB model,
 * with animated camera movements, component highlighting, and labels.
 * Then composites with FFmpeg + TTS audio.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const FRAME_DIR = '/workspaces/Elevate-lms/temp/hvac-3d-frames';
const AUDIO_DIR = '/workspaces/Elevate-lms/temp/hvac-video';
const OUTPUT_DIR = '/workspaces/Elevate-lms/temp/hvac-video';
const GLB_PATH = '/workspaces/Elevate-lms/public/models/hvac-condenser.glb';
const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 24;

// Scene timeline: camera positions + component highlights synced to narration
// Audio durations from the TTS files already generated
const SCENES = [
  {
    id: 'overview',
    audio: '01-hook.mp3',
    duration: 28.4, // seconds
    segments: [
      // Slow orbit showing the full unit
      { t: 0, camera: [3, 2.5, 3], lookAt: [0, 0.6, 0], highlight: null, label: 'HVAC Condenser Unit' },
      { t: 7, camera: [3, 1.5, 0], lookAt: [0, 0.6, 0], highlight: null, label: 'Outdoor Condenser' },
      { t: 14, camera: [0, 2.5, 3], lookAt: [0, 0.6, 0], highlight: null, label: 'Split AC System' },
      { t: 21, camera: [-2, 2, 2.5], lookAt: [0, 0.6, 0], highlight: null, label: '6 Key Components Inside' },
    ],
  },
  {
    id: 'condenser-overview',
    audio: '02-condenser-overview.mp3',
    duration: 18.4,
    segments: [
      { t: 0, camera: [2.5, 2, 2.5], lookAt: [0, 0.6, 0], highlight: 'Casing', label: 'Condenser Cabinet' },
      { t: 5, camera: [1.5, 1.5, 1.5], lookAt: [0, 0.6, 0], highlight: null, label: '6 Components' },
      { t: 9, camera: [1, 0.8, 1.5], lookAt: [0.15, 0.3, 0.1], highlight: 'Compressor', label: 'Compressor' },
      { t: 12, camera: [0, 2, 1.5], lookAt: [0, 1.35, 0], highlight: 'FanMotor', label: 'Fan Motor' },
      { t: 15, camera: [-1, 0.8, 1], lookAt: [-0.35, 0.35, 0.15], highlight: 'Capacitor', label: 'Capacitor' },
    ],
  },
  {
    id: 'compressor-coil',
    audio: '03-compressor-coil.mp3',
    duration: 37.8,
    segments: [
      // Zoom into compressor
      { t: 0, camera: [1, 0.5, 1], lookAt: [0.15, 0.3, 0.1], highlight: 'Compressor', label: 'COMPRESSOR — Heart of the System' },
      { t: 5, camera: [0.8, 0.3, 0.6], lookAt: [0.15, 0.3, 0.1], highlight: 'Compressor', label: 'Compresses Low-Pressure Gas' },
      { t: 10, camera: [0.6, 0.4, 0.8], lookAt: [0.15, 0.3, 0.1], highlight: 'Compressor', label: 'Most Expensive Component' },
      // Pan to condenser coil (casing)
      { t: 15, camera: [1.5, 1, 0], lookAt: [0, 0.6, 0], highlight: 'Casing', label: 'CONDENSER COIL — Copper + Aluminum Fins' },
      { t: 20, camera: [1.8, 0.8, 0.5], lookAt: [0, 0.6, 0], highlight: 'Casing', label: 'Rejects Heat to Outdoor Air' },
      { t: 25, camera: [0, 0.8, 1.8], lookAt: [0, 0.6, 0], highlight: 'Casing', label: 'Clean Fins = Good Airflow' },
      // Show fan motor
      { t: 30, camera: [0.5, 2.2, 1], lookAt: [0, 1.35, 0], highlight: 'FanMotor', label: 'FAN MOTOR — Pulls Air Through Coil' },
      { t: 34, camera: [-0.5, 2, 1.2], lookAt: [0, 1.35, 0], highlight: 'TopGrille', label: 'Check: Blade Spins Freely' },
    ],
  },
  {
    id: 'electrical',
    audio: '04-electrical.mp3',
    duration: 38.6,
    segments: [
      // Zoom to capacitor
      { t: 0, camera: [-0.8, 0.5, 0.8], lookAt: [-0.35, 0.35, 0.15], highlight: 'Capacitor', label: 'CAPACITOR — #1 Failure Point' },
      { t: 5, camera: [-0.6, 0.4, 0.6], lookAt: [-0.35, 0.35, 0.15], highlight: 'Capacitor', label: 'Stores Electrical Energy' },
      { t: 10, camera: [-0.7, 0.3, 0.5], lookAt: [-0.35, 0.35, 0.15], highlight: 'Capacitor', label: 'Test with Multimeter (µF)' },
      { t: 15, camera: [-0.5, 0.5, 0.7], lookAt: [-0.35, 0.35, 0.15], highlight: 'Capacitor', label: 'Replace if >10% Below Rating' },
      // Pan to contactor
      { t: 20, camera: [-0.5, 0.7, 1], lookAt: [-0.15, 0.45, 0.45], highlight: 'Contactor', label: 'CONTACTOR — Electromagnetic Switch' },
      { t: 25, camera: [-0.3, 0.5, 1.2], lookAt: [-0.15, 0.45, 0.45], highlight: 'Contactor', label: '24V Coil → Closes 240V Contacts' },
      { t: 30, camera: [-0.4, 0.6, 0.9], lookAt: [-0.15, 0.45, 0.45], highlight: 'Contactor', label: 'Check for Pitted/Burned Contacts' },
      // Show service valves (ref lines)
      { t: 34, camera: [1.2, 0.5, 0.5], lookAt: [0.45, 0.35, 0], highlight: 'RefLine1', label: 'SERVICE VALVES — Gauge Ports' },
    ],
  },
  {
    id: 'inspection',
    audio: '05-inspection.mp3',
    duration: 36.3,
    segments: [
      // Full unit view for inspection overview
      { t: 0, camera: [3, 2, 2], lookAt: [0, 0.6, 0], highlight: null, label: 'STEP 1: Visual Inspection' },
      { t: 5, camera: [2.5, 1, 2.5], lookAt: [0, 0.6, 0], highlight: 'Casing', label: 'Check for Debris, Damage, Oil Stains' },
      // Airflow check - top view
      { t: 10, camera: [0.5, 3, 0.5], lookAt: [0, 1.35, 0], highlight: 'TopGrille', label: 'STEP 2: Check Airflow' },
      { t: 15, camera: [0, 2.5, 1], lookAt: [0, 1.35, 0], highlight: 'FanMotor', label: 'Feel for Strong Warm Air at Top' },
      // Capacitor test
      { t: 20, camera: [-0.8, 0.5, 0.8], lookAt: [-0.35, 0.35, 0.15], highlight: 'Capacitor', label: 'STEP 3: Test Capacitor' },
      { t: 25, camera: [-0.6, 0.4, 0.6], lookAt: [-0.35, 0.35, 0.15], highlight: 'Capacitor', label: 'Multimeter → Microfarad Setting' },
      // Gauges on service valves
      { t: 28, camera: [1.5, 0.5, 0.5], lookAt: [0.45, 0.35, 0], highlight: 'RefLine1', label: 'STEP 4: Connect Manifold Gauges' },
      { t: 32, camera: [1.2, 0.4, 0.8], lookAt: [0.45, 0.35, 0], highlight: 'RefLine2', label: 'Compare Pressures to Specs' },
    ],
  },
  {
    id: 'summary',
    audio: '06-summary.mp3',
    duration: 28.9,
    segments: [
      // Orbit showing all components one more time
      { t: 0, camera: [2.5, 2, 2.5], lookAt: [0, 0.6, 0], highlight: null, label: 'MODULE 1 COMPLETE' },
      { t: 5, camera: [1, 0.5, 1.5], lookAt: [0.15, 0.3, 0.1], highlight: 'Compressor', label: '✓ Compressor' },
      { t: 8, camera: [1.5, 1, 0], lookAt: [0, 0.6, 0], highlight: 'Casing', label: '✓ Condenser Coil' },
      { t: 11, camera: [0, 2.2, 1], lookAt: [0, 1.35, 0], highlight: 'FanMotor', label: '✓ Fan Motor' },
      { t: 14, camera: [-0.8, 0.5, 0.8], lookAt: [-0.35, 0.35, 0.15], highlight: 'Capacitor', label: '✓ Capacitor' },
      { t: 17, camera: [-0.5, 0.7, 1], lookAt: [-0.15, 0.45, 0.45], highlight: 'Contactor', label: '✓ Contactor' },
      { t: 20, camera: [1.2, 0.5, 0.5], lookAt: [0.45, 0.35, 0], highlight: 'RefLine1', label: '✓ Service Valves' },
      { t: 23, camera: [3, 2.5, 3], lookAt: [0, 0.6, 0], highlight: null, label: 'Now Try the 3D Lab + Quiz ↓' },
    ],
  },
];

// HTML page that Three.js renders in the browser
function buildHTML() {
  const glbBase64 = fs.readFileSync(GLB_PATH).toString('base64');
  
  return `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; background: #0f172a; overflow: hidden; }
  canvas { display: block; }
  #label {
    position: absolute; bottom: 40px; left: 0; right: 0;
    text-align: center; font-family: 'Arial', sans-serif;
    font-size: 36px; font-weight: bold; color: white;
    text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5);
    pointer-events: none; padding: 0 40px;
    letter-spacing: 1px;
  }
  #scene-label {
    position: absolute; top: 30px; left: 40px;
    font-family: 'Arial', sans-serif; font-size: 18px;
    color: rgba(255,255,255,0.6); pointer-events: none;
    letter-spacing: 2px; text-transform: uppercase;
  }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r152/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.152.0/examples/js/loaders/GLTFLoader.js"></script>
</head>
<body>
<div id="label"></div>
<div id="scene-label"></div>
<script>
const WIDTH = ${WIDTH};
const HEIGHT = ${HEIGHT};

// Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);

// Gradient floor
const floorGeo = new THREE.PlaneGeometry(10, 10);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.05;
floor.receiveShadow = true;
scene.add(floor);

// Grid helper for tech look
const grid = new THREE.GridHelper(6, 20, 0x334155, 0x1e293b);
grid.position.y = -0.04;
scene.add(grid);

const camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 100);
camera.position.set(3, 2.5, 3);
camera.lookAt(0, 0.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 1.0);
key.position.set(5, 8, 5);
key.castShadow = true;
key.shadow.mapSize.width = 2048;
key.shadow.mapSize.height = 2048;
scene.add(key);

const fill = new THREE.DirectionalLight(0x88aaff, 0.3);
fill.position.set(-3, 4, -2);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.2);
rim.position.set(0, 3, -5);
scene.add(rim);

// Store original materials
const originalMaterials = {};
let model = null;

// Load GLB from base64
const glbBytes = Uint8Array.from(atob('${glbBase64}'), c => c.charCodeAt(0));
const loader = new THREE.GLTFLoader();
loader.parse(glbBytes.buffer, '', (gltf) => {
  model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      // Store original material
      originalMaterials[child.name] = child.material.clone();
      // Improve materials
      if (child.material) {
        child.material.metalness = 0.6;
        child.material.roughness = 0.4;
      }
    }
  });
  scene.add(model);
  window._modelReady = true;
}, (err) => console.error(err));

// Animation state
window._cameraPos = [3, 2.5, 3];
window._lookAt = [0, 0.6, 0];
window._highlight = null;
window._label = '';
window._sceneLabel = '';

function lerp(a, b, t) { return a + (b - a) * t; }

window.setFrame = function(camX, camY, camZ, lx, ly, lz, highlightMesh, label, sceneLabel) {
  window._cameraPos = [camX, camY, camZ];
  window._lookAt = [lx, ly, lz];
  window._highlight = highlightMesh;
  window._label = label;
  window._sceneLabel = sceneLabel || '';
};

window.renderFrame = function() {
  if (!model) return;
  
  // Smooth camera
  camera.position.set(...window._cameraPos);
  camera.lookAt(new THREE.Vector3(...window._lookAt));
  
  // Highlight logic
  model.traverse((child) => {
    if (child.isMesh && originalMaterials[child.name]) {
      if (window._highlight && child.name === window._highlight) {
        child.material = child.material.clone();
        child.material.emissive = new THREE.Color(0x3b82f6);
        child.material.emissiveIntensity = 0.5;
      } else if (window._highlight && child.name !== window._highlight && child.name !== 'BasePad') {
        child.material = originalMaterials[child.name].clone();
        child.material.opacity = 0.3;
        child.material.transparent = true;
      } else {
        child.material = originalMaterials[child.name].clone();
      }
    }
  });
  
  // Update labels
  document.getElementById('label').textContent = window._label;
  document.getElementById('scene-label').textContent = window._sceneLabel;
  
  renderer.render(scene, camera);
};
</script>
</body>
</html>`;
}

async function main() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--use-gl=swiftshader',
      `--window-size=${WIDTH},${HEIGHT}`,
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  console.log('Loading 3D scene...');
  await page.setContent(buildHTML(), { waitUntil: 'networkidle0' });

  // Wait for model to load
  await page.waitForFunction('window._modelReady === true', { timeout: 30000 });
  console.log('Model loaded.');

  // Clear frame directory
  const existingFrames = fs.readdirSync(FRAME_DIR).filter(f => f.endsWith('.png'));
  for (const f of existingFrames) fs.unlinkSync(path.join(FRAME_DIR, f));

  let globalFrame = 0;

  for (let sceneIdx = 0; sceneIdx < SCENES.length; sceneIdx++) {
    const sc = SCENES[sceneIdx];
    const totalFrames = Math.ceil(sc.duration * FPS);
    console.log(`\nScene ${sceneIdx + 1}/${SCENES.length}: ${sc.id} (${sc.duration}s, ${totalFrames} frames)`);

    for (let f = 0; f < totalFrames; f++) {
      const t = f / FPS; // current time in scene

      // Find which segment we're in
      let segIdx = 0;
      for (let s = 0; s < sc.segments.length - 1; s++) {
        if (t >= sc.segments[s + 1].t) segIdx = s + 1;
      }

      const seg = sc.segments[segIdx];
      const nextSeg = sc.segments[segIdx + 1] || seg;
      const segDuration = (nextSeg === seg) ? (sc.duration - seg.t) : (nextSeg.t - seg.t);
      const segProgress = Math.min(1, (t - seg.t) / segDuration);

      // Smooth easing
      const ease = segProgress < 0.5
        ? 2 * segProgress * segProgress
        : 1 - Math.pow(-2 * segProgress + 2, 2) / 2;

      // Interpolate camera
      const cx = lerp(seg.camera[0], nextSeg.camera[0], ease);
      const cy = lerp(seg.camera[1], nextSeg.camera[1], ease);
      const cz = lerp(seg.camera[2], nextSeg.camera[2], ease);
      const lx = lerp(seg.lookAt[0], nextSeg.lookAt[0], ease);
      const ly = lerp(seg.lookAt[1], nextSeg.lookAt[1], ease);
      const lz = lerp(seg.lookAt[2], nextSeg.lookAt[2], ease);

      await page.evaluate(
        (cx, cy, cz, lx, ly, lz, hl, label, scLabel) => {
          window.setFrame(cx, cy, cz, lx, ly, lz, hl, label, scLabel);
          window.renderFrame();
        },
        cx, cy, cz, lx, ly, lz,
        seg.highlight,
        seg.label,
        `Module 1 — Scene ${sceneIdx + 1}`
      );

      // Capture frame
      const framePath = path.join(FRAME_DIR, `frame_${String(globalFrame).padStart(6, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });
      globalFrame++;

      if (f % (FPS * 5) === 0) {
        console.log(`  Frame ${f}/${totalFrames} (${t.toFixed(1)}s)`);
      }
    }
  }

  console.log(`\nTotal frames captured: ${globalFrame}`);
  await browser.close();

  // Now composite with FFmpeg
  console.log('\nCompositing with FFmpeg...');

  // First, create video from frames
  execSync(
    `ffmpeg -y -framerate ${FPS} -i ${FRAME_DIR}/frame_%06d.png -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 ${OUTPUT_DIR}/3d-video-noaudio.mp4`,
    { stdio: 'inherit' }
  );

  // Concatenate all audio files
  const audioConcat = SCENES.map(s => `file '${AUDIO_DIR}/${s.audio}'`).join('\n');
  fs.writeFileSync(`${OUTPUT_DIR}/audio-concat.txt`, audioConcat);
  execSync(
    `ffmpeg -y -f concat -safe 0 -i ${OUTPUT_DIR}/audio-concat.txt -c:a aac -b:a 192k ${OUTPUT_DIR}/narration.aac`,
    { stdio: 'inherit' }
  );

  // Merge video + audio
  execSync(
    `ffmpeg -y -i ${OUTPUT_DIR}/3d-video-noaudio.mp4 -i ${OUTPUT_DIR}/narration.aac -c:v copy -c:a copy -shortest ${OUTPUT_DIR}/hvac-module1-lesson1-3d.mp4`,
    { stdio: 'inherit' }
  );

  const stats = fs.statSync(`${OUTPUT_DIR}/hvac-module1-lesson1-3d.mp4`);
  console.log(`\nFinal video: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
  console.log('Output: temp/hvac-video/hvac-module1-lesson1-3d.mp4');
}

function lerp(a, b, t) { return a + (b - a) * t; }

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
