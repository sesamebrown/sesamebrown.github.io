import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';

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
let UFOpositions;
let ufoIdleMoveTween;
let ufoIdleRotateTween;

const loader = new GLTFLoader();
loader.load('/glb/UFOscene.glb',
    function (gltf) {
        UFOscene = gltf.scene;
        // UFOscene.rotation.set(0, Math.PI/5, 0);
        // UFO = gltf.scene;
        

        UFOscene.position.set(0, -3, 0);

        UFO = UFOscene.getObjectByName('UFO_Root');
        UFO.position.set(-3, 3, -5);
        UFO.rotation.set(0.1, 0.15, 0.1);
        const dome = UFOscene.getObjectByName('dome001')
        const beam = UFOscene.getObjectByName('Beam')
        const body = UFOscene.getObjectByName('UFO001')
        // idle
        // UFO.position.set(-2.5, 0.3, -5);
        // UFO.rotation.set(0.1, 0.15, 0.1);

        // about
        // UFO.position.set(-5.3, 3.5, 2);
        // UFO.rotation.set(0.05, 0.3, 0.15);

        //portfolio
        // UFO.position.set(-1.5, -0.2, 0);
        // UFO.rotation.set(-0.1, -0.2, -0.1);

        //qualifications z =
        // UFO.position.set(0.65, 0.5, -1);
        // UFO.rotation.set(0.15, 0.1, 0.2);

        //service
        // UFO.position.set(5.5, 0.2, 1);
        // UFO.rotation.set(-0.25, -0.5, -0.25);
        beam.visible = false;

        dome.material.transparent = true
        dome.material.opacity = 0.3
        
        beam.material.transparent = true
        beam.material.opacity = 0.5
        beam.material.depthWrite = false
        beam.material.emissive.set(0x00ffff)
        beam.material.emissiveIntensity = 2

        gsap.to([dome.rotation, body.rotation], {
            y: `+=${Math.PI * 2}`,
            duration: 2.5,
            ease: "none",
            repeat: -1
        });
        startUFOIdleMotion();

        // positions
        UFOpositions = [
            {id: 'idle', position: {x: -3, y: 3, z: -5}, rotation: {x: 0.1, y: 0.15, z: 0.1}},
            {id: 'cow-about', position: UFOscene.getObjectByName('position_1').position, rotation: UFOscene.getObjectByName('position_1').rotation},
            {id: 'cow-portfolio', position: UFOscene.getObjectByName('position_2').position, rotation: UFOscene.getObjectByName('position_2').rotation},
            {id: 'cow-qualifications', position: UFOscene.getObjectByName('position_3').position, rotation: UFOscene.getObjectByName('position_3').rotation},
            {id: 'cow-service', position: UFOscene.getObjectByName('position_4').position, rotation: UFOscene.getObjectByName('position_4').rotation}
        ]
        
        scene.add(UFOscene);

        mixer = new THREE.AnimationMixer(UFOscene);
        mixer.timeScale = 0.5;

        modelMove();
    },
function (xhr) {},
function (error) {
    console.error("GLTF Load Error:", error);
}
);


let cowPositionModel = [
    {
        id: 'cow-about',
        position: {x: -4.8, y: -1.75, z: 1.5},
        rotation: {x: 0, y: 1, z: 0},
        scale: {x: 0.5, y: 0.5, z: 0.5}
    },
    {
        id: 'cow-portfolio',
        position: {x: -1.75, y: -2.5, z: 0},
        rotation: {x: 0, y: -0.75, z: 0},
        scale: {x: 0.5, y: 0.5, z: 0.5}
    },
    {
        id: 'cow-qualifications',
        position: {x: 1.1, y: -1.75, z: -1.5},
        rotation: {x: 0, y: 0.5, z:0},
        scale: {x: 0.5, y: 0.5, z:0.5}
    },
    {
        id: 'cow-service',
        position: {x: 5, y: -2.15, z: 1},
        rotation: {x: 0, y: -1.3, z: 0},
        scale: {x: 0.5, y: 0.5, z: 0.5}
    }
];

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

