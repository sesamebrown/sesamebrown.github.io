import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { scene, camera, renderer, controls } from './js/scene.js';
import { mixer, bodyMixer } from './js/ufo.js';
import { updateDust } from './js/dust.js';
import { updateMovement } from './js/movement.js';
import './js/beam.js';
import { planetMixers } from './js/planet.js';
import './js/planet-drag.js';
import './js/flag-plant.js';
import './js/scroll-camera.js';
import './js/scroll-ufo.js';
// --- DEBUG START: comment out this import and the two lines below marked
// DEBUG to disable the free-fly debug camera (see js/debug-camera.js). ---
import { updateDebugCamera, getActiveCamera } from './js/debug-camera.js';
// --- DEBUG END ---

// animation
const clock = new THREE.Clock();

const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    updateMovement();
    updateDebugCamera(); // DEBUG — see js/debug-camera.js
    renderer.render(scene, getActiveCamera()); // DEBUG — swap back to renderer.render(scene, camera) if disabling

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (bodyMixer) bodyMixer.update(delta);
    for (const planetMixer of planetMixers) planetMixer.update(delta);
    updateDust(delta);
};
animate();
