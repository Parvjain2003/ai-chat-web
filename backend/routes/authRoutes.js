const express = require("express");
const {
  register,
  login,
  logout,
  searchUser,
} = require("../controllers/authController");
const authenticateToken = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticateToken, logout);
router.get("/search", authenticateToken, searchUser);

module.exports = router;