function stopUFOIdleMotion() {
    if (ufoIdleMoveTween) {
        ufoIdleMoveTween.kill();
        ufoIdleMoveTween = null;
    }

    if (ufoIdleRotateTween) {
        ufoIdleRotateTween.kill();
        ufoIdleRotateTween = null;
    }
}

function startUFOIdleMotion() {
    if (!UFO) return;

    stopUFOIdleMotion();

    ufoIdleMoveTween = gsap.to(UFO.position, {
        y: `+=0.4`,
        duration: 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
    });
}

function moveUFOTo(newCoordinates, onComplete) {
    if (!UFO || !newCoordinates) return;

    gsap.killTweensOf(UFO.position);
    gsap.killTweensOf(UFO.rotation);

    const moveTimeline = gsap.timeline({
        onComplete: () => {
            if (onComplete) onComplete();
        }
    });

    moveTimeline.to(UFO.position, {
        x: newCoordinates.position.x,
        y: newCoordinates.position.y,
        z: newCoordinates.position.z,
        duration: 2,
        ease: "power2.out"
    }, 0);

    moveTimeline.to(UFO.rotation, {
        x: newCoordinates.rotation.x,
        y: newCoordinates.rotation.y,
        z: newCoordinates.rotation.z,
        duration: 2,
        ease: "power3.out"
    }, 0);
}

const modelMove = () => {
    let idleTimeout = null;


    const cowsHTML = document.querySelectorAll('.menu-cows');
    const beam = UFOscene.getObjectByName('Beam')

    cowsHTML.forEach((cowHTML) => {
        cowHTML.addEventListener('mouseenter', () => {
            clearTimeout(idleTimeout);
            stopUFOIdleMotion();

            let position_active = UFOpositions.findIndex(
                (val) => val.id == cowHTML.id
            );

            if (position_active >= 0) {
                let new_coordinates = UFOpositions[position_active];
                moveUFOTo(new_coordinates, () => {
                    startUFOIdleMotion();
                });

                // beam animation
                beam.scale.set(0.3, 0, 0.3);
                beam.visible = true;
                gsap.to(beam.scale, {
                    x: 1,
                    y: 1,
                    z: 1,
                    delay: 1,
                    duration: 2,
                    ease: "power2.out"
                });

                // cow animation
                const cowModel = UFOscene.getObjectByName(`cow${position_active}`);
                if (cowModel) {
                    const t = 1; // percnet of the way to the target position
                    console.log(UFOpositions[position_active].id);
                    gsap.to(cowModel.position, {
                        x: gsap.utils.interpolate(cowModel.position.x, UFOpositions[position_active].position.x, t),
                        y: gsap.utils.interpolate(cowModel.position.y, UFOpositions[position_active].position.y, t),
                        z: gsap.utils.interpolate(cowModel.position.z, UFOpositions[position_active].position.z, t),
                        duration: 1,
                        ease: "power2.out"
                    });
                }
                else {
                    console.warn(`Cow model for position ${position_active} not found.`);
                }
            }
        })

        cowHTML.addEventListener('mouseleave', () => {
            idleTimeout = setTimeout(() => {
                let new_coordinates = UFOpositions[0];

                moveUFOTo(new_coordinates, () => {
                    startUFOIdleMotion();
                });

                gsap.to(beam.scale, {
                    x: .3,
                    y: 0,
                    z: .3,
                    duration: 2,
                    ease: "power2.out"
                });

                setTimeout(() => {
                    gsap.to(beam.scale, {
                        x: 0.3,
                        y: 0,
                        z: 0.3,
                        duration: 1,
                        ease: "power2.out"
                    });
                    beam.visible = false;
                }, 1500);

            }, 1500); 
        });
    })
};

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
