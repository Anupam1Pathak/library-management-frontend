
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const loginUser = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await api.post("/auth/login", {
                email,
                password
            });

            // Save JWT token
            localStorage.setItem("token", response.data.token);

            alert("Login successful!");

            // Open Books page
            navigate("/books");
        } catch (error) {
            console.error(
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Login failed. Check your email and password."
            );
        }
    };

    return (
        <div>
            <h1>Library Management System</h1>
            <h2>Login</h2>

            <form onSubmit={loginUser}>
                <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <br /><br />

                <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <br /><br />

                <button type="submit">Login</button>
            </form>

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}

            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    );
}

export default Login;
