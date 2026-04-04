const User = require("../models/User");
const Course = require("../models/Course");
const Quiz = require("../models/Quiz");
const Resource = require("../models/Resource");
const Announcement = require("../models/Announcement");
const Leaderboard = require("../models/Leaderboard");
const { createNotification } = require("./notificationController");

// @desc Get all users (admin only)
// @route GET /api/admin/users
// @access Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get user by ID
// @route GET /api/admin/users/:id
// @access Private/Admin
exports.getUserById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Update user role (super admin only)
// @route PUT /api/admin/users/:id/role
// @access Private/Admin/Super
exports.updateUserRole = async (req, res) => {
  try {
    // Fetch fresh user from DB to get updated adminTier
    const freshUser = await User.findById(req.user.id);
    const isSuperAdmin = (freshUser && freshUser.role === "admin" && freshUser.adminTier === "super") ||
                        (freshUser && freshUser.email === process.env.ADMIN_EMAIL);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only super admin can modify user roles",
      });
    }

    const { role } = req.body;
    const user = await User.findById(req.params.id);

    // Prevent modifying the main super admin
    if (user && user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify the main super admin account",
      });
    }

    // Set adminTier based on role being assigned
    const adminTier = role !== "student" ? "limited" : null;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role, adminTier },
      { new: true },
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Deactivate user (super admin only)
// @route PUT /api/admin/users/:id/deactivate
// @access Private/Admin/Super
exports.deactivateUser = async (req, res) => {
  try {
    // Fetch fresh user from DB to get updated adminTier
    const freshUser = await User.findById(req.user.id);
    const isSuperAdmin = (freshUser && freshUser.role === "admin" && freshUser.adminTier === "super") ||
                        (freshUser && freshUser.email === process.env.ADMIN_EMAIL);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only super admin can deactivate users",
      });
    }

    const user = await User.findById(req.params.id);

    // Prevent deactivating the main super admin
    if (user && user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Cannot deactivate the main super admin account",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Activate user (super admin only)
// @route PUT /api/admin/users/:id/activate
// @access Private/Admin/Super
exports.activateUser = async (req, res) => {
  try {
    // Fetch fresh user from DB to get updated adminTier
    const freshUser = await User.findById(req.user.id);
    const isSuperAdmin = (freshUser && freshUser.role === "admin" && freshUser.adminTier === "super") ||
                        (freshUser && freshUser.email === process.env.ADMIN_EMAIL);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only super admin can activate users",
      });
    }

    const user = await User.findById(req.params.id);

    // Prevent modifying the main super admin
    if (user && user.email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify the main super admin account",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true },
    ).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Create announcement
