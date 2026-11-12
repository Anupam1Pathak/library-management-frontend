
const Loan = require("../models/Loan");
const Book = require("../models/Book");

// ==================== BORROW BOOK ====================

const borrowBook = async (req, res) => {
  let bookId;
  let stockReserved = false;

  try {
    ({ bookId } = req.body);

    if (!bookId) {
      return res.status(400).json({
        error: "Book ID is required",
      });
    }

    // Reserve one available copy atomically
    const book = await Book.findOneAndUpdate(
      {
        _id: bookId,
        availableQuantity: { $gt: 0 },
      },
      {
        $inc: { availableQuantity: -1 },
      },
      { new: true }
    );

    if (!book) {
      const bookExists = await Book.exists({ _id: bookId });

      if (!bookExists) {
        return res.status(404).json({
          error: "Book not found",
        });
      }

      return res.status(400).json({
        error: "Book is not available",
      });
    }

    stockReserved = true;

    const loan = new Loan({
      user: req.user.id,
      book: bookId,
      dueDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
    });

    await loan.save();
    stockReserved = false;

    return res.status(201).json({
      message: "Book borrowed successfully",
      loan,
      availableQuantity: book.availableQuantity,
    });
  } catch (error) {
    if (stockReserved && bookId) {
      try {
        await Book.updateOne(
          { _id: bookId },
          { $inc: { availableQuantity: 1 } }
        );
      } catch (rollbackError) {
        console.error(
          "Inventory rollback failed:",
          rollbackError.message
        );
      }
    }

    return res.status(500).json({
      error: error.message,
    });
  }
};

// ==================== RETURN BOOK ====================

const returnBook = async (req, res) => {
  try {
    const { loanId } = req.body;

    if (!loanId) {
      return res.status(400).json({
        error: "Loan ID is required",
      });
    }

    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({
        error: "Loan not found",
      });
    }

    const isOwner = loan.user.toString() === req.user.id;
    const isStaff = ["ADMIN", "LIBRARIAN"].includes(
      String(req.user.role || "").toUpperCase()
    );

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        error: "You are not authorized to return this loan",
      });
    }

    if (loan.status === "RETURNED") {
      return res.status(400).json({
        error: "Book already returned",
      });
    }

    const updatedLoan = await Loan.findOneAndUpdate(
      {
        _id: loanId,
        status: "BORROWED",
      },
      {
        $set: {
          status: "RETURNED",
          returnDate: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedLoan) {
      return res.status(400).json({
        error: "Book already returned",
      });
    }

    const book = await Book.findByIdAndUpdate(
      loan.book,
      { $inc: { availableQuantity: 1 } },
      { new: true }
    );

    if (!book) {
      return res.status(500).json({
        error: "Loan returned, but book inventory could not be updated",
        loan: updatedLoan,
      });
    }

    return res.status(200).json({
      message: "Book returned successfully",
      loan: updatedLoan,
      availableQuantity: book.availableQuantity,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ==================== GET MY LOANS ====================

const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({
      user: req.user.id,
    }).populate("book", "title author");

    return res.status(200).json({
      count: loans.length,
      loans,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ==================== GET ALL LOANS (ADMIN/LIBRARIAN) ====================

const getAllLoans = async (req, res) => {
  try {
    const role = String(req.user.role || "").toUpperCase();

    // Only Admin and Librarian can view every member's loans
    if (!["ADMIN", "LIBRARIAN"].includes(role)) {
      return res.status(403).json({
        error: "Access denied. Admin or Librarian only.",
      });
    }

    const loans = await Loan.find()
      .populate("user", "name email")
      .populate("book", "title author isbn")
      .sort({ issueDate: -1 });

    const now = new Date();

    const loansWithDetails = loans.map((loan) => {
      const item = loan.toObject();

      item.isOverdue =
        item.status === "BORROWED" &&
        item.dueDate &&
        new Date(item.dueDate) < now;

      return item;
    });

    return res.status(200).json({
      count: loansWithDetails.length,
      loans: loansWithDetails,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ==================== EXPORT FUNCTIONS ====================

module.exports = {
  borrowBook,
  returnBook,
  getMyLoans,
  getAllLoans,
};
