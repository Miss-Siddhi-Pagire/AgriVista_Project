const Admin = require("../Models/AdminModel");
const User = require("../Models/UserModel");
const Post = require("../Models/PostModel");
const Comment = require("../Models/CommentModel");
const Yield = require("../Models/YieldDetails");
const Fertilizer = require("../Models/FertilizerDetails");
const Crop = require("../Models/CropModel");
const Trend = require("../Models/TrendModel");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");

/* =========================
   ADMIN AUTHENTICATION
========================= */

module.exports.createFirstAdmin = async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({ message: "Admin already exists. Use the secure signup." });
    }

    const { fullName, email, password } = req.body;
    const admin = await Admin.create({ fullName, email, password });
    const token = createSecretToken(admin._id);

    res.status(201).json({ message: "First Admin created successfully", success: true, token });
  } catch (error) {
    res.status(500).json({ message: "Failed to create first admin" });
  }
};

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

// Delete a specific comment
module.exports.adminDeleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: "Comment deleted by Admin" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment" });
  }
};

// Fetch all posts for moderation
// Fetch all posts for moderation
module.exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.aggregate([
      {
        $addFields: {
          postIdString: { $toString: "$_id" }
        }
      },
      {
        $lookup: {
          from: "comments",
          localField: "postIdString",
          foreignField: "postId",
          as: "comments"
        }
      },
      {
        $addFields: {
          commentsCount: { $size: "$comments" }
        }
      },
      {
        $project: {
          comments: 0,
          postIdString: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts" });
  }
};

/* =========================
   MARKET TRENDS MANAGEMENT
   ========================= */

module.exports.createTrend = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    // Image path relative to public folder
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const trend = await Trend.create({ title, description, image, category });
    res.status(201).json({ success: true, message: "Trend created successfully", trend });
  } catch (error) {
    console.error("Create Trend Error:", error);
    res.status(500).json({ message: "Failed to create trend" });
  }
};

module.exports.updateTrend = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;

    let updateData = { title, description, category };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const trend = await Trend.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ success: true, message: "Trend updated successfully", trend });
  } catch (error) {
    console.error("Update Trend Error:", error);
    res.status(500).json({ message: "Failed to update trend" });
  }
};

module.exports.deleteTrend = async (req, res) => {
  try {
    const { id } = req.params;
    await Trend.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Trend deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete trend" });
  }
};

// Get comprehensive data for a single user
module.exports.getUserFullDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Parallel Fetching for Efficiency
    const [yields, fertilizers, crops, posts, comments] = await Promise.all([
      Yield.find({ id: userId }).sort({ createdAt: -1 }),
      Fertilizer.find({ id: userId }).sort({ createdAt: -1 }),
      Crop.find({ id: userId }), // Crop model might not have timestamps check schema
      Post.find({ creatorId: userId }).sort({ createdAt: -1 }),
      Comment.find({ creatorId: userId }).sort({ createdAt: -1 })
    ]);

    res.status(200).json({
      success: true,
      user,
      data: {
        yields,
        fertilizers,
        crops,
        posts,
        comments
      }
    });

  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Error fetching user details" });
  }
};