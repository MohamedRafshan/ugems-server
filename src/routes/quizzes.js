const express = require("express");
const {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempts,
  getQuizResult,
} = require("../controllers/quizController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

// Quiz CRUD
router.post("/", protect, authorize("admin", "lecturer"), createQuiz);
router.get("/", getQuizzes);
router.get("/:id", getQuiz);
router.put("/:id", protect, authorize("admin", "lecturer"), updateQuiz);
router.delete("/:id", protect, authorize("admin", "lecturer"), deleteQuiz);

// Questions
router.post(
  "/:id/questions",
  protect,
  authorize("admin", "lecturer"),
  addQuestion,
);
router.put(
  "/:id/questions/:questionId",
  protect,
  authorize("admin", "lecturer"),
  updateQuestion,
);
router.delete(
  "/:id/questions/:questionId",
  protect,
  authorize("admin", "lecturer"),
  deleteQuestion,
);

// Quiz Attempts
router.post("/:id/attempts", protect, startQuizAttempt);
router.post("/:id/attempts/:attemptId/submit", protect, submitQuizAttempt);
router.get("/:id/attempts", protect, getQuizAttempts);
router.get("/attempts/:attemptId", protect, getQuizResult);

module.exports = router;
