const express = require("express");
const { register, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

// Protected route
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.user,
  });
});

// ADMIN-only route
router.get("/admin", authMiddleware, roleMiddleware("ADMIN"), (req, res) => {
  res.json({
    message: "Welcome Admin!",
  });
});

module.exports = router;
