const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createPost,
  getPosts,
  getPost,
  addReply,
  likePost,
  pinPost,
  deletePost,
} = require("../controllers/forumController");

// Public routes
router.get("/", getPosts);
router.get("/:id", getPost);

// Protected routes
router.post("/", protect, createPost);
router.post("/:id/replies", protect, addReply);
router.post("/:id/like", protect, likePost);
router.put("/:id/pin", protect, authorize("admin"), pinPost);
router.delete("/:id", protect, deletePost);

module.exports = router;
