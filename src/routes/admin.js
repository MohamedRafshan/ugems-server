const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  activateUser,
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

// User Management routes (Super Admin Only)
router.get("/users", protect, authorize("admin:super"), getAllUsers);
router.get("/users/:id", protect, authorize("admin:super"), getUserById);
router.put("/users/:id/role", protect, authorize("admin:super"), updateUserRole);
router.put(
  "/users/:id/deactivate",
  protect,
  authorize("admin:super"),
  deactivateUser,
);
router.put(
  "/users/:id/activate",
  protect,
  authorize("admin:super"),
  activateUser,
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

// Dashboard & Analytics (Super Admin Only)
router.get("/stats", protect, authorize("admin:super"), getDashboardStats);
router.get("/analytics", protect, authorize("admin:super"), getAnalytics);

// Students (Super Admin Only)
router.get("/students", protect, authorize("admin:super"), getAllStudents);

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
