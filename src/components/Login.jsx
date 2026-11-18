import React, { useState } from "react";
import axios from "axios";

export default function Login({ onLogin }) {
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState("admin@emplox.com");
    const [password, setPassword] = useState("admin123");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/auth/login",
                {
                    email,
                    password
                }
            );

            const { token, user } = response.data;

            localStorage.setItem("emplox_token", token);
            localStorage.setItem(
                "emplox_user",
                JSON.stringify(user)
            );

            onLogin(user);

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-art">
                <div className="brand large">
                    <span className="brand-mark">E</span>
                    <span>EMPLOX</span>
                </div>

                <div className="art-copy">
                    <p className="eyebrow">
                        EMPLOYEE MANAGEMENT SYSTEM
                    </p>

                    <h1>
                        Manage your people.
                        <br />
                        <span>Grow your business.</span>
                    </h1>

                    <p>
                        One simple workspace for employees, attendance,
                        departments, payroll and leave management.
                    </p>
                </div>

                <div className="art-card">
                    <div className="mini-avatar">AS</div>

                    <div>
                        <strong>Welcome back, Admin</strong>
                        <small>Everything is under control.</small>
                    </div>

                    <span className="green-dot"></span>
                </div>
            </div>

            <div className="login-panel">
                <div className="mobile-brand brand">
                    <span className="brand-mark">E</span>
                    <span>EMPLOX</span>
                </div>

                <div className="login-box">
                    <p className="eyebrow">EMPLOX PORTAL</p>

                    <h2>Welcome back</h2>

                    <p className="muted">
                        Sign in to access your dashboard.
                    </p>

                    <form onSubmit={handleLogin}>
                        <label>Email address</label>

                        <div className="input-wrap">
                            <span>✉</span>

                            <input
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                type="email"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <label>Password</label>

                        <div className="input-wrap">
                            <span>⌑</span>

                            <input
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                type={show ? "text" : "password"}
                                placeholder="Enter your password"
                                required
                            />

                            <button
                                type="button"
                                className="eye"
                                onClick={() => setShow(!show)}
                            >
                                {show ? "Hide" : "Show"}
                            </button>
                        </div>

                        {error && (
                            <p
                                style={{
                                    color: "#dc2626",
                                    marginTop: "10px"
                                }}
                            >
                                {error}
                            </p>
                        )}

                        <div className="login-options">
                            <label className="remember">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                />
                                Remember me
                            </label>

                            <a
                                href="#forgot"
                                onClick={(e) =>
                                    e.preventDefault()
                                }
                            >
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className="primary-btn full"
                            disabled={loading}
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign in to dashboard"}
                            {!loading && <span>→</span>}
                        </button>
                    </form>

                    <p className="demo-note">
                        EMPLOX Authentication
                    </p>
                </div>

                <footer>
                    © 2026 EMPLOX · Employee Management System
                </footer>
            </div>
        </div>
    );
}