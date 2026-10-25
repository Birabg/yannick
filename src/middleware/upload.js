const multer = require('multer');
const sharp = require('sharp');

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    const err = new Error('Photos must be JPG, PNG or WebP.');
    err.status = 400;
    return cb(err);
  },
});

/** Multer errors become friendly 400s; the file's real format is verified with sharp. */
function singleImage(field) {
  const handler = upload.single(field);
  return (req, res, next) =>
    handler(req, res, async (err) => {
      if (err) {
        req.uploadError =
          err.code === 'LIMIT_FILE_SIZE' ? 'The photo is larger than 5 MB.' : err.message;
        return next();
      }
      if (req.file) {
        try {
          const { format } = await sharp(req.file.buffer).metadata();
          if (!['jpeg', 'png', 'webp'].includes(format)) throw new Error('bad format');
        } catch {
          req.uploadError = 'That file is not a valid JPG, PNG or WebP image.';
          req.file = undefined;
        }
      }
      return next();
    });
}

module.exports = { singleImage };
