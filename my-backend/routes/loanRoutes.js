const express = require("express");

const {
  borrowBook,
  returnBook,
  getMyLoans,
  getAllLoans,
} = require("../controllers/loanController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Borrow a book
router.post("/borrow", authMiddleware, borrowBook);

// Return a book
router.post("/return", authMiddleware, returnBook);

// Get loans of the logged-in member
router.get("/my-loans", authMiddleware, getMyLoans);

// Get all loans (Admin/Librarian only)
// Role authorization is checked inside getAllLoans.
router.get("/all", authMiddleware, getAllLoans);

module.exports = router;
