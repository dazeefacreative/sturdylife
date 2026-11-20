-- ─────────────────────────────────────────
-- SITE SETTINGS (key/value store — hero video, etc.)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  setting_key   VARCHAR(100) UNIQUE NOT NULL,
  setting_value VARCHAR(500),
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- CATEGORY SLIDESHOW IMAGES
-- 3 images per category (hoodies, beanie-caps, shirts) shown on the
-- homepage "Shop by Category" tiles, auto-rotating every few seconds.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS category_slideshow_images (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  category_slug  VARCHAR(100) NOT NULL,
  image_url      VARCHAR(500) NOT NULL,
  display_order  INT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_slideshow_slug ON category_slideshow_images(category_slug);
