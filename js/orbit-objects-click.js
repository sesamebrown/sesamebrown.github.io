import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { camera } from './scene.js';
import { orbitObjects } from './orbit-objects.js';

// Click detection for the portfolio orbit objects. Each object carries its
// project config on obj.userData.project (set in orbit-objects.js); a
// click opens that project's `url`. Placeholders have url: null, so for
// now this just logs. Swap window.open for the navigation you want
// (same-tab, a modal, a camera move, …).
//
// Same window-level listening as planet-drag.js (#container3D is
// pointer-events:none on this page). A "click" is a press and release on
// the same object without much pointer travel, so it doesn't fire when the
// press was actually the start of a planet drag.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const CLICK_MOVE_TOLERANCE = 5; // px

let pressObj = null;
let pressX = 0;
let pressY = 0;
let hoveredObj = null;

function pick(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return orbitObjects.find((obj) => raycaster.intersectObject(obj, true).length > 0) || null;
}

function onOrbitObjectClick(obj) {
    const project = obj.userData.project;
    if (project?.url) {
        window.open(project.url, '_blank', 'noopener');
    } else {
        console.log('orbit object clicked (no url yet):', project?.name ?? obj);
    }
}

// Flags the hovered object so orbit-objects.js can grow it. planet-drag.js
// resets document.body.style.cursor earlier in the same event, so it's
// safe to only set 'pointer' here and leave the non-hover case to it.
window.addEventListener('pointermove', (event) => {
    const obj = pick(event);
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
    pressObj = pick(event);
    pressX = event.clientX;
    pressY = event.clientY;
});

window.addEventListener('pointerup', (event) => {
    if (!pressObj) return;

    const moved = Math.hypot(event.clientX - pressX, event.clientY - pressY);
    if (moved <= CLICK_MOVE_TOLERANCE && pick(event) === pressObj) {
        onOrbitObjectClick(pressObj);
    }
    pressObj = null;
});
