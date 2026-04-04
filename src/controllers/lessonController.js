const Lesson = require("../models/Lesson");
const Course = require("../models/Course");
const UserProgress = require("../models/UserProgress");

// @desc Create lesson
// @route POST /api/lessons
// @access Private/Instructor
exports.createLesson = async (req, res) => {
  try {
    const { courseId, title, description, order, content, videoUrl, duration } =
      req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (
      course.instructorId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const lesson = new Lesson({
      courseId,
      title,
      description,
      order,
      content,
      videoUrl,
      duration,
      resources: [],
      quizzes: [],
    });

    await lesson.save();
    course.lessons.push(lesson._id);
    await course.save();

    res.status(201).json({ success: true, lesson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get all lessons in course
// @route GET /api/lessons/:courseId
// @access Public
exports.getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ courseId: req.params.courseId })
      .populate("resources")
      .populate("quizzes")
      .sort({ order: 1 });

    res.json({ success: true, lessons });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get single lesson
// @route GET /api/lessons/:id
// @access Public
exports.getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate("resources")
      .populate("quizzes");

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    res.json({ success: true, lesson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Update lesson
// @route PUT /api/lessons/:id
// @access Private/Instructor
exports.updateLesson = async (req, res) => {
  try {
    let lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    const course = await Course.findById(lesson.courseId);
    if (
      course.instructorId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const { title, description, content, videoUrl, duration, order } = req.body;

    if (title) lesson.title = title;
    if (description) lesson.description = description;
    if (content) lesson.content = content;
    if (videoUrl) lesson.videoUrl = videoUrl;
    if (duration) lesson.duration = duration;
    if (order !== undefined) lesson.order = order;

    await lesson.save();
    res.json({ success: true, lesson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Delete lesson
// @route DELETE /api/lessons/:id
// @access Private/Instructor
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    const course = await Course.findById(lesson.courseId);
    if (
      course.instructorId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    course.lessons = course.lessons.filter(
      (id) => id.toString() !== req.params.id,
    );
    await course.save();

    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Lesson deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Mark lesson as completed
// @route POST /api/lessons/:id/complete
// @access Private/Student
exports.completeLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    const progress = await UserProgress.findOne({
      userId: req.user.id,
      courseId: lesson.courseId,
    });

    if (!progress) {
      return res
        .status(404)
        .json({ success: false, message: "Enrollment not found" });
    }

    if (!progress.lessonsCompleted.includes(lesson._id)) {
      progress.lessonsCompleted.push(lesson._id);
      await progress.save();
    }

    res.json({ success: true, message: "Lesson marked complete", progress });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Add resource to lesson
// @route POST /api/lessons/:id/resources/:resourceId
// @access Private/Instructor
exports.addResourceToLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    if (!lesson.resources.includes(req.params.resourceId)) {
      lesson.resources.push(req.params.resourceId);
      await lesson.save();
    }

    res.json({ success: true, lesson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Add quiz to lesson
// @route POST /api/lessons/:id/quizzes/:quizId
// @access Private/Instructor
exports.addQuizToLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    if (!lesson.quizzes.includes(req.params.quizId)) {
      lesson.quizzes.push(req.params.quizId);
      await lesson.save();
    }

    res.json({ success: true, lesson });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
