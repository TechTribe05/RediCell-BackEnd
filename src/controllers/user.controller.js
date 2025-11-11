const User = require("../models/user.schema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER USER ✅
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, country } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !country) {
      return res.status(400).json({ success: false, message: "All fields required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists." });
    }

    // Password must be 6 digits
    if (!/^\d{6}$/.test(password)) {
      return res.status(403).json({ success: false, message: "Password must be 6 digits." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      country
    });

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.SECRET, { expiresIn: "1d" });

    // Return response
    return res.status(200).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        country: newUser.country,
        walletBalance: newUser.walletBalance
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// LOGIN USER ✅
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: "All fields required." });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password." });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        country: user.country,
        walletBalance: user.walletBalance
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// GET USER PROFILE ✅
const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: user
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { register, login, getUserProfile };
