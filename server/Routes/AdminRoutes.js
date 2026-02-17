const express = require("express");
const router = express.Router();
const adminCtrl = require("../Controllers/AdminController");
const { adminVerification } = require("../Middlewares/AdminMiddleware");

// =========================
// Public Admin Routes
// =========================
router.post("/signup", adminCtrl.AdminSignup);
router.get("/create-first", adminCtrl.createFirstAdmin); // EMERGENCY ROUTE (GET for browser access)
router.post("/login", adminCtrl.AdminLogin);

// =========================
// Protected Admin Routes
// =========================
// Dashboard & Stats
router.get("/stats", adminVerification, adminCtrl.getSystemStats);

// User Management
router.get("/users/all", adminVerification, adminCtrl.getAllUsers);
router.get("/users/:userId/full", adminVerification, adminCtrl.getUserFullDetails); // New
router.delete("/users/:userId", adminVerification, adminCtrl.deleteUserAccount);

// Content Moderation
router.get("/posts/all", adminVerification, adminCtrl.getAllPosts); // New
router.get("/comments/all", adminVerification, adminCtrl.getAllComments);
router.delete("/post/:postId", adminVerification, adminCtrl.adminDeletePost);
router.delete("/comment/:commentId", adminVerification, adminCtrl.adminDeleteComment); // New

const multer = require("multer");
const path = require("path");

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "../client/public/uploads"); // Save to public folder for easy access
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Market Trends
router.post("/trends/add", adminVerification, upload.single("image"), adminCtrl.createTrend);
router.put("/trends/:id", adminVerification, upload.single("image"), adminCtrl.updateTrend);
router.delete("/trends/:id", adminVerification, adminCtrl.deleteTrend);

module.exports = router;