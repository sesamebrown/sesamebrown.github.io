// --- DEBUG START: press c to fly a free camera around the scene and see
// the real scene camera's frustum as a wireframe (CameraHelper), plus the
// spiral path (see spiral-path.js) as a cyan line. WASDQE moves the debug
// camera itself (forward/back/strafe relative to where it's currently
// looking, Q/E straight down/up); drag/scroll still orbit and zoom it,
// same as the main camera normally works. To disable: comment out this
// file's import and its two call sites in app.js (marked there).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { scene, camera, renderer, controls } from './scene.js';
import { setShipMovementEnabled } from './movement.js';
import { getSpiralPosition } from './spiral-path.js';

const debugCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const debugControls = new OrbitControls(debugCamera, renderer.domElement);
debugControls.enableDamping = true;
debugControls.dampingFactor = 0.05;
debugControls.enabled = false;

const cameraHelper = new THREE.CameraHelper(camera);
cameraHelper.visible = false;
scene.add(cameraHelper);

// Traces the same downward-spring equation the sections' data-spiral-t
// waypoints ease along — see spiral-path.js.
const SPIRAL_SAMPLES = 200;
const spiralPoints = [];
for (let i = 0; i <= SPIRAL_SAMPLES; i++) {
    spiralPoints.push(getSpiralPosition(i / SPIRAL_SAMPLES));
}
const spiralLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(spiralPoints),
    new THREE.LineBasicMaterial({ color: 0x00ffff })
);
spiralLine.visible = false;
scene.add(spiralLine);

export let debugCameraActive = false;

export function getActiveCamera() {
    return debugCameraActive ? debugCamera : camera;
}

const keys = { w: false, a: false, s: false, d: false, q: false, e: false };
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);
const delta = new THREE.Vector3();
const speed = 0.5; // no easing on this one — snappy, immediate-stop free-fly for quick traversal

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (key === 'c' && !e.repeat) {
        debugCameraActive = !debugCameraActive;

        if (debugCameraActive) {
            // Starts exactly at the real camera's current vantage point, so
            // "from its point of view" is literal at the moment of toggling.
            debugCamera.position.copy(camera.position);
            debugCamera.quaternion.copy(camera.quaternion);
            debugCamera.aspect = camera.aspect;
            debugCamera.updateProjectionMatrix();
            debugControls.target.copy(controls.target);
            debugControls.update();
        }

        controls.enabled = !debugCameraActive;
        debugControls.enabled = debugCameraActive;
        cameraHelper.visible = debugCameraActive;
        spiralLine.visible = debugCameraActive;
        setShipMovementEnabled(!debugCameraActive);
        return;
    }

    if (debugCameraActive && keys.hasOwnProperty(key)) keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

window.addEventListener('resize', () => {
    debugCamera.aspect = window.innerWidth / window.innerHeight;
    debugCamera.updateProjectionMatrix();
});

export function updateDebugCamera() {
    cameraHelper.update(); // keep the wireframe in sync with the real camera even while it's not driving the view

    if (!debugCameraActive) return;

    debugControls.update();

    debugCamera.getWorldDirection(forward);
    right.setFromMatrixColumn(debugCamera.matrixWorld, 0);

    delta.set(0, 0, 0);
    if (keys.w) delta.addScaledVector(forward, speed);
    if (keys.s) delta.addScaledVector(forward, -speed);
    if (keys.a) delta.addScaledVector(right, -speed);
    if (keys.d) delta.addScaledVector(right, speed);
    if (keys.q) delta.addScaledVector(worldUp, -speed);
    if (keys.e) delta.addScaledVector(worldUp, speed);

    // Move the pivot along with the camera (not just the camera itself) so
    // translating doesn't fight OrbitControls' own distance-from-target math.
    debugCamera.position.add(delta);
    debugControls.target.add(delta);
}
// --- DEBUG END ---
