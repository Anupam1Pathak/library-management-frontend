
import { useEffect, useState } from "react";
import api from "../api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingBook, setEditingBook] = useState(null);

  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogResults, setCatalogResults] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState({});
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    borrowedBooks: 0,
    overdueLoans: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    quantity: 1,
  });

  // FETCH ALL BOOKS
  const fetchBooks = async () => {
    try {
      const response = await api.get("/books");
      const data = response.data;

      setBooks(Array.isArray(data) ? data : data.books || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load books."
      );
    } finally {
      setLoading(false);
    }
  };

  // FETCH DASHBOARD STATISTICS
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError("");

      const response = await api.get("/dashboard/stats");

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      setStatsError(
        err.response?.data?.message ||
          "Failed to load dashboard statistics."
      );
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchDashboardStats();
  }, []);

  // GET AN ONLINE BOOK LINK.
  // Always returns a URL, even if full-text reading is unavailable.
  const getCatalogReadUrl = (book) => {
    if (
      typeof book.detailsUrl === "string" &&
      book.detailsUrl.startsWith("https://openlibrary.org/")
    ) {
      return book.detailsUrl;
    }

    const volumeId = book.volumeId || book.key;

    if (
      typeof volumeId === "string" &&
      volumeId.startsWith("/works/")
    ) {
      return `https://openlibrary.org${volumeId}`;
    }

    const query = `${book.title || ""} ${book.author || ""}`.trim();

    return `https://openlibrary.org/search?q=${encodeURIComponent(
      query
    )}`;
  };

  // SEARCH OPEN LIBRARY
  const searchCatalog = async (e) => {
    e.preventDefault();

    if (!catalogSearch.trim()) {
      setError("Enter a book title or author to search.");
      return;
    }

    setError("");
    setMessage("");
    setCatalogLoading(true);
    setCatalogResults([]);
    setSelectedCatalog({});

    try {
      const response = await api.get("/books/catalog/search", {
        params: { q: catalogSearch.trim() },
      });

      const results = response.data.books || [];
      setCatalogResults(results);

      if (results.length === 0) {
        setMessage("No books found. Try another title or author.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to search Open Library."
      );
    } finally {
      setCatalogLoading(false);
    }
  };

  // SELECT OR UNSELECT A CATALOG BOOK
  const toggleCatalogBook = (book, checked) => {
    setSelectedCatalog((previous) => {
      const updated = { ...previous };

      if (checked) {
        updated[book.volumeId] = {
          volumeId: book.volumeId,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          category: book.category,
          quantity: 1,
        };
      } else {
        delete updated[book.volumeId];
      }

      return updated;
    });
  };

  // IMPORT SELECTED BOOKS
  const importSelectedBooks = async () => {
    const selectedBooks = Object.values(selectedCatalog);

    if (selectedBooks.length === 0) {
      setError("Select at least one book to import.");
      return;
    }

    if (selectedBooks.length > 50) {
      setError("You can import a maximum of 50 books at a time.");
      return;
    }

    const invalidQuantity = selectedBooks.some(
      (book) =>
        !Number.isInteger(Number(book.quantity)) ||
        Number(book.quantity) < 1
    );

    if (invalidQuantity) {
      setError(
        "Every selected book must have a positive whole-number copy quantity."
      );
      return;
    }

    setError("");
    setMessage("");
    setImportLoading(true);

    try {
      const response = await api.post("/books/catalog/import", {
        books: selectedBooks.map((book) => ({
          volumeId: book.volumeId,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          category: book.category,
          quantity: Number(book.quantity),
        })),
      });

      setMessage(
        `Import complete: ${response.data.imported} imported, ${response.data.skipped} skipped.`
      );

      setSelectedCatalog({});
      await fetchBooks();
      await fetchDashboardStats();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to import selected books."
      );
    } finally {
      setImportLoading(false);
    }
  };

  // HANDLE MANUAL BOOK FORM CHANGES
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // ADD BOOK MANUALLY
  const addBook = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    try {
      const response = await api.post("/books", {
        ...form,
        quantity,
      });

      setMessage(response.data.message || "Book added successfully!");

      setForm({
        title: "",
        author: "",
        isbn: "",
        category: "",
        quantity: 1,
      });

      await fetchBooks();
      await fetchDashboardStats();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to add book. Check your permissions."
      );
    }
  };

  // OPEN EDIT FORM
  const editBook = (book) => {
    setError("");
    setMessage("");

    setEditingBook({
      _id: book._id,
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      category: book.category || "",
      quantity: book.quantity ?? 1,
    });
  };

  // SAVE EDITED BOOK
  const saveEditedBook = async (e) => {
    e.preventDefault();

    if (!editingBook) return;

    const quantity = Number(editingBook.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (
      !editingBook.title.trim() ||
      !editingBook.author.trim() ||
      !editingBook.isbn.trim() ||
      !editingBook.category.trim()
    ) {
      setError("Please fill in all book details.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await api.put(
        `/books/${editingBook._id}`,
        {
          title: editingBook.title.trim(),
          author: editingBook.author.trim(),
          isbn: editingBook.isbn.trim(),
          category: editingBook.category.trim(),
          quantity,
        }
      );

      setMessage(
        response.data.message || "Book updated successfully!"
      );

      setEditingBook(null);
      await fetchBooks();
      await fetchDashboardStats();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update book."
      );
    }
  };

  // DELETE BOOK
  const deleteBook = async (book) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await api.delete(`/books/${book._id}`);

      setMessage(
        response.data.message || "Book deleted successfully!"
      );

      if (editingBook?._id === book._id) {
        setEditingBook(null);
      }

      await fetchBooks();
      await fetchDashboardStats();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete book."
      );
    }
  };

  const statCards = [
    {
      title: "Total Book Titles",
      value: stats.totalBooks,
      icon: "📚",
      color: "#2563eb",
      background: "#eff6ff",
    },
    {
      title: "Registered Users",
      value: stats.totalUsers,
      icon: "👥",
      color: "#15803d",
      background: "#f0fdf4",
    },
    {
      title: "Books Borrowed",
      value: stats.borrowedBooks,
      icon: "📖",
      color: "#b45309",
      background: "#fffbeb",
    },
    {
      title: "Overdue Loans",
      value: stats.overdueLoans,
      icon: "⏰",
      color: "#b91c1c",
      background: "#fef2f2",
    },
  ];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* DASHBOARD HEADER */}
      <div className="admin-header">
        <div>
          <p className="admin-eyebrow">
            LIBRARY MANAGEMENT SYSTEM
          </p>

          <h1>Admin Dashboard</h1>

          <p className="admin-subtitle">
            Manage your library books and inventory.
          </p>
        </div>

        <div className="admin-total">
          <span>Total Book Titles</span>
          <strong>{books.length}</strong>
        </div>
      </div>

      {/* DASHBOARD STATISTICS */}
      <section style={{ margin: "25px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0 }}>Library Overview</h2>

          <button
            type="button"
            onClick={fetchDashboardStats}
            disabled={statsLoading}
            style={{
              padding: "9px 15px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
              background: "#ffffff",
              cursor: statsLoading ? "wait" : "pointer",
            }}
          >
            {statsLoading ? "Refreshing..." : "↻ Refresh Statistics"}
          </button>
        </div>

        {statsError && (
          <p style={{ color: "#b91c1c", marginBottom: "12px" }}>
            {statsError}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "18px",
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.title}
              style={{
                background: card.background,
                borderRadius: "12px",
                padding: "22px",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    color: "#374151",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {card.title}
                </span>

                <span style={{ fontSize: "25px" }}>
                  {card.icon}
                </span>
              </div>

              <h2
                style={{
                  color: card.color,
                  fontSize: "32px",
                  margin: "15px 0 0",
                }}
              >
                {statsLoading ? "..." : card.value ?? 0}
              </h2>
            </div>
          ))}
        </div>
      </section>

      {/* SUCCESS AND ERROR MESSAGES */}
      {message && (
        <p className="admin-message admin-success">
          {message}
        </p>
      )}

      {error && (
        <p className="admin-message admin-error">
          {error}
        </p>
      )}

      {/* EDIT BOOK FORM */}
      {editingBook && (
        <section className="admin-section edit-book-section">
          <h2>Edit Book</h2>

          <p className="section-description">
            Update the book details and save your changes.
          </p>

          <form className="admin-form" onSubmit={saveEditedBook}>
            <div className="admin-field">
              <label htmlFor="edit-title">Book Title</label>
              <input
                id="edit-title"
                value={editingBook.title}
                onChange={(e) =>
                  setEditingBook({
                    ...editingBook,
                    title: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="edit-author">Author</label>
              <input
                id="edit-author"
                value={editingBook.author}
                onChange={(e) =>
                  setEditingBook({
                    ...editingBook,
                    author: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="edit-isbn">ISBN</label>
              <input
                id="edit-isbn"
                value={editingBook.isbn}
                onChange={(e) =>
                  setEditingBook({
                    ...editingBook,
                    isbn: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="edit-category">Category</label>
              <input
                id="edit-category"
                value={editingBook.category}
                onChange={(e) =>
                  setEditingBook({
                    ...editingBook,
                    category: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="edit-quantity">Total Copies</label>
              <input
                id="edit-quantity"
                type="number"
                min="1"
                step="1"
                value={editingBook.quantity}
                onChange={(e) =>
                  setEditingBook({
                    ...editingBook,
                    quantity: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="admin-form-action edit-actions">
              <button type="submit" className="admin-add-button">
                Save Changes
              </button>

              <button
                type="button"
                className="admin-cancel-button"
                onClick={() => {
                  setEditingBook(null);
                  setError("");
                  setMessage("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* SEARCH AND IMPORT REAL PUBLISHED BOOKS */}
      <section className="admin-section">
        <h2>Import Real Published Books</h2>

        <p className="section-description">
          Search Open Library and add selected titles to your library.
          Enter the number of physical copies you actually own.
        </p>

        <form
          onSubmit={searchCatalog}
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <input
            type="text"
            value={catalogSearch}
            onChange={(e) => setCatalogSearch(e.target.value)}
            placeholder="Search by book title or author..."
            style={{
              flex: "1",
              minWidth: "220px",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "7px",
            }}
          />

          <button type="submit" disabled={catalogLoading}>
            {catalogLoading ? "Searching..." : "Search Books"}
          </button>
        </form>

        {/* CATALOG SEARCH RESULTS */}
        {catalogResults.map((book) => {
          const selected = selectedCatalog[book.volumeId];

          const canSelect = Boolean(
            book.volumeId &&
              book.title &&
              book.author &&
              book.isbn
          );

          return (
            <div
              key={book.volumeId || `${book.title}-${book.author}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "12px",
              }}
            >
              {book.thumbnail && (
                <img
                  src={book.thumbnail}
                  alt={`Cover of ${book.title}`}
                  loading="lazy"
                  style={{
                    width: "65px",
                    maxHeight: "100px",
                    objectFit: "contain",
                  }}
                />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ marginTop: 0 }}>{book.title}</h3>

                <p>Author: {book.author || "Not available"}</p>
                <p>Category: {book.category || "General"}</p>
                <p>ISBN: {book.isbn || "Not available"}</p>

                {/* READ ONLINE BUTTON - ALWAYS VISIBLE */}
                <a
                  href={getCatalogReadUrl(book)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    margin: "4px 0 12px",
                    padding: "9px 14px",
                    borderRadius: "6px",
                    backgroundColor: "#15803d",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Read Online
                </a>

                {!canSelect && (
                  <p style={{ color: "#b91c1c" }}>
                    This result is missing a title, author, or ISBN
                    and cannot be imported.
                  </p>
                )}

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selected)}
                    disabled={!canSelect}
                    onChange={(e) =>
                      toggleCatalogBook(book, e.target.checked)
                    }
                  />
                  Select book
                </label>

                {selected && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "10px",
                    }}
                  >
                    Physical copies:

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={selected.quantity}
                      onChange={(e) =>
                        setSelectedCatalog((previous) => ({
                          ...previous,
                          [book.volumeId]: {
                            ...previous[book.volumeId],
                            quantity: e.target.value,
                          },
                        }))
                      }
                      style={{ width: "85px", padding: "6px" }}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}

        {catalogResults.length > 0 && (
          <button
            type="button"
            onClick={importSelectedBooks}
            disabled={
              importLoading ||
              Object.keys(selectedCatalog).length === 0
            }
          >
            {importLoading
              ? "Importing..."
              : `Import Selected (${Object.keys(selectedCatalog).length})`}
          </button>
        )}
      </section>

      {/* ADD BOOK MANUALLY */}
      <section className="admin-section">
        <h2>Add New Book</h2>

        <p className="section-description">
          Enter the details below to add a book to your library.
        </p>

        <form className="admin-form" onSubmit={addBook}>
          <div className="admin-field">
            <label htmlFor="title">Book Title</label>
            <input
              id="title"
              name="title"
              placeholder="e.g. Java Programming"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="author">Author</label>
            <input
              id="author"
              name="author"
              placeholder="Enter author name"
              value={form.author}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="isbn">ISBN</label>
            <input
              id="isbn"
              name="isbn"
              placeholder="Enter ISBN"
              value={form.isbn}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              name="category"
              placeholder="e.g. Programming"
              value={form.category}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="quantity">Total Copies</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form-action">
            <button type="submit" className="admin-add-button">
              + Add Book
            </button>
          </div>
        </form>
      </section>

      {/* MANAGE BOOKS */}
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Manage Books</h2>

            <p className="section-description">
              Edit book details or remove books from your library.
            </p>
          </div>

          <span className="book-count">
            {books.length} {books.length === 1 ? "book" : "books"}
          </span>
        </div>

        {books.length === 0 ? (
          <div className="admin-empty">
            <h3>No books found</h3>
            <p>Add your first book using the form above.</p>
          </div>
        ) : (
          <div className="admin-books-grid">
            {books.map((book) => (
              <div className="admin-book-card" key={book._id}>
                <div className="book-card-top">
                  <div className="book-icon">BOOK</div>

                  <span className="book-category">
                    {book.category || "General"}
                  </span>
                </div>

                <h3>{book.title}</h3>

                <p className="book-author">
                  By {book.author || "Unknown author"}
                </p>

                <p className="book-isbn">
                  ISBN: {book.isbn || "Not provided"}
                </p>

                <div className="book-inventory">
                  <div>
                    <span>Total Copies</span>
                    <strong>{book.quantity}</strong>
                  </div>

                  <div>
                    <span>Available</span>
                    <strong>{book.availableQuantity}</strong>
                  </div>
                </div>

                <div className="admin-book-actions">
                  <button
                    type="button"
                    className="admin-edit-button"
                    onClick={() => editBook(book)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => deleteBook(book)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
