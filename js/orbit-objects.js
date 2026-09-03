import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { scene, camera } from './scene.js';
import { PAGE_PLANETS } from './planet.js';

// Portfolio-only: an "orb gallery" — clickable planet placeholders spread
// evenly over a sphere around the page's planet. Dragging the planet (see
// planet-drag.js) turns the whole orb in any direction; the objects
// counter-rotate every frame so they hold a fixed world facing no matter
// how the orb is spun. Wireframe pass — cube.glb is a stand-in.

// The individual objects, in load order. planet-drag.js and
// orbit-objects-click.js raycast against this.
export const orbitObjects = [];

// One AnimationMixer per object that ships a clip; ticked in updateOrbitObjects.
const orbitMixers = [];

// Centre of the orb — always the exact coordinates of the portfolio
// planet, read straight from its config in planet.js so the two can never
// drift apart.
export const ORBIT_CENTER = new THREE.Vector3(...PAGE_PLANETS.portfolio[0].position);

// Everything is parented to this group; planet-drag.js rotates it.
export const orbGroup = new THREE.Group();
orbGroup.position.copy(ORBIT_CENTER);

const RADIUS = 12;
const ITEM_SCALE = 1;    // default; per-entry `scale` in ITEMS overrides it
const HOVER_SCALE = 1.2;  // multiplier applied on top of each item's scale while hovered
const HOVER_LERP = 0.05;   // 0..1 per frame — how quickly it eases to that size
const IDLE_SPIN = 0.05;  // radians/sec ambient turn of the whole orb — 0 to hold still
const ITEM_SPIN = 0.4;   // radians/sec each item spins in place about its own Y — 0 to stop

// The orientation every object keeps in world space regardless of orb
// spin. Identity = stays axis-aligned to the world.
const ITEM_FACING = new THREE.Quaternion();

// ---------------------------------------------------------------------------
// One entry per object on the orb. To wire these to real projects later,
// replace the placeholders with e.g.
//   { file: 'mars-portfolio.glb', name: 'Renderer', url: '/projects/renderer.html' }
// - `file`   : a .glb in /glb/ (each entry can be a different model)
// - `name`   : label, handy for hover text / the click handler
// - `url`    : where a click goes (see orbit-objects-click.js); null = inert
// - `scale`  : optional, per-model size; omitted falls back to ITEM_SCALE
// - `animation` : optional clip name to play; omitted plays the longest clip
// Add or remove entries freely — spherePoint() re-spaces the whole list.
// ---------------------------------------------------------------------------
const ITEMS = [
    { file: 'wendigo_planet.glb', name: 'Wendigo', url: 'https://akxgo.itch.io/grim-encounters', scale: 3, animation: 'sitting' },
    { file: 'fishplanet.glb', name: 'Fish', url: null },
    { file: 'cube.glb', name: 'Cube', url: null },
    { file: 'cube.glb', name: 'Cube', url: null },
];

// Fixed vertical gap between neighbouring latitude rings. Smaller = more
// rings fit before the poles start filling. At 0.18 the caps stay empty
// until ~12 items.
const LAT_STEP = 0.18;

// Local offset for item `i`. Latitude marches out from the equator in
// fixed steps, alternating hemispheres (i = 0,1,2,3,4 -> y = 0, -step,
// +step, -2·step, +2·step …), clamped at the poles — so a pole only gets
// an item once the rings have run all the way out to ±1. Longitude keeps
// the Fibonacci golden angle on the raw index so each new item lands at a
// fresh, well-spread meridian.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
function spherePoint(i, radius) {
    const y = (i % 2 ? -1 : 1) * Math.min(1, Math.ceil(i / 2) * LAT_STEP);
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    return new THREE.Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring).multiplyScalar(radius);
}

