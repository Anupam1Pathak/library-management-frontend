
import { useEffect, useState } from "react";
import api from "../api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingBook, setEditingBook] = useState(null);

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

  // Fetch all books
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

  // Fetch dashboard statistics from backend
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

  // Handle Add Book form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // Add a book
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

  // Open the Edit Book form
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

  // Update a book
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

  // Delete a book
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
      {/* Dashboard Header */}
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

      {/* Dashboard Statistics */}
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
          <p
            style={{
              color: "#b91c1c",
              marginBottom: "12px",
            }}
          >
            {statsError}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
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

      {/* Success and Error Messages */}
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

      {/* Edit Book Form */}
      {editingBook && (
        <section className="admin-section edit-book-section">
          <h2>Edit Book</h2>

          <p className="section-description">
            Update the book details and save your changes.
          </p>

          <form
            className="admin-form"
            onSubmit={saveEditedBook}
          >
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
              <label htmlFor="edit-quantity">
                Total Copies
              </label>
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
              <button
                type="submit"
                className="admin-add-button"
              >
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

      {/* Add Book Form */}
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
            <button
              type="submit"
              className="admin-add-button"
            >
              + Add Book
            </button>
          </div>
        </form>
      </section>

      {/* Manage Books */}
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h2>Manage Books</h2>

            <p className="section-description">
              Edit book details or remove books from your library.
            </p>
          </div>

          <span className="book-count">
            {books.length}{" "}
            {books.length === 1 ? "book" : "books"}
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
              <div
                className="admin-book-card"
                key={book._id}
              >
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
