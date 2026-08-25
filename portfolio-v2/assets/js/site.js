(() => {
  const data = window.PORTFOLIO;
  const body = document.body;
  const page = body.dataset.page || "home";
  const root = body.dataset.root || ".";
  const categoryId = body.dataset.category;
  const projectId = body.dataset.project;

  const url = (path = "") => `${root}/${path}`.replace(/\/\.\//g, "/");
  const projectUrl = id => url(`projects/${id}/`);

  function header() {
    const categories = data.categories.map(c => `<a href="${url(c.path)}">${c.label}</a>`).join("");
    document.querySelector("#site-header").innerHTML = `
      <a class="brand" href="${url("")}">${data.site.name}</a>
      <nav class="desktop-nav">${categories}<a href="${url("about/")}">About</a></nav>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu">Menu</button>
      <div class="mobile-menu" id="mobile-menu" hidden>
        <div class="mobile-menu-inner">${categories}<a href="${url("about/")}">About</a></div>
      </div>`;

    const button = document.querySelector(".menu-button");
    const menu = document.querySelector("#mobile-menu");
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      button.textContent = open ? "Menu" : "Close";
      menu.hidden = open;
      body.classList.toggle("menu-open", !open);
    });
  }

  function media(project, extra = "") {
    return `<div class="media-block media-${project.aspect || "wide"} ${extra}" aria-label="Placeholder media for ${project.title}">
      <span>${project.status === "placeholder" ? "media / documentation" : project.medium}</span>
    </div>`;
  }

  function card(project, index) {
    return `<article class="work-card">
      <a class="work-link" href="${projectUrl(project.id)}">
        ${media(project)}
        <div class="work-meta">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <span>${project.title}</span>
          <span>${project.year}</span>
        </div>
      </a>
    </article>`;
  }

  function home() {
    const main = document.querySelector("#content");
    const sections = data.categories.map(category => {
      const works = data.projects.filter(p => p.categories.includes(category.id) && p.featured).slice(0, 2);
      return `<section class="home-category" id="${category.id}">
        <div class="section-heading">
          <h2>${category.label}</h2>
          <a href="${url(category.path)}">View all →</a>
        </div>
        <p class="section-description">${category.description}</p>
        <div class="featured-grid">${works.map(card).join("")}</div>
      </section>`;
    }).join("");

    main.innerHTML = `
      <section class="hero">
        <h1><span>Hoyeon</span><span>Choi</span></h1>
        <div class="hero-bottom">
          <p>${data.site.intro}</p>
          <p>${data.site.note}</p>
        </div>
      </section>
      <div class="discipline-index">
        ${data.categories.map((c, i) => `<a href="#${c.id}"><span>${String(i + 1).padStart(2, "0")}</span><strong>${c.label}</strong><span>↓</span></a>`).join("")}
      </div>
      ${sections}
      <section class="home-about">
        <p>Profile, biography, selected credits and contact.</p>
        <a href="${url("about/")}">About / Contact →</a>
      </section>`;
  }

  function category() {
    const category = data.categories.find(c => c.id === categoryId);
    const works = data.projects.filter(p => p.categories.includes(categoryId));
    document.title = `${category.label} — ${data.site.name}`;
    document.querySelector("#content").innerHTML = `
      <section class="archive-head">
        <p class="eyebrow">${category.label}</p>
        <h1>${category.label}</h1>
        <p>${category.description}</p>
      </section>
      <section class="archive-list">
        ${works.length ? works.map(card).join("") : `<p class="empty">Projects will be added here.</p>`}
      </section>`;
  }

  function project() {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return;
    document.title = `${project.title} — ${data.site.name}`;
    const cats = project.categories.map(id => data.categories.find(c => c.id === id)).filter(Boolean);
    const launch = project.launch ? `<a class="launch" href="${project.launch}" target="_blank" rel="noopener">Launch project ↗</a>` : "";
    document.querySelector("#content").innerHTML = `
      <article class="project-page">
        <header class="project-head">
          <div>
            <p class="eyebrow">${cats.map(c => c.label).join(" / ")}</p>
            <h1>${project.title}</h1>
          </div>
          <div class="project-summary">
            <p>${project.summary}</p>
            ${launch}
          </div>
        </header>
        ${media(project, "project-hero-media")}
        <div class="project-details">
          <div><span>Year</span><p>${project.year}</p></div>
          <div><span>Medium</span><p>${project.medium}</p></div>
          <div><span>Context</span><p>${project.location}</p></div>
        </div>
        <section class="project-copy">
          <p>Project statement and documentation will live here. This page is intentionally structured as a reusable container rather than a fixed template: image sequences, video, credits, technical notes and longer text can be added per project.</p>
        </section>
        <div class="project-media-sequence">
          ${media(project)}${media({...project, aspect: "portrait"})}
        </div>
        <nav class="project-back">${cats.map(c => `<a href="${url(c.path)}">← ${c.label}</a>`).join("")}</nav>
      </article>`;
  }

  function about() {
    document.title = `About — ${data.site.name}`;
    document.querySelector("#content").innerHTML = `
      <section class="about-page">
        <h1>About</h1>
        <div class="about-grid">
          <div class="about-label">Profile</div>
          <div><p>Hoyeon Choi<br>Musician / Media Artist / Photographer / Filmmaker</p><p>Biography and artist statement will be added here.</p></div>
          <div class="about-label">Practice</div>
          <div><p>Jazz guitar<br>Media art<br>Photography<br>Film / video<br>Interactive web work</p></div>
          <div class="about-label">Contact</div>
          <div><p>Email / Instagram / YouTube / other professional links</p></div>
          <div class="about-label">CV</div>
          <div><p>Selected performances, exhibitions, releases, commissions, awards and press.</p></div>
        </div>
      </section>`;
  }

  function footer() {
    document.querySelector("#site-footer").innerHTML = `<span>© 2026 ${data.site.name}</span><a href="#top">Top ↑</a>`;
  }

  header();
  if (page === "home") home();
  if (page === "category") category();
  if (page === "project") project();
  if (page === "about") about();
  footer();
})();
