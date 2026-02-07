const {
  Signup,
  Login,
  updateLanguage,
  updateFarmerDetails,
  getFarmerDetails, // ✅ Import the new controller
} = require("../Controllers/AuthController");

const {
  userVerification,
  userVerificationMobile,

} = require("../Middlewares/AuthMiddleware");

const multer = require("multer");
const path = require("path");

// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../client/public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `user_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

const router = require("express").Router();

// Auth routes
router.post("/signup", upload.single("profilePhoto"), Signup);
router.post("/login", Login);

// User updates
router.post("/updateLanguage", updateLanguage);
router.post("/updateFarmerDetails", upload.single("profilePhoto"), updateFarmerDetails);

// ✅ New GET route for fetching farmer details
router.get("/getFarmerDetails/:id", getFarmerDetails);

// Verification routes
router.post("/", userVerification);
router.post("/mobile", userVerificationMobile);

module.exports = router;
