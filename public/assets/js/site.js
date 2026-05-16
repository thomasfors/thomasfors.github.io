async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function fallbackImage(image) {
  image.addEventListener("error", () => {
    image.removeAttribute("src");
    image.alt = "Image file is not available yet";
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function gallerySlugFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[0] === "gallery" ? decodeURIComponent(parts[1] || "") : "";
}

function setupLandingReveal() {
  const page = document.querySelector(".landing-page");
  const hero = document.querySelector(".landing-hero");
  const title = document.querySelector(".textLogo--frontpage");
  const galleries = document.querySelector(".landing-galleries");
  if (!page || !hero || !title || !galleries) return;

  function reveal() {
    if (page.classList.contains("is-revealed")) return;
    page.classList.add("is-revealed");
    galleries.setAttribute("aria-hidden", "false");
  }

  hero.addEventListener("pointerdown", reveal);
  hero.addEventListener("mousedown", reveal);
  title.addEventListener("click", reveal);
  title.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      reveal();
    }
  });
}

async function renderHome() {
  const target = document.querySelector("#gallery-list");
  if (!target) return;

  target.innerHTML = "<li class=\"block legacy-message\">Loading galleries...</li>";
  const galleries = await fetchJson("/api/galleries");

  if (!galleries.length) {
    target.innerHTML = "<li class=\"block legacy-message\">No galleries yet.</li>";
    return;
  }

  target.innerHTML = galleries.map((gallery) => `
    <li class="block">
      <div class="postArticle-wrapper">
        <article class="postArticle postArticle--short">
          <a href="/gallery/${encodeURIComponent(gallery.slug)}">
            <div
              class="postArticle-image desaturate grayscale"
              role="img"
              aria-label="${escapeHtml(gallery.title)}"
              style="background-image:url('${gallery.coverUrl}')"
            ></div>
          </a>
          <a class="postArticle-title" href="/gallery/${encodeURIComponent(gallery.slug)}">${escapeHtml(gallery.title)}</a>
        </article>
      </div>
    </li>
  `).join("");
}

async function renderGallery() {
  const target = document.querySelector("#slideshow");
  if (!target) return;

  target.innerHTML = "<p class=\"legacy-message\">Loading images...</p>";
  const galleries = await fetchJson("/api/galleries");
  const gallery = galleries.find((item) => item.slug === gallerySlugFromPath());

  if (!gallery) {
    document.querySelector("#gallery-title").textContent = "Gallery not found";
    target.innerHTML = "<p class=\"legacy-message\">This gallery does not exist.</p>";
    return;
  }

  document.title = `${gallery.title} - Thomas Fors`;
  document.querySelector("#gallery-title").textContent = gallery.title;
  renderGalleryNav(galleries, gallery.slug);

  if (!gallery.images.length) {
    target.innerHTML = "<p class=\"legacy-message\">No images in this gallery yet.</p>";
    return;
  }

  target.innerHTML = `
    <p>
      ${gallery.images.map((image, index) => `
        <img
          class="gallery-slide ${index === 0 ? "is-active" : ""}"
          src="${image.url}"
          alt="${escapeHtml(image.filename)}"
          data-index="${index}"
        >
      `).join("")}
    </p>
  `;

  target.querySelectorAll("img").forEach(fallbackImage);
  setupSlideshow();
  setupLightbox();
}

function renderGalleryNav(galleries, activeSlug) {
  const target = document.querySelector("#gallery-nav");
  if (!target) return;

  target.innerHTML = galleries.map((gallery) => `
    <li>
      <a class="sidebar-nav-item ${gallery.slug === activeSlug ? "active" : ""}" href="/gallery/${encodeURIComponent(gallery.slug)}">
        <span class="sidebar-recentPosts-image-wrapper">
          <img src="${gallery.coverUrl}" alt="${escapeHtml(gallery.title)}">
        </span>
        ${escapeHtml(gallery.title)}
      </a>
    </li>
  `).join("");

  target.querySelectorAll("img").forEach(fallbackImage);
}

function setupSlideshow() {
  const slides = Array.from(document.querySelectorAll(".gallery-slide"));
  const previous = document.querySelector("#previous");
  const next = document.querySelector("#next");
  if (!slides.length || !previous || !next) return;

  let current = 0;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === current);
    });
  }

  previous.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });
}

function setupLightbox() {
  const lightbox = document.querySelector("#lightbox");
  const image = document.querySelector("#lightbox-image");
  const close = document.querySelector("#lightbox-close");
  if (!lightbox || !image || !close) return;

  document.querySelectorAll(".gallery-slide").forEach((slide) => {
    slide.addEventListener("click", () => {
      image.src = slide.src;
      image.alt = slide.alt;
      lightbox.showModal();
    });
  });

  close.addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
}

renderHome().catch((error) => {
  const target = document.querySelector("#gallery-list");
  if (target) target.innerHTML = `<p class="empty">${error.message}</p>`;
});

setupLandingReveal();

renderGallery().catch((error) => {
  const target = document.querySelector("#slideshow");
  if (target) target.innerHTML = `<p class="empty">${error.message}</p>`;
});
