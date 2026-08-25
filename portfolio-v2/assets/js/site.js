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
          <p class="ko">${data.site.note}</p>
        </div>
      </section>
      <div class="discipline-index">
        ${data.categories.map((c, i) => `<a href="#${c.id}"><span>${String(i + 1).padStart(2, "0")}</span><strong>${c.label}</strong><span>↓</span></a>`).join("")}
      </div>
      ${sections}
      <section class="home-about">
        <p>Jazz guitarist and multidisciplinary artist working between performance, image, sound and interactive systems.</p>
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
          <p>Project statement and documentation will be added here as the archive develops. Each project page can combine still images, video, credits, technical notes and longer writing without forcing every work into the same presentation format.</p>
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
          <div>
            <p>Hoyeon Choi is a jazz guitarist, media artist, photographer and filmmaker. His practice began in music and gradually expanded into moving image, photography, installation and browser-based interactive work.</p>
            <p class="ko-block">최호연은 재즈 기타 연주를 기반으로 활동하며, 작업 영역을 영상, 사진, 설치미술, 브라우저 기반 인터랙티브 작업으로 확장해 왔다.</p>
            <p>He studied jazz guitar at the graduate level in the United States and has worked professionally as a performer while developing visual and audiovisual projects alongside his music practice.</p>
          </div>

          <div class="about-label">Practice</div>
          <div>
            <p>Music remains the center of the practice: improvisation, ensemble interaction and the physical experience of performance. Visual work often grows from the same interest in time, repetition, variation and the relationship between structured systems and unpredictable events.</p>
            <p class="ko-block">음악에서 출발한 시간성, 반복, 변주, 즉흥성에 대한 관심은 영상과 인터랙티브 작업에서도 중요한 방법론으로 이어진다.</p>
          </div>

          <div class="about-label">Media Art</div>
          <div>
            <p>His early media-art work developed through an audiovisual project with prepared piano, combining live performance, moving image, programming, recording, filming and stage design. More recent work explores TouchDesigner, p5.js and web-based systems as artistic media rather than simply presentation tools.</p>
            <p class="ko-block">라이브 연주, 영상, 프로그래밍, 촬영과 무대 구성을 하나의 시스템으로 다루는 작업에서 출발해 TouchDesigner와 p5.js, 웹 환경을 작품의 매체로 확장하고 있다.</p>
          </div>

          <div class="about-label">Photography / Film</div>
          <div>
            <p>Alongside personal work, he works with portrait photography, artist profiles, performance documentation and moving-image production. The visual approach tends toward restrained direction, available atmosphere and images that preserve a sense of the person or event rather than over-staging it.</p>
            <p class="ko-block">인물 프로필, 아티스트 사진, 공연 기록과 영상 촬영을 병행하며, 과도한 연출보다 인물과 현장의 분위기를 남기는 방식을 선호한다.</p>
          </div>

          <div class="about-label">Current Direction</div>
          <div>
            <p>Current projects move freely between music, image and code. Rather than treating these as separate professions, this portfolio presents them as connected parts of one practice: listening, observing, recording, manipulating and performing.</p>
            <p class="ko-block">음악, 이미지, 코드를 서로 다른 직업군으로 분리하기보다 듣고, 보고, 기록하고, 변형하고, 수행하는 하나의 작업 과정으로 다룬다.</p>
          </div>

          <div class="about-label">Fields</div>
          <div><p>Jazz guitar / Improvisation<br>Media art / Installation / Audiovisual performance<br>Photography / Portrait / Artist profile<br>Film / Performance documentation / Moving image<br>Interactive web / p5.js / TouchDesigner</p></div>

          <div class="about-label">Contact</div>
          <div><p>Email, Instagram, YouTube and professional links will be added here.</p></div>

          <div class="about-label">CV</div>
          <div><p>Selected performances, exhibitions, releases, commissions, collaborations and press will be added as the portfolio archive is completed.</p></div>
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
