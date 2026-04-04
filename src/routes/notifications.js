const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// Protected routes (all require authentication)
router.get("/", protect, getNotifications);
router.get("/count/unread", protect, getUnreadCount);
router.put("/:id", protect, markAsRead);
router.put("/mark-all/read", protect, markAllAsRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
