const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

module.exports = {
  rootDir,
  publicDir: path.join(rootDir, "public"),
  dataFile: path.join(rootDir, "server", "data", "galleries.json"),
  mediaDir: process.env.MEDIA_DIR || "/srv/thomasfors-media",
  mediaRoute: "/media",
  port: Number(process.env.PORT || 3000),
  adminPassword: process.env.ADMIN_PASSWORD || "change-me",
  cookieName: "thomasfors_admin",
  cookieSecret: process.env.COOKIE_SECRET || "change-this-cookie-secret"
};
