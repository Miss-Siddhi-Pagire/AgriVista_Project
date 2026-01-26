const Admin = require("../Models/AdminModel"); // Path to your new Admin model
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Admin Verification for Web/JSON Body
 */
module.exports.adminVerification = (req, res, next) => {
  const { tok } = req.body;

  if (!tok) {
    return res.status(401).json({ status: false, message: "No token provided" });
  }

  jwt.verify(tok, process.env.TOKEN_KEY, async (err, data) => {
    if (err) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    } else {
      try {
        // Verify the ID belongs to the Admin collection, not the User collection
        const admin = await Admin.findById(data.id);
        
        if (admin) {
          // If you are using this as actual middleware for routes:
          // req.admin = admin; 
          // next();
          
          // If you are using it as a verification check for the frontend:
          return res.json({ 
            status: true, 
            admin: admin.fullName, 
            id: admin.id, 
            role: admin.role 
          });
        } else {
          return res.json({ status: false, message: "Admin access denied" });
        }
      } catch (error) {
        return res.status(500).json({ status: false, message: "Server error" });
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