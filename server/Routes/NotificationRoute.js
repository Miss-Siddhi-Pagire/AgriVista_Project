const { getNotifications, markAsRead, deleteNotification } = require("../Controllers/NotificationController");
const router = require("express").Router();

router.get("/:userId", getNotifications);
router.post("/read/:id", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
