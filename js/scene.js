import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';

// scene
export const scene = new THREE.Scene();
export const pilot = new THREE.Object3D(); // WASD moves this; the animated UFO is nested inside it
scene.add(pilot);

// camera
export const camera = new THREE.PerspectiveCamera(
    10,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.z = 100;
camera.position.y = 10;
camera.rotateX(-0.2);

// --- DEBUG START: world axes at the origin (red=X, green=Y, blue=Z) —
// about page only, to help read data-camera/data-ufo-position values while
// tuning. Select this block and toggle-comment it to disable. ---
// const axesHelper = new THREE.AxesHelper(50);
// axesHelper.visible = document.body.classList.contains('about-page');
// scene.add(axesHelper);
// --- DEBUG END ---

// light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const topLight = new THREE.DirectionalLight(0xffffff, 0.2);
topLight.position.set(500, 500, 500);
scene.add(topLight);

// renderer
export const renderer = new THREE.WebGLRenderer({alpha: true});

// PS1-style pixelation: render at a fraction of the real resolution, then
// let the browser upscale the canvas with hard nearest-neighbor edges
// (no smoothing) instead of the usual blurry bilinear scaling. Toggle with
// the P key, or call setPixelation(true/false) directly. Persisted in
// localStorage so the preference carries across page navigations — this
// is a multi-page site, not an SPA, so each page starts a fresh JS
// environment and would otherwise always reset to the default.
const PIXEL_SCALE = 0.6;
const PIXELATION_STORAGE_KEY = 'pixelationEnabled';
let pixelationEnabled = localStorage.getItem(PIXELATION_STORAGE_KEY) !== 'false';

// setSize(..., false) below stops three.js from managing canvas.style size,
// so it's set here instead — full-size CSS box, tiny internal drawing buffer.
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.display = 'block';

function setPixelatedSize() {
    const scale = pixelationEnabled ? PIXEL_SCALE : 1;
    const width = Math.max(1, Math.floor(window.innerWidth * scale));
    const height = Math.max(1, Math.floor(window.innerHeight * scale));
    renderer.setSize(width, height, false); // false: don't touch canvas.style, CSS keeps it full-size
}

export function setPixelation(enabled) {
    pixelationEnabled = enabled;
    localStorage.setItem(PIXELATION_STORAGE_KEY, String(enabled));
    renderer.domElement.style.imageRendering = enabled ? 'pixelated' : 'auto';
    setPixelatedSize();
}

setPixelation(pixelationEnabled);

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p' && !e.repeat) {
        setPixelation(!pixelationEnabled);
    }
});
document.getElementById('container3D').appendChild(renderer.domElement);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 30;
controls.maxDistance = 70;
controls.update();

window.addEventListener('resize', () => {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    setPixelatedSize();
});
