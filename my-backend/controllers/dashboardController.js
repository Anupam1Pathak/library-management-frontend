const Book = require("../models/Book");
const User = require("../models/User");
const Loan = require("../models/Loan");

const getDashboardStats = async (req, res) => {
  try {
    // Only Admin and Librarian can view statistics
    if (!req.user || !["ADMIN", "LIBRARIAN"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();

    const borrowedBooks = await Loan.countDocuments({
      status: "BORROWED",
    });

    const overdueLoans = await Loan.countDocuments({
      status: "BORROWED",
      dueDate: { $lt: new Date() },
    });

    res.status(200).json({
      success: true,
      stats: {
        totalBooks,
        totalUsers,
        borrowedBooks,
        overdueLoans,
      },
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

module.exports = { getDashboardStats };
