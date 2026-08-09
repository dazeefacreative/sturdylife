-- ─────────────────────────────────────────
-- BEANIE CAPS: color instead of size
--
-- New reusable "colors" registry (name-matched against product_sizes.size,
-- not FK-linked, so it stays a suggestion list rather than a hard
-- constraint) plus widened size columns so color names fit, plus a
-- category_slug snapshot on order_items so past orders/emails still know
-- whether to say "Color" or "Size" even if the product is later
-- recategorized or deleted.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colors (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(50) UNIQUE NOT NULL,
  hex_code   VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO colors (name, hex_code) VALUES
  ('Black', '#000000'),
  ('White', '#FFFFFF'),
  ('Grey', '#808080'),
  ('Navy Blue', '#1B2A4A'),
  ('Red', '#C41E3A'),
  ('Green', '#2E5339'),
  ('Burgundy', '#6D071A'),
  ('Purple', '#6A0DAD'),
  ('Camel', '#C19A6B'),
  ('Mustard', '#E1AD01')
ON DUPLICATE KEY UPDATE hex_code = VALUES(hex_code);

ALTER TABLE product_sizes MODIFY size VARCHAR(50) NOT NULL;
ALTER TABLE cart_items    MODIFY size VARCHAR(50);
ALTER TABLE order_items   MODIFY size VARCHAR(50);
ALTER TABLE order_items   ADD COLUMN category_slug VARCHAR(100) AFTER product_image;

-- Beanie Caps products created before this change still have stock
-- recorded under old size values (S, M, L, ...). Those don't match any
-- row in `colors`, so they'd otherwise leak onto the storefront as
-- mislabeled, colorless swatches. Clear them out — the admin re-enters
-- real color stock for these products via the new color picker.
DELETE ps FROM product_sizes ps
JOIN products p        ON p.id = ps.product_id
JOIN categories cat     ON cat.id = p.category_id
LEFT JOIN colors col    ON col.name = ps.size
WHERE cat.slug = 'beanie-caps' AND col.id IS NULL;
