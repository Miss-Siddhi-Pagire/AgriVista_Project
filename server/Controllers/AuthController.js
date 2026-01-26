const User = require("../Models/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");

/* =========================
   SIGNUP
========================= */
module.exports.Signup = async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      age,
      gender,
      address,
      preferredLanguage,
    } = req.body;

    if (!email || !password || !name) {
      return res.json({ message: "Required fields are missing" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const user = await User.create({
      email,
      password,
      name,
      phone,
      age,
      gender,
      address,
      preferredLanguage,
    });

    const token = createSecretToken(user._id);

    res.status(201).json({
      message: "User signed up successfully",
      success: true,
      user,
      token,
    });

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed" });
  }
};

/* =========================
   LOGIN
========================= */
module.exports.Login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Invalid email" });
    }

    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.json({ message: "Incorrect password" });
    }

    const token = createSecretToken(user._id);

    res.status(200).json({
      message: "User logged in successfully",
      success: true,
      user,
      token,
    });

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
};

/* =========================
   UPDATE LANGUAGE
========================= */
module.exports.updateLanguage = async (req, res) => {
  try {
    const { userId, language } = req.body;

    if (!userId || !language) {
      return res.json({ message: "User ID and language are required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { language },
      { new: true }
    );

    if (!user) {
      return res.json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Language updated successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update language" });
  }
};

/* =========================
   UPDATE FARMER DETAILS
========================= */
module.exports.updateFarmerDetails = async (req, res) => {
  try {
    const {
      userId,
      name,
      phone,
      age,
      gender,
      address,
      preferredLanguage,
    } = req.body;

    if (!userId) {
      return res.json({ message: "User ID is required" });
    }

    const updateFields = {
      name,
      phone,
      age,
      gender,
      address,
      preferredLanguage,
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const user = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true }
    );

    if (!user) {
      return res.json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Farmer details updated successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update farmer details" });
  }
};

/* =========================
   GET FARMER DETAILS
========================= */
module.exports.getFarmerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user); // send full user object
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch farmer details" });
  }
};
