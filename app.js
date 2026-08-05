import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { scene, camera, renderer, controls } from './js/scene.js';
import { mixer, bodyMixer } from './js/ufo.js';
import { dust } from './js/dust.js';
import { updateMovement } from './js/movement.js';
import './js/beam.js';

// animation
const clock = new THREE.Clock();

const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    updateMovement();
    renderer.render(scene, camera);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (bodyMixer) bodyMixer.update(delta);
    if (dust) dust.update(delta);
};
animate();
