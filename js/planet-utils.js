// Shared by planet.js (one planet per content page) and home-planets.js
// (many planets scattered on the home page), so both get the same look
// without duplicating the logic.

// Glow from within: only the textured surface mesh (some planet exports
// bundle extra untextured parts, e.g. a leftover UFO/dome — .map presence
// is what distinguishes the actual planet surface).
export function applyPlanetGlow(root) {
    root.traverse((child) => {
        if (child.isMesh && child.material && child.material.map) {
            child.material.emissiveMap = child.material.map;
            child.material.emissive.set('#ffffff');
            child.material.emissiveIntensity = 1.1;
        }
    });
}
