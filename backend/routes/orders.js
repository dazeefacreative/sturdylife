const express = require("express");
const db = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const router = express.Router();

// ─── GET /api/orders — my orders ─────────────────────────────
router.get("/", authenticate, async (req, res) => {
  const [orders] = await db.query(
    `SELECT id, order_number, total, status, created_at, paid_at
     FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(orders);
});

// ─── GET /api/orders/:orderNumber — single order ─────────────
router.get("/:orderNumber", authenticate, async (req, res) => {
  const [[order]] = await db.query(
    "SELECT * FROM orders WHERE order_number = ? AND user_id = ?",
    [req.params.orderNumber, req.user.id]
  );
  if (!order) return res.status(404).json({ error: "Order not found" });

  const [items] = await db.query(
    "SELECT * FROM order_items WHERE order_id = ?",
    [order.id]
  );
  res.json({ ...order, items });
});

module.exports = router;
