const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },

  issueDate: {
    type: Date,
    default: Date.now,
  },

  dueDate: {
    type: Date,
    required: true,
  },

  returnDate: {
    type: Date,
    default: null,
  },

  status: {
    type: String,
    enum: ["BORROWED", "RETURNED"],
    default: "BORROWED",
  },
});

module.exports = mongoose.model("Loan", loanSchema);
