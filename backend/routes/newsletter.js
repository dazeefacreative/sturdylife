const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.post("/subscribe", async (req, res) => {
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

module.exports = router;
