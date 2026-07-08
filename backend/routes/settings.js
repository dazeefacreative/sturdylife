const express = require("express");
const fs      = require("fs");
const path    = require("path");
const db      = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const uploadVideo           = require("../middleware/uploadVideo");
const uploadCategoryImages  = require("../middleware/uploadCategoryImages");
const uploadImage           = require("../middleware/upload");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");

const CATEGORY_SLUGS = ["hoodies", "beanie-caps", "shirts"];
const MAX_ABOUT_IMAGES = 4;

// ─── GET /api/settings — public: hero video, category images, about slideshow ──
router.get("/", async (req, res) => {
  const [settingRows] = await db.query("SELECT setting_key, setting_value FROM site_settings");
  const settings = {};
  for (const row of settingRows) settings[row.setting_key] = row.setting_value;

  const [catRows] = await db.query(
    "SELECT category_slug, image_url FROM category_slideshow_images ORDER BY category_slug, display_order"
  );
  const categoryImages = {};
  for (const slug of CATEGORY_SLUGS) categoryImages[slug] = null;
  for (const row of catRows) categoryImages[row.category_slug] = row.image_url;

  const [aboutRows] = await db.query(
    "SELECT id, image_url FROM about_slideshow_images ORDER BY display_order"
  );

  res.json({
    hero_video_url: settings.hero_video_url || null,
    categoryImages,
    aboutImages: aboutRows,
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

// ─── PUT /api/settings/category-images/:slug — admin: replace the category image ──
router.put(
  "/category-images/:slug",
  authenticate,
  adminOnly,
  (req, res, next) => {
    if (!CATEGORY_SLUGS.includes(req.params.slug)) return res.status(400).json({ error: "Unknown category" });
    next();
  },
  ...uploadCategoryImages.withValidation("image"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "An image is required" });

    const [existing] = await db.query(
      "SELECT image_url FROM category_slideshow_images WHERE category_slug = ?",
      [req.params.slug]
    );

    await db.query("DELETE FROM category_slideshow_images WHERE category_slug = ?", [req.params.slug]);

    const url = `/uploads/${req.file.filename}`;
    await db.query(
      "INSERT INTO category_slideshow_images (category_slug, image_url, display_order) VALUES (?, ?, 0)",
      [req.params.slug, url]
    );

    for (const img of existing) {
      fs.unlink(path.join(uploadDir, path.basename(img.image_url)), () => {});
    }

    res.json({ image_url: url });
  }
);

// ─── POST /api/settings/about-images — admin: add one image (up to 4 total) ──
router.post("/about-images", authenticate, adminOnly, ...uploadImage.withCompression("image", 1), async (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ error: "An image is required" });

  const [[{ count }]] = await db.query("SELECT COUNT(*) AS count FROM about_slideshow_images");
  if (count >= MAX_ABOUT_IMAGES) {
    fs.unlink(req.files[0].path, () => {});
    return res.status(400).json({ error: `You can upload up to ${MAX_ABOUT_IMAGES} images. Remove one first.` });
  }

  const [[{ maxOrder }]] = await db.query(
    "SELECT COALESCE(MAX(display_order), -1) AS maxOrder FROM about_slideshow_images"
  );
  const url = `/uploads/${req.files[0].filename}`;
  const [result] = await db.query(
    "INSERT INTO about_slideshow_images (image_url, display_order) VALUES (?, ?)",
    [url, maxOrder + 1]
  );

  res.status(201).json({ id: result.insertId, image_url: url });
});

// ─── DELETE /api/settings/about-images/:id — admin: remove one image ─────
router.delete("/about-images/:id", authenticate, adminOnly, async (req, res) => {
  const [[image]] = await db.query("SELECT image_url FROM about_slideshow_images WHERE id = ?", [req.params.id]);
  if (!image) return res.status(404).json({ error: "Not found" });

  await db.query("DELETE FROM about_slideshow_images WHERE id = ?", [req.params.id]);
  fs.unlink(path.join(uploadDir, path.basename(image.image_url)), () => {});

  res.json({ message: "Deleted" });
});

// ─── PUT /api/settings/about-images/reorder — admin: reorder images ──────
router.put("/about-images/reorder", authenticate, adminOnly, async (req, res) => {
  const { order } = req.body; // array of image ids in the new display order
  if (!Array.isArray(order) || !order.length) return res.status(400).json({ error: "Invalid order" });

  for (let i = 0; i < order.length; i++) {
    await db.query("UPDATE about_slideshow_images SET display_order = ? WHERE id = ?", [i, order[i]]);
  }

  res.json({ message: "Reordered" });
});

module.exports = router;
