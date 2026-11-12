const User = require("../models/User");

const getUserCount = async (req, res) => {
  try {
    // Only Admin and Librarian can access statistics
    if (!req.user || !["ADMIN", "LIBRARIAN"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      totalUsers,
    });
  } catch (error) {
    console.error("Error counting users:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get total user count",
    });
  }
};

module.exports = { getUserCount };
