const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Avatar upload configuration
const AVATAR_DIR = path.join(__dirname, "../../public/assets/avatars");

// Ensure directory exists
if (!fs.existsSync(AVATAR_DIR)) {
  try {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
    console.log("[UPLOAD] Created avatars directory:", AVATAR_DIR);
  } catch (err) {
    console.error("[UPLOAD] Failed to create avatars directory:", err);
  }
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, AVATAR_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const random = Math.random().toString(16).slice(2, 8);
    const filename = `${timestamp}_${random}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Multer configuration
const uploadConfig = {
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
};

// Create multer instance
const upload = multer(uploadConfig);

// Middleware functions
const uploadMiddleware = {
  single: (fieldName) => upload.single(fieldName),
  multiple: (fieldName, maxCount = 5) => upload.array(fieldName, maxCount),
  fields: (fields) => upload.fields(fields),

  // Custom avatar upload with error handling
  avatar: (req, res, next) => {
    const singleUpload = upload.single("avatar");

    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "File too large. Maximum size is 5MB." });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }

      // Add file info to request if uploaded
      if (req.file) {
        req.uploadedFile = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          path: req.file.path,
        };
      }

      next();
    });
  },
};

// Utility function to delete uploaded file
const deleteUploadedFile = (filename) => {
  if (!filename || filename === "default.png") return;

  const filePath = path.join(AVATAR_DIR, filename);

  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("[UPLOAD] Failed to delete file:", filename, err);
    } else {
      console.log("[UPLOAD] Deleted file:", filename);
    }
  });
};

module.exports = {
  uploadMiddleware,
  deleteUploadedFile,
  AVATAR_DIR,
};
