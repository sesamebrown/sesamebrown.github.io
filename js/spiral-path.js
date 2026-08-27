import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

// The pure equation. about.html's sections 2-4 use data-spiral-t (see
// scroll-camera.js) to ease along this live, rather than a hand-copied
// x/y/z; debug-camera.js also samples it directly to draw the curve as a
// wireframe (hidden by default — see that file).
//
// A downward-going spring/helix that starts exactly at `start` and winds
// around the vertical axis through `center` (only center's x/z matter —
// it's the axis being orbited, not a literal point on the path) while
// steadily dropping in height and flaring outward. baseRadius/phase are
// derived from `start`'s own offset from that axis, so t=0 always lands
// exactly on `start` — spread only widens the coil for t>0, it never
// moves the start point itself.
//   radius(t) = baseRadius + spread * t
//   x(t) = center.x + radius(t) * cos(phase + t * turns * 2π)
//   y(t) = start.y - height * t
//   z(t) = center.z + radius(t) * sin(phase + t * turns * 2π)
// t = 0 is `start`, t = 1 is `height` units below it and `spread` units
// further out from the axis.

const SPRING_START = new THREE.Vector3(0, 10, 100); // matches section 0's data-camera exactly
const SPRING_CENTER = new THREE.Vector3(0, -25, -10); // the planet — only x/z used, as the orbit axis
const SPRING_TURNS = 1; // full revolutions from top to bottom
// t=0.75 is the deepest point actually used (about.html's last section) —
// this keeps that one at y=-30 rather than the -102.5 the old height=150
// gave it.
const SPRING_HEIGHT = 40 / 0.75; // total vertical drop from t=0 to t=1
const SPRING_SPREAD = 100; // how much farther from the axis t=1 sits than t=0 — raise/lower to taste

const startOffsetX = SPRING_START.x - SPRING_CENTER.x;
const startOffsetZ = SPRING_START.z - SPRING_CENTER.z;
const SPRING_BASE_RADIUS = Math.hypot(startOffsetX, startOffsetZ);
const SPRING_PHASE = Math.atan2(startOffsetZ, startOffsetX);

export function getSpiralPosition(t, {
    start = SPRING_START,
    center = SPRING_CENTER,
    baseRadius = SPRING_BASE_RADIUS,
    spread = SPRING_SPREAD,
    phase = SPRING_PHASE,
    turns = SPRING_TURNS,
    height = SPRING_HEIGHT,
} = {}) {
    const angle = phase + t * turns * Math.PI * 2;
    const radius = baseRadius + spread * t;

    return new THREE.Vector3(
        center.x + radius * Math.cos(angle),
        start.y - height * t,
        center.z + radius * Math.sin(angle)
    );
}
