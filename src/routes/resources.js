const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
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

// Configure multer for Cloudinary file uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ugems/resources",
    resource_type: "auto",
    allowed_formats: ["pdf", "doc", "docx", "txt", "ppt", "pptx"],
  },
});

const upload = multer({
  storage,
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
