import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './scene.js';
import { PAGE_PLANETS } from './planet.js';

// Portfolio-only: an "orb gallery" — clickable planet placeholders spread
// evenly over a sphere around the page's planet. Dragging the planet (see
// planet-drag.js) turns the whole orb in any direction; the objects
// counter-rotate every frame so they hold a fixed world facing no matter
// how the orb is spun. Wireframe pass — cube.glb is a stand-in.

// The individual objects, in load order. planet-drag.js and
// orbit-objects-click.js raycast against this.
export const orbitObjects = [];

// Centre of the orb — always the exact coordinates of the portfolio
// planet, read straight from its config in planet.js so the two can never
// drift apart.
export const ORBIT_CENTER = new THREE.Vector3(...PAGE_PLANETS.portfolio[0].position);

// Everything is parented to this group; planet-drag.js rotates it.
export const orbGroup = new THREE.Group();
orbGroup.position.copy(ORBIT_CENTER);

const RADIUS = 12;
const ITEM_SCALE = 1;
const HOVER_SCALE = 1.2;  // multiplier applied on top of ITEM_SCALE while hovered
const HOVER_LERP = 0.05;   // 0..1 per frame — how quickly it eases to that size
const IDLE_SPIN = 0.05;  // radians/sec ambient turn — set to 0 to hold still

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
// Add or remove entries freely — layout() re-spaces whatever is in the list.
// ---------------------------------------------------------------------------
const PLACEHOLDER_COUNT = 24;
const ITEMS = Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => ({
    file: 'cube.glb',
    name: `Placeholder`,
    url: null,
}));

// Even distribution over a sphere for ANY count — the Fibonacci ("golden
// spiral") sphere. Point `i` of `count`, as a local offset from the orb
// centre. Whenever ITEMS grows or shrinks, every object's slot recomputes,
// so spacing stays uniform.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
function spherePoint(i, count, radius) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2; // 1 .. -1
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * i;
    return new THREE.Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring).multiplyScalar(radius);
}

if (document.body.dataset.page === 'portfolio') {
    scene.add(orbGroup);
    const loader = new GLTFLoader();

    ITEMS.forEach((item, i) => {
        const slot = spherePoint(i, ITEMS.length, RADIUS);
        loader.load(`/glb/${item.file}`, (gltf) => {
            const obj = gltf.scene;
            obj.scale.setScalar(ITEM_SCALE);
            obj.position.copy(slot);
            obj.userData.project = item; // orbit-objects-click.js reads this
            orbGroup.add(obj);
            orbitObjects.push(obj);
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

// Called once per frame from app.js. Applies the slow ambient turn, pins
// every object to ITEM_FACING in world space (local quat = inverse(parent
// world quat) * desired facing), and eases hovered objects toward their
// grown size. `obj.userData.hovered` is set by orbit-objects-click.js.
export function updateOrbitObjects(delta) {
    if (!orbitObjects.length) return;

    if (IDLE_SPIN) orbGroup.rotateY(IDLE_SPIN * delta);

    orbGroup.getWorldQuaternion(_parentInverse).invert();
    for (const obj of orbitObjects) {
        obj.quaternion.copy(_parentInverse).multiply(ITEM_FACING);

        const target = ITEM_SCALE * (obj.userData.hovered ? HOVER_SCALE : 1);
        obj.scale.setScalar(THREE.MathUtils.lerp(obj.scale.x, target, HOVER_LERP));
    }
}
