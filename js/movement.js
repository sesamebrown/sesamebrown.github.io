import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { pilot, camera } from './scene.js';
import { ufo } from './ufo.js';
import { PILOT_SPAWN_POSITION } from './constants.js';

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// keyboard input
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
        lastInputTime = Date.now();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

const speed = 0.1;
const followFactor = 0.15; // how quickly the ship eases toward targetPosition each frame
const cameraRight = new THREE.Vector3();
const cameraUp = new THREE.Vector3();
const idlePosition = new THREE.Vector3(...PILOT_SPAWN_POSITION);
// Starts at the spawn position (not the Vector3 default (0,0,0)) — otherwise
// the pilot would spawn correctly for one frame, then immediately get
// lerped toward (0,0,0) since that's what this chases every frame.
const targetPosition = new THREE.Vector3(...PILOT_SPAWN_POSITION); // where WASD wants the ship to be; pilot chases this
let lastInputTime = Date.now();

export function updateMovement() {
    if (!ufo) return;

    // Camera's own right/up axes, so WASD stays in the on-screen plane
    // no matter how OrbitControls has orbited the camera.
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);

    if (keys.w) targetPosition.addScaledVector(cameraUp, speed);
    if (keys.s) targetPosition.addScaledVector(cameraUp, -speed);
    if (keys.a) targetPosition.addScaledVector(cameraRight, -speed);
    if (keys.d) targetPosition.addScaledVector(cameraRight, speed);

    // If idle for 3 seconds
    if (Date.now() - lastInputTime > 3000) {
        targetPosition.lerp(idlePosition, 0.02);
    }

    // Ease the actual ship position toward the target instead of snapping to it
    pilot.position.lerp(targetPosition, followFactor);
}
