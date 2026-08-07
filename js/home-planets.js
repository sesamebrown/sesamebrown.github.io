import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './scene.js';
import { applyPlanetGlow } from './planet-utils.js';

// Home-only: every other page loads exactly one planet via planet.js.
// This is intentionally separate rather than a "load everything, reuse
// everywhere" shared scene — see conversation notes, but short version:
// this is a multi-page site, not an SPA, so every navigation is a full
// page reload anyway. A shared scene wouldn't survive that, and it would
// force e.g. about.html to load every planet here just to show one.
if (document.body.classList.contains('landing-page')) {
    // Edit freely — position: [x, y, z], scale: uniform multiplier.
    // Add/remove entries to change which planets appear and how many.
    const HOME_PLANETS = [
        { file: 'moon.glb', position: [500, 10, -10], scale: 5 },
        { file: 'mars.glb', position: [-100, 200, -10], scale: 4 },
        { file: 'jupiter.glb', position: [50, -40, -600], scale: 6 },
    ];

    const loader = new GLTFLoader();

    for (const { file, position, scale } of HOME_PLANETS) {
        loader.load(`/glb/${file}`, (gltf) => {
            const planet = gltf.scene;
            planet.position.set(...position);
            planet.scale.setScalar(scale);
            scene.add(planet);
            applyPlanetGlow(planet);
        });
    }
}
