const express = require("express");
const db = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const router = express.Router();

// All admin routes require auth + admin role
router.use(authenticate, adminOnly);

// ─── GET /api/admin/stats ─────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [[revenue]]   = await db.query("SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status = 'paid'");
    const [[orders]]    = await db.query("SELECT COUNT(*) AS count FROM orders");
    const [[customers]] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'");
    const [[products]]  = await db.query("SELECT COUNT(*) AS count FROM products WHERE is_active = 1");

    // Recent orders
    const [recentOrders] = await db.query(`
      SELECT order_number, first_name, last_name, email, total, status, created_at
      FROM orders ORDER BY created_at DESC LIMIT 10
    `);

    // Revenue by month (last 6 months)
    const [monthlyRevenue] = await db.query(`
      SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month,
             SUM(total) AS revenue,
             COUNT(*) AS order_count
      FROM orders
      WHERE status = 'paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `);

    res.json({
      revenue: revenue.total,
      orders: orders.count,
      customers: customers.count,
      products: products.count,
      recentOrders,
      monthlyRevenue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stats fetch failed" });
  }
});

// ─── GET /api/admin/orders ────────────────────────────────────
router.get("/orders", async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = "1=1";
  const params = [];
  if (status) { where += " AND status = ?"; params.push(status); }

  const [orders] = await db.query(
    `SELECT * FROM orders WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM orders WHERE ${where}`, params);
  res.json({ orders, total, page: Number(page) });
});

// ─── GET /api/admin/orders/:id ────────────────────────────────
router.get("/orders/:id", async (req, res) => {
  const [[order]] = await db.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  if (!order) return res.status(404).json({ error: "Not found" });
  const [items] = await db.query("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
  res.json({ ...order, items });
});

// ─── PUT /api/admin/orders/:id/status ────────────────────────
router.put("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending","paid","processing","shipped","delivered","cancelled","refunded"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
  await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
  res.json({ message: "Status updated" });
});

// ─── GET /api/admin/customers ─────────────────────────────────
router.get("/customers", async (req, res) => {
  const [rows] = await db.query(`
    SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.created_at,
           COUNT(o.id) AS order_count,
           COALESCE(SUM(o.total), 0) AS total_spent
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid'
    WHERE u.role = 'customer'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  res.json(rows);
});

// ─── GET /api/admin/newsletter ────────────────────────────────
router.get("/newsletter", async (req, res) => {
  const [rows] = await db.query(
    "SELECT email, subscribed_at FROM newsletter_subscribers WHERE is_active = 1 ORDER BY subscribed_at DESC"
  );
  res.json(rows);
});

module.exports = router;
