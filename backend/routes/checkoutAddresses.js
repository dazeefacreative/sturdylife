const express = require("express");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

const MAX_ADDRESSES = 10;

// GET /api/checkout-addresses
router.get("/", async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM checkout_addresses WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(rows);
});

// POST /api/checkout-addresses
router.post("/", async (req, res) => {
  const { first_name, last_name, phone, address_line1, address_line2, city, state, country, postal_code } = req.body;

  const [[{ count }]] = await db.query(
    "SELECT COUNT(*) AS count FROM checkout_addresses WHERE user_id = ?",
    [req.user.id]
  );
  if (count >= MAX_ADDRESSES) {
    return res.status(400).json({ error: `You can save up to ${MAX_ADDRESSES} addresses.` });
  }

  const [result] = await db.query(
    `INSERT INTO checkout_addresses
      (user_id, first_name, last_name, phone, address_line1, address_line2, city, state, country, postal_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, first_name, last_name, phone || null, address_line1, address_line2 || null, city, state, country || "Nigeria", postal_code || null]
  );
  res.status(201).json({ id: result.insertId });
});

// DELETE /api/checkout-addresses/:id
router.delete("/:id", async (req, res) => {
  await db.query(
    "DELETE FROM checkout_addresses WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id]
  );
  res.json({ message: "Deleted" });
});

module.exports = router;
