import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { camera } from './scene.js';
import { planets, planetSpinTweens } from './planet.js';

// Click-and-drag rotation for the planet. #container3D is deliberately
// pointer-events:none on non-landing pages so the 3D scene never blocks
// clicks/text-selection on real page content — so this listens on `window`
// (which still receives every pointer event regardless of that CSS) and
// only engages once a raycast confirms the drag actually started on the
// planet. Anywhere else, the event is left completely alone.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const ROTATE_SPEED = 0.005;

let dragging = false;
let draggedIndex = -1;
let lastX = 0;
let lastY = 0;

function toNDC(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Returns the index of the planet under the pointer, or -1 if none.
function hitPlanetIndex(event) {
    toNDC(event);
    raycaster.setFromCamera(pointer, camera);
    return planets.findIndex((planet) => raycaster.intersectObject(planet, true).length > 0);
}

window.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;

    const index = hitPlanetIndex(event);
    if (index === -1) return;

    dragging = true;
    draggedIndex = index;
    lastX = event.clientX;
    lastY = event.clientY;
    planetSpinTweens[index]?.pause();
    document.body.style.cursor = 'grabbing';
    event.preventDefault(); // stop text-selection while dragging
});

window.addEventListener('pointermove', (event) => {
    if (dragging) {
        const planet = planets[draggedIndex];
        planet.rotation.y += (event.clientX - lastX) * ROTATE_SPEED;
        planet.rotation.x += (event.clientY - lastY) * ROTATE_SPEED;
        lastX = event.clientX;
        lastY = event.clientY;
        return;
    }

    document.body.style.cursor = hitPlanetIndex(event) !== -1 ? 'grab' : '';
});

window.addEventListener('pointerup', () => {
    if (!dragging) return;

    dragging = false;
    planetSpinTweens[draggedIndex]?.resume();
    draggedIndex = -1;
    document.body.style.cursor = '';
});
