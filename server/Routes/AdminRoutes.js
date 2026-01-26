const express = require("express");
const router = express.Router();
const adminCtrl = require("../Controllers/AdminController");
const { adminVerification } = require("../Middlewares/AdminMiddleware");

// =========================
// Public Admin Routes
// =========================
router.post("/signup", adminCtrl.AdminSignup); // This was missing!
router.post("/login", adminCtrl.AdminLogin);

// =========================
// Protected Admin Routes
// =========================
// Dashboard & Stats
router.get("/stats", adminVerification, adminCtrl.getSystemStats);

// User Management
router.get("/users/all", adminVerification, adminCtrl.getAllUsers);
router.delete("/users/:userId", adminVerification, adminCtrl.deleteUserAccount);

// Content Moderation
router.get("/comments/all", adminVerification, adminCtrl.getAllComments);
router.delete("/post/:postId", adminVerification, adminCtrl.adminDeletePost);

module.exports = router;