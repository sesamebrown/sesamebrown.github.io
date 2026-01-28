// import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';

const camera = new THREE.PerspectiveCamera(
    10,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.z = 50;
camera.position.y = 5;
camera.rotateX(-0.1);

const scene = new THREE.Scene();
let UFO;
let mixer;
const loader = new GLTFLoader();
loader.load('./glb/ufo.glb',
    function (gltf) {
        UFO = gltf.scene;
        UFO.position.set(-3, 1.5, 0);
        scene.add(UFO);

        // UFO.traverse(o => console.log(o.name, o.type))

        const dome = UFO.getObjectByName('dome')
        const beam = UFO.getObjectByName('Beam')

        beam.visible = true;

        dome.material.transparent = true
        dome.material.opacity = 0.3

        beam.material.transparent = true
        beam.material.opacity = 0.5
        beam.material.depthWrite = false
        beam.material.emissive.set(0x00ffff)
        beam.material.emissiveIntensity = 2

        mixer = new THREE.AnimationMixer(UFO);
        mixer.clipAction(gltf.animations[0]).play();
        // mixer.clipAction(gltf.animations[2]).play();
        mixer.clipAction(gltf.animations[5]).play();
        // mixer.clipAction(gltf.animations[1]).play();
        mixer.timeScale = 0.5;
        console.log(gltf.animations);
    },
function (xhr) {},
function (error) {}
);

const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container3D').appendChild(renderer.domElement);

// light
const ambientLight = new THREE.AmbientLight(0xffffff, .5);
scene.add(ambientLight);
const topLight = new THREE.DirectionalLight(0xffffff, .1);
topLight.position.set(500, 500, 500);
scene.add(topLight);

const reRender3D = () => {
    requestAnimationFrame(reRender3D);
    renderer.render(scene, camera);
    if (mixer) mixer.update(0.02);
};
reRender3D();