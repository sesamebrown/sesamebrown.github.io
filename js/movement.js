import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { pilot, camera } from './scene.js';
import { ufo } from './ufo.js';
import { PILOT_SPAWN_POSITION, PILOT_SPAWN_ROTATION } from './constants.js';

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false
};

// keyboard input
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
        lastInputTime = Date.now();
        scrollActive = false; // WASD always wins back control from a scroll-set target
    }
});

// --- DEBUG START: press i to log the UFO's and camera's current position,
// formatted to paste straight into data-ufo-position/data-camera
// attributes. Select this block and toggle-comment it to disable. ---
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'i' && !e.repeat) {
        console.log('UFO position:', `${Math.round(pilot.position.x)},${Math.round(pilot.position.y)},${Math.round(pilot.position.z)}`);
        console.log('Camera position:', `${Math.round(camera.position.x)},${Math.round(camera.position.y)},${Math.round(camera.position.z)}`);
    }
});
// --- DEBUG END ---

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

const speed = 0.1;
const followFactor = 0.15; // how quickly the ship eases toward targetPosition each frame, under WASD control
const scrollFollowFactor = 0.05; // same, but while chasing a scroll-set target (see scrollActive below) — tune independently of WASD's feel
const scrollRotationFollowFactor = 0.08; // slower than position, for a lagging turn feel — rotation is scroll-only, WASD never sets targetRotation
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const worldUp = new THREE.Vector3(0, 1, 0);
const idlePosition = new THREE.Vector3(...PILOT_SPAWN_POSITION);
// Starts at the spawn position (not the Vector3 default (0,0,0)) — otherwise
// the pilot would spawn correctly for one frame, then immediately get
// lerped toward (0,0,0) since that's what this chases every frame.
const targetPosition = new THREE.Vector3(...PILOT_SPAWN_POSITION); // where WASD (or scroll) wants the ship to be; pilot chases this
const targetRotation = new THREE.Euler(...PILOT_SPAWN_ROTATION); // where scroll wants the ship facing; pilot chases this too (see setScrollTarget)
let lastInputTime = Date.now();
// True while the ship should be chasing targetPosition at scrollFollowFactor
// instead of followFactor — set by setScrollTarget, cleared the instant WASD
// is pressed (see the keydown listener above) so WASD always wins control.
let scrollActive = false;
// --- DEBUG START: lets debug-camera.js pause ship WASDQE while it's
// borrowing those same keys for free-fly camera movement, so the ship
// doesn't silently fly off in the background. Select this block (and the
// !shipMovementEnabled check below) and toggle-comment to disable. ---
let shipMovementEnabled = true;
export function setShipMovementEnabled(enabled) {
    shipMovementEnabled = enabled;
}
// --- DEBUG END ---

// Called by scroll-ufo.js when a scroll-tagged section becomes active.
// Only updates the *targets* — the actual chase (and its lag/delay) is
// entirely the lerps already running in updateMovement() below, same as
// WASD, just at scrollFollowFactor/scrollRotationFollowFactor instead.
// idlePosition is updated too, not just targetPosition: otherwise, after 3s
// of no WASD input, the "idle drift" a few lines down would pull the ship
// back toward the original spawn point instead of leaving it at the scroll
// target.
export function setScrollTarget(position, rotationDegrees) {
    targetPosition.set(...position);
    idlePosition.copy(targetPosition);
    scrollActive = true;

    if (rotationDegrees) {
        targetRotation.set(
            THREE.MathUtils.degToRad(rotationDegrees[0]),
            THREE.MathUtils.degToRad(rotationDegrees[1]),
            THREE.MathUtils.degToRad(rotationDegrees[2])
        );
    }
}

export function updateMovement() {
    if (!ufo || !shipMovementEnabled) return;

    // Default game controls, free-flying in 3D instead of locked to the
    // on-screen plane: W/S move forward/back and A/D strafe along wherever
    // the camera is currently looking, Q/E move straight down/up in world
    // space regardless of camera pitch.
    camera.getWorldDirection(cameraForward);
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);

    if (keys.w) targetPosition.addScaledVector(cameraForward, speed);
    if (keys.s) targetPosition.addScaledVector(cameraForward, -speed);
    if (keys.a) targetPosition.addScaledVector(cameraRight, -speed);
    if (keys.d) targetPosition.addScaledVector(cameraRight, speed);
    if (keys.q) targetPosition.addScaledVector(worldUp, -speed);
    if (keys.e) targetPosition.addScaledVector(worldUp, speed);

    // If idle for 3 seconds
    if (Date.now() - lastInputTime > 3000) {
        targetPosition.lerp(idlePosition, 0.02);
    }

    // Ease the actual ship position/rotation toward their targets instead of
    // snapping. Rotation is a simple per-axis lerp (not a quaternion slerp)
    // — fine for the small scroll-driven turns this is meant for, matching
    // how simply position is already handled above.
    pilot.position.lerp(targetPosition, scrollActive ? scrollFollowFactor : followFactor);
    pilot.rotation.x += (targetRotation.x - pilot.rotation.x) * scrollRotationFollowFactor;
    pilot.rotation.y += (targetRotation.y - pilot.rotation.y) * scrollRotationFollowFactor;
    pilot.rotation.z += (targetRotation.z - pilot.rotation.z) * scrollRotationFollowFactor;
}
