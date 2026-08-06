import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';
import { scene } from './scene.js';

// Which planet model to load is set per-page via <body data-planet="...">.
// Not present (e.g. index.html) means no planet on that page.
const planetFile = document.body.dataset.planet;

if (planetFile) {
    const loader = new GLTFLoader();
    loader.load(`/glb/${planetFile}`, (gltf) => {
        const planet = gltf.scene;
        planet.scale.setScalar(3);
        planet.position.set(0, -25, -10);
        // planet.rotation.set(0, 0, -Math.PI / 2);
        scene.add(planet);

        // Glow from within: only the textured surface mesh (some planet
        // exports bundle extra untextured parts, e.g. a leftover UFO/dome —
        // .map presence is what distinguishes the actual planet surface).
        planet.traverse((child) => {
            if (child.isMesh && child.material && child.material.map) {
                child.material.emissiveMap = child.material.map;
                child.material.emissive.set('#ffffff');
                child.material.emissiveIntensity = 1.1;
            }
        });

        gsap.to(planet.rotation, {
            // x: -Math.PI * 2,
            // y: -Math.PI * 2,
            z: -Math.PI * 2,
            duration: 360,
            repeat: -1,
            ease: 'linear',
        });
    });
}
