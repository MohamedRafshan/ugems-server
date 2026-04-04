const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createLesson,
  getLessons,
  getLesson,
  updateLesson,
  deleteLesson,
  completeLesson,
  addResourceToLesson,
  addQuizToLesson,
} = require("../controllers/lessonController");

// Public routes
router.get("/:courseId", getLessons);
router.get("/detail/:id", getLesson);

// Protected routes
router.post("/", protect, authorize("lecturer", "admin"), createLesson);
router.put("/:id", protect, authorize("lecturer", "admin"), updateLesson);
router.delete("/:id", protect, authorize("lecturer", "admin"), deleteLesson);

// Student routes
router.post("/:id/complete", protect, authorize("student"), completeLesson);

// Resource and quiz management
router.post(
  "/:id/resources/:resourceId",
  protect,
  authorize("lecturer", "admin"),
  addResourceToLesson,
);
router.post(
  "/:id/quizzes/:quizId",
  protect,
  authorize("lecturer", "admin"),
  addQuizToLesson,
);

module.exports = router;
