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
      <nav class="desktop-nav"><a href="#work">Index</a><a href="${url("about/")}">About</a></nav>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu">Index</button>
      <div class="mobile-menu" id="mobile-menu" hidden>
        <div class="mobile-menu-inner"><span class="index-label">INDEX</span>${categories}<a href="${url("about/")}">About</a></div>
      </div>`;
    const button = document.querySelector(".menu-button");
    const menu = document.querySelector("#mobile-menu");
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      button.textContent = open ? "Index" : "Close";
      menu.hidden = open;
      body.classList.toggle("menu-open", !open);
    });
  }

  function media(project, extra = "") {
    if (project.media) return `<figure class="media-block media-${project.aspect || "wide"} has-image ${extra}"><img src="${project.media}" alt="Temporary visual reference for ${project.title}" loading="lazy"><figcaption>${project.mediaCredit || "Temporary reference image"}</figcaption></figure>`;
    return `<div class="media-block media-${project.aspect || "wide"} ${extra}"><span>documentation</span></div>`;
  }

  function card(project, index) {
    return `<article class="work-card work-${index + 1}"><a class="work-link" href="${projectUrl(project.id)}">${media(project)}<div class="work-meta"><span>${String(index + 1).padStart(2, "0")}</span><span>${project.title}</span><span>${project.year}</span></div></a></article>`;
  }

  function home() {
    const works = data.projects.filter(p => p.featured);
    document.querySelector("#content").innerHTML = `
      <section class="visual-intro"><p>${data.site.intro}</p><p class="ko">${data.site.note}</p></section>
      <section class="visual-stream" id="work">${works.map(card).join("")}</section>
      <section class="quiet-about"><p>Hoyeon Choi works across sound, image, performance and computational media.<br><span class="ko">최호연은 음악, 이미지, 퍼포먼스와 컴퓨테이셔널 미디어를 오가며 작업한다.</span></p><a href="${url("about/")}">About →</a></section>`;
  }

  function category() {
    const category = data.categories.find(c => c.id === categoryId);
    const works = data.projects.filter(p => p.categories.includes(categoryId));
    document.title = `${category.label} — ${data.site.name}`;
    document.querySelector("#content").innerHTML = `<section class="archive-head"><p class="eyebrow">${category.label}</p><p>${category.description}</p></section><section class="archive-list">${works.length ? works.map(card).join("") : `<p class="empty">Projects will be added here.</p>`}</section>`;
  }

  function project() {
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return;
    document.title = `${project.title} — ${data.site.name}`;
    const cats = project.categories.map(id => data.categories.find(c => c.id === id)).filter(Boolean);
    const launch = project.launch ? `<a class="launch" href="${project.launch}" target="_blank" rel="noopener">Launch project ↗</a>` : "";
    document.querySelector("#content").innerHTML = `<article class="project-page"><header class="project-head"><div><p class="eyebrow">${project.year} · ${project.medium}</p><h1>${project.title}</h1></div><div class="project-summary"><p>${project.summary}</p>${launch}</div></header>${media(project, "project-hero-media")}<div class="project-details"><div><span>Year</span><p>${project.year}</p></div><div><span>Medium</span><p>${project.medium}</p></div><div><span>Context</span><p>${project.location}</p></div></div><nav class="project-back">${cats.map(c => `<a href="${url(c.path)}">← ${c.label}</a>`).join("")}</nav></article>`;
  }

  function about() {
    document.title = `About — ${data.site.name}`;
    document.querySelector("#content").innerHTML = `<section class="about-page"><p class="about-intro">Hoyeon Choi is a jazz guitarist and multidisciplinary artist working across sound, moving image, photography, installation and browser-based systems.</p><p class="about-intro ko">최호연은 재즈 기타 연주를 기반으로 영상, 사진, 설치와 브라우저 기반 작업을 이어가고 있다.</p><div class="about-grid"><div class="about-label">Practice</div><div><p>Improvisation, time, repetition and variation move between his musical and visual work. Current projects treat performance, image and code as connected materials rather than separate disciplines.</p><p class="ko-block">음악에서 출발한 시간성, 반복, 변주와 즉흥성에 대한 관심을 영상과 인터랙티브 작업으로 확장하고 있다.</p></div><div class="about-label">Background</div><div><p>He studied jazz guitar at the graduate level in the United States and works professionally as a performer. His audiovisual practice developed through projects combining live performance, moving image, programming, recording, filming and stage design.</p></div><div class="about-label">Work</div><div><p>Jazz guitar / audiovisual performance / installation / photography / moving image / p5.js / TouchDesigner</p></div><div class="about-label">Contact</div><div><p>Contact and professional links will be added here.</p></div></div></section>`;
  }

  function footer() { document.querySelector("#site-footer").innerHTML = `<span>© 2026 ${data.site.name}</span><a href="#top">↑</a>`; }
  header();
  if (page === "home") home();
  if (page === "category") category();
  if (page === "project") project();
  if (page === "about") about();
  footer();
})();