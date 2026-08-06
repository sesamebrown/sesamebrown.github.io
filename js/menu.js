const template = document.createElement('template');
template.innerHTML = `
    <a class="menu-buttons" id="about" href="about.html">o</a>
    <a class="menu-buttons" id="portfolio" href="portfolio.html">o</a>
    <a class="menu-buttons" id="home" href="index.html">O</a>
    <a class="menu-buttons" id="qualifications" href="qualifications.html">o</a>
    <a class="menu-buttons" id="service" href="service.html">o</a>
`;

class SiteMenu extends HTMLElement {
    connectedCallback() {
        if (this.childElementCount > 0) return;

        this.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('site-menu', SiteMenu);
