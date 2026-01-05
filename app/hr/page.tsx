"use client";

import { useState } from "react";
import { fetchAPI } from "../../lib/api";

export default function HRPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI("/users?populate=role");
      setUsers(data);
    } catch (err: any) {
      // Typically public/standard users can't see all users.
      // This is generic handling.
      setError("Could not fetch users. You might need Admin permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Employee & User Management</h1>

      <div
        className="glass-panel"
        style={{ padding: "1.5rem", marginBottom: "2rem" }}
      >
        <h3>Role Management</h3>
        <p style={{ color: "#64748b", marginBottom: "1rem" }}>
          User Roles and Permissions are managed securely via the Strapi Admin
          Panel.
        </p>
        <a
          href="http://localhost:1337/admin"
          target="_blank"
          className="btn btn-primary"
          style={{ display: "inline-block" }}
        >
          Open Admin Panel
        </a>
      </div>

      <div className="glass-panel">
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>Registered Users</h3>
          <button
            onClick={fetchUsers}
            className="btn"
            style={{ background: "#f1f5f9" }}
          >
            Load Users
          </button>
        </div>

        {loading && <div style={{ padding: "1.5rem" }}>Loading...</div>}

        {error && (
          <div style={{ padding: "1.5rem", color: "red" }}>{error}</div>
        )}

        {!loading && !error && users.length > 0 && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "1rem" }}>Username</th>
                <th style={{ padding: "1rem" }}>Email</th>
                <th style={{ padding: "1rem" }}>Role</th>
                <th style={{ padding: "1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1rem", fontWeight: 500 }}>
                    {u.username}
                  </td>
                  <td style={{ padding: "1rem" }}>{u.email}</td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        background: "#dbeafe",
                        color: "#1e40af",
                        fontSize: "0.8rem",
                      }}
                    >
                      {u.role?.name || "Authenticated"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {u.confirmed ? (
                      <span style={{ color: "green" }}>Active</span>
                    ) : (
                      <span style={{ color: "orange" }}>Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && users.length === 0 && (
          <div
            style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}
          >
            Click "Load Users" to view the user directory.
          </div>
        )}
      </div>
    </div>
  );
}
