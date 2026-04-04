const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createDiscussion,
  getDiscussions,
  getDiscussion,
  addReply,
  likeDiscussion,
  resolveDiscussion,
  deleteDiscussion,
} = require("../controllers/discussionController");

// Public routes
router.get("/", getDiscussions);
router.get("/:id", getDiscussion);

// Protected routes
router.post("/", protect, createDiscussion);
router.post("/:id/replies", protect, addReply);
router.post("/:id/like", protect, likeDiscussion);
router.put("/:id/resolve", protect, resolveDiscussion);
router.delete("/:id", protect, deleteDiscussion);

module.exports = router;
