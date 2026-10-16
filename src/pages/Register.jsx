import { useState } from "react";
import api from "../api";

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");

    const registerUser = async (e) => {

        e.preventDefault();

        try {

            const response = await api.post("/auth/register", {
                name,
                email,
                password,
                phone,
                role: "MEMBER"
            });

            console.log("Registration successful:", response.data);

            alert("Registration successful!");

            setName("");
            setEmail("");
            setPassword("");
            setPhone("");

        } catch (error) {

            console.log(
                error.response?.data || error.message
            );

        }
    };

    return (
        <div>

            <h1>Library Management System</h1>

            <h2>Register</h2>

            <form onSubmit={registerUser}>

                <input
                    type="text"
                    placeholder="Enter name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <br /><br />

                <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <br /><br />

                <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <br /><br />

                <input
                    type="text"
                    placeholder="Enter phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />

                <br /><br />

                <button type="submit">
                    Register
                </button>

            </form>

        </div>
    );
}

export default Register;