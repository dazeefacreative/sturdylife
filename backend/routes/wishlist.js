const express = require("express");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const router = express.Router();

router.get("/", authenticate, async (req, res) => {
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

router.post("/", authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;
    await db.query("INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)", [req.user.id, product_id]);
    res.status(201).json({ message: "Added to wishlist" });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.delete("/:productId", authenticate, async (req, res) => {
  await db.query("DELETE FROM wishlists WHERE user_id = ? AND product_id = ?", [req.user.id, req.params.productId]);
  res.json({ message: "Removed from wishlist" });
});

module.exports = router;
