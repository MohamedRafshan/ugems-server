const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false,
    },
    firstName: {
      type: String,
      required: [true, "Please provide a first name"],
    },
    lastName: {
      type: String,
      required: [true, "Please provide a last name"],
    },
    role: {
      type: String,
      enum: ["student", "lecturer", "admin"],
      default: "student",
    },
    adminTier: {
      type: String,
      enum: ["super", "limited", null],
      default: null,
      sparse: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    course: {
      type: String,
      default: null,
    },
    year: {
      type: Number,
      default: null,
    },
    university: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
    },
    // LMS Fields
    address: {
      type: String,
      default: null,
    },
    nicNumber: {
      type: String,
      default: null,
    },
    alBatch: {
      type: String,
      default: null,
    },
    school: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    indexNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    // Still set adminTier if role was modified
    if (this.isModified("role")) {
      this.setAdminTier();
    }
    next();
  }

  // Set admin tier based on role and email
  if (this.isModified("role") || this.isModified("email")) {
    this.setAdminTier();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to set adminTier
userSchema.methods.setAdminTier = function () {
  const superAdminEmail = process.env.ADMIN_EMAIL;

  if (this.role === "student") {
    this.adminTier = null;
  } else if (this.email === superAdminEmail) {
    this.adminTier = "super";
    this.role = "admin"; // Ensure super admin has admin role
  } else if (this.role === "admin" || this.role === "lecturer") {
    this.adminTier = "limited";
  }
};

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate index number
userSchema.statics.generateIndexNumber = async function (alBatch) {
  const year = alBatch || new Date().getFullYear().toString();
  const prefix = `${year}UGEMS`;

  // Find the highest sequential number for this batch
  const lastUser = await this.findOne({ alBatch: year })
    .sort({ indexNumber: -1 })
    .select("indexNumber");

  let sequentialNumber = 1;
  if (lastUser && lastUser.indexNumber) {
    const lastNumber = parseInt(lastUser.indexNumber.replace(prefix, ""));
    sequentialNumber = lastNumber + 1;
  }

  // Pad with zeros to 5 digits
  const paddedNumber = String(sequentialNumber).padStart(5, "0");
  return `${prefix}${paddedNumber}`;
};

module.exports = mongoose.model("User", userSchema);
