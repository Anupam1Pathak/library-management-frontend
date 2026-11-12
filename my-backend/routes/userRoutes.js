const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getUserCount } = require("../controllers/userController");

// Get total registered users
router.get("/count", authMiddleware, getUserCount);

module.exports = router;
