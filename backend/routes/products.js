const express  = require("express");
const fs       = require("fs");
const path     = require("path");
const slugify  = require("slugify");
const db       = require("../config/db");
const { authenticate, adminOnly } = require("../middleware/auth");
const upload   = require("../middleware/upload");

const router = express.Router();

// ─── GET /api/products — public list ─────────────────────────
router.get("/", async (req, res) => {
  try {
    const { category, tag, search, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = "p.is_active = 1";

    if (category) { where += " AND c.slug = ?"; params.push(category); }
    if (tag)      { where += " AND p.tag = ?";  params.push(tag); }
    if (search)   { where += " AND p.name LIKE ?"; params.push(`%${search}%`); }

    const [products] = await db.query(`
      SELECT p.id, p.name, p.slug, p.price, p.tag,
             c.name AS category, c.slug AS category_slug,
             (SELECT image_url FROM product_images
              WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, Number(limit), Number(offset)]);

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where}`, params
    );

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ─── GET /api/products/:slug — single product ─────────────────
router.get("/:slug", async (req, res) => {
  try {
    const [[product]] = await db.query(`
      SELECT p.*, c.name AS category, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.slug = ? AND p.is_active = 1
    `, [req.params.slug]);

    if (!product) return res.status(404).json({ error: "Product not found" });

    const [images] = await db.query(
      "SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order",
      [product.id]
    );

    const [sizes] = await db.query(
      "SELECT size, stock_quantity FROM product_sizes WHERE product_id = ? ORDER BY id",
      [product.id]
    );

    res.json({ ...product, images, sizes });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ─── POST /api/products — admin create ───────────────────────
router.post("/", authenticate, adminOnly, upload.array("images", 8), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { name, description, price, category_id, tag, sizes } = req.body;

    const slug = slugify(name, { lower: true, strict: true });
    const [result] = await conn.query(
      "INSERT INTO products (name, slug, description, price, category_id, tag) VALUES (?, ?, ?, ?, ?, ?)",
      [name, slug, description, price, category_id || null, tag || null]
    );
    const productId = result.insertId;

    // Images
    if (req.files && req.files.length) {
      for (let i = 0; i < req.files.length; i++) {
        await conn.query(
          "INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)",
          [productId, `/uploads/${req.files[i].filename}`, i === 0 ? 1 : 0, i]
        );
      }
    }

    // Sizes e.g. sizes = [{"size":"S","stock":10},{"size":"M","stock":5}]
    if (sizes) {
      const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      for (const s of parsedSizes) {
        await conn.query(
          "INSERT INTO product_sizes (product_id, size, stock_quantity) VALUES (?, ?, ?)",
          [productId, s.size, s.stock || 0]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ id: productId, slug, message: "Product created" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  } finally {
    conn.release();
  }
});

// ─── PUT /api/products/:id — admin update ────────────────────
router.put("/:id", authenticate, adminOnly, upload.array("images", 8), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { name, description, price, category_id, tag, is_active, sizes } = req.body;
    const slug = name ? slugify(name, { lower: true, strict: true }) : undefined;

    await conn.query(
      `UPDATE products SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        category_id = COALESCE(?, category_id),
        tag = ?,
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, slug, description, price, category_id, tag || null, is_active, req.params.id]
    );

    if (req.files && req.files.length) {
      // Get next display order
      const [[{ maxOrder }]] = await conn.query(
        "SELECT COALESCE(MAX(display_order), -1) AS maxOrder FROM product_images WHERE product_id = ?",
        [req.params.id]
      );
      for (let i = 0; i < req.files.length; i++) {
        await conn.query(
          "INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, 0, ?)",
          [req.params.id, `/uploads/${req.files[i].filename}`, maxOrder + i + 1]
        );
      }
    }

    if (sizes) {
      const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      for (const s of parsedSizes) {
        await conn.query(
          `INSERT INTO product_sizes (product_id, size, stock_quantity) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE stock_quantity = ?`,
          [req.params.id, s.size, s.stock, s.stock]
        );
      }
    }

    await conn.commit();
    res.json({ message: "Product updated" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: "Failed to update product" });
  } finally {
    conn.release();
  }
});

// ─── DELETE /api/products/:productId/images/:imageId — admin remove one image ──
router.delete("/:productId/images/:imageId", authenticate, adminOnly, async (req, res) => {
  try {
    const [[image]] = await db.query(
      "SELECT * FROM product_images WHERE id = ? AND product_id = ?",
      [req.params.imageId, req.params.productId]
    );
    if (!image) return res.status(404).json({ error: "Image not found" });

    await db.query("DELETE FROM product_images WHERE id = ?", [image.id]);

    const filePath = path.join(__dirname, "..", image.image_url);
    fs.unlink(filePath, () => {}); // best-effort, don't fail the request if missing

    if (image.is_primary) {
      const [[next]] = await db.query(
        "SELECT id FROM product_images WHERE product_id = ? ORDER BY display_order LIMIT 1",
        [req.params.productId]
      );
      if (next) {
        await db.query("UPDATE product_images SET is_primary = 1 WHERE id = ?", [next.id]);
      }
    }

    res.json({ message: "Image removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove image" });
  }
});

// ─── DELETE /api/products/:id — admin soft delete ────────────
router.delete("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    await db.query("UPDATE products SET is_active = 0 WHERE id = ?", [req.params.id]);
    res.json({ message: "Product deactivated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
