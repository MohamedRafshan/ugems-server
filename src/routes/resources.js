const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  uploadResource,
  getResources,
  getResource,
  deleteResource,
  addComment,
  rateResource,
  downloadResource,
} = require("../controllers/resourceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
  limits: { fileSize: 52428800 }, // 50MB
});

router.post("/", protect, upload.single("file"), uploadResource);
router.get("/", getResources);
router.get("/:id", getResource);
router.delete("/:id", protect, deleteResource);
router.post("/:id/comments", protect, addComment);
router.post("/:id/rate", protect, rateResource);
router.get("/:id/download", downloadResource);

module.exports = router;
