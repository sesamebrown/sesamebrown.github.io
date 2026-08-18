import { readResponsiveAttr } from './responsive-data.js';

export const BEAM_HIDDEN_SCALE = 0.01;
export const BEAM_VISIBLE_SCALE = 1;
export const BEAM_TWEEN_DURATION = 0.5;

function parseVector(str) {
    return str.split(',').map(Number);
}

// Pages with scroll-driven UFO sections (see scroll-ufo.js) spawn the ship
// at the first such section's position/rotation instead of the fallback
// below, so it doesn't visibly fly in from an unrelated spot on load.
const firstUfoSection = document.querySelector('main section[data-ufo-position]');
const spawnPositionAttr = firstUfoSection && readResponsiveAttr(firstUfoSection, 'ufoPosition');
const spawnRotationAttr = firstUfoSection && readResponsiveAttr(firstUfoSection, 'ufoRotation');

// Where the UFO (pilot) first appears, and the spot movement.js eases it
// back to after idling — shared so the two can't drift out of sync with
// each other (see ufo.js and movement.js).
export const PILOT_SPAWN_POSITION = spawnPositionAttr ? parseVector(spawnPositionAttr) : [0, -2, 0];

// Same idea, in radians — defaults to facing forward when no section opts in.
export const PILOT_SPAWN_ROTATION = spawnRotationAttr
    ? parseVector(spawnRotationAttr).map((deg) => deg * Math.PI / 180)
    : [0, 0, 0];
