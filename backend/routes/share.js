const express = require("express");
const db = require("../config/db");

const router = express.Router();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function getFrontendUrl() {
  const configuredUrl = process.env.APP_URL
    || process.env.FRONTEND_URL?.split(",").find((url) => url.trim().startsWith("https://"))
    || process.env.FRONTEND_URL?.split(",")[0]
    || "http://localhost:5173";

  return configuredUrl.trim().replace(/\/+$/, "");
}

router.get("/product/:slug", async (req, res) => {
  try {
    const [[product]] = await db.query(`
      SELECT p.id, p.name, p.slug, p.description, p.price,
             (SELECT image_url FROM product_images
              WHERE product_id = p.id
              ORDER BY is_primary DESC, display_order ASC
              LIMIT 1) AS image_url
      FROM products p
      WHERE p.slug = ? AND p.is_active = 1
    `, [req.params.slug]);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const frontendUrl = getFrontendUrl();
    const productUrl = `${frontendUrl}/product/${encodeURIComponent(product.slug)}`;
    const apiUrl = (process.env.API_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
    const imageUrl = product.image_url
      ? new URL(product.image_url, `${apiUrl}/`).href
      : new URL("/og-image.jpg", `${frontendUrl}/`).href;
    const title = `${product.name} - Sturdy Life`;
    const description = product.description || `Shop the ${product.name} at Sturdy Life.`;
    const isSocialCrawler = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|SkypeUriPreview/i
      .test(req.get("user-agent") || "");
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeUrl = escapeHtml(productUrl);
    const safeImageUrl = escapeHtml(imageUrl);

    res.set("Cache-Control", "no-store");
    res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    <link rel="canonical" href="${safeUrl}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Sturdy Life">
    <meta property="og:url" content="${safeUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${safeImageUrl}">
    <meta property="og:image:alt" content="${escapeHtml(product.name)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${safeImageUrl}">
    ${isSocialCrawler ? "" : `<meta http-equiv="refresh" content="0;url=${safeUrl}">`}
  </head>
  <body>
    <p>Opening <a href="${safeUrl}">${escapeHtml(product.name)}</a>…</p>
    ${isSocialCrawler ? "" : `<script>window.location.replace(${JSON.stringify(productUrl)});</script>`}
  </body>
</html>`);
  } catch (err) {
    console.error("Product share preview failed:", err);
    res.status(500).send("Unable to load product preview");
  }
});

module.exports = router;
