const multer = require("multer");
const sharp  = require("sharp");
const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only jpg, jpeg, png, and webp images are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 }, // 200KB max per image
});

// hoodies are square (1:1); beanie caps and shirts are wide banners (3:1)
const ASPECT_RULES = {
  hoodies:      { ratio: 1, label: "square (1:1)" },
  "beanie-caps": { ratio: 3, label: "wide (3:1)" },
  shirts:       { ratio: 3, label: "wide (3:1)" },
};
const TOLERANCE = 0.08;

// Middleware that runs after multer: validates every file's aspect ratio
// against the category's rule (all-or-nothing), then compresses to WebP.
const processCategoryImages = async (req, res, next) => {
  if (!req.files || !req.files.length) return next();

  const rule = ASPECT_RULES[req.params.slug];
  if (!rule) return res.status(400).json({ error: "Unknown category" });

  try {
    const metas = await Promise.all(req.files.map((f) => sharp(f.buffer).metadata()));

    for (let i = 0; i < req.files.length; i++) {
      const { width, height } = metas[i];
      const actualRatio = width / height;
      if (Math.abs(actualRatio - rule.ratio) > TOLERANCE) {
        return res.status(400).json({
          error: `Image ${i + 1} must be ${rule.label} — got ${width}x${height}.`,
        });
      }
    }

    for (const file of req.files) {
      const filename = `${crypto.randomBytes(16).toString("hex")}.webp`;
      const dest      = path.join(uploadDir, filename);

      await sharp(file.buffer).webp({ quality: 82 }).toFile(dest);

      file.filename = filename;
      file.path     = dest;
    }
    next();
  } catch (err) {
    console.error("Category image processing error:", err);
    next(err);
  }
};

// Convenience: returns [multer middleware, processor] as an array for use in routes
upload.withValidation = (fieldName, maxCount) => [
  upload.array(fieldName, maxCount),
  processCategoryImages,
];

module.exports = upload;
