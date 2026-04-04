const Notification = require("../models/Notification");

// @desc Get notifications for user
// @route GET /api/notifications
// @access Private
exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { userId: req.user.id };

    if (unreadOnly === "true") {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get unread notification count
// @route GET /api/notifications/count
// @access Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Mark notification as read
// @route PUT /api/notifications/:id
// @access Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Mark all notifications as read
// @route PUT /api/notifications/mark-all/read
// @access Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id }, { isRead: true });

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Delete notification
// @route DELETE /api/notifications/:id
// @access Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Create notification (internal use)
// @access Private
exports.createNotification = async (
  userId,
  type,
  title,
  message,
  relatedId = null,
) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
  }
};
