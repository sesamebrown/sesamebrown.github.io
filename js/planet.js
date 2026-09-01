import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';
import { scene } from './scene.js';
import { applyPlanetGlow } from './planet-utils.js';

// Which planets to load is set per-page via <body data-page="...">.
// Not present (e.g. index.html, which uses home-planets.js instead) means
// no planet on that page. Add more entries to a page's array to place
// additional planets in that scene — position: [x,y,z], scale: uniform
// multiplier, rotation: [x,y,z] in radians.
const DEG = Math.PI / 180;
const PAGE_PLANETS = {
    portfolio: [
        // { file: 'fishplanet.glb', position: [0, -10, 0], scale: 3, rotation: [0, 30 * DEG, 50 * DEG] },
        // { file: 'alien.glb', position: [0, 0, 2], scale: 6, rotation: [0, 180 * DEG, 0] },
        { file: 'earth.glb', position: [0, -5, -50], scale: 1, rotation: [0, 30 * DEG, 50 * DEG] },
    ],
    about: [
        { file: 'saturn.glb', position: [0, -25, -10], scale: 3, rotation: [0, 30 * DEG, 50 * DEG] },
    ],
    guests: [
        { file: 'moon.glb', position: [0, -25, -10], scale: 3, rotation: [0, 30 * DEG, 50 * DEG] },
    ],
    service: [
        { file: 'mars.glb', position: [0, -25, -10], scale: 3, rotation: [0, 30 * DEG, 50 * DEG] },
    ],
    qualifications: [
        { file: 'jupiter.glb', position: [0, -25, -10], scale: 3, rotation: [0, 30 * DEG, 50 * DEG] },
    ],
};

// Live bindings — entries appear only once their GLTF finishes loading.
// planet-drag.js reads these to raycast against the planets and pause/resume
// the ambient spin of whichever one is being dragged.
export const planets = [];
export const planetSpinTweens = [];
export const planetMixers = [];

const pageConfigs = PAGE_PLANETS[document.body.dataset.page] || [];

if (pageConfigs.length) {
    const loader = new GLTFLoader();
    for (const { file, position, scale, rotation } of pageConfigs) {
        loader.load(`/glb/${file}`, (gltf) => {
            const planet = gltf.scene;
            planet.scale.setScalar(scale);
            planet.rotation.set(...rotation);
            planet.position.set(...position);
            scene.add(planet);

            applyPlanetGlow(planet);

            if (gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(planet);
                // Some models (e.g. alien.glb) export multiple clips for
                // the same skeleton — playing all of them at once would
                // have them fight over the same bones, so just the idle
                // loop plays (falling back to the first clip for
                // single-animation files like fishplanet.glb).
                const idleClip = gltf.animations.find((clip) => clip.name.toLowerCase() === 'idle') || gltf.animations[0];
                mixer.clipAction(idleClip).play();
                planetMixers.push(mixer);
            }

            planets.push(planet);
            planetSpinTweens.push(gsap.to(planet.rotation, {
                z: planet.rotation.z - Math.PI * 2,
                duration: 360,
                repeat: -1,
                ease: 'linear',
            }));

        });
    }
}
