const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "ugems@gmail.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: "ugems@gmail.com",
      password: "ugems@123",
      firstName: "UGEMS",
      lastName: "Admin",
      role: "admin",
      isActive: true,
    });

    console.log("✅ Admin user created successfully");
    console.log("Email: ugems@gmail.com");
    console.log("Password: ugems@123");
    console.log("Role: admin");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
