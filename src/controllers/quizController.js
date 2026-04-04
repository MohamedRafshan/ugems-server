const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");

exports.createQuiz = async (req, res) => {
  try {
    const { title, description, category, subject, timeLimit, attemptLimit } =
      req.body;

    if (!title || !category || !subject || !timeLimit) {
      return res.status(400).json({
        success: false,
        message: "Please provide required fields",
      });
    }

    const quiz = await Quiz.create({
      title,
      description,
      category,
      subject,
      timeLimit,
      attemptLimit: attemptLimit || 3,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const { category, subject, search } = req.query;
    const filter = { isPublished: true, isActive: true, isHidden: false };

    if (category) filter.category = category;
    if (subject) filter.subject = subject;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const quizzes = await Quiz.find(filter)
      .populate("createdBy", "firstName lastName email")
      .populate("questions")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("createdBy", "firstName lastName email")
      .populate("questions");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const quizData = quiz.toObject();
    quizData.status = quiz.isEnabled ? "available" : "locked";
    if (!quiz.isEnabled) {
      quizData.message = "This quiz is not available yet";
    }

    res.status(200).json({
      success: true,
      quiz: quizData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subject,
      timeLimit,
      attemptLimit,
      isPublished,
    } = req.body;

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    if (
      quiz.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this quiz",
      });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category,
        subject,
        timeLimit,
        attemptLimit,
        isPublished,
      },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      quiz: updatedQuiz,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    if (
      quiz.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this quiz",
      });
    }

    // Delete all questions associated with quiz
    await Question.deleteMany({ quizId: req.params.id });

    // Delete all attempts for this quiz
    await QuizAttempt.deleteMany({ quizId: req.params.id });

    await Quiz.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const {
      questionText,
      questionType,
      options,
      correctAnswer,
      explanation,
      points,
      order,
    } = req.body;

    if (!questionText || !questionType || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: "Please provide required fields",
      });
    }

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    if (
      quiz.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add questions to this quiz",
      });
    }

    const question = await Question.create({
      quizId: req.params.id,
      questionText,
      questionType,
      options,
      correctAnswer,
      explanation,
      points: points || 1,
      order: order || quiz.questions.length + 1,
    });

    quiz.questions.push(question._id);
    quiz.totalPoints += points || 1;
    await quiz.save();

    res.status(201).json({
      success: true,
      message: "Question added successfully",
      question,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { questionText, options, correctAnswer, explanation, points } =
      req.body;

    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const quiz = await Quiz.findById(req.params.id);

    if (
      quiz.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this question",
      });
    }

    const oldPoints = question.points;
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.questionId,
      { questionText, options, correctAnswer, explanation, points },
      { new: true, runValidators: true },
    );

    if (points && points !== oldPoints) {
      quiz.totalPoints = quiz.totalPoints - oldPoints + points;
      await quiz.save();
    }

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const quiz = await Quiz.findById(req.params.id);

    if (
      quiz.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this question",
      });
    }

    quiz.questions = quiz.questions.filter(
      (q) => q.toString() !== req.params.questionId,
    );
    quiz.totalPoints -= question.points;
    await quiz.save();

    await Question.findByIdAndDelete(req.params.questionId);

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.startQuizAttempt = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("questions");

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    // Check if quiz is enabled
    if (!quiz.isEnabled) {
      return res.status(403).json({
        success: false,
        message: "This quiz is not available yet",
      });
    }

    // Check attempt limit
    const previousAttempts = await QuizAttempt.countDocuments({
      userId: req.user.id,
      quizId: req.params.id,
      status: "submitted",
    });

    if (previousAttempts >= quiz.attemptLimit) {
      return res.status(403).json({
        success: false,
        message:
          "You have reached the maximum number of attempts for this quiz",
      });
    }

    const attempt = await QuizAttempt.create({
      userId: req.user.id,
      quizId: req.params.id,
      totalPoints: quiz.totalPoints,
      startTime: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Quiz attempt started",
      attempt: {
        id: attempt._id,
        timeLimit: quiz.timeLimit,
        questions: quiz.questions,
        startTime: attempt.startTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.submitQuizAttempt = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide answers",
      });
    }

    const attempt = await QuizAttempt.findById(req.params.attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    if (attempt.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to submit this attempt",
      });
    }

    // Calculate score
    let score = 0;
    const gradedAnswers = [];

    for (const answer of answers) {
      const question = await Question.findById(answer.questionId);

      if (question) {
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        const pointsEarned = isCorrect ? question.points : 0;

        score += pointsEarned;
        gradedAnswers.push({
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
          pointsEarned,
        });
      }
    }

    const endTime = new Date();
    const timeTaken = (endTime - attempt.startTime) / 60000; // in minutes

    const percentage = ((score / attempt.totalPoints) * 100).toFixed(2);

    const updatedAttempt = await QuizAttempt.findByIdAndUpdate(
      req.params.attemptId,
      {
        answers: gradedAnswers,
        score,
        percentage,
        endTime,
        timeTaken: Math.round(timeTaken),
        status: "submitted",
      },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Quiz submitted successfully",
      result: {
        score: updatedAttempt.score,
        totalPoints: updatedAttempt.totalPoints,
        percentage: updatedAttempt.percentage,
        timeTaken: updatedAttempt.timeTaken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getQuizAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      userId: req.user.id,
      quizId: req.params.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getQuizResult = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId)
      .populate({
        path: "answers.questionId",
        select: "questionText options correctAnswer explanation",
      })
      .populate("quizId", "title");

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    if (
      attempt.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this result",
      });
    }

    res.status(200).json({
      success: true,
      attempt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
