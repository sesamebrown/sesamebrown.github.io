import { DustMotesEffect } from 'https://cdn.jsdelivr.net/npm/three-low-poly@1.2.2/dist/index.mjs';
import { scene, pilot } from './scene.js';

// Dust motes are streamed in fixed-size cells around the pilot, rather than
// one big fixed volume (which the pilot could simply fly past) or a single
// volume that follows the pilot directly (visibly "drags" the stars along
// with you, which reads as obviously fake). Cells tile a 3D grid; whichever
// cell the pilot is currently in, plus its 26 neighbors (a 3x3x3 block),
// stay populated — cells that fall outside that block get torn down.
// Individual motes never move once spawned, so nothing visibly follows the
// ship: it's the coverage that expands, invisibly, ahead of wherever you go.
const CELL_SIZE = 30; // world units per cell edge — also each cell's own DustMotesEffect box size, so cells tile with no gaps/overlap
const GRID_RADIUS = 1; // cells out from the pilot's own cell, per axis — 1 gives the requested 3x3x3 block
const CELL_DUST_COUNT = 80; // motes per cell — 27 cells fully populated is ~2160 on screen at once, vs. the original single-volume 600
const DUST_Y_OFFSET = -10; // grid is centered on the pilot's x/z but offset down in y, matching the original fixed height

const cells = new Map(); // "cx,cy,cz" -> DustMotesEffect instance
let lastCellKey = null;

function cellCoordsFor(position) {
    return {
        x: Math.round(position.x / CELL_SIZE),
        y: Math.round((position.y - DUST_Y_OFFSET) / CELL_SIZE),
        z: Math.round(position.z / CELL_SIZE),
    };
}

function spawnCell(cx, cy, cz) {
    const effect = new DustMotesEffect({
        count: CELL_DUST_COUNT,
        width: CELL_SIZE,
        height: CELL_SIZE,
        depth: CELL_SIZE,
        color: 'white',
        radius: 0.01,
        settleMin: 0,
        settleMax: 0,
        waft: 0,
        twinkleMin: 0.2,
        twinkleMax: 2,
    });
    effect.position.set(cx * CELL_SIZE, cy * CELL_SIZE + DUST_Y_OFFSET, cz * CELL_SIZE);
    scene.add(effect);
    return effect;
}

// Traverses defensively (geometry/material could live on the effect itself
// or on children, depending on how DustMotesEffect is built internally)
// rather than assuming a specific structure.
function despawnCell(effect) {
    scene.remove(effect);
    effect.traverse((obj) => {
        obj.geometry?.dispose?.();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m) => m?.dispose?.());
    });
}

function updateGrid() {
    const center = cellCoordsFor(pilot.position);
    const key = `${center.x},${center.y},${center.z}`;
    if (key === lastCellKey) return; // still in the same cell — grid membership can't have changed
    lastCellKey = key;

    const needed = new Set();

    for (let dx = -GRID_RADIUS; dx <= GRID_RADIUS; dx++) {
        for (let dy = -GRID_RADIUS; dy <= GRID_RADIUS; dy++) {
            for (let dz = -GRID_RADIUS; dz <= GRID_RADIUS; dz++) {
                const cx = center.x + dx;
                const cy = center.y + dy;
                const cz = center.z + dz;
                const cellKey = `${cx},${cy},${cz}`;
                needed.add(cellKey);

                if (!cells.has(cellKey)) {
                    cells.set(cellKey, spawnCell(cx, cy, cz));
                }
            }
        }
    }

    for (const [cellKey, effect] of cells) {
        if (!needed.has(cellKey)) {
            despawnCell(effect);
            cells.delete(cellKey);
        }
    }
}

// Prime the initial 3x3x3 block immediately rather than waiting for the
// first animation frame.
updateGrid();

export function updateDust(delta) {
    updateGrid();

    for (const effect of cells.values()) {
        effect.update(delta);
    }
}
