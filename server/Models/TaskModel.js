const mongoose = require("mongoose");

const TaskSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    planId: {
        type: String,
        default: null,
    }
}, { timestamps: true });

module.exports = mongoose.model("tasks", TaskSchema);
