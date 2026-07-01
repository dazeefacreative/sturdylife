const multer = require("multer");
const sharp  = require("sharp");
const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage so Sharp can process the buffer before saving
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only jpg, jpeg, png, and webp images are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB raw upload limit before compression
});

// Middleware that runs after multer: compresses each uploaded file with Sharp
// and writes the result to disk as a WebP. Attaches .filename to each file.
const compressImages = async (req, res, next) => {
  if (!req.files || !req.files.length) return next();
  try {
    for (const file of req.files) {
      const name     = crypto.randomBytes(16).toString("hex");
      const filename = `${name}.webp`;
      const dest     = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .resize({ width: 900, withoutEnlargement: true }) // max 900px wide, never upscale
        .webp({ quality: 82 })
        .toFile(dest);

      file.filename = filename;
      file.path     = dest;
    }
    next();
  } catch (err) {
    console.error("Image compression error:", err);
    next(err);
  }
};

// Convenience: returns [multer middleware, compressor] as an array for use in routes
upload.withCompression = (fieldName, maxCount) => [
  upload.array(fieldName, maxCount),
  compressImages,
];

module.exports = upload;
