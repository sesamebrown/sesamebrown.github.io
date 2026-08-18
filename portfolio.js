// import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.skypack.dev/gsap@3.6.1';
import { SkeletonUtils } from 'https://cdn.jsdelivr.net/npm/three@0.129.0/examples/jsm/utils/SkeletonUtils.js';


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
let UFOscene;
const loader = new GLTFLoader();
loader.load('./glb/ufo.glb',
    function (gltf) {
        UFO = gltf.scene;
        // UFOscene = gltf.scene;
        // UFOscene.rotation.set(0, Math.PI/5, 0);
        // UFO = gltf.scene;
        //idle
        // UFO.position.set(-2.5, 0.3, -5);
        // UFO.rotation.set(0.1, 0.15, 0.1);

        UFO.position.set(2.5, 0.3, -5);
        UFO.rotation.set(0.1, -0.2, 0);

        // about
        // UFO.position.set(-5, 0.6, 2);
        // UFO.rotation.set(0.05, 0.5, 0.15);

        //portfolio
        // UFO.position.set(-1.5, -0.2, 0);
        // UFO.rotation.set(-0.1, -0.2, -0.1);

        //qualifications z =
        // UFO.position.set(0.65, 0.5, -1);
        // UFO.rotation.set(0.15, 0.1, 0.2);

        //service
        // UFO.position.set(5.5, 0.2, 1);
        // UFO.rotation.set(-0.25, -0.5, -0.25);


        const dome = UFO.getObjectByName('dome')
        const beam = UFO.getObjectByName('Beam')

        beam.visible = false;

        dome.material.transparent = true
        dome.material.opacity = 0.3
        
        beam.material.transparent = true
        beam.material.opacity = 0.5
        beam.material.depthWrite = false
        beam.material.emissive.set(0x00ffff)
        beam.material.emissiveIntensity = 2
        
        
        scene.add(UFO);

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const topLight = new THREE.DirectionalLight(0xffffff, 0.2);
topLight.position.set(500, 500, 500);
scene.add(topLight);

const reRender3D = () => {
    requestAnimationFrame(reRender3D);
    renderer.render(scene, camera);
    if (mixer) mixer.update(0.02);
    
};
reRender3D();
