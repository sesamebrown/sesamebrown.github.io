import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { pilot, camera } from './scene.js';
import { ufo } from './ufo.js';

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
const cameraRight = new THREE.Vector3();
const cameraUp = new THREE.Vector3();
const idlePosition = new THREE.Vector3(0, -2, 0);
let lastInputTime = Date.now();

export function updateMovement() {
    if (!ufo) return;

    // Camera's own right/up axes, so WASD stays in the on-screen plane
    // no matter how OrbitControls has orbited the camera.
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);

    if (keys.w) pilot.position.addScaledVector(cameraUp, speed);
    if (keys.s) pilot.position.addScaledVector(cameraUp, -speed);
    if (keys.a) pilot.position.addScaledVector(cameraRight, -speed);
    if (keys.d) pilot.position.addScaledVector(cameraRight, speed);

    // If idle for 3 seconds
    if (Date.now() - lastInputTime > 3000) {
        pilot.position.lerp(idlePosition, 0.02);
    }
}
