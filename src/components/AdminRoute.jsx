
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";

function AdminRoute({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await api.get("/auth/profile");
        const user = response.data.user || response.data;

        const role = String(user.role || "").toUpperCase();

        setAuthorized(
          role === "ADMIN" || role === "LIBRARIAN"
        );
      } catch (error) {
        console.error(
          "Unable to verify user role:",
          error.response?.data || error.message
        );
        setAuthorized(false);
      } finally {
        setChecking(false);
      }
    };

    checkRole();
  }, []);

  if (checking) {
    return <p>Checking permissions...</p>;
  }

  if (!authorized) {
    return <Navigate to="/books" replace />;
  }

  return children;
}

export default AdminRoute;
