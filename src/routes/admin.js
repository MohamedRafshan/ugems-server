const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  createAnnouncement,
  getAnnouncements,
  getLeaderboard,
  getDashboardStats,
  getAnalytics,
  getAllStudents,
  toggleResourceEnable,
  toggleResourceHide,
  toggleQuizEnable,
  toggleQuizHide,
} = require("../controllers/adminController");

// Admin-only routes
router.get("/users", protect, authorize("admin"), getAllUsers);
router.get("/users/:id", protect, authorize("admin"), getUserById);
router.put("/users/:id/role", protect, authorize("admin"), updateUserRole);
router.put(
  "/users/:id/deactivate",
  protect,
  authorize("admin"),
  deactivateUser,
);

// Announcements
router.post(
  "/announcements",
  protect,
  authorize("lecturer", "admin"),
  createAnnouncement,
);
router.get("/announcements", getAnnouncements);

// Leaderboard
router.get("/leaderboard/:courseId", getLeaderboard);

// Dashboard & Analytics
router.get("/stats", protect, authorize("admin"), getDashboardStats);
router.get("/analytics", protect, authorize("admin"), getAnalytics);

// Students
router.get("/students", protect, authorize("admin"), getAllStudents);

// Resources Management
router.put(
  "/resources/:id/enable",
  protect,
  authorize("admin"),
  toggleResourceEnable,
);
router.put(
  "/resources/:id/hide",
  protect,
  authorize("admin"),
  toggleResourceHide,
);

// Quizzes Management
router.put("/quizzes/:id/enable", protect, authorize("admin"), toggleQuizEnable);
router.put("/quizzes/:id/hide", protect, authorize("admin"), toggleQuizHide);

module.exports = router;
