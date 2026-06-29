const express = require("express");
const crypto  = require("crypto");
const axios   = require("axios");
const db      = require("../config/db");
const { authenticate, optionalAuth } = require("../middleware/auth");

const router = express.Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const paystackHeaders = { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" };

// Helper — generate unique order number
const makeOrderNumber = () => {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SL-${ts}-${rand}`;
};

// ─── POST /api/payment/initialize ────────────────────────────
// Creates an order record and returns a Paystack authorization URL
router.post("/initialize", optionalAuth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      email, first_name, last_name, phone,
      address_line1, address_line2, city, state, country, postal_code,
      items,   // [{ product_id, size, quantity }]
    } = req.body;

    if (!items || !items.length) return res.status(400).json({ error: "Cart is empty" });

    // Fetch real prices from DB (never trust client-side prices)
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const [[product]] = await conn.query(
        `SELECT p.id, p.name, p.price,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
         FROM products p WHERE p.id = ? AND p.is_active = 1`,
        [item.product_id]
      );
      if (!product) {
        await conn.rollback();
        return res.status(400).json({ error: `Product ${item.product_id} not found or unavailable` });
      }
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        price: product.price,
        size: item.size,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    const shipping_fee = subtotal >= 250000 ? 0 : 15; // free shipping over ₦250
    const total = subtotal + shipping_fee;
    const order_number = makeOrderNumber();

    // Create the order as 'pending'
    const [orderResult] = await conn.query(
      `INSERT INTO orders
        (order_number, user_id, email, first_name, last_name, phone,
         address_line1, address_line2, city, state, country, postal_code,
         subtotal, shipping_fee, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        order_number,
        req.user?.id || null,
        email, first_name, last_name, phone,
        address_line1, address_line2 || null, city, state, country || "Nigeria", postal_code || null,
        subtotal, shipping_fee, total,
      ]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (const oi of orderItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, oi.product_id, oi.product_name, oi.product_image, oi.price, oi.size, oi.quantity, oi.subtotal]
      );
    }

    // Initialize Paystack transaction
    const amountKobo = Math.round(total * 100); // Paystack uses smallest currency unit
    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amountKobo,
        currency: "NGN",  // or USD depending on your Paystack account
        reference: order_number,
        metadata: {
          order_id: orderId,
          order_number,
          first_name,
          last_name,
          custom_fields: [
            { display_name: "Order Number", variable_name: "order_number", value: order_number },
          ],
        },
        callback_url: `${process.env.FRONTEND_URL}/payment/success?ref=${order_number}`,
      },
      { headers: paystackHeaders }
    );

    // Save the Paystack reference
    await conn.query(
      "UPDATE orders SET paystack_reference = ? WHERE id = ?",
      [order_number, orderId]
    );

    await conn.commit();

    res.json({
      payment_url: paystackRes.data.data.authorization_url,
      reference: order_number,
      order_id: orderId,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Payment initialize error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment initialization failed" });
  } finally {
    conn.release();
  }
});

// ─── GET /api/payment/verify/:reference ──────────────────────
// Called by frontend after Paystack redirect to confirm payment
router.get("/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    // Check local order status first
    const [[order]] = await db.query(
      "SELECT * FROM orders WHERE paystack_reference = ? OR order_number = ?",
      [reference, reference]
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status === "paid") return res.json({ status: "paid", order });

    // Verify with Paystack
    const psRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: paystackHeaders }
    );

    const txn = psRes.data.data;
    if (txn.status === "success") {
      await db.query(
        `UPDATE orders SET status = 'paid', paystack_transaction_id = ?, paid_at = NOW()
         WHERE id = ?`,
        [txn.id, order.id]
      );

      // Clear cart if user is logged in
      if (order.user_id) {
        await db.query("DELETE FROM cart_items WHERE user_id = ?", [order.user_id]);
      }

      return res.json({ status: "paid", order: { ...order, status: "paid" } });
    }

    res.json({ status: txn.status, order });
  } catch (err) {
    console.error("Verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ─── POST /api/payment/webhook ───────────────────────────────
// Paystack calls this automatically for every payment event
// Body is already raw (registered before express.json() in server.js)
router.post("/webhook", async (req, res) => {
  try {
    // Validate signature
    const signature = req.headers["x-paystack-signature"];
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(req.body)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).send("Unauthorized");
    }

    const event = JSON.parse(req.body);

    if (event.event === "charge.success") {
      const { reference, id: txnId } = event.data;
      await db.query(
        `UPDATE orders
         SET status = 'paid', paystack_transaction_id = ?, paid_at = NOW()
         WHERE (paystack_reference = ? OR order_number = ?) AND status = 'pending'`,
        [txnId, reference, reference]
      );

      // Also clear cart for the user
      const [[order]] = await db.query(
        "SELECT user_id FROM orders WHERE order_number = ?", [reference]
      );
      if (order?.user_id) {
        await db.query("DELETE FROM cart_items WHERE user_id = ?", [order.user_id]);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(200); // always 200 to Paystack
  }
});

module.exports = router;
