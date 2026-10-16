
import { useEffect, useState } from "react";
import api from "../api";

function AllLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchLoans = async () => {
    try {
      const response = await api.get("/loans/all");
      setLoans(response.data.loans || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load loans."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const filteredLoans = loans.filter((loan) => {
    const searchText = search.toLowerCase();

    const memberName = loan.user?.name || "";
    const memberEmail = loan.user?.email || "";
    const bookTitle = loan.book?.title || "";
    const author = loan.book?.author || "";

    const matchesSearch = [
      memberName,
      memberEmail,
      bookTitle,
      author,
    ].some((value) => value.toLowerCase().includes(searchText));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "OVERDUE" && loan.isOverdue) ||
      (statusFilter === "BORROWED" &&
        loan.status === "BORROWED" &&
        !loan.isOverdue) ||
      (statusFilter === "RETURNED" &&
        loan.status === "RETURNED");

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString();
  };

  const borrowedCount = loans.filter(
    (loan) => loan.status === "BORROWED"
  ).length;

  const returnedCount = loans.filter(
    (loan) => loan.status === "RETURNED"
  ).length;

  const overdueCount = loans.filter(
    (loan) => loan.isOverdue
  ).length;

  if (loading) {
    return <div style={{ padding: 25 }}>Loading all loans...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "30px auto", padding: 20 }}>
      <h1>All Library Loans</h1>
      <p>Monitor borrowed books, member details, and overdue loans.</p>

      {error && (
        <p style={{ color: "red", margin: "15px 0" }}>{error}</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 15,
          margin: "25px 0",
        }}
      >
        <div style={cardStyle}>
          <p>Total Loans</p>
          <h2>{loans.length}</h2>
        </div>

        <div style={cardStyle}>
          <p>Currently Borrowed</p>
          <h2>{borrowedCount}</h2>
        </div>

        <div style={cardStyle}>
          <p>Returned</p>
          <h2>{returnedCount}</h2>
        </div>

        <div style={cardStyle}>
          <p>Overdue</p>
          <h2>{overdueCount}</h2>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <input
          type="text"
          placeholder="Search member, email, book, author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="ALL">All Loans</option>
          <option value="BORROWED">Borrowed</option>
          <option value="RETURNED">Returned</option>
          <option value="OVERDUE">Overdue</option>
        </select>

        <button onClick={fetchLoans} style={buttonStyle}>
          Refresh
        </button>
      </div>

      {filteredLoans.length === 0 ? (
        <p>No matching loans found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 900,
            }}
          >
            <thead>
              <tr style={{ background: "#1e293b", color: "white" }}>
                {[
                  "Member",
                  "Email",
                  "Book",
                  "Issue Date",
                  "Due Date",
                  "Return Date",
                  "Status",
                ].map((heading) => (
                  <th key={heading} style={cellStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan._id}>
                  <td style={cellStyle}>
                    {loan.user?.name || "Unknown"}
                  </td>
                  <td style={cellStyle}>
                    {loan.user?.email || "—"}
                  </td>
                  <td style={cellStyle}>
                    {loan.book?.title || "Book unavailable"}
                    {loan.book?.author && (
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {loan.book.author}
                      </div>
                    )}
                  </td>
                  <td style={cellStyle}>
                    {formatDate(loan.issueDate)}
                  </td>
                  <td style={cellStyle}>
                    {formatDate(loan.dueDate)}
                  </td>
                  <td style={cellStyle}>
                    {formatDate(loan.returnDate)}
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        color: loan.isOverdue
                          ? "#b91c1c"
                          : loan.status === "RETURNED"
                          ? "#15803d"
                          : "#1d4ed8",
                        fontWeight: "bold",
                      }}
                    >
                      {loan.isOverdue
                        ? "OVERDUE"
                        : loan.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: 15, color: "#64748b" }}>
        Showing {filteredLoans.length} of {loans.length} loans.
      </p>
    </div>
  );
}

const cardStyle = {
  padding: 18,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
};

const inputStyle = {
  padding: 11,
  border: "1px solid #cbd5e1",
  borderRadius: 7,
  minWidth: 180,
};

const buttonStyle = {
  padding: "11px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
};

const cellStyle = {
  padding: 12,
  border: "1px solid #e2e8f0",
  textAlign: "left",
  verticalAlign: "top",
};

export default AllLoans;
