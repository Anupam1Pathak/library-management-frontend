
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";

function Navbar() {
  const [userRole, setUserRole] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUserRole("");
      return;
    }

    api
      .get("/auth/profile")
      .then((res) => {
        setUserRole(
          res.data.user?.role || res.data.role || ""
        );
      })
      .catch((error) => {
        console.error("Failed to fetch user profile:", error);
        setUserRole("");
      });
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserRole("");
    navigate("/");
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    marginRight: "20px",
  };

  return (
    <nav
      style={{
        backgroundColor: "#222",
        padding: "15px 25px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
      }}
    >
      <Link to="/books" style={linkStyle}>
        Books
      </Link>

      {localStorage.getItem("token") && (
        <Link to="/my-loans" style={linkStyle}>
          My Loans
        </Link>
      )}

      {(userRole === "ADMIN" ||
        userRole === "LIBRARIAN") && (
        <>
          <Link to="/admin" style={linkStyle}>
            Admin Dashboard
          </Link>

          <Link to="/all-loans" style={linkStyle}>
            All Loans
          </Link>
        </>
      )}

      <div style={{ marginLeft: "auto" }}>
        {localStorage.getItem("token") ? (
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              padding: "8px 14px",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        ) : (
          <>
            <Link to="/" style={linkStyle}>
              Login
            </Link>

            <Link to="/register" style={linkStyle}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
