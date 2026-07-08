const express = require("express");
const fs      = require("fs");
const path    = require("path");
const db      = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const uploadVideo           = require("../middleware/uploadVideo");
const uploadCategoryImages  = require("../middleware/uploadCategoryImages");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");

const CATEGORY_SLUGS = ["hoodies", "beanie-caps", "shirts"];

// ─── GET /api/settings — public: hero video + category slideshow images ──
router.get("/", async (req, res) => {
  const [settingRows] = await db.query("SELECT setting_key, setting_value FROM site_settings");
  const settings = {};
  for (const row of settingRows) settings[row.setting_key] = row.setting_value;

  const [images] = await db.query(
    "SELECT category_slug, image_url FROM category_slideshow_images ORDER BY category_slug, display_order"
  );
  const categoryImages = {};
  for (const slug of CATEGORY_SLUGS) categoryImages[slug] = [];
  for (const img of images) {
    (categoryImages[img.category_slug] ||= []).push(img.image_url);
  }

  res.json({
    hero_video_url: settings.hero_video_url || null,
    categoryImages,
  });
});

// ─── PUT /api/settings/hero-video — admin: replace hero video ────────────
router.put("/hero-video", authenticate, adminOnly, ...uploadVideo.withSave("video"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No video uploaded" });

  const [[existing]] = await db.query(
    "SELECT setting_value FROM site_settings WHERE setting_key = 'hero_video_url'"
  );
  const url = `/uploads/${req.file.filename}`;

  await db.query(
    `INSERT INTO site_settings (setting_key, setting_value) VALUES ('hero_video_url', ?)
     ON DUPLICATE KEY UPDATE setting_value = ?`,
    [url, url]
  );

  if (existing?.setting_value) {
    fs.unlink(path.join(uploadDir, path.basename(existing.setting_value)), () => {});
  }

  res.json({ hero_video_url: url });
});

// ─── PUT /api/settings/category-images/:slug — admin: replace 3 slideshow images ──
router.put(
  "/category-images/:slug",
  authenticate,
  adminOnly,
  (req, res, next) => {
    if (!CATEGORY_SLUGS.includes(req.params.slug)) return res.status(400).json({ error: "Unknown category" });
    next();
  },
  ...uploadCategoryImages.withValidation("images", 3),
  async (req, res) => {
    if (!req.files || req.files.length !== 3) {
      return res.status(400).json({ error: "Exactly 3 images are required" });
    }

    const [existing] = await db.query(
      "SELECT image_url FROM category_slideshow_images WHERE category_slug = ?",
      [req.params.slug]
    );

    await db.query("DELETE FROM category_slideshow_images WHERE category_slug = ?", [req.params.slug]);

    const urls = [];
    for (let i = 0; i < req.files.length; i++) {
      const url = `/uploads/${req.files[i].filename}`;
      urls.push(url);
      await db.query(
        "INSERT INTO category_slideshow_images (category_slug, image_url, display_order) VALUES (?, ?, ?)",
        [req.params.slug, url, i]
      );
    }

    for (const img of existing) {
      fs.unlink(path.join(uploadDir, path.basename(img.image_url)), () => {});
    }

    res.json({ images: urls });
  }
);

module.exports = router;
