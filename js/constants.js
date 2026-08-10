export const BEAM_HIDDEN_SCALE = 0.01;
export const BEAM_VISIBLE_SCALE = 1;
export const BEAM_TWEEN_DURATION = 1;

// Where the UFO (pilot) first appears, and the spot movement.js eases it
// back to after idling — shared so the two can't drift out of sync with
// each other (see ufo.js and movement.js).
export const PILOT_SPAWN_POSITION = [0, -2, 0];
