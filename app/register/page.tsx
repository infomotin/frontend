"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "../login/Login.module.css"; // Reusing Login styles for consistency
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(username, email, password);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>RefuelOS</h1>
        <p className={styles.subtitle}>Create a new account</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={styles.input}
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                marginTop: "0.2rem",
              }}
            >
              Min 6 characters
            </p>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.9rem",
            color: "#64748b",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "var(--secondary)", fontWeight: 500 }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
