-- ─────────────────────────────────────────
-- ABOUT SECTION SLIDESHOW IMAGES
-- Up to 4 images shown in "The Sturdy Edit" band on the homepage,
-- auto-rotating every few seconds. Admin can add/remove/reorder.
-- (Category tiles were simplified back to 1 image each — the existing
-- category_slideshow_images table now just holds a single row per slug.)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about_slideshow_images (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  image_url      VARCHAR(500) NOT NULL,
  display_order  INT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_about_slideshow_order ON about_slideshow_images(display_order);
