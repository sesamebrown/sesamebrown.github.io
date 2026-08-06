const SVG_NS = 'http://www.w3.org/2000/svg';

// Layout constants (SVG user-space units — the whole graphic scales
// uniformly to fit the .menu box, so these are NOT pixels).
const SPINE_X = 30;
const HOME_Y = 320;

// order top-to-bottom matches the visual stack; "orbitR" is the radius
// of the home-centered semicircle each side icon swings along on hover.
const NODES = [
    { id: 'about', href: 'about.html', y: 40, orbitR: 110 },
    { id: 'portfolio', href: 'portfolio.html', y: 180, orbitR: 70 },
    { id: 'home', href: 'index.html', y: HOME_Y, orbitR: 0 },
    { id: 'qualifications', href: 'qualifications.html', y: 460, orbitR: 70 },
    { id: 'service', href: 'service.html', y: 600, orbitR: 110 },
];

// 6 small sparkle points scattered around Home, staggered so they twinkle
// out of sync with each other rather than all at once.
const SPARKLES = [
    [-18, -14, 0], [16, -18, 0.2], [22, 6, 0.4],
    [-20, 10, 0.6], [4, 24, 0.8], [-2, -26, 1],
].map(([dx, dy, delay]) => ({ x: SPINE_X + dx, y: HOME_Y + dy, delay }));

/**
 * Every icon currently references this one shared symbol, so they're all
 * identical placeholder circles for now.
 *
 * TO CUSTOMIZE ICONS LATER: give each node its own <symbol id="icon-xxx">
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

function buildIconUse(node, r, extraClass, extraStyle) {
    return `<use href="#menu-icon-shape" class="menu-icon${extraClass ? ' ' + extraClass : ''}"
            x="${SPINE_X - r}" y="${node.y - r}" width="${r * 2}" height="${r * 2}"
            ${extraStyle ? `style="${extraStyle}"` : ''} />`;
}

function buildNode(node) {
    if (node.id === 'home') {
        const r = 15;
        const hitR = 24; // larger invisible hover/click target
        const sparkles = SPARKLES.map(
            (s) => `<circle class="sparkle" cx="${s.x}" cy="${s.y}" r="2" style="--delay:${s.delay}s" />`
        ).join('');

        return `
            <g class="menu-node menu-node--home" data-id="home">
                <g class="sparkles">${sparkles}</g>
                <a href="${node.href}" aria-label="Home">
                    <circle class="hit-target" cx="${SPINE_X}" cy="${node.y}" r="${hitR}" />
                    ${buildIconUse(node, r, 'menu-icon--home')}
                </a>
            </g>`;
    }

    const r = 9;
    const hitR = 18;
    const top = { x: SPINE_X, y: HOME_Y - node.orbitR };
    const bottom = { x: SPINE_X, y: HOME_Y + node.orbitR };
    const arcId = `orbit-${node.id}`;
    const d = `M ${top.x} ${top.y} A ${node.orbitR} ${node.orbitR} 0 0 1 ${bottom.x} ${bottom.y}`;

    // --orbit-path duplicates the visible <path>'s "d" so the icon rides
    // exactly along the dotted line drawn below it, purely via CSS
    // (no JS/SMIL involved in the actual motion). It's stored as a custom
    // property (inert on its own) and only consumed by the :hover rule's
    // real "offset-path" — otherwise the icon would sit on the arc's start
    // point instead of its true idle spot on the spine even at rest.
    const orbitStyle = `--orbit-path: path('${d}');`;

    return `
        <g class="menu-node" data-id="${node.id}">
            <path id="${arcId}" class="orbit-path" d="${d}" />
            <a href="${node.href}" aria-label="${node.id}">
                <circle class="hit-target" cx="${SPINE_X}" cy="${node.y}" r="${hitR}" />
                ${buildIconUse(node, r, 'menu-icon--orbits', orbitStyle)}
            </a>
        </g>`;
}

function buildSvgMarkup() {
    const first = NODES[0].y;
    const last = NODES[NODES.length - 1].y;
    const spine = `<line class="spine" x1="${SPINE_X}" y1="${first}" x2="${SPINE_X}" y2="${last}" />`;
    const nodes = NODES.map(buildNode).join('');

    return `
        <svg class="menu-svg" viewBox="0 0 200 640" xmlns="${SVG_NS}">
            <defs>${buildDefs()}</defs>
            ${spine}
            ${nodes}
        </svg>`;
}

const template = document.createElement('template');
template.innerHTML = buildSvgMarkup();

class SiteMenu extends HTMLElement {
    connectedCallback() {
        if (this.childElementCount > 0) return;

        this.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('site-menu', SiteMenu);