// @route POST /api/admin/announcements
// @access Private/Admin
exports.createAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "lecturer") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const { title, content, courseId, priority, attachments } = req.body;

    const announcement = new Announcement({
      title,
      content,
      courseId,
      priority,
      attachments,
      author: req.user.id,
    });

    await announcement.save();

    // Send notification to all students in course if courseId provided
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) {
        for (const studentId of course.students) {
          await createNotification(
            studentId,
            "announcement",
            title,
            content,
            courseId,
          );
        }
      }
    }

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get all announcements
// @route GET /api/admin/announcements
// @access Public
exports.getAnnouncements = async (req, res) => {
  try {
    const { courseId } = req.query;
    const filter = {};

    if (courseId) filter.courseId = courseId;

    const announcements = await Announcement.find(filter)
      .populate("author", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({ success: true, announcements });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get leaderboard for course
// @route GET /api/admin/leaderboard/:courseId
// @access Public
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find({
      courseId: req.params.courseId,
    })
      .populate("userId", "firstName lastName email")
      .sort({ points: -1, averageScore: -1 })
      .limit(100);

    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get dashboard stats (super admin only)
// @route GET /api/admin/stats
// @access Private/Admin/Super
exports.getDashboardStats = async (req, res) => {
  try {
    // Fetch fresh user from DB to get updated adminTier
    const freshUser = await User.findById(req.user.id);
    const isSuperAdmin = (freshUser && freshUser.role === "admin" && freshUser.adminTier === "super") ||
                        (freshUser && freshUser.email === process.env.ADMIN_EMAIL);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only super admin can view system analytics",
      });
    }

    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalQuizzes,
        activeUsers,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get system analytics (super admin only)
// @route GET /api/admin/analytics
// @access Private/Admin/Super
exports.getAnalytics = async (req, res) => {
  try {
    // Fetch fresh user from DB to get updated adminTier
    const freshUser = await User.findById(req.user.id);
    const isSuperAdmin = (freshUser && freshUser.role === "admin" && freshUser.adminTier === "super") ||
                        (freshUser && freshUser.email === process.env.ADMIN_EMAIL);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only super admin can view system analytics",
      });
    }

    const { startDate, endDate } = req.query;
    const filter = {};

    if (startDate) filter.createdAt = { $gte: new Date(startDate) };
    if (endDate) {
      if (!filter.createdAt) filter.createdAt = {};
      filter.createdAt.$lte = new Date(endDate);
    }

    const newUsers = await User.countDocuments(filter);
    const newCourses = await Course.countDocuments(filter);

    res.json({
      success: true,
      analytics: {
        newUsers,
        newCourses,
        period: { startDate, endDate },
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get all registered students
// @route GET /api/admin/students
// @access Private/Admin/Super
exports.getAllStudents = async (req, res) => {
  try {
    console.log("=== getAllStudents DEBUG ===");
    console.log("req.user.id:", req.user.id);
    console.log("req.user.email:", req.user.email);
    console.log("req.user.role:", req.user.role);
    console.log("req.user.adminTier:", req.user.adminTier);
    console.log("process.env.ADMIN_EMAIL:", process.env.ADMIN_EMAIL);

    // Fetch fresh user from DB to get updated adminTier
    const freshUser = await User.findById(req.user.id);
    console.log("freshUser found:", !!freshUser);
    if (freshUser) {
      console.log("freshUser._id:", freshUser._id);
      console.log("freshUser.email:", freshUser.email);
      console.log("freshUser.role:", freshUser.role);
      console.log("freshUser.adminTier:", freshUser.adminTier);
    }

    const isSuperAdmin = (freshUser && freshUser.role === "admin" && freshUser.adminTier === "super") ||
                        (freshUser && freshUser.email === process.env.ADMIN_EMAIL);

    console.log("isSuperAdmin check result:", isSuperAdmin);
    console.log("================================");

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only super admin can access user management",
      });
    }

    // Get all users EXCEPT the main super admin (env admin)
    const mainAdminEmail = process.env.ADMIN_EMAIL;
    const students = await User.find({ email: { $ne: mainAdminEmail } })
      .select(
        "firstName lastName email role indexNumber nicNumber alBatch school address createdAt isActive adminTier",
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      totalStudents: students.length,
      students,
    });
  } catch (error) {
    console.error("getAllStudents error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Toggle resource enable/disable
// @route PUT /api/admin/resources/:id/enable
// @access Private/Admin
exports.toggleResourceEnable = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    // Limited admin can only toggle their own resources
    if (req.user.adminTier === "limited") {
      if (resource.uploadedBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Cannot modify other creator's resource",
        });
      }
    }
    // Super admin can toggle any resource (no check needed)

    resource.isEnabled = !resource.isEnabled;
    await resource.save();

    res.json({
      success: true,
      message: `Resource ${resource.isEnabled ? "enabled" : "disabled"}`,
      resource,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Toggle resource hide/show
// @route PUT /api/admin/resources/:id/hide
// @access Private/Admin
exports.toggleResourceHide = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    // Limited admin can only toggle their own resources
    if (req.user.adminTier === "limited") {
      if (resource.uploadedBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Cannot modify other creator's resource",
        });
      }
    }
    // Super admin can toggle any resource (no check needed)

    resource.isHidden = !resource.isHidden;
    await resource.save();

    res.json({
      success: true,
      message: `Resource ${resource.isHidden ? "hidden" : "shown"}`,
      resource,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Toggle quiz enable/disable
// @route PUT /api/admin/quizzes/:id/enable
// @access Private/Admin
exports.toggleQuizEnable = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    // Limited admin can only toggle their own quizzes
    if (req.user.adminTier === "limited") {
      if (quiz.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Cannot modify other creator's quiz",
        });
      }
    }
    // Super admin can toggle any quiz (no check needed)

    quiz.isEnabled = !quiz.isEnabled;
    await quiz.save();

    res.json({
      success: true,
      message: `Quiz ${quiz.isEnabled ? "enabled" : "disabled"}`,
      quiz,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Toggle quiz hide/show
// @route PUT /api/admin/quizzes/:id/hide
// @access Private/Admin
exports.toggleQuizHide = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    // Limited admin can only toggle their own quizzes
    if (req.user.adminTier === "limited") {
      if (quiz.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Cannot modify other creator's quiz",
        });
      }
    }
    // Super admin can toggle any quiz (no check needed)

    quiz.isHidden = !quiz.isHidden;
    await quiz.save();

    res.json({
      success: true,
      message: `Quiz ${quiz.isHidden ? "hidden" : "shown"}`,
      quiz,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
