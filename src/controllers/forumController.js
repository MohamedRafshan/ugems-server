const Forum = require("../models/Forum");

// @desc Create forum post
// @route POST /api/forum
// @access Private
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    const post = new Forum({
      title,
      content,
      category,
      tags,
      author: req.user.id,
      replies: [],
      likes: [],
    });

    await post.save();
    await post.populate("author", "firstName lastName email");

    res.status(201).json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get all forum posts
// @route GET /api/forum
// @access Public
exports.getPosts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    let query = Forum.find(filter).populate(
      "author",
      "firstName lastName email",
    );

    if (sort === "views") {
      query = query.sort({ views: -1 });
    } else if (sort === "likes") {
      query = query.sort({ likes: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    // Pin announcements first
    const query2 = Forum.find({ ...filter, isPinned: true }).populate(
      "author",
      "firstName lastName email",
    );
    const pinnedPosts = await query2;
    const otherPosts = await query;

    const posts = [...pinnedPosts, ...otherPosts.filter((p) => !p.isPinned)];

    res.json({ success: true, posts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get single forum post
// @route GET /api/forum/:id
// @access Public
exports.getPost = async (req, res) => {
  try {
    const post = await Forum.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true },
    ).populate("author", "firstName lastName email");

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    res.json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Add reply to forum post
// @route POST /api/forum/:id/replies
// @access Private
exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;

    const post = await Forum.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const reply = {
      userId: req.user.id,
      content,
      likes: [],
    };

    post.replies.push(reply);
    await post.save();
    await post.populate("replies.userId", "firstName lastName email");

    res.json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Like forum post
// @route POST /api/forum/:id/like
// @access Private
exports.likePost = async (req, res) => {
  try {
    const post = await Forum.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.likes.includes(req.user.id)) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Pin forum post (Admin only)
// @route PUT /api/forum/:id/pin
// @access Private/Admin
exports.pinPost = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const post = await Forum.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Delete forum post
// @route DELETE /api/forum/:id
// @access Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Forum.findById(req.params.id);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await Forum.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
