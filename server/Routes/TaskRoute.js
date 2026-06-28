const { createTask, getTasks, updateTaskStatus, deleteTask, createBulkTasks } = require("../Controllers/TaskController");
const router = require("express").Router();

router.post("/", createTask);
router.get("/", getTasks);
router.post("/bulk", createBulkTasks);
router.patch("/:taskId", updateTaskStatus);
router.delete("/:taskId", deleteTask);

module.exports = router;
