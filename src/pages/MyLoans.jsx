
import { useEffect, useState } from "react";
import api from "../api";

function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [returningId, setReturningId] = useState("");

  const fetchLoans = async () => {
    try {
      const response = await api.get("/loans/my-loans");
      setLoans(response.data.loans || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to load your loans."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const returnBook = async (loanId) => {
    try {
      setReturningId(loanId);
      setError("");
      setMessage("");

      const response = await api.post("/loans/return", { loanId });

      setMessage(response.data.message || "Book returned successfully!");

      await fetchLoans();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to return the book."
      );
    } finally {
      setReturningId("");
    }
  };

  if (loading) {
    return <p>Loading your loans...</p>;
  }

  if (error && loans.length === 0) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Loans</h1>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {loans.length === 0 ? (
        <p>You haven't borrowed any books yet.</p>
      ) : (
        loans.map((loan) => (
          <div
            key={loan._id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "12px",
            }}
          >
            <h3>{loan.book?.title || "Book details unavailable"}</h3>

            <p>Author: {loan.book?.author || "Unknown"}</p>

            <p>
              Borrowed on:{" "}
              {loan.issueDate
                ? new Date(loan.issueDate).toLocaleDateString()
                : "N/A"}
            </p>

            <p>
              Due date:{" "}
              {loan.dueDate
                ? new Date(loan.dueDate).toLocaleDateString()
                : "N/A"}
            </p>

            <p>
              Returned on:{" "}
              {loan.returnDate
                ? new Date(loan.returnDate).toLocaleDateString()
                : "Not returned"}
            </p>

            <p>
              Status: <strong>{loan.status}</strong>
            </p>

            {loan.status === "BORROWED" && (
              <button
                onClick={() => returnBook(loan._id)}
                disabled={returningId !== ""}
              >
                {returningId === loan._id
                  ? "Returning..."
                  : "Return Book"}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MyLoans;
