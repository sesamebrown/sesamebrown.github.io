import { setScrollTarget } from './movement.js';

// Opt-in per page, same pattern as scroll-camera.js: give a <section>
// inside <main> data-ufo-position="x,y,z" (and optionally
// data-ufo-rotation="x,y,z", in degrees) and the UFO eases there whenever
// that section becomes the one centered in the viewport.
//
// This deliberately does NOT share scroll-camera.js's data-camera
// attributes — the UFO gets its own position/rotation per section, and
// UFO_DELAY_MS below holds off applying it for a beat after the section
// activates, so the ship visibly trails the camera instead of moving in
// lockstep with it. The actual easing motion itself (the "lerp") happens
// in movement.js's updateMovement(), same as WASD movement.
const UFO_DELAY_MS = 400;

function parseVector(str) {
    return str.split(',').map(Number);
}

const sections = document.querySelectorAll('main section[data-ufo-position]');

if (sections.length) {
    let delayTimer = null;

    const observer = new IntersectionObserver(
        (entries) => {
            const entry = entries.find((e) => e.isIntersecting);
            if (!entry) return;

            const { ufoPosition, ufoRotation } = entry.target.dataset;
            const position = parseVector(ufoPosition);
            const rotation = ufoRotation ? parseVector(ufoRotation) : null;

            clearTimeout(delayTimer);
            delayTimer = setTimeout(() => setScrollTarget(position, rotation), UFO_DELAY_MS);
        },
        { threshold: 0.5 }
    );

    sections.forEach((section) => observer.observe(section));
}
