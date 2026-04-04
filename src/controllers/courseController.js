const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const UserProgress = require("../models/UserProgress");

// @desc Create a new course
// @route POST /api/courses
// @access Private/Lecturer
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, level, duration, thumbnail } =
      req.body;

    const course = new Course({
      title,
      description,
      category,
      level,
      duration,
      thumbnail,
      instructorId: req.user.id,
      students: [],
      lessons: [],
    });

    await course.save();
    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get all courses (published)
// @route GET /api/courses
// @access Public
exports.getCourses = async (req, res) => {
  try {
    const { category, level, search } = req.query;
    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(filter)
      .populate("instructorId", "firstName lastName email")
      .populate("lessons");

    res.json({ success: true, courses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get single course with lessons
// @route GET /api/courses/:id
// @access Public
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructorId", "firstName lastName email")
      .populate({
        path: "lessons",
        populate: { path: "quizzes resources" },
      })
      .populate("students", "firstName lastName email");

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Update course
// @route PUT /api/courses/:id
// @access Private/Instructor
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

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

    const {
      title,
      description,
      category,
      level,
      duration,
      thumbnail,
      isPublished,
    } = req.body;

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (level) course.level = level;
    if (duration) course.duration = duration;
    if (thumbnail) course.thumbnail = thumbnail;
    if (isPublished !== undefined) course.isPublished = isPublished;

    await course.save();
    res.json({ success: true, course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Delete course
// @route DELETE /api/courses/:id
// @access Private/Instructor
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

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

    // Delete all lessons in course
    await Lesson.deleteMany({ courseId: req.params.id });

    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Course deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Enroll student in course
// @route POST /api/courses/:id/enroll
// @access Private/Student
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    if (course.students.includes(req.user.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Already enrolled" });
    }

    course.students.push(req.user.id);
    await course.save();

    // Create user progress record
    const progress = new UserProgress({
      userId: req.user.id,
      courseId: course._id,
      lessonsCompleted: [],
      quizzesAttempted: [],
    });
    await progress.save();

    res.json({ success: true, message: "Enrolled successfully", course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get enrolled courses for student
// @route GET /api/courses/student/enrolled
// @access Private/Student
exports.getEnrolledCourses = async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user.id })
      .populate("instructorId", "firstName lastName")
      .populate("lessons");

    res.json({ success: true, courses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get course progress for student
// @route GET /api/courses/:id/progress
// @access Private/Student
exports.getCourseProgress = async (req, res) => {
  try {
    const progress = await UserProgress.findOne({
      userId: req.user.id,
      courseId: req.params.id,
    })
      .populate("lessonsCompleted")
      .populate("quizzesAttempted");

    if (!progress) {
      return res
        .status(404)
        .json({ success: false, message: "Progress not found" });
    }

    const course = await Course.findById(req.params.id);
    const totalLessons = course.lessons.length;
    const completedLessons = progress.lessonsCompleted.length;
    const progressPercentage =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    progress.progressPercentage = progressPercentage;
    await progress.save();

    res.json({ success: true, progress });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
