const Book = require("../models/Book");

// ADD BOOK
const addBook = async (req, res) => {
  try {
    const { title, author, isbn, category, quantity } = req.body;
    const copies = Number(quantity);

    if (!Number.isInteger(copies) || copies < 1) {
      return res.status(400).json({
        error: "Quantity must be a positive whole number.",
      });
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      category,
      quantity: copies,
      availableQuantity: copies,
    });

    res.status(201).json({
      message: "Book added successfully",
      book,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      error:
        error.code === 11000
          ? "A book with this ISBN already exists."
          : error.message,
    });
  }
};

// GET ALL BOOKS
const getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BOOK BY ID
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE BOOK
const updateBook = async (req, res) => {
  try {
    const { title, author, isbn, category, quantity } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    book.title = title ?? book.title;
    book.author = author ?? book.author;
    book.isbn = isbn ?? book.isbn;
    book.category = category ?? book.category;

    if (quantity !== undefined) {
      const newQuantity = Number(quantity);

      if (!Number.isInteger(newQuantity) || newQuantity < 1) {
        return res.status(400).json({
          error: "Quantity must be a positive whole number.",
        });
      }

      const borrowedBooks = book.quantity - book.availableQuantity;

      if (newQuantity < borrowedBooks) {
        return res.status(400).json({
          error: "Quantity cannot be less than borrowed books.",
        });
      }

      book.quantity = newQuantity;
      book.availableQuantity = newQuantity - borrowedBooks;
    }

    await book.save();

    res.json({
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      error:
        error.code === 11000
          ? "A book with this ISBN already exists."
          : error.message,
    });
  }
};

// DELETE BOOK
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// SEARCH REAL PUBLISHED BOOKS USING OPEN LIBRARY
const searchCatalogBooks = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        error: "Enter a book title or author to search.",
      });
    }

    const url = new URL("https://openlibrary.org/search.json");

    url.searchParams.set("q", query);
    url.searchParams.set(
      "fields",
      "key,title,author_name,isbn,subject,cover_i,availability",
    );
    url.searchParams.set("limit", "20");

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Open Library status:", response.status);

      return res.status(502).json({
        error: "Open Library is temporarily unavailable. Please try again.",
      });
    }

    const data = await response.json();

    const books = (data.docs || []).map((item) => {
      const isbnList = item.isbn || [];

      const isbn =
        isbnList.find((value) => /^\d{13}$/.test(value)) ||
        isbnList.find((value) => /^\d{9}[\dX]$/i.test(value)) ||
        "";

      const availability = item.availability || {};

      const status = String(
        availability.status || availability.availability || "",
      ).toLowerCase();

      const identifier =
        availability.identifier || item.key?.replace("/works/", "");

      // Show Read Online only when Open Library reports open access.
      const canReadOnline = status === "open" && Boolean(identifier);

      return {
        volumeId: item.key || "",
        title: item.title || "",
        author: (item.author_name || []).join(", "),
        isbn,
        category: item.subject?.[0] || "General",
        thumbnail: item.cover_i
          ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
          : "",
        canReadOnline,
        readUrl: canReadOnline
          ? `https://archive.org/details/${encodeURIComponent(identifier)}`
          : "",
        detailsUrl: item.key
          ? `https://openlibrary.org${item.key}`
          : "https://openlibrary.org",
      };
    });

    res.json({ books });
  } catch (error) {
    console.error("Open Library search error:", error.message);

    res.status(502).json({
      error: "Could not connect to Open Library. Please try again.",
    });
  }
};

// IMPORT SELECTED BOOKS INTO MONGODB
const importCatalogBooks = async (req, res) => {
  try {
    const { books } = req.body;

    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({
        error: "Select at least one book to import.",
      });
    }

    if (books.length > 50) {
      return res.status(400).json({
        error: "You can import a maximum of 50 books at a time.",
      });
    }

    const results = [];

    for (const item of books) {
      try {
        const title = String(item.title || "").trim();
        const author = String(item.author || "").trim();
        const isbn = String(item.isbn || "").trim();
        const category = String(item.category || "General").trim();
        const quantity = Number(item.quantity);

        if (
          !title ||
          !author ||
          !isbn ||
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          results.push({
            status: "skipped",
            title,
            message:
              "Title, author, ISBN, and a valid copy quantity are required.",
          });
          continue;
        }

        const existingBook = await Book.findOne({ isbn });

        if (existingBook) {
          results.push({
            status: "skipped",
            title,
            message: "This ISBN already exists in your library.",
          });
          continue;
        }

        await Book.create({
          title,
          author,
          isbn,
          category,
          quantity,
          availableQuantity: quantity,
        });

        results.push({
          status: "imported",
          title,
        });
      } catch (error) {
        results.push({
          status: "skipped",
          title: item.title || "",
          message:
            error.code === 11000
              ? "This ISBN already exists in your library."
              : "Could not import this book.",
        });
      }
    }

    res.json({
      message: "Book import completed.",
      imported: results.filter((item) => item.status === "imported").length,
      skipped: results.filter((item) => item.status === "skipped").length,
      results,
    });
  } catch (error) {
    console.error("Book import error:", error.message);

    res.status(500).json({
      error: "Failed to import books.",
    });
  }
};

module.exports = {
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  searchCatalogBooks,
  importCatalogBooks,
};
