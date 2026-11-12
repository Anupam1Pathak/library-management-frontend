const express = require("express");

const {
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  searchCatalogBooks,
  importCatalogBooks,
} = require("../controllers/bookController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Add book: ADMIN or LIBRARIAN
router.post("/", authMiddleware, roleMiddleware("ADMIN", "LIBRARIAN"), addBook);

// Search Open Library catalog: logged-in users
// Keep this route before /:id
router.get("/catalog/search", authMiddleware, searchCatalogBooks);

// Import selected books: ADMIN or LIBRARIAN
router.post(
  "/catalog/import",
  authMiddleware,
  roleMiddleware("ADMIN", "LIBRARIAN"),
  importCatalogBooks,
);

// Get all books: logged-in users
router.get("/", authMiddleware, getBooks);

// Get one book
router.get("/:id", authMiddleware, getBookById);

// Update book: ADMIN or LIBRARIAN
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "LIBRARIAN"),
  updateBook,
);

// Delete book: ADMIN only
router.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), deleteBook);

module.exports = router;
