const Admin = require("../Models/AdminModel");
const User = require("../Models/UserModel");
const Post = require("../Models/PostModel");
const Comment = require("../Models/CommentModel");
const Yield = require("../Models/YieldDetails");
const Fertilizer = require("../Models/FertilizerDetails");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");

/* =========================
   ADMIN AUTHENTICATION
========================= */
module.exports.AdminSignup = async (req, res) => {
  try {
    const { fullName, email, password, adminSecretKey } = req.body;

    // DEBUGGING: Check your terminal after sending the request
    console.log("Key from Body:", adminSecretKey);
    console.log("Key from .env:", process.env.ADMIN_SIGNUP_SECRET);

    const secretFromServer = process.env.ADMIN_SIGNUP_SECRET;

    // If .env is not loading, it will be undefined. 
    // This check ensures we don't compare against nothing.
    if (!secretFromServer || adminSecretKey !== secretFromServer) {
      return res.status(403).json({ 
        message: "Invalid Secret Key",
        debug: "Check server console to see if .env is loaded" 
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Admin already exists" });

    const admin = await Admin.create({ fullName, email, password });
    const token = createSecretToken(admin._id);

    res.status(201).json({ message: "Admin created", success: true, token });
  } catch (error) {
    res.status(500).json({ message: "Signup failed" });
  }
};
// Admin Login
module.exports.AdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid Admin Credentials" });
    }

    const auth = await bcrypt.compare(password, admin.password);
    if (!auth) {
      return res.status(401).json({ message: "Invalid Admin Credentials" });
    }

    const token = createSecretToken(admin._id);
    
    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    res.status(200).json({
      message: "Admin logged in successfully",
      success: true,
      token,
      admin: { id: admin._id, name: admin.fullName, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

/* =========================
   DASHBOARD & ANALYTICS
========================= */

// Get Overall System Stats
module.exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalYieldQueries = await Yield.countDocuments();
    const totalFertilizerQueries = await Fertilizer.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        users: totalUsers,
        posts: totalPosts,
        yieldPredictions: totalYieldQueries,
        fertilizerPredictions: totalFertilizerQueries,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};

/* =========================
   USER MANAGEMENT
========================= */

// Fetch all registered farmers
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Delete a user (and optionally their data)
module.exports.deleteUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    // Cleanup: Remove user's history as well
    await Yield.deleteMany({ id: userId });
    await Fertilizer.deleteMany({ id: userId });
    
    res.status(200).json({ message: "User and associated data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Deletion failed" });
  }
};

/* =========================
   CONTENT MODERATION
========================= */

// Admin can see ALL comments across ALL posts for moderation
module.exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments" });
  }
};

// Force delete any post (Professional Overwrite)
module.exports.adminDeletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ postId }); // Cleanup
    res.status(200).json({ message: "Post removed by Admin" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
};