import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';
import { beamObject } from './ufo.js';
import { BEAM_HIDDEN_SCALE, BEAM_VISIBLE_SCALE, BEAM_TWEEN_DURATION } from './constants.js';

let beamOn = false;

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

// keyboard input
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (key === 'q') {
        if (e.repeat) return;

        beamOn = !beamOn;
        beamOn ? playBeamGrow() : playBeamShrink();
    }
});
