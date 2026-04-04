const Resource = require("../models/Resource");
const Comment = require("../models/Comment");
const fs = require("fs");
const path = require("path");

exports.uploadResource = async (req, res) => {
  try {
    const { title, description, category, subject, field } = req.body;

    if (!title || !description || !category || !subject || !field) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    const resource = await Resource.create({
      title,
      description,
      category,
      subject,
      field,
      uploadedBy: req.user.id,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype.split("/")[1],
    });

    res.status(201).json({
      success: true,
      message: "Resource uploaded successfully",
      resource,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getResources = async (req, res) => {
  try {
    const { category, subject, field, search } = req.query;
    const filter = { isPublished: true, isHidden: false };

    if (category) filter.category = category;
    if (subject) filter.subject = subject;
    if (field) filter.field = field;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const resources = await Resource.find(filter)
      .populate("uploadedBy", "firstName lastName email")
      .populate("comments")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate("uploadedBy", "firstName lastName email")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "firstName lastName",
        },
      });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Include status information
    const resourceData = resource.toObject();
    resourceData.status = resource.isEnabled ? "available" : "locked";
    if (!resource.isEnabled) {
      resourceData.message = "This resource is not available yet";
    }

    res.status(200).json({
      success: true,
      resource: resourceData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    if (
      resource.uploadedBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this resource",
      });
    }

    // Delete file from filesystem
    if (resource.filePath && fs.existsSync(resource.filePath)) {
      fs.unlinkSync(resource.filePath);
    }

    await Resource.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Please provide comment content",
      });
    }

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    const comment = await Comment.create({
      content,
      author: req.user.id,
      resource: req.params.id,
    });

    resource.comments.push(comment._id);
    await resource.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "firstName lastName",
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.rateResource = async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rating between 1 and 5",
      });
    }

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Check if user already rated
    const existingRating = resource.ratings.find(
      (r) => r.userId.toString() === req.user.id,
    );

    if (existingRating) {
      existingRating.rating = rating;
    } else {
      resource.ratings.push({
        userId: req.user.id,
        rating,
      });
    }

    // Calculate average rating
    const totalRating = resource.ratings.reduce((sum, r) => sum + r.rating, 0);
    resource.averageRating = (totalRating / resource.ratings.length).toFixed(2);

    await resource.save();

    res.status(200).json({
      success: true,
      message: "Rating added successfully",
      averageRating: resource.averageRating,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true },
    );

    if (!resource || !fs.existsSync(resource.filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.download(resource.filePath, resource.fileName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
