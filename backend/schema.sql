-- ============================================================
-- STURDY LIFE — Full Database Schema
-- Run this in cPanel > phpMyAdmin or MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS sturdy_life CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sturdy_life;

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          ENUM('customer', 'admin') DEFAULT 'customer',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE categories (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  subtitle    VARCHAR(200),
  image_url   VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug, subtitle) VALUES
  ('Hoodies', 'hoodies', 'Essential comfort'),
  ('Beanie Caps', 'beanie-caps', 'All-season warmth'),
  ('Shirts', 'shirts', 'Elevated essentials');

-- ─────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE products (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  name           VARCHAR(255) NOT NULL,
  slug           VARCHAR(255) UNIQUE NOT NULL,
  description    TEXT,
  price          DECIMAL(10,2) NOT NULL,
  category_id    INT,
  tag            ENUM('New', 'Limited', 'Bestseller', 'Sale') NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- PRODUCT IMAGES
-- ─────────────────────────────────────────
CREATE TABLE product_images (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  product_id    INT NOT NULL,
  image_url     VARCHAR(500) NOT NULL,
  is_primary    BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- PRODUCT SIZES (stock per size)
-- ─────────────────────────────────────────
CREATE TABLE product_sizes (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  product_id     INT NOT NULL,
  size           VARCHAR(10) NOT NULL,   -- XS, S, M, L, XL, XXL | 30, 32, 34…
  stock_quantity INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_size (product_id, size)
);

-- ─────────────────────────────────────────
-- CART ITEMS (persisted for logged-in users)
-- ─────────────────────────────────────────
CREATE TABLE cart_items (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  size        VARCHAR(10),
  quantity    INT DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (user_id, product_id, size)
);

-- ─────────────────────────────────────────
-- WISHLIST
-- ─────────────────────────────────────────
CREATE TABLE wishlists (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wishlist (user_id, product_id)
);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
CREATE TABLE orders (
  id                     INT PRIMARY KEY AUTO_INCREMENT,
  order_number           VARCHAR(20) UNIQUE NOT NULL,
  user_id                INT,               -- NULL for guest checkout
  email                  VARCHAR(255) NOT NULL,
  first_name             VARCHAR(100),
  last_name              VARCHAR(100),
  phone                  VARCHAR(20),
  address_line1          VARCHAR(255),
  address_line2          VARCHAR(255),
  city                   VARCHAR(100),
  state                  VARCHAR(100),
  country                VARCHAR(100) DEFAULT 'Nigeria',
  postal_code            VARCHAR(20),
  subtotal               DECIMAL(10,2) NOT NULL,
  shipping_fee           DECIMAL(10,2) DEFAULT 0.00,
  total                  DECIMAL(10,2) NOT NULL,
  status                 ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
  paystack_reference     VARCHAR(255),
  paystack_transaction_id VARCHAR(255),
  paid_at                TIMESTAMP NULL,
  notes                  TEXT,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- ORDER ITEMS (snapshot of product at purchase)
-- ─────────────────────────────────────────
CREATE TABLE order_items (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  order_id      INT NOT NULL,
  product_id    INT,
  product_name  VARCHAR(255) NOT NULL,   -- snapshot — survives product edits
  product_image VARCHAR(500),
  price         DECIMAL(10,2) NOT NULL,  -- snapshot price
  size          VARCHAR(10),
  quantity      INT NOT NULL,
  subtotal      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- NEWSLETTER SUBSCRIBERS
-- ─────────────────────────────────────────
CREATE TABLE newsletter_subscribers (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  email          VARCHAR(255) UNIQUE NOT NULL,
  is_active      BOOLEAN DEFAULT TRUE,
  subscribed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- SAVED CHECKOUT ADDRESSES
-- Linked to a user account. Up to 10 per user.
-- Used to auto-fill checkout for returning customers
-- or when purchasing for someone else (different name/address).
-- ─────────────────────────────────────────
CREATE TABLE checkout_addresses (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  user_id       INT NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(20),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  country       VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
  postal_code   VARCHAR(20),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- SITE SETTINGS (key/value store — hero video, etc.)
-- ─────────────────────────────────────────
CREATE TABLE site_settings (
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
CREATE TABLE category_slideshow_images (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  category_slug  VARCHAR(100) NOT NULL,
  image_url      VARCHAR(500) NOT NULL,
  display_order  INT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- ABOUT SECTION SLIDESHOW IMAGES
-- Up to 4 images shown in "The Sturdy Edit" band on the homepage,
-- auto-rotating every few seconds. Admin can add/remove/reorder.
-- ─────────────────────────────────────────
CREATE TABLE about_slideshow_images (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  image_url      VARCHAR(500) NOT NULL,
  display_order  INT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────
CREATE INDEX idx_products_category      ON products(category_id);
CREATE INDEX idx_products_active        ON products(is_active);
CREATE INDEX idx_orders_user            ON orders(user_id);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_orders_reference       ON orders(paystack_reference);
CREATE INDEX idx_order_items_order      ON order_items(order_id);
CREATE INDEX idx_checkout_addr_user     ON checkout_addresses(user_id);
CREATE INDEX idx_category_slideshow_slug ON category_slideshow_images(category_slug);
CREATE INDEX idx_about_slideshow_order   ON about_slideshow_images(display_order);
