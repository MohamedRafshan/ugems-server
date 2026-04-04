const Discussion = require("../models/Discussion");
const Notification = require("../models/Notification");

// @desc Create discussion/question
// @route POST /api/discussions
// @access Private
exports.createDiscussion = async (req, res) => {
  try {
    const { title, content, category, courseId, resourceId, tags } = req.body;

    const discussion = new Discussion({
      title,
      content,
      category,
      courseId,
      resourceId,
      tags,
      author: req.user.id,
      replies: [],
      likes: [],
    });

    await discussion.save();
    await discussion.populate("author", "firstName lastName email");

    res.status(201).json({ success: true, discussion });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get all discussions (with filters)
// @route GET /api/discussions
// @access Public
exports.getDiscussions = async (req, res) => {
  try {
    const { courseId, category, search, isResolved } = req.query;
    const filter = {};

    if (courseId) filter.courseId = courseId;
    if (category) filter.category = category;
    if (isResolved !== undefined) filter.isResolved = isResolved === "true";
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const discussions = await Discussion.find(filter)
      .populate("author", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, discussions });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get single discussion with replies
// @route GET /api/discussions/:id
// @access Public
exports.getDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    ).populate("author", "firstName lastName email");

    if (!discussion) {
      return res
        .status(404)
        .json({ success: false, message: "Discussion not found" });
    }

    res.json({ success: true, discussion });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Add reply to discussion
// @route POST /api/discussions/:id/replies
// @access Private
exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res
        .status(404)
        .json({ success: false, message: "Discussion not found" });
    }

    const reply = {
      userId: req.user.id,
      content,
      likes: [],
    };

    discussion.replies.push(reply);
    await discussion.save();
    await discussion.populate("replies.userId", "firstName lastName email");

    res.json({ success: true, discussion });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Like discussion
// @route POST /api/discussions/:id/like
// @access Private
exports.likeDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res
        .status(404)
        .json({ success: false, message: "Discussion not found" });
    }

    if (discussion.likes.includes(req.user.id)) {
      discussion.likes = discussion.likes.filter(
        (id) => id.toString() !== req.user.id,
      );
    } else {
      discussion.likes.push(req.user.id);
    }

    await discussion.save();
    res.json({ success: true, discussion });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Mark discussion as resolved
// @route PUT /api/discussions/:id/resolve
// @access Private
exports.resolveDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res
        .status(404)
        .json({ success: false, message: "Discussion not found" });
    }

    if (
      discussion.author.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    discussion.isResolved = true;
    await discussion.save();

    res.json({ success: true, discussion });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Delete discussion
// @route DELETE /api/discussions/:id
// @access Private
exports.deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res
        .status(404)
        .json({ success: false, message: "Discussion not found" });
    }

    if (
      discussion.author.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Discussion deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
