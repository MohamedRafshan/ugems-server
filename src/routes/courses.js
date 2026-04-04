const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  getEnrolledCourses,
  getCourseProgress,
} = require("../controllers/courseController");

// Public routes
router.get("/", getCourses);
router.get("/:id", getCourse);

// Protected routes
router.post("/", protect, authorize("lecturer", "admin"), createCourse);
router.put("/:id", protect, authorize("lecturer", "admin"), updateCourse);
router.delete("/:id", protect, authorize("lecturer", "admin"), deleteCourse);

// Student enrollment
router.post("/:id/enroll", protect, authorize("student"), enrollCourse);
router.get(
  "/student/enrolled",
  protect,
  authorize("student"),
  getEnrolledCourses,
);
router.get("/:id/progress", protect, authorize("student"), getCourseProgress);

module.exports = router;