if (document.body.dataset.page === 'portfolio') {
    scene.add(orbGroup);
    const loader = new GLTFLoader();

    ITEMS.forEach((item, i) => {
        const slot = spherePoint(i, RADIUS);
        loader.load(`/glb/${item.file}`, (gltf) => {
            console.log('item animations:', gltf.animations.map((clip) => clip.name));

            const obj = gltf.scene;
            obj.scale.setScalar(item.scale ?? ITEM_SCALE);
            obj.position.copy(slot);
            obj.userData.project = item; // orbit-objects-click.js reads this
            obj.userData.facing = ITEM_FACING.clone(); // drag-rotate + idle spin write here
            orbGroup.add(obj);
            orbitObjects.push(obj);

            if (gltf.animations.length) {
                // `animation` names the clip; otherwise the longest one —
                // some models (wendigo.glb) export a 1-frame static "idle"
                // as clip 0 and the real loop after it.
                const clip = gltf.animations.find((c) => c.name === item.animation)
                    ?? gltf.animations.reduce((a, b) => (b.duration > a.duration ? b : a));
                const mixer = new THREE.AnimationMixer(obj);
                mixer.clipAction(clip).play(); // loops by default
                orbitMixers.push(mixer);
            }
        });
    });

    // --- DEBUG START: wireframe shell showing the orb. Select this block
    // and toggle-comment it to hide. ---
    const shell = new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS, 24, 16),
        new THREE.MeshBasicMaterial({ color: 0x44ccff, wireframe: true, transparent: true, opacity: 0.15 }),
    );
    orbGroup.add(shell);
    // --- DEBUG END ---
}

const _parentInverse = new THREE.Quaternion();
const _spinStep = new THREE.Quaternion();
const _yAxis = new THREE.Vector3(0, 1, 0);

// Called once per frame from app.js. Applies the slow ambient turn, pins
// every object to its `facing` in world space (local quat = inverse(parent
// world quat) * facing) so it holds orientation as the orb spins, and eases
// hovered objects toward their grown size. `hovered` and `facing` are set
// by orbit-objects-click.js.
export function updateOrbitObjects(delta) {
    if (!orbitObjects.length) return;

    if (IDLE_SPIN) orbGroup.rotateY(IDLE_SPIN * delta);
    for (const mixer of orbitMixers) mixer.update(delta);

    if (ITEM_SPIN) {
        _spinStep.setFromAxisAngle(_yAxis, ITEM_SPIN * delta);
    }

    orbGroup.getWorldQuaternion(_parentInverse).invert();
    for (const obj of orbitObjects) {
        // Spin in place: advance the object's own facing about its Y. Kept
        // in `facing` so the spin survives the orb turning and composes
        // with any drag-rotate.
        if (ITEM_SPIN) obj.userData.facing.multiply(_spinStep);
        obj.quaternion.copy(_parentInverse).multiply(obj.userData.facing);

        const base = obj.userData.project.scale ?? ITEM_SCALE;
        const target = base * (obj.userData.hovered ? HOVER_SCALE : 1);
        obj.scale.setScalar(THREE.MathUtils.lerp(obj.scale.x, target, HOVER_LERP));
    }
}

// --- Pointer picking, shared by planet-drag.js and orbit-objects-click.js ---
const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _objWorld = new THREE.Vector3();
const _centerWorld = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _toCamera = new THREE.Vector3();

// An object is "on the front" when it sits on the camera-facing side of the
// orb centre — keeps back-hemisphere objects from taking the pointer.
function isOnFront(obj) {
    obj.getWorldPosition(_objWorld);
    _normal.subVectors(_objWorld, _centerWorld);
    _toCamera.subVectors(camera.position, _objWorld);
    return _normal.dot(_toCamera) > 0;
}

// Nearest front-facing orbit object under the given screen coords, or null.
// Each object is raycast on its own (occlusion between them doesn't matter),
// then the back hemisphere is filtered out and the closest hit wins.
export function pick(clientX, clientY) {
    if (!orbitObjects.length) return null;
    _ndc.x = (clientX / window.innerWidth) * 2 - 1;
    _ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    _raycaster.setFromCamera(_ndc, camera);
    orbGroup.getWorldPosition(_centerWorld);

    let best = null;
    let bestDistance = Infinity;
    for (const obj of orbitObjects) {
        const hits = _raycaster.intersectObject(obj, true);
        if (!hits.length || !isOnFront(obj)) continue;
        if (hits[0].distance < bestDistance) {
            bestDistance = hits[0].distance;
            best = obj;
        }
    }
    return best;
}
