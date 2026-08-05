import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';
import { DustMotesEffect } from 'https://cdn.jsdelivr.net/npm/three-low-poly@1.2.2/dist/index.mjs';


// scene
const scene = new THREE.Scene();
let ufo;
let mixer;
let bodyMixer;
let idleRootAction;
let idleBodyAction;
let hoverRootAction;
let beamObject;
let isHovered = false;
let isReady = false;
let dust;

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

camera.position.z = 50;
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
    width: 20,
    height: 20,
    depth: 20,
    color: 'white',
    radius: 0.01,
    settleMin: 0.02,
    settleMax: 0.05,
    twinkleMin: 0.2,
    twinkleMax: 2,
    settleMin: 0.01,
    settleMax: 0.05,
    waft: 0.05
});
dust.position.set(0, -10, 0);
scene.add(dust);

// renderer
const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container3D').appendChild(renderer.domElement);
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

        scene.add(root);
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
            const hoverRootClip = gltf.animations[0] || idleRootClip;

            idleRootAction = mixer.clipAction(idleRootClip);
            idleBodyAction = bodyMixer.clipAction(idleBodyClip);
            hoverRootAction = mixer.clipAction(hoverRootClip);

            idleRootAction.setLoop(THREE.LoopRepeat, Infinity);
            idleBodyAction.setLoop(THREE.LoopRepeat, Infinity);
            hoverRootAction.setLoop(THREE.LoopRepeat, Infinity);

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

// mouse input
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;

    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function playIdle() {
    if (!idleRootAction || !idleBodyAction) return;

    idleRootAction.play();
    idleBodyAction.play();

    playBeamShrink();
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

function playHoverState() {
    if (!hoverRootAction) return;

    playBeamGrow();
}

function checkHover() {
    if (!ufo || !isReady) return;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(ufo, true);
    const nextHovered = intersects.length > 0;

    if (nextHovered !== isHovered) {
        isHovered = nextHovered;

        if (isHovered) {
            console.log('mouse on');
            playHoverState();
        } else {
            playIdle();
        }
    }
}

// animation
const clock = new THREE.Clock();

const animate = () => {
    requestAnimationFrame(animate);
    updateMovement();
    checkHover();
    renderer.render(scene, camera);
    
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (bodyMixer) bodyMixer.update(delta);
    if (dust) dust.update(delta);
    const speed = 5 * delta;

    updateMovement(delta);
};
animate();

const speed = 0.1;

function updateMovement() {
    if (!ufo) return;
    let moving = false;

    if (keys.w) {
        ufo.position.z -= speed;
        moving = true;
    }

    if (keys.s) {
        ufo.position.z += speed;
        moving = true;
    }

    if (keys.a) {
        ufo.position.x -= speed;
        moving = true;
    }

    if (keys.d) {
        ufo.position.x += speed;
        moving = true;
    }

    // If idle for 3 seconds
    if (Date.now() - lastInputTime > 3000) {
        ufo.position.lerp(idlePosition, 0.02);
    }
}



// ufo stuff
const idlePosition = new THREE.Vector3(0, 0, 0);
let lastInputTime = Date.now();