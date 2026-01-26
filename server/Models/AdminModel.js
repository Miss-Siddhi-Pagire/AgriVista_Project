const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Admin name is required"],
    },
    email: {
        type: String,
        required: [true, "Admin email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Admin password is required"],
    },
    role: {
        type: String,
        enum: ["superadmin", "editor", "moderator"],
        default: "superadmin",
    },
    permissions: {
        canDeleteUsers: { type: Boolean, default: true },
        canEditPosts: { type: Boolean, default: true },
        canAccessAnalytics: { type: Boolean, default: true },
    },
    lastLogin: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, { 
    timestamps: true 
});

// Password Hashing Middleware
AdminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password for login
AdminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", AdminSchema);