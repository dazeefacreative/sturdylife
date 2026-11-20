// ────────────────────────────────────────────────────────────
// categories.js
// ────────────────────────────────────────────────────────────
const express = require("express");
const db = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const categoriesRouter = express.Router();

categoriesRouter.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM categories ORDER BY name");
  res.json(rows);
});

categoriesRouter.post("/", authenticate, adminOnly, async (req, res) => {
  try {
    const { name, slug, subtitle, image_url } = req.body;
    const [r] = await db.query(
      "INSERT INTO categories (name, slug, subtitle, image_url) VALUES (?,?,?,?)",
      [name, slug, subtitle, image_url]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

module.exports = { categoriesRouter };


// ────────────────────────────────────────────────────────────
// cart.js
// ────────────────────────────────────────────────────────────
const cartRouter = express.Router();

// GET /api/cart
cartRouter.get("/", authenticate, async (req, res) => {
  const [items] = await db.query(`
    SELECT ci.id, ci.quantity, ci.size,
           p.id AS product_id, p.name, p.slug, p.price,
           (SELECT image_url FROM product_images
            WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `, [req.user.id]);
  res.json(items);
});

// POST /api/cart  { product_id, size, quantity }
cartRouter.post("/", authenticate, async (req, res) => {
  try {
    const { product_id, size, quantity = 1 } = req.body;
    await db.query(
      `INSERT INTO cart_items (user_id, product_id, size, quantity)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [req.user.id, product_id, size, quantity, quantity]
    );
    res.status(201).json({ message: "Added to cart" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// PUT /api/cart/:id  { quantity }
cartRouter.put("/:id", authenticate, async (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) {
    await db.query("DELETE FROM cart_items WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    return res.json({ message: "Removed" });
  }
  await db.query(
    "UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?",
    [quantity, req.params.id, req.user.id]
  );
  res.json({ message: "Updated" });
});

// DELETE /api/cart/:id
cartRouter.delete("/:id", authenticate, async (req, res) => {
  await db.query("DELETE FROM cart_items WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  res.json({ message: "Removed" });
});

// DELETE /api/cart  (clear whole cart)
cartRouter.delete("/", authenticate, async (req, res) => {
  await db.query("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);
  res.json({ message: "Cart cleared" });
});

module.exports = { cartRouter };


// ────────────────────────────────────────────────────────────
// wishlist.js
// ────────────────────────────────────────────────────────────
const wishlistRouter = express.Router();

wishlistRouter.get("/", authenticate, async (req, res) => {
  const [items] = await db.query(`
    SELECT w.id, p.id AS product_id, p.name, p.slug, p.price, p.tag,
           (SELECT image_url FROM product_images
            WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
    FROM wishlists w
    JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ?
  `, [req.user.id]);
  res.json(items);
});

wishlistRouter.post("/", authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;
    await db.query(
      "INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)",
      [req.user.id, product_id]
    );
    res.status(201).json({ message: "Added to wishlist" });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

wishlistRouter.delete("/:productId", authenticate, async (req, res) => {
  await db.query(
    "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?",
    [req.user.id, req.params.productId]
  );
  res.json({ message: "Removed from wishlist" });
});

module.exports = { wishlistRouter };


// ────────────────────────────────────────────────────────────
// newsletter.js
// ────────────────────────────────────────────────────────────
const newsletterRouter = express.Router();

newsletterRouter.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    await db.query(
      "INSERT INTO newsletter_subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE is_active = 1",
      [email.toLowerCase()]
    );
    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Subscription failed" });
  }
});

module.exports = { newsletterRouter };
