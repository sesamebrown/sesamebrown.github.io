import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { camera } from './scene.js';
import { planet } from './planet.js';

// Only pages that opt in via <body data-flags="true"> get this (currently
// just guests.html): click the planet surface and a flag plants there.
if (document.body.dataset.flags === 'true') {
    const CLICK_MOVE_THRESHOLD = 6; // px of pointer movement beyond which this is a drag (planet-drag.js's job), not a click
    const FLAG_SCALE = 0.6; // world-space size of a planted flag, independent of the planet's own .scale

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    const loader = new GLTFLoader();

    let flagTemplate = null;
    loader.load('/glb/flag.glb', (gltf) => {
        flagTemplate = gltf.scene;
    });

    let downX = 0;
    let downY = 0;

    window.addEventListener('pointerdown', (event) => {
        downX = event.clientX;
        downY = event.clientY;
    });

    window.addEventListener('pointerup', (event) => {
        if (!planet || !flagTemplate) return;

        const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
        if (moved > CLICK_MOVE_THRESHOLD) return; // was a drag-to-rotate, not a click

        pointerNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointerNDC.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointerNDC, camera);

        const hits = raycaster.intersectObject(planet, true);
        if (hits.length > 0) plantFlag(hits[0]);
    });

    function plantFlag(hit) {
        const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        const planetWorldQuat = planet.getWorldQuaternion(new THREE.Quaternion());
        const planetWorldQuatInverse = planetWorldQuat.clone().invert();

        // "up" is the pole's lean — the flag sticks straight out of the
        // surface, exactly as before. This is computed in planet-local
        // space since the flag is parented to the planet (see below).
        const up = worldNormal.clone().applyQuaternion(planetWorldQuatInverse).normalize();

        // "front" is the direction, within the plane perpendicular to `up`,
        // that points as close to the camera as possible without disturbing
        // the lean — i.e. the flag is free to spin around its own pole, but
        // the pole itself can't tilt away from the surface normal.
        const worldToCamera = camera.position.clone().sub(hit.point).normalize();
        const localToCamera = worldToCamera.applyQuaternion(planetWorldQuatInverse).normalize();
        const front = localToCamera.clone().sub(up.clone().multiplyScalar(localToCamera.dot(up)));
        if (front.lengthSq() < 1e-6) front.set(1, 0, 0); // camera is ~directly along the pole; rare, arbitrary fallback
        front.normalize();

        const right = new THREE.Vector3().crossVectors(up, front).normalize();
        front.crossVectors(right, up).normalize(); // re-orthogonalize

        const flag = flagTemplate.clone();

        // Clones share the template's material by default — clone it too so
        // recoloring this flag doesn't recolor every other planted flag (or
        // the template itself).
        flag.traverse((child) => {
            if (!child.isMesh) return;

            child.material = child.material.clone();

            const hsl = { h: 0, s: 0, l: 0 };
            child.material.color.getHSL(hsl);
            child.material.color.setHSL(Math.random(), hsl.s, hsl.l); // random hue, same saturation/lightness

            // This scene's ambient/directional lighting is quite weak, and
            // depending on which way a flag ends up facing it can catch
            // almost none of the directional light — reading as flat and
            // dark. A little matching emissive keeps it clearly visible and
            // colorful regardless of angle, same trick used for the planets.
            child.material.emissive.copy(child.material.color);
            child.material.emissiveIntensity = 0.6;
        });

        planet.add(flag);

        // The flag is parented to the planet (not the scene) so it stays
        // stuck to the surface as the planet auto-spins or gets dragged —
        // meaning its position/orientation need to be expressed in the
        // planet's own local space, not world space.
        flag.position.copy(planet.worldToLocal(hit.point.clone()));

        // Model's local +Y is its pole, local +Z is its front face.
        flag.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, front));

        // Counter the planet's own scale so the flag's real-world size stays
        // consistent regardless of which planet model/scale is loaded here.
        flag.scale.setScalar(FLAG_SCALE / planet.scale.x);
    }
}
