const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id, role, adminTier) => {
  return jwt.sign({ id, role, adminTier }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "7d",
  });
};

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      address,
      nicNumber,
      alBatch,
      school,
    } = req.body;

    // Validation - all fields required for student registration
    if (!email || !password || !firstName || !lastName || !address || !nicNumber || !alBatch || !school) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: email, password, firstName, lastName, address, nicNumber, alBatch, school",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Generate index number for student
    const indexNumber = await User.generateIndexNumber(alBatch);

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: "student", // Hard-coded to student only
      address,
      nicNumber,
      alBatch,
      school,
      indexNumber,
    });

    const token = generateToken(user._id, user.role, user.adminTier);

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        indexNumber: user.indexNumber,
        address: user.address,
        school: user.school,
        alBatch: user.alBatch,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log("=== LOGIN DEBUG ===");
    console.log("user.email:", user.email);
    console.log("process.env.ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
    console.log("emails match:", user.email === process.env.ADMIN_EMAIL);

    // Ensure env admin has super tier set
    if (user.email === process.env.ADMIN_EMAIL) {
      console.log("Setting adminTier to super for env admin");
      user.adminTier = "super";
      user.role = "admin";
      await user.save();
      console.log("After save - user.adminTier:", user.adminTier);
    }

    const token = generateToken(user._id, user.role, user.adminTier);

    console.log("Login response user.adminTier:", user.adminTier);
    console.log("==================");

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        adminTier: user.adminTier,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Ensure env admin has super tier set
    if (user.email === process.env.ADMIN_EMAIL) {
      if (user.adminTier !== "super" || user.role !== "admin") {
        user.adminTier = "super";
        user.role = "admin";
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        adminTier: user.adminTier,
        indexNumber: user.indexNumber,
        address: user.address,
        nicNumber: user.nicNumber,
        alBatch: user.alBatch,
        school: user.school,
        profilePicture: user.profilePicture,
        course: user.course,
        year: user.year,
        university: user.university,
        bio: user.bio,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Admin-only login with env credentials
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check against env credentials
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Create or get admin user from database
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      // Create admin user if doesn't exist
      adminUser = await User.create({
        email: adminEmail,
        password: adminPassword,
        firstName: "UGEMS",
        lastName: "Admin",
        role: "admin",
        isActive: true,
      });
    }

    const token = generateToken(adminUser._id, adminUser.role);

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
