import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { pilot } from './scene.js';
import { BEAM_HIDDEN_SCALE } from './constants.js';

export let ufo;
export let mixer;
export let bodyMixer;
export let beamObject;
export let isReady = false;

let idleRootAction;
let idleBodyAction;

function playIdle() {
    if (!idleRootAction || !idleBodyAction) return;

    idleRootAction.play();
    idleBodyAction.play();
}

// loader
const loader = new GLTFLoader();
loader.load('/glb/ufo_3.glb',
    function (gltf) {
        const root = gltf.scene;
        const ufoRoot = root.getObjectByName('UFO_Root') || root;
        const body = root.getObjectByName('UFO') || ufoRoot;
        beamObject = root.getObjectByName('Beam') || null;

        pilot.add(root);

        ufo = ufoRoot;

        if (beamObject) {
            beamObject.scale.y = BEAM_HIDDEN_SCALE;
        } else {
            console.log('No Beam object found in this UFO GLTF file.');
        }

        mixer = new THREE.AnimationMixer(ufoRoot);
        bodyMixer = new THREE.AnimationMixer(body);

        mixer.timeScale = 0.5;
        bodyMixer.timeScale = 0.5;

        if (gltf.animations.length > 0) {
            console.log('UFO animations:', gltf.animations.map((clip) => clip.name));

            const idleRootClip = gltf.animations[0]; // UFO_upDown
            const idleBodyClip = gltf.animations[3] || gltf.animations[0]; // Body_rotate

            idleRootAction = mixer.clipAction(idleRootClip);
            idleBodyAction = bodyMixer.clipAction(idleBodyClip);

            idleRootAction.setLoop(THREE.LoopRepeat, Infinity);
            idleBodyAction.setLoop(THREE.LoopRepeat, Infinity);

            playIdle();
            isReady = true;
        } else {
            console.log('No animations found in this UFO GLTF file.');
        }
    },
);
