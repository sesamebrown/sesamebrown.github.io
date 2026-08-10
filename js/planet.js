import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';
import { scene } from './scene.js';
import { applyPlanetGlow } from './planet-utils.js';

// Which planet model to load is set per-page via <body data-planet="...">.
// Not present (e.g. index.html) means no planet on that page.
const planetFile = document.body.dataset.planet;

// Live bindings — undefined until the GLTF finishes loading. planet-drag.js
// reads these to raycast against the planet and pause/resume the ambient
// spin while the user is manually dragging it.
export let planet;
export let planetSpinTween;

if (planetFile) {
    const loader = new GLTFLoader();
    loader.load(`/glb/${planetFile}`, (gltf) => {
        planet = gltf.scene;
        planet.scale.setScalar(3);
        planet.rotation.set(0, 30 * (Math.PI / 180), 50 * (Math.PI / 180)); // rotate 90 degrees around Z axis
        planet.position.set(0, -25, -10);
        scene.add(planet);

        applyPlanetGlow(planet);

        planetSpinTween = gsap.to(planet.rotation, {
            z: -Math.PI * 2,
            duration: 360,
            repeat: -1,
            ease: 'linear',
        });
    });
}
