 
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
      const response = await api.post("/loans/borrow", {
        bookId,
      });

      setMessage(
        response.data.message || "Book borrowed successfully!"
      );

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

  // Always provide an online book link.
  const getReadOnlineUrl = (book) => {
    if (book.detailsUrl) {
      return book.detailsUrl;
    }

    if (
      typeof book.volumeId === "string" &&
      book.volumeId.startsWith("/works/")
    ) {
      return `https://openlibrary.org${book.volumeId}`;
    }

    const query = `${book.title || ""} ${book.author || ""}`.trim();

    return `https://openlibrary.org/search?q=${encodeURIComponent(
      query
    )}`;
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
    return <p style={{ padding: "20px" }}>Loading books...</p>;
  }

  if (error && books.length === 0) {
    return (
      <p style={{ color: "red", padding: "20px" }}>
        {error}
      </p>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
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
          border: "1px solid #ccc",
          borderRadius: "6px",
        }}
      />

      {message && (
        <p style={{ color: "green" }}>{message}</p>
      )}

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

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
              backgroundColor: "#fff",
            }}
          >
            <h3>{book.title}</h3>

            <p>Author: {book.author}</p>

            <p>Category: {book.category}</p>

            <p>
              Available copies: {book.availableQuantity}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "12px",
              }}
            >
              <button
                onClick={() => borrowBook(book._id)}
                disabled={
                  book.availableQuantity <= 0 ||
                  borrowingId !== ""
                }
                style={{
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "5px",
                  backgroundColor:
                    book.availableQuantity <= 0 ||
                    borrowingId !== ""
                      ? "#999"
                      : "#2563eb",
                  color: "white",
                  cursor:
                    book.availableQuantity <= 0 ||
                    borrowingId !== ""
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {borrowingId === book._id
                  ? "Borrowing..."
                  : book.availableQuantity <= 0
                  ? "Not Available"
                  : "Borrow Book"}
              </button>

              <a
                href={getReadOnlineUrl(book)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "10px 16px",
                  borderRadius: "5px",
                  backgroundColor: "#15803d",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Read Online
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Books;
