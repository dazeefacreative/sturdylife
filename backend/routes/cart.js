const express = require("express");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticate, async (req, res) => {
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

router.post("/", authenticate, async (req, res) => {
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

router.put("/:id", authenticate, async (req, res) => {
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

router.delete("/:id", authenticate, async (req, res) => {
  await db.query("DELETE FROM cart_items WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  res.json({ message: "Removed" });
});

router.delete("/", authenticate, async (req, res) => {
  await db.query("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);
  res.json({ message: "Cart cleared" });
});

module.exports = router;
