import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { pick } from './orbit-objects.js';

// Hover, click and drag-rotate for the portfolio orbit objects. All three
// act only on objects pick() reports as front-facing (see orbit-objects.js).
// Window-level listening because #container3D is pointer-events:none here;
// planet-drag.js calls pick() too and yields when a press lands on an
// object, so the planet/orb drag and this never both run.
const DRAG_SPEED = 0.005;       // radians of spin per pixel dragged
const CLICK_MOVE_TOLERANCE = 5; // px — past this a press is a drag, not a click

const _spin = new THREE.Quaternion();
const _spinEuler = new THREE.Euler();

let hoveredObj = null;
let pressObj = null;
let pressX = 0;
let pressY = 0;
let draggingObj = null;
let lastX = 0;
let lastY = 0;

function onOrbitObjectClick(obj) {
    const project = obj.userData.project;
    if (project?.url) {
        window.open(project.url, '_blank', 'noopener');
    } else {
        console.log('orbit object clicked (no url yet):', project?.name ?? obj);
    }
}

window.addEventListener('pointermove', (event) => {
    if (draggingObj) {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        // World-space spin so drag direction maps the same whatever the
        // object's orientation. Stored on userData.facing, which
        // orbit-objects.js reapplies every frame.
        _spinEuler.set(dy * DRAG_SPEED, dx * DRAG_SPEED, 0, 'XYZ');
        _spin.setFromEuler(_spinEuler);
        draggingObj.userData.facing.premultiply(_spin);
        document.body.style.cursor = 'grabbing';
        return;
    }

    const obj = pick(event.clientX, event.clientY);
    if (obj === hoveredObj) return;
    if (hoveredObj) hoveredObj.userData.hovered = false;
    if (obj) {
        obj.userData.hovered = true;
        document.body.style.cursor = 'pointer';
    }
    hoveredObj = obj;
});

window.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    pressObj = pick(event.clientX, event.clientY);
    if (!pressObj) return;

    pressX = lastX = event.clientX;
    pressY = lastY = event.clientY;
    draggingObj = pressObj;
    event.preventDefault();
});

window.addEventListener('pointerup', (event) => {
    if (!pressObj) return;

    const moved = Math.hypot(event.clientX - pressX, event.clientY - pressY);
    if (moved <= CLICK_MOVE_TOLERANCE && pick(event.clientX, event.clientY) === pressObj) {
        onOrbitObjectClick(pressObj);
    }
    pressObj = null;
    draggingObj = null;
    document.body.style.cursor = '';
});
