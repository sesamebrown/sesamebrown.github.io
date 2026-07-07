import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';

// scene
const scene = new THREE.Scene();
let ufo;
let mixer;

// camera
const camera = new THREE.PerspectiveCamera(
    10,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.z = 50;
camera.position.y = 5;
camera.rotateX(-0.1);

// light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const topLight = new THREE.DirectionalLight(0xffffff, 0.2);
topLight.position.set(500, 500, 500);
scene.add(topLight);

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
loader.load('/glb/ufo.glb',
    function (gltf) {
        ufo = gltf.scene;
        scene.add(ufo);

        mixer = new THREE.AnimationMixer(ufo);
        mixer.timeScale = 0.5;

        if (gltf.animations.length > 0) {
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
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

function checkHover() {

    if (!ufo) return;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(ufo, true);

    if (intersects.length > 0) {

        // Mouse is hovering UFO

        console.log("hovering!");

        ufo.rotation.y += 0.02;

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