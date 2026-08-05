import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';
import { DustMotesEffect } from 'https://cdn.jsdelivr.net/npm/three-low-poly@1.2.2/dist/index.mjs';

// scene
const scene = new THREE.Scene();
const pilot = new THREE.Object3D(); // WASD moves this; the animated UFO is nested inside it
scene.add(pilot);
let ufo;
let mixer;
let bodyMixer;
let idleRootAction;
let idleBodyAction;
let beamObject;
let isReady = false;
let dust;
let beamOn = false;

const BEAM_HIDDEN_SCALE = 0.01;
const BEAM_VISIBLE_SCALE = 1;
const BEAM_TWEEN_DURATION = 1;

// camera
const camera = new THREE.PerspectiveCamera(
    10,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.z = 100;
camera.position.y = 10;
camera.rotateX(-0.2);

// light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const topLight = new THREE.DirectionalLight(0xffffff, 0.2);
topLight.position.set(500, 500, 500);
scene.add(topLight);

// dust motes
dust = new DustMotesEffect({
    count: 600,
    width: 30,
    height: 30,
    depth: 30,
    color: 'white',
    radius: 0.01,
    settleMin: 0,
    settleMax: 0,
    waft: 0,
    twinkleMin: 0.2,
    twinkleMax: 2,
});
dust.position.set(0, -10, 0);
scene.add(dust);

// renderer
const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container3D').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 30;
controls.maxDistance = 70;
controls.update();

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('resize', () => {

    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

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

// keyboard input
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (key === 'q') {
        if (e.repeat) return;

        beamOn = !beamOn;
        beamOn ? playBeamGrow() : playBeamShrink();
        return;
    }

    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
        lastInputTime = Date.now();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();

    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

function playIdle() {
    if (!idleRootAction || !idleBodyAction) return;

    idleRootAction.play();
    idleBodyAction.play();
}

function playBeamGrow() {
    if (!beamObject) return;

    gsap.to(beamObject.scale, {
        x: BEAM_VISIBLE_SCALE,
        y: BEAM_VISIBLE_SCALE,
        z: BEAM_VISIBLE_SCALE,
        duration: BEAM_TWEEN_DURATION,
        ease: 'power2.out',
    });
}

function playBeamShrink() {
    if (!beamObject) return;

    gsap.to(beamObject.scale, {
        x: BEAM_HIDDEN_SCALE,
        y: BEAM_HIDDEN_SCALE,
        z: BEAM_HIDDEN_SCALE,
        duration: BEAM_TWEEN_DURATION,
        ease: 'power2.out',
    });
}

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

const speed = 0.1;
const cameraRight = new THREE.Vector3();
const cameraUp = new THREE.Vector3();

function updateMovement() {
    if (!ufo) return;

    // Camera's own right/up axes, so WASD stays in the on-screen plane
    // no matter how OrbitControls has orbited the camera.
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);

    if (keys.w) pilot.position.addScaledVector(cameraUp, speed);
    if (keys.s) pilot.position.addScaledVector(cameraUp, -speed);
    if (keys.a) pilot.position.addScaledVector(cameraRight, -speed);
    if (keys.d) pilot.position.addScaledVector(cameraRight, speed);

    // If idle for 3 seconds
    if (Date.now() - lastInputTime > 3000) {
        pilot.position.lerp(idlePosition, 0.02);
    }
}



// ufo stuff
const idlePosition = new THREE.Vector3(0, 0, 0);
let lastInputTime = Date.now();