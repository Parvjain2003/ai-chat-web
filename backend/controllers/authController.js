// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      userId: user.userId,
      phoneNumber: user.phoneNumber,
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "24h" }
  );
};

exports.register = async (req, res) => {
  try {
    const { userId, phoneNumber, name, password } = req.body;

    // Validation
    if (!userId || !phoneNumber || !name || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    if (userId.length < 3 || userId.length > 20) {
      return res.status(400).json({
        error: "User ID must be between 3-20 characters",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
      return res.status(400).json({
        error: "User ID can only contain letters, numbers, and underscore",
      });
    }

    if (!/^[0-9]{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({
        error: "Phone number must be 10-15 digits",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ userId }, { phoneNumber }],
    });

    if (existingUser) {
      const field = existingUser.userId === userId ? "User ID" : "Phone number";
      return res.status(400).json({
        error: `${field} already exists`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      userId,
      phoneNumber,
      name,
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${name}&background=random`,
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        userId: user.userId,
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be userId or phoneNumber

    if (!identifier || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Find user by userId or phoneNumber
    const user = await User.findOne({
      $or: [{ userId: identifier }, { phoneNumber: identifier }],
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        userId: user.userId,
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: false,
      lastSeen: new Date(),
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Search for users to start chat
exports.searchUser = async (req, res) => {
  try {
    const { identifier } = req.query; // userId or phoneNumber

    if (!identifier) {
      return res
        .status(400)
        .json({ error: "User ID or phone number required" });
    }

    const user = await User.findOne({
      $or: [{ userId: identifier }, { phoneNumber: identifier }],
      _id: { $ne: req.user.id }, // Exclude current user
    }).select("userId phoneNumber name avatar isOnline lastSeen");

    if (!user) {
      return res.json({
        found: false,
        message: "No user found with this ID or phone number",
      });
    }

    res.json({
      found: true,
      user: {
        userId: user.userId,
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("Search User Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
