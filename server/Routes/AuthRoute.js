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

const router = require("express").Router();

// Auth routes
router.post("/signup", Signup);
router.post("/login", Login);

// User updates
router.post("/updateLanguage", updateLanguage);
router.post("/updateFarmerDetails", updateFarmerDetails);

// ✅ New GET route for fetching farmer details
router.get("/getFarmerDetails/:id", getFarmerDetails);

// Verification routes
router.post("/", userVerification);
router.post("/mobile", userVerificationMobile);

module.exports = router;
