import { DustMotesEffect } from 'https://cdn.jsdelivr.net/npm/three-low-poly@1.2.2/dist/index.mjs';
import { scene } from './scene.js';

// dust motes
export const dust = new DustMotesEffect({
    count: 600,
    width: 30,
    height: 30,
    depth: 30,
    color: 'white',
    radius: 0.01,
    settleMin: 0,
    settleMax: 0,
    waft: 0,
    twinkleMin: 0.2,
    twinkleMax: 2,
});
dust.position.set(0, -10, 0);
scene.add(dust);
