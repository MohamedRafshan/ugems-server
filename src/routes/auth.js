const express = require("express");
const {
  register,
  login,
  getUser,
  logout,
  adminLogin,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.get("/me", protect, getUser);
router.post("/logout", protect, logout);

module.exports = router;
