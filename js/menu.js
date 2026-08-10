const SVG_NS = 'http://www.w3.org/2000/svg';

const HUB = { x: 24, y: 200 };

// To add a page: just add {id, href} here. Position, orbit radius, and
// stagger delay are all computed from this list automatically — each
// successive entry gets fanned out at a wider angle and a bigger orbit
// ring, so nothing needs manual x/y placement.
const PAGES = [
    { id: 'about', href: 'about.html' },
    { id: 'portfolio', href: 'portfolio.html' },
    { id: 'qualifications', href: 'qualifications.html' },
    { id: 'service', href: 'service.html' },
    { id: 'guests', href: 'guests.html' }
];

const FAN_ANGLE_DEGREES = 70; // total angular spread, centered on the horizontal
const BASE_RADIUS = 85;
const RADIUS_STEP = 150; // each successive planet's orbit grows by this much
const PLANET_R = 10;
const LABEL_INSET = 10; // px the label sits inward from the visible orbit ring
const STAGGER_STEP = 0.06; // seconds between each planet's reveal, for a cascading feel
const BASE_ORBIT_DURATION = 40; // seconds for the innermost planet's full lap
const ORBIT_DURATION_STEP = 50; // farther-out planets orbit slower, like real planets

const PLANETS = PAGES.map((page, i) => {
    const t = PAGES.length === 1 ? 0.5 : i / (PAGES.length - 1); // 0..1 across the fan
    const angle = ((-FAN_ANGLE_DEGREES / 2 + t * FAN_ANGLE_DEGREES) * Math.PI) / 180;
    const orbitR = BASE_RADIUS + i * RADIUS_STEP;

    return {
        ...page,
        x: HUB.x + orbitR * Math.cos(angle),
        y: HUB.y + orbitR * Math.sin(angle),
        angle,
        r: PLANET_R,
        stagger: i * STAGGER_STEP,
        orbitDuration: BASE_ORBIT_DURATION + i * ORBIT_DURATION_STEP,
    };
});

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// SVG path tracing a full circle, so a <textPath> can be bound to it (a
// plain <circle> doesn't have the path-following support text needs). Only
// ever used for a label's path (the visible ring is a plain <circle>), so
// its sweep direction (the "0" flags below) is chosen purely for how it
// makes textPath-bound text read, not for the ring's appearance: sweeping
// this way keeps curved labels right-side up instead of upside-down. Split
// into two semicircle arcs — one arc command alone can't close a full loop
// back to its own start point.
function circlePathD(cx, cy, r) {
    return `M ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy} A ${r},${r} 0 1,0 ${cx + r},${cy}`;
}

