import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';
import { camera, controls } from './scene.js';
import { readResponsiveAttr } from './responsive-data.js';
import { getSpiralPosition } from './spiral-path.js';

// Opt-in per page. Give a page's body the "snap-sections" class (see
// alienstyle.css) and add data-camera / data-camera-target attributes
// (each "x,y,z") to any <section> inside <main> that should have its own
// camera view. The camera eases to that section's values whenever it
// becomes the section centered in the viewport. Sections without either
// attribute are left alone — the camera just stays put while they scroll by.
//
// Each can have a "-mobile" sibling too (data-camera-mobile,
// data-camera-target-mobile) — used instead below MOBILE_QUERY's width,
// since a narrow/portrait viewport frames the scene very differently. See
// responsive-data.js.
//
// NOTE: OrbitControls (scene.js) clamps camera distance from the target
// to between controls.minDistance and controls.maxDistance. Pick
// data-camera/data-camera-target pairs whose distance apart falls in that
// range, or the tween will visibly stop short of where it's heading.
//
// A section can use data-spiral-t="<0-1>" instead of data-camera: rather
// than tweening straight-line x/y/z (which cuts across the inside of the
// spiral's curve instead of following it), this eases a single t value
// along spiral-path.js's equation. spiralState.t assumes the page starts
// at t=0 (see scene.js's initial camera position, which matches
// spiral-path's start point exactly) and is kept in sync whenever a plain
// data-camera section becomes active instead — currently only the very
// first section, whose own data-camera also happens to equal t=0.
//
// While spiralActive is true, applySpiralPosition() (called from app.js,
// after controls.update() each frame) hard-sets camera.position from the
// live spiralState.t every frame — not just during the tween. This is
// necessary, not just tidy: OrbitControls silently clamps camera.position
// to maxDistance every time controls.update() runs, so setting position
// from a GSAP onUpdate callback (which fires on GSAP's own ticker, before
// controls.update() in the frame) would just get clamped straight back
// off the curve. Running after controls.update() instead bypasses that
// clamp, the same way the spiral needed to for its size to read at all.

const TWEEN_DURATION = 1.2; // seconds
const TWEEN_EASE = 'power2.inOut';

function parseVector(str) {
    const [x, y, z] = str.split(',').map(Number);
    return { x, y, z };
}

const spiralState = { t: 0 };
let spiralActive = true; // page starts at the spiral's own t=0, see comment above

export function applySpiralPosition() {
    if (spiralActive) camera.position.copy(getSpiralPosition(spiralState.t));
}

const sections = document.querySelectorAll('main section[data-camera], main section[data-camera-target], main section[data-spiral-t]');

if (sections.length) {
    const observer = new IntersectionObserver(
        (entries) => {
            const entry = entries.find((e) => e.isIntersecting);
            if (!entry) return;

            const spiralTAttr = readResponsiveAttr(entry.target, 'spiralT');
            const cameraAttr = readResponsiveAttr(entry.target, 'camera');
            const cameraTargetAttr = readResponsiveAttr(entry.target, 'cameraTarget');

            if (spiralTAttr) {
                spiralActive = true;
                gsap.to(spiralState, { t: parseFloat(spiralTAttr), duration: TWEEN_DURATION, ease: TWEEN_EASE });
            } else if (cameraAttr) {
                spiralActive = false; // hand position control back to the plain tween below
                spiralState.t = 0; // only non-spiral section right now is the first one, which is exactly t=0
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
