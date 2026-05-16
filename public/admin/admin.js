const loginPanel = document.querySelector("#login-panel");
const adminPanel = document.querySelector("#admin-panel");
const statusBox = document.querySelector("#admin-status");
const list = document.querySelector("#admin-gallery-list");

function translateError(message) {
  const messages = {
    "Wrong password": "Fel lösenord.",
    "Not logged in": "Du är inte inloggad.",
    "Gallery not found": "Bildserien hittades inte.",
    "Title is required": "Titel behövs.",
    "Server error": "Serverfel.",
    "Not found": "Hittades inte."
  };
  return messages[message] || message || "Något gick fel.";
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(translateError(data.error));
  }
  return data;
}

function setStatus(message) {
  statusBox.textContent = message || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function showAdmin(loggedIn) {
  loginPanel.classList.toggle("hidden", loggedIn);
  adminPanel.classList.toggle("hidden", !loggedIn);
}

function imageOptions(gallery) {
  return gallery.images.map((image) => `
    <option value="${escapeHtml(image.filename)}" ${gallery.coverImage === image.filename ? "selected" : ""}>
      ${escapeHtml(image.filename)}
    </option>
  `).join("");
}

function renderGalleries(galleries) {
  if (!galleries.length) {
    list.innerHTML = "<p class=\"empty\">Det finns inga bildserier än.</p>";
    return;
  }

  list.innerHTML = galleries.map((gallery) => `
    <article class="admin-card" data-slug="${escapeHtml(gallery.slug)}" data-title="${escapeHtml(gallery.title)}">
      <div class="admin-gallery-header">
        <div>
          <h3>${escapeHtml(gallery.title)}</h3>
          <p>${gallery.images.length} bilder</p>
        </div>
        <a class="button button--secondary" href="/gallery/${encodeURIComponent(gallery.slug)}">Öppna</a>
      </div>

      <form class="edit-gallery-form">
        <label class="form-row">
          Titel
          <input name="title" type="text" value="${escapeHtml(gallery.title)}" required>
          <span class="field-help">
            Tryck <strong>Enter för att spara</strong> eller <strong>Esc för att avbryta</strong>.
          </span>
        </label>
        <label class="form-row">
          Omslagsbild
          <select name="coverImage">
            <option value="">Ingen omslagsbild</option>
            ${imageOptions(gallery)}
          </select>
        </label>
        <label class="form-row">
          Publicerad
          <select name="published">
            <option value="true" ${gallery.published !== false ? "selected" : ""}>Ja</option>
            <option value="false" ${gallery.published === false ? "selected" : ""}>Nej</option>
          </select>
        </label>
      </form>

      <form class="upload-form">
        <label class="upload-button">
          Välj bilder
          <input name="images" type="file" accept="image/*" multiple required>
        </label>
      </form>

      <div class="admin-images">
        ${gallery.images.map((image) => `
          <div class="admin-image">
            <img src="${image.url}" alt="${escapeHtml(image.filename)}">
            <div>
              <small>${escapeHtml(image.filename)}</small>
              <button class="secondary delete-image" type="button" data-filename="${escapeHtml(image.filename)}">Ta bort</button>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="delete-gallery-zone">
        <button class="secondary delete-gallery" type="button">Ta bort bildserie</button>
      </div>
    </article>
  `).join("");

  bindGalleryActions();
}

async function loadGalleries() {
  setStatus("Laddar bildserier...");
  const galleries = await fetchJson("/api/admin/galleries");
  renderGalleries(galleries);
  setStatus("");
}

function bindGalleryActions() {
  document.querySelectorAll(".edit-gallery-form").forEach((form) => {
    async function saveGallery() {
      const card = form.closest("[data-slug]");
      const formData = new FormData(form);
      setStatus("Sparar bildserie...");
      await fetchJson(`/api/admin/galleries/${encodeURIComponent(card.dataset.slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          coverImage: formData.get("coverImage"),
          published: formData.get("published") === "true"
        })
      });
      await loadGalleries();
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveGallery();
    });

    form.querySelector("input[name=\"title\"]").addEventListener("keydown", async (event) => {
      const card = form.closest("[data-slug]");
      if (event.key === "Enter") {
        event.preventDefault();
        await saveGallery();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.currentTarget.value = card.dataset.title;
        event.currentTarget.blur();
        setStatus("Ändringen avbröts.");
      }
    });

    form.querySelector("select[name=\"coverImage\"]").addEventListener("change", async () => {
      await saveGallery();
    });

    form.querySelector("select[name=\"published\"]").addEventListener("change", async () => {
      await saveGallery();
    });
  });

  document.querySelectorAll(".upload-form").forEach((form) => {
    async function uploadSelectedFiles() {
      const card = form.closest("[data-slug]");
      const formData = new FormData(form);
      if (!formData.getAll("images").some((file) => file instanceof File && file.size > 0)) return;

      setStatus("Laddar upp bilder...");
      await fetchJson(`/api/admin/galleries/${encodeURIComponent(card.dataset.slug)}/images`, {
        method: "POST",
        body: formData
      });
      form.reset();
      await loadGalleries();
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await uploadSelectedFiles();
    });

    form.querySelector("input[type=\"file\"]").addEventListener("change", async () => {
      await uploadSelectedFiles();
    });
  });

  document.querySelectorAll(".delete-image").forEach((button) => {
    button.addEventListener("click", async () => {
      const card = button.closest("[data-slug]");
      if (!confirm(`Ta bort ${button.dataset.filename}?`)) return;
      setStatus("Tar bort bilden...");
      await fetchJson(
        `/api/admin/galleries/${encodeURIComponent(card.dataset.slug)}/images/${encodeURIComponent(button.dataset.filename)}`,
        { method: "DELETE" }
      );
      await loadGalleries();
    });
  });

  document.querySelectorAll(".delete-gallery").forEach((button) => {
    button.addEventListener("click", async () => {
      const card = button.closest("[data-slug]");
      const title = card.dataset.title;
      const confirmation = prompt(`Skriv "${title}" för att ta bort hela bildserien.`);
      if (confirmation !== title) {
        alert("Namnet matchade inte. Bildserien togs inte bort.");
        return;
      }
      setStatus("Tar bort bildserien...");
      await fetchJson(`/api/admin/galleries/${encodeURIComponent(card.dataset.slug)}`, { method: "DELETE" });
      await loadGalleries();
    });
  });
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const password = document.querySelector("#password").value;
    await fetchJson("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    showAdmin(true);
    await loadGalleries();
  } catch (error) {
    alert(error.message);
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  await fetchJson("/api/admin/logout", { method: "POST" });
  showAdmin(false);
});

document.querySelector("#create-gallery-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#new-gallery-title");
  setStatus("Skapar bildserie...");
  await fetchJson("/api/admin/galleries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: input.value })
  });
  input.value = "";
  await loadGalleries();
});

fetchJson("/api/admin/session")
  .then(async (session) => {
    showAdmin(session.loggedIn);
    if (session.loggedIn) await loadGalleries();
  })
  .catch((error) => setStatus(translateError(error.message)));
