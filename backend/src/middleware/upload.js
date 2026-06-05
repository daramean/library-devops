const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safe);
  }
});

const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/pjpeg'];
const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only PNG and JPG image files are allowed'), false);
  }
  cb(null, true);
};

module.exports = require('multer')({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