// Converts a position angle around HUB into the % along a label's path
// (circlePathD) where that angle actually sits. The path sweeps the
// opposite rotational direction from increasing angle (see circlePathD),
// so this negates the angle before taking its fraction of the full circle.
// Shared by buildPlanet (initial placement) and setupLabelSafety (its
// off-screen search) so the two stay in agreement about what a given angle
// means.
function angleToStartOffsetPercent(angle) {
    const normalized = ((-angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return (normalized / (Math.PI * 2)) * 100;
}

/**
 * Every planet currently references this one shared symbol, so they're all
 * identical placeholder circles for now.
 *
 * TO CUSTOMIZE PLANETS LATER: give each node its own <symbol id="icon-xxx">
 * here (any SVG shapes inside, viewBox="-1 -1 2 2" keeps it centered/unit
 * sized) and point that node's <use href="#..."> below at its own symbol
 * id instead of the shared "menu-icon-shape".
 */
function buildDefs() {
    return `
        <symbol id="menu-icon-shape" viewBox="-1 -1 2 2">
            <circle cx="0" cy="0" r="1" />
        </symbol>
    `;
}

// transform-origin is set explicitly here (rather than relying on CSS
// transform-box: fill-box, which doesn't reliably resolve to a <use>
// element's own center) so the hover-grow scales the icon in place
function buildIconUse(x, y, r, extraClass) {
    return `<use href="#menu-icon-shape" class="menu-icon${extraClass ? ' ' + extraClass : ''}"
            x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}"
            style="transform-origin: ${x}px ${y}px;" />`;
}

function buildHome() {
    const r = 16;
    const hitR = 26;

    // A plain <circle> in the main SVG's own coordinate space, not routed
    // through buildIconUse's shared unit-circle symbol: that symbol's
    // viewBox has zero margin around its circle, so a stroke on it (for the
    // hollow idle state) bled straight to the symbol's square clip edge
    // instead of forming a ring. Drawn at its real size here, there's no
    // tight clip box for a stroke to hit.
    return `
        <g class="menu-node menu-node--home" data-id="home">
            <a href="index.html" aria-label="Home">
                <circle class="hit-target" cx="${HUB.x}" cy="${HUB.y}" r="${hitR}" />
                <circle class="menu-icon menu-icon--home" cx="${HUB.x}" cy="${HUB.y}" r="${r}"
                    style="transform-origin: ${HUB.x}px ${HUB.y}px;" />
            </a>
        </g>`;
}

function buildPlanet(node) {
    const orbitR = dist(HUB, node);
    const hitR = node.r + 9;
    const labelPathId = `orbit-label-path-${node.id}`;

    const startOffsetPercent = angleToStartOffsetPercent(node.angle);

    // The reveal (scale-in from the hub, on menu hover) lives on the outer
    // .planet-node group; continuous orbital motion lives on the nested
    // .planet-orbit group. Both are anchored at the same HUB point, so they
    // compose instead of fighting over the same "transform" property —
    // the planet grows in AND keeps circling at once. The orbit ring and
    // its label live directly on .planet-node too, so they fade/scale in
    // with the rest of the reveal but don't themselves orbit.
    //
    // The label doesn't sit on the visible ring itself — it's bound to a
    // second, invisible path at a smaller radius (LABEL_INSET) so it reads
    // just inside the ring instead of straddling the line. Every label's
    // path is built with the exact same circlePathD (same center, same
    // start point, same sweep) so they all curve the same way as each
    // other — startOffset is the only thing that varies per label.
    return `
        <g class="menu-node planet-node" data-id="${node.id}" style="--stagger: ${node.stagger}s">
            <circle class="orbit-ring" cx="${HUB.x}" cy="${HUB.y}" r="${orbitR}" />
            <path id="${labelPathId}" class="orbit-label-path" d="${circlePathD(HUB.x, HUB.y, orbitR - LABEL_INSET)}" />
            <text class="orbit-label"><textPath href="#${labelPathId}" startOffset="${startOffsetPercent}%">${node.id}</textPath></text>
            <g class="planet-orbit" style="--orbit-duration: ${node.orbitDuration}s;">
                <a href="${node.href}" aria-label="${node.id}">
                    <circle class="hit-target" cx="${node.x}" cy="${node.y}" r="${hitR}" />
                    ${buildIconUse(node.x, node.y, node.r)}
                </a>
            </g>
        </g>`;
}

function buildSvgMarkup() {
    return `
        <svg class="menu-svg" viewBox="0 0 300 420" xmlns="${SVG_NS}">
            <defs>${buildDefs()}</defs>
            ${buildHome()}
            ${PLANETS.map(buildPlanet).join('')}
        </svg>`;
}

const template = document.createElement('template');
template.innerHTML = buildSvgMarkup();

const VIEWBOX_W = 300;
const VIEWBOX_H = 420;
const EDGE_MARGIN = 3; // px of extra clearance beyond the true edge, so the on/off check doesn't flicker right at the boundary

const CLOSE_DELAY = 600; // ms of genuine mouse inactivity before closing (see setupOpenState)

class SiteMenu extends HTMLElement {
    connectedCallback() {
        if (this.childElementCount > 0) return;

        this.appendChild(template.content.cloneNode(true));
        this.startOrbiting();
        this.setupOpenState();
        this.setupGlow();
        this.setupLabelSafety();
    }

    // A backdrop behind the menu, fading from opaque black at the screen's
    // left edge to transparent by the outermost orbit ring's screen
    // position, so the menu (especially once expanded) reads clearly
    // against whatever page content sits behind it. Lives on <body>, not
    // inside this element: .menu has its own `transform`, which would make
    // it the containing block for a position:fixed child instead of the
    // real viewport.
    setupGlow() {
        const glow = document.createElement('div');
        glow.className = 'menu-glow';
        document.body.appendChild(glow);

        const outermost = PLANETS[PLANETS.length - 1];
        const maxRadius = dist(HUB, outermost) + outermost.r;

        const update = () => {
            const { x } = this.toScreen(HUB.x + maxRadius, HUB.y);
            glow.style.width = `${Math.max(0, x)}px`;
        };

        update();
        window.addEventListener('resize', update);
    }

    // A label can land off-screen the same way an orbiting planet can — the
    // outer rings are far bigger than the viewport, and a label's fixed
    // startOffset (see buildPlanet) might just happen to fall on a stretch
    // of ring that's off-canvas. If so, walk that same ring outward from
    // the label's natural spot, in both directions, looking for a
    // startOffset where it renders on-screen — same radius throughout, so
    // it always stays "along the orbital line," just relocated.
    setupLabelSafety() {
        const SEARCH_STEP = (10 * Math.PI) / 180; // 10°
        const MAX_STEPS = Math.ceil(Math.PI / SEARCH_STEP); // half the ring covers every position in either direction

        const setStartOffset = (textPath, angle) => {
            textPath.setAttribute('startOffset', `${angleToStartOffsetPercent(angle)}%`);
        };

        const isOffScreen = (textEl) => {
            const bbox = textEl.getBBox();
            const a = this.toScreen(bbox.x, bbox.y);
            const b = this.toScreen(bbox.x + bbox.width, bbox.y + bbox.height);
            const left = Math.min(a.x, b.x);
            const right = Math.max(a.x, b.x);
            const top = Math.min(a.y, b.y);
            const bottom = Math.max(a.y, b.y);

            return (
                right < -EDGE_MARGIN ||
                left > window.innerWidth + EDGE_MARGIN ||
                bottom < -EDGE_MARGIN ||
                top > window.innerHeight + EDGE_MARGIN
            );
        };

        const place = () => {
            for (const node of PLANETS) {
                const textEl = this.querySelector(`.planet-node[data-id="${node.id}"] .orbit-label`);
                const textPath = textEl.querySelector('textPath');

                setStartOffset(textPath, node.angle);
                if (!isOffScreen(textEl)) continue;

                for (let i = 1; i <= MAX_STEPS; i++) {
                    let placed = false;

                    for (const direction of [1, -1]) {
                        setStartOffset(textPath, node.angle + direction * i * SEARCH_STEP);
                        if (!isOffScreen(textEl)) {
                            placed = true;
                            break;
                        }
                    }

                    if (placed) break;
                    // neither direction fits at this distance yet; keep searching outward
                }
                // if nothing on the ring ever fits, it's left at the last candidate tried
            }
        };

        place();
        window.addEventListener('resize', place);
    }

    // Whether the menu stays revealed can't be a CSS :hover zone on .menu's
    // own box — planets orbit (and skip-ahead) to wherever makes them
    // visible, which can be anywhere in the viewport, not just inside
    // .menu's fixed-size box. So this tracks an explicit "open" class
    // instead.
    //
    // The close timer resets on ANY mouse movement while already open, not
    // just on landing on a specific hit-target — reaching a distant, still-
    // orbiting outer planet can take a while, and none of that travel time
    // across empty space should count against a countdown. It only closes
    // after CLOSE_DELAY of the mouse being genuinely still.
    //
    // While the cursor sits on Home itself, movement is never allowed to
    // schedule a close — otherwise ordinary hand jitter while resting on
    // Home starts the countdown, and the menu can close out from under a
    // cursor that never actually left it.
    setupOpenState() {
        let closeTimer = null;
        let overHome = false;

        const open = () => {
            clearTimeout(closeTimer);
            this.classList.add('menu--open');
        };
        const scheduleClose = () => {
            clearTimeout(closeTimer);
            closeTimer = setTimeout(() => this.classList.remove('menu--open'), CLOSE_DELAY);
        };

        for (const hit of this.querySelectorAll('.hit-target')) {
            hit.addEventListener('pointerenter', open);
        }

        const homeHit = this.querySelector('.menu-node--home .hit-target');
        homeHit.addEventListener('pointerenter', () => { overHome = true; });
        homeHit.addEventListener('pointerleave', () => { overHome = false; });

        window.addEventListener('pointermove', () => {
            if (this.classList.contains('menu--open') && !overHome) scheduleClose();
        });
    }

    // Converts a point in the SVG's own viewBox units to real screen pixels,
    // replicating preserveAspectRatio="xMidYMid meet" (the SVG default) —
    // needed because "off-screen" is a browser-window concept, not one the
    // SVG's own coordinate space knows about on its own.
    toScreen(vx, vy) {
        const rect = this.getBoundingClientRect();
        const scale = Math.min(rect.width / VIEWBOX_W, rect.height / VIEWBOX_H);
        const renderedW = VIEWBOX_W * scale;
        const renderedH = VIEWBOX_H * scale;
        const offsetX = rect.left + (rect.width - renderedW) / 2;
        const offsetY = rect.top + (rect.height - renderedH) / 2;
        return { x: offsetX + vx * scale, y: offsetY + vy * scale, scale };
    }

    // True only once there's not a single visible pixel left — a planet is
    // allowed to clip the edge and partially exit like normal motion; it
    // only gets skipped once it's fully gone, so the jump itself is never
    // seen happening.
    isFullyOffScreen(vx, vy, vr) {
        const { x, y, scale } = this.toScreen(vx, vy);
        const r = vr * scale;
        return (
            x + r < -EDGE_MARGIN ||
            x - r > window.innerWidth + EDGE_MARGIN ||
            y + r < -EDGE_MARGIN ||
            y - r > window.innerHeight + EDGE_MARGIN
        );
    }

    // Each planet orbits continuously via JS (not CSS @keyframes) because
    // the skip-ahead-when-off-screen behavior needs to check real window
    // bounds every frame and jump discontinuously — something a CSS
    // animation has no way to do.
    startOrbiting() {
        const states = PLANETS.map((node) => {
            const orbitR = dist(HUB, node);
            const initialAngle = Math.atan2(node.y - HUB.y, node.x - HUB.x);

            return {
                el: this.querySelector(`.planet-node[data-id="${node.id}"] .planet-orbit`),
                orbitR,
                r: node.r,
                initialAngle,
                angle: initialAngle,
                speed: (Math.PI * 2) / node.orbitDuration,
            };
        });

        const posAt = (state, angle) => ({
            x: HUB.x + state.orbitR * Math.cos(angle),
            y: HUB.y + state.orbitR * Math.sin(angle),
        });

        let lastTime = performance.now();

        const tick = (now) => {
            const dt = Math.min((now - lastTime) / 1000, 0.1); // clamp so a backgrounded-tab gap doesn't jump wildly
            lastTime = now;

            for (const state of states) {
                let candidate = state.angle + state.speed * dt;
                let p = posAt(state, candidate);

                if (this.isFullyOffScreen(p.x, p.y, state.r)) {
                    // Completely invisible now, so it's safe to skip ahead
                    // without the jump itself ever being visible. Keep
                    // stepping in the same direction until any part of it
                    // would be visible again.
                    const step = 0.05;
                    const maxSteps = Math.ceil((Math.PI * 2) / step);
                    let found = false;

                    for (let i = 0; i < maxSteps; i++) {
                        candidate += step;
                        p = posAt(state, candidate);
                        if (!this.isFullyOffScreen(p.x, p.y, state.r)) {
                            found = true;
                            break;
                        }
                    }

                    if (!found) continue; // whole ring never touches the screen; leave it be
                }

                state.angle = candidate;
                const deg = ((state.angle - state.initialAngle) * 180) / Math.PI;
                state.el.style.transform = `rotate(${deg}deg)`;
            }

            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }
}

customElements.define('site-menu', SiteMenu);
