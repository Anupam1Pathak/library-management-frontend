require("dotenv").config();
const mongoose = require("mongoose");
const Book = require("./models/Book");
require("./models/User");
const Loan = require("./models/Loan");

async function checkInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const bookId = "6ac49db5d649e63f9bfa2b7c";

    const book = await Book.findById(bookId);

    if (!book) {
      console.log("Book not found.");
      return;
    }

    const activeLoans = await Loan.find({
      book: bookId,
      status: "BORROWED",
    }).populate("user", "name");

    console.log("Book:", book.title);
    console.log("Total copies:", book.quantity);
    console.log("Available copies:", book.availableQuantity);
    console.log("Active loan count:", activeLoans.length);

    console.table(
      activeLoans.map((loan) => ({
        loanId: loan._id.toString(),
        status: loan.status,
        borrower: loan.user?.name ?? "Unknown",
        dueDate: loan.dueDate,
      })),
    );
  } catch (error) {
    console.error("Check failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkInventory();
