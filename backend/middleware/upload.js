const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const docFilter = (req, file, cb) => {
  const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp','text/plain'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('File type not allowed. Use PDF, Word, image, or text files.'), false);
};

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Images only (JPG, PNG, WebP, GIF).'), false);
};

const makeStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads', folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

// Wraps a multer instance so errors are returned as HTTP 400 JSON instead of crashing
const withErrorHandling = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum size is 10MB.'
      : (err.message || 'Upload failed.');
    res.status(400).json({ message });
  });
};

// For documents (PDF, Word, images, text) — 10MB
const createUpload = (folder) => ({
  single: (field) => withErrorHandling(
    multer({ storage: makeStorage(folder), fileFilter: docFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single(field)
  )
});

// For images only — 10MB
const createImageUpload = (folder) => ({
  single: (field) => withErrorHandling(
    multer({ storage: makeStorage(folder), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single(field)
  )
});

module.exports = createUpload;
module.exports.image = createImageUpload;
