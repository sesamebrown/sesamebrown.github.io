import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';
import { camera, controls } from './scene.js';

// Opt-in per page. Give a page's body the "snap-sections" class (see
// alienstyle.css) and add data-camera / data-camera-target attributes
// (each "x,y,z") to any <section> inside <main> that should have its own
// camera view. The camera eases to that section's values whenever it
// becomes the section centered in the viewport. Sections without either
// attribute are left alone — the camera just stays put while they scroll by.
//
// NOTE: OrbitControls (scene.js) clamps camera distance from the target
// to between controls.minDistance and controls.maxDistance. Pick
// data-camera/data-camera-target pairs whose distance apart falls in that
// range, or the tween will visibly stop short of where it's heading.

const TWEEN_DURATION = 1.2; // seconds
const TWEEN_EASE = 'power2.inOut';

function parseVector(str) {
    const [x, y, z] = str.split(',').map(Number);
    return { x, y, z };
}

const sections = document.querySelectorAll('main section[data-camera], main section[data-camera-target]');

if (sections.length) {
    const observer = new IntersectionObserver(
        (entries) => {
            const entry = entries.find((e) => e.isIntersecting);
            if (!entry) return;

            const { camera: cameraAttr, cameraTarget: cameraTargetAttr } = entry.target.dataset;
            if (cameraAttr) {
                gsap.to(camera.position, { ...parseVector(cameraAttr), duration: TWEEN_DURATION, ease: TWEEN_EASE });
            }
            if (cameraTargetAttr) {
                gsap.to(controls.target, { ...parseVector(cameraTargetAttr), duration: TWEEN_DURATION, ease: TWEEN_EASE });
            }
        },
        { threshold: 0.5 }
    );

    sections.forEach((section) => observer.observe(section));
}
