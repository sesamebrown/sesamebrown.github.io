// Shared by scroll-camera.js and scroll-ufo.js: lets any per-section data
// attribute have a mobile-specific override. e.g. a <section> with
// data-camera="0,15,60" can also carry data-camera-mobile="0,25,40" — the
// "-mobile" variant is read instead whenever the viewport matches
// MOBILE_QUERY, falling back to the base attribute if the "-mobile" one
// isn't present on that particular element.
export const MOBILE_QUERY = window.matchMedia('(max-width: 768px)');

// datasetKey is the camelCase form (e.g. "cameraTarget" for
// data-camera-target / data-camera-target-mobile).
export function readResponsiveAttr(el, datasetKey) {
    if (MOBILE_QUERY.matches) {
        const mobileValue = el.dataset[`${datasetKey}Mobile`];
        if (mobileValue) return mobileValue;
    }
    return el.dataset[datasetKey];
}
