
import { useEffect, useState } from "react";
import api from "../api";

function Books() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [borrowingId, setBorrowingId] = useState("");

  const fetchBooks = async () => {
    try {
      const response = await api.get("/books");
      const data = response.data;

      setBooks(Array.isArray(data) ? data : data.books || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Failed to load books. Please log in again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const borrowBook = async (bookId) => {
    setMessage("");
    setError("");
    setBorrowingId(bookId);

    try {
      const response = await api.post("/loans/borrow", { bookId });
      setMessage(response.data.message || "Book borrowed successfully!");
      await fetchBooks();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Unable to borrow this book."
      );
    } finally {
      setBorrowingId("");
    }
  };

  const filteredBooks = books.filter((book) => {
    const query = search.toLowerCase();

    return (
      (book.title || "").toLowerCase().includes(query) ||
      (book.author || "").toLowerCase().includes(query) ||
      (book.category || "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <p>Loading books...</p>;
  }

  if (error && books.length === 0) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Library Books</h1>

      <input
        type="text"
        placeholder="Search by title, author, or category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "10px",
          marginBottom: "20px",
          boxSizing: "border-box",
        }}
      />

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {filteredBooks.length === 0 ? (
        <p>No matching books found.</p>
      ) : (
        filteredBooks.map((book) => (
          <div
            key={book._id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "12px",
            }}
          >
            <h3>{book.title}</h3>
            <p>Author: {book.author}</p>
            <p>Category: {book.category}</p>
            <p>Available copies: {book.availableQuantity}</p>

            <button
              onClick={() => borrowBook(book._id)}
              disabled={
                book.availableQuantity <= 0 || borrowingId !== ""
              }
            >
              {borrowingId === book._id
                ? "Borrowing..."
                : book.availableQuantity <= 0
                ? "Not Available"
                : "Borrow Book"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Books;
