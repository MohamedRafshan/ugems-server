/**
 * Migration script to set adminTier on existing users
 * Usage: node setAdminTiers.js
 *
 * This script:
 * 1. Sets adminTier="super" on the admin user matching process.env.ADMIN_EMAIL
 * 2. Sets adminTier="limited" on all other admins
 * 3. Sets adminTier="limited" on all lecturers
 * 4. Leaves adminTier as null for students
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

const migrateAdminTiers = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl =
      process.env.MONGODB_URI || "mongodb://localhost:27017/ugems";
    await mongoose.connect(mongoUrl);
    console.log("✓ Connected to MongoDB");

    const mainAdminEmail = process.env.ADMIN_EMAIL;

    if (!mainAdminEmail) {
      console.warn(
        "⚠️  ADMIN_EMAIL not set in environment. Skipping super admin setup.",
      );
    } else {
      // Set super admin tier
      const superAdminResult = await User.updateOne(
        { email: mainAdminEmail },
        { adminTier: "super", role: "admin" },
      );
      console.log(
        `✓ Set adminTier="super" for ${mainAdminEmail}`,
        superAdminResult,
      );
    }

    // Set limited tier for other admins (excluding main admin)
    const otherAdminsResult = await User.updateMany(
      { role: "admin", email: { $ne: mainAdminEmail } },
      { adminTier: "limited" },
    );
    console.log(
      `✓ Set adminTier="limited" for ${otherAdminsResult.modifiedCount} other admins`,
    );

    // Set limited tier for lecturers
    const lecturersResult = await User.updateMany(
      { role: "lecturer" },
      { adminTier: "limited" },
    );
    console.log(
      `✓ Set adminTier="limited" for ${lecturersResult.modifiedCount} lecturers`,
    );

    // Verify results
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$adminTier",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("\n📊 Admin Tier Distribution:");
    stats.forEach((stat) => {
      console.log(`  ${stat._id || "null"}: ${stat.count} users`);
    });

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

// Run migration
migrateAdminTiers();
