const Notification = require("../Models/Notification");

module.exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    // Get notifications sorted by dateObj (upcoming first)
    const notifications = await Notification.find({ userId }).sort({ dateObj: 1 });
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
