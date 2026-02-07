const Admin = require("../Models/AdminModel"); // Path to your new Admin model
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Admin Verification for Web/JSON Body
 */
module.exports.adminVerification = (req, res, next) => {
  const { tok } = req.body;

  // DEBUGGING LOGS
  console.log("Admin Middleware - Body Token:", tok);
  console.log("Admin Middleware - Cookies:", req.cookies);

  const token = tok || req.cookies.token || req.cookies.admin_token; // Check body first, then cookies

  if (!token) {
    console.log("Admin Middleware - No Token Found");
    return res.status(401).json({ status: false, message: "No token provided" });
  }

  jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
    if (err) {
      console.log("Admin Middleware - Verify Error:", err.message);
      return res.status(401).json({ status: false, message: "Unauthorized token" });
    } else {
      try {
        const admin = await Admin.findById(data.id);

        if (admin) {
          // Attach admin to request object for use in controllers
          req.admin = admin;
          next();
        } else {
          return res.status(403).json({ status: false, message: "Admin access denied" });
        }
      } catch (error) {
        return res.status(500).json({ status: false, message: "Server error during verification" });
      }
    }
  });
};

/**
 * Admin Verification for Cookies (Mobile/Browser Secure)
 */
module.exports.adminVerificationMobile = (req, res) => {
  const token = req.cookies.admin_token; // Use a distinct cookie name for admins

  if (!token) {
    return res.json({ status: false });
  }

  jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
    if (err) {
      return res.json({ status: false });
    } else {
      const admin = await Admin.findById(data.id);
      if (admin) {
        return res.json({ status: true, admin: admin.fullName, id: admin.id });
      } else {
        return res.json({ status: false });
      }
    }
  });
};