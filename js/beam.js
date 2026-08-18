import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.6.1/index.js';
// Aliased: "beamObject" below names the abductee placeholder, so the
// actual beam cone mesh goes by beamCone in here.
import { beamObject as beamCone, ufo } from './ufo.js';
import { BEAM_HIDDEN_SCALE, BEAM_VISIBLE_SCALE, BEAM_TWEEN_DURATION } from './constants.js';

let beamOn = false;

// Placeholder abductee — sits inside the Beam mesh's cone (whose local
// bounds run from y -0.05 near the UFO down to y -2.99 at the ground, see
// ufo_3.glb). Materializes tiny at the UFO's own origin (its spawn point),
// then grows while easing down into its resting spot, and bobs gently
// once there.
const BEAM_OBJECT_SPAWN_POSITION = [0, 0, 0];
const BEAM_OBJECT_POSITION = [0, -1.7, 0];
const BEAM_OBJECT_SPAWN_SCALE = 0.1;
const BEAM_OBJECT_SCALE = 0.3;
const BEAM_OBJECT_FLOAT_AMPLITUDE = 0.3;
const BEAM_OBJECT_FLOAT_DURATION = 1.5;
// Keeps the object's appear/disappear tucked inside the beam's own
// grow/shrink instead of both firing on the same keypress: the object
// waits this long after the beam starts growing to materialize, and the
// beam waits this same delay after the object starts retracting before it
// starts shrinking (see the keydown handler at the bottom of this file).
const BEAM_OBJECT_APPEAR_DELAY = BEAM_TWEEN_DURATION / 5;

let beamObject = null;
let beamObjectReady = false;

new GLTFLoader().load('/glb/cube.glb', (gltf) => {
    beamObject = gltf.scene;
    beamObject.scale.setScalar(BEAM_OBJECT_SPAWN_SCALE);
    beamObject.position.set(...BEAM_OBJECT_SPAWN_POSITION);
    beamObject.visible = false;
    beamObjectReady = true;

    if (beamOn) showBeamObject();
});

function showBeamObject() {
    if (!beamObjectReady || !ufo) return;

    // Cancels whichever stage — grow, land, retract, or the infinite bob —
    // was still running. Deliberately does NOT reset scale/position first:
    // gsap.to() always animates from the object's current live value, so
    // if this interrupts a mid-flight retract, it continues smoothly from
    // wherever that was instead of snapping back to the spawn point first.
    gsap.killTweensOf(beamObject.scale);
    gsap.killTweensOf(beamObject.position);

    if (!beamObject.parent) ufo.add(beamObject);
    beamObject.visible = true;

    // Same ease as the beam cone's own grow/shrink (playBeamGrow/Shrink
    // below), so the two read as one coordinated motion.
    gsap.to(beamObject.scale, {
        x: BEAM_OBJECT_SCALE,
        y: BEAM_OBJECT_SCALE,
        z: BEAM_OBJECT_SCALE,
        duration: BEAM_TWEEN_DURATION,
        ease: 'power2.out',
    });

    // Falls straight through its resting height into the bottom of the
    // bob range, so the landing blends into the first half of the float
    // loop instead of stopping dead and restarting from zero velocity.
    gsap.to(beamObject.position, {
        y: BEAM_OBJECT_POSITION[1] - BEAM_OBJECT_FLOAT_AMPLITUDE,
        duration: BEAM_TWEEN_DURATION,
        ease: 'power2.out',
        onComplete: () => {
            gsap.to(beamObject.position, {
                y: BEAM_OBJECT_POSITION[1] + BEAM_OBJECT_FLOAT_AMPLITUDE,
                duration: BEAM_OBJECT_FLOAT_DURATION,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        },
    });
}

function hideBeamObject() {
    if (!beamObject) return;

    // Same reasoning as showBeamObject: no reset before animating, so
    // interrupting a mid-flight appear continues smoothly from there.
    gsap.killTweensOf(beamObject.scale);
    gsap.killTweensOf(beamObject.position);

    // Reverse of showBeamObject, same 'power2.out' ease as the beam cone's
    // own shrink — shrinks and rises back up into the UFO in step with it.
    gsap.to(beamObject.position, {
        y: BEAM_OBJECT_SPAWN_POSITION[1],
        duration: BEAM_TWEEN_DURATION,
        ease: 'power2.out',
    });

    gsap.to(beamObject.scale, {
        x: BEAM_OBJECT_SPAWN_SCALE,
        y: BEAM_OBJECT_SPAWN_SCALE,
        z: BEAM_OBJECT_SPAWN_SCALE,
        duration: BEAM_TWEEN_DURATION,
        ease: 'power2.out',
        onComplete: () => {
            beamObject.visible = false;
        },
    });
}

function playBeamGrow() {
    if (!beamCone) return;

    gsap.to(beamCone.scale, {
        x: BEAM_VISIBLE_SCALE,
        y: BEAM_VISIBLE_SCALE,
        z: BEAM_VISIBLE_SCALE,
        duration: BEAM_TWEEN_DURATION,
        ease: 'power2.out',
    });
}

function playBeamShrink() {
    if (!beamCone) return;

    gsap.to(beamCone.scale, {
        x: BEAM_HIDDEN_SCALE,
        y: BEAM_HIDDEN_SCALE,
        z: BEAM_HIDDEN_SCALE,
        duration: BEAM_TWEEN_DURATION,
        ease: 'power2.out',
    });
}

// Whichever of these is pending — killed on the next Q press so a fast
// double-tap can't leave a stale showBeamObject/playBeamShrink call to
// fire after the beam's already gone the other way.
let pendingBeamObjectAction = null;

// keyboard input
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (key === 'q') {
        if (e.repeat) return;

        beamOn = !beamOn;
        pendingBeamObjectAction?.kill();

        if (beamOn) {
            playBeamGrow();
            pendingBeamObjectAction = gsap.delayedCall(BEAM_OBJECT_APPEAR_DELAY, showBeamObject);
        } else {
            hideBeamObject();
            pendingBeamObjectAction = gsap.delayedCall(BEAM_OBJECT_APPEAR_DELAY, playBeamShrink);
        }
    }
});
