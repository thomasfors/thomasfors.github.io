const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const express = require("express");
const multer = require("multer");

const config = require("./config");

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(config.publicDir));
app.use("/assets", express.static(path.join(config.rootDir, "assets")));
app.use(config.mediaRoute, express.static(config.mediaDir, { fallthrough: false }));

function sign(value) {
  return crypto.createHmac("sha256", config.cookieSecret).update(value).digest("hex");
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getCookie(req, name) {
  const cookies = req.headers.cookie ? req.headers.cookie.split(";") : [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function makeAuthCookie() {
  const value = "admin";
  return `${value}.${sign(value)}`;
}

function isAuthenticated(req) {
  const cookie = getCookie(req, config.cookieName);
  const [value, signature] = cookie.split(".");
  return value === "admin" && signature && safeCompare(signature, sign(value));
}

function requireAdmin(req, res, next) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }
  next();
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `gallery-${Date.now()}`;
}

function cleanFilename(value) {
  const parsed = path.parse(value);
  const base = slugify(parsed.name);
  const ext = parsed.ext.toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${base}${ext || ".jpg"}`;
}

function mediaUrl(slug, filename) {
  return `${config.mediaRoute}/galleries/${encodeURIComponent(slug)}/${encodeURIComponent(filename)}`;
}

async function ensurePaths() {
  await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
  await fs.mkdir(path.join(config.mediaDir, "galleries"), { recursive: true });
}

async function readGalleries() {
  await ensurePaths();
  try {
    const raw = await fs.readFile(config.dataFile, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeGalleries(galleries) {
  await ensurePaths();
  const tmpFile = `${config.dataFile}.tmp`;
  await fs.writeFile(tmpFile, `${JSON.stringify(galleries, null, 2)}\n`);
  await fs.rename(tmpFile, config.dataFile);
}

function toPublicGallery(gallery) {
  return {
    ...gallery,
    coverUrl: gallery.coverImage ? mediaUrl(gallery.slug, gallery.coverImage) : "",
    images: gallery.images.map((image) => ({
      filename: image,
      url: mediaUrl(gallery.slug, image)
    }))
  };
}

app.get("/api/galleries", async (req, res, next) => {
  try {
    const galleries = await readGalleries();
    res.json(galleries.filter((gallery) => gallery.published !== false).map(toPublicGallery));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/session", (req, res) => {
  res.json({ loggedIn: isAuthenticated(req) });
});

app.post("/api/admin/login", (req, res) => {
  if (!safeCompare(req.body.password || "", config.adminPassword)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  res.setHeader(
    "Set-Cookie",
    `${config.cookieName}=${encodeURIComponent(makeAuthCookie())}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
  );
  res.json({ ok: true });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  res.setHeader("Set-Cookie", `${config.cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

app.get("/api/admin/galleries", requireAdmin, async (req, res, next) => {
  try {
    const galleries = await readGalleries();
    res.json(galleries.map(toPublicGallery));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/galleries", requireAdmin, async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const galleries = await readGalleries();
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let suffix = 2;
    while (galleries.some((gallery) => gallery.slug === slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const gallery = {
      title,
      slug,
      coverImage: "",
      published: true,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    galleries.unshift(gallery);
    await fs.mkdir(path.join(config.mediaDir, "galleries", slug), { recursive: true });
    await writeGalleries(galleries);
    res.status(201).json(toPublicGallery(gallery));
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/galleries/:slug", requireAdmin, async (req, res, next) => {
  try {
    const galleries = await readGalleries();
    const gallery = galleries.find((item) => item.slug === req.params.slug);
    if (!gallery) {
      res.status(404).json({ error: "Gallery not found" });
      return;
    }

    if (typeof req.body.title === "string" && req.body.title.trim()) {
      gallery.title = req.body.title.trim();
    }
    if (typeof req.body.coverImage === "string") {
      gallery.coverImage = gallery.images.includes(req.body.coverImage) ? req.body.coverImage : gallery.coverImage;
    }
    if (typeof req.body.published === "boolean") {
      gallery.published = req.body.published;
    }
    gallery.updatedAt = new Date().toISOString();

    await writeGalleries(galleries);
    res.json(toPublicGallery(gallery));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/galleries/:slug", requireAdmin, async (req, res, next) => {
  try {
    const galleries = await readGalleries();
    const index = galleries.findIndex((gallery) => gallery.slug === req.params.slug);
    if (index === -1) {
      res.status(404).json({ error: "Gallery not found" });
      return;
    }

    const [gallery] = galleries.splice(index, 1);
    await writeGalleries(galleries);
    await fs.rm(path.join(config.mediaDir, "galleries", gallery.slug), { recursive: true, force: true });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/galleries/:slug/images", requireAdmin, upload.array("images", 30), async (req, res, next) => {
  try {
    const galleries = await readGalleries();
    const gallery = galleries.find((item) => item.slug === req.params.slug);
    if (!gallery) {
      res.status(404).json({ error: "Gallery not found" });
      return;
    }

    const galleryDir = path.join(config.mediaDir, "galleries", gallery.slug);
    await fs.mkdir(galleryDir, { recursive: true });

    for (const file of req.files || []) {
      if (!file.mimetype.startsWith("image/")) continue;

      let filename = cleanFilename(file.originalname);
      let filePath = path.join(galleryDir, filename);
      let suffix = 2;
      while (gallery.images.includes(filename)) {
        const parsed = path.parse(filename);
        filename = `${parsed.name}-${suffix}${parsed.ext}`;
        filePath = path.join(galleryDir, filename);
        suffix += 1;
      }

      await fs.writeFile(filePath, file.buffer);
      gallery.images.push(filename);
      if (!gallery.coverImage) gallery.coverImage = filename;
    }

    gallery.updatedAt = new Date().toISOString();
    await writeGalleries(galleries);
    res.json(toPublicGallery(gallery));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/galleries/:slug/images/:filename", requireAdmin, async (req, res, next) => {
  try {
    const galleries = await readGalleries();
    const gallery = galleries.find((item) => item.slug === req.params.slug);
    if (!gallery) {
      res.status(404).json({ error: "Gallery not found" });
      return;
    }

    const filename = req.params.filename;
    gallery.images = gallery.images.filter((image) => image !== filename);
    if (gallery.coverImage === filename) {
      gallery.coverImage = gallery.images[0] || "";
    }

    await fs.rm(path.join(config.mediaDir, "galleries", gallery.slug, filename), { force: true });
    gallery.updatedAt = new Date().toISOString();
    await writeGalleries(galleries);
    res.json(toPublicGallery(gallery));
  } catch (error) {
    next(error);
  }
});

app.get("/gallery/:slug", (req, res) => {
  res.sendFile(path.join(config.publicDir, "gallery.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.status === 404 ? "Not found" : "Server error" });
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Thomas Fors site listening on port ${config.port}`);
  });
}

module.exports = app;
