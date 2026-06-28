const TaskModel = require("../Models/TaskModel");

module.exports.createTask = async (req, res) => {
    try {
        const { userId, title, description, dueDate, planId } = req.body;
        
        if (!userId || !title || !dueDate) {
            return res.status(400).json({ message: "userId, title, and dueDate are required" });
        }

        const task = await TaskModel.create({
            userId,
            title,
            description,
            dueDate,
            planId
        });

        return res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
        console.error("Create task error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.getTasks = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required to fetch tasks" });
        }

        const tasks = await TaskModel.find({ userId }).sort({ dueDate: 1 });
        return res.status(200).json({ tasks });
    } catch (error) {
        console.error("Get tasks error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { isCompleted } = req.body;

        const task = await TaskModel.findByIdAndUpdate(taskId, { isCompleted }, { new: true });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        return res.status(200).json({ message: "Task updated", task });
    } catch (error) {
        console.error("Update task error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await TaskModel.findByIdAndDelete(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        return res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Delete task error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.createBulkTasks = async (req, res) => {
    try {
        const { userId, planId, tasks } = req.body;
        if (!userId || !tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ message: "Invalid payload" });
        }

        const formattedTasks = tasks.map(task => ({
            userId,
            planId,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate
        }));

        await TaskModel.insertMany(formattedTasks);
        return res.status(201).json({ message: "Tasks generated successfully" });
    } catch (error) {
        console.error("Bulk create task error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
