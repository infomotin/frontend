"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../lib/api";

interface ChartOfAccount {
  documentId: string;
  code: string;
  name: string;
  type: string;
  classification: string;
  currentBalance: number;
}

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
const CLASSIFICATIONS = [
  "Current",
  "Non-Current",
  "Operating",
  "Non-Operating",
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "Asset",
    classification: "Current",
    currentBalance: 0,
  });

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/chart-of-accounts?sort=code:ASC");
      if (res.data) {
        setAccounts(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      type: "Asset",
      classification: "Current",
      currentBalance: 0,
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: ChartOfAccount) => {
    setFormData({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      classification: acc.classification,
      currentBalance: acc.currentBalance || 0,
    });
    setEditingId(acc.documentId);
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      await fetchAPI(`/chart-of-accounts/${documentId}`, {
        method: "DELETE",
      });
      // Optimistic update or refresh
      setAccounts((prev) => prev.filter((a) => a.documentId !== documentId));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (editingId) {
        // Update
        await fetchAPI(`/chart-of-accounts/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ data: formData }),
        });
      } else {
        // Create
        await fetchAPI("/chart-of-accounts", {
          method: "POST",
          body: JSON.stringify({ data: formData }),
        });
      }

      setIsModalOpen(false);
      resetForm();
      loadAccounts(); // Refresh list
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAccounts =
    filterType === "All"
      ? accounts
      : accounts.filter((acc) => acc.type === filterType);

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          Chart of Accounts
        </h1>
        <div>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + New Account
          </button>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          padding: "1rem",
          marginBottom: "2rem",
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
        }}
      >
        {["All", "Asset", "Liability", "Equity", "Revenue", "Expense"].map(
          (type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "2rem",
                border: "none",
                background:
                  filterType === type ? "var(--secondary)" : "#f1f5f9",
                color: filterType === type ? "white" : "#64748b",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {type}
            </button>
          )
        )}
      </div>

      {loading && <div>Loading Financial Data...</div>}

      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead
              style={{
                background: "rgba(0,0,0,0.02)",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <tr>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Code
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Account Name
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Type
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Class
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: 600,
                    color: "#64748b",
                    textAlign: "right",
                  }}
                >
                  Balance
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: 600,
                    color: "#64748b",
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No accounts found.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr
                    key={acc.documentId}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: "var(--primary)",
                      }}
                    >
                      {acc.code}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 500 }}>
                      {acc.name}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.6rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          background:
                            acc.type === "Asset" || acc.type === "Expense"
                              ? "#e0e7ff"
                              : "#f0fdf4",
                          color:
                            acc.type === "Asset" || acc.type === "Expense"
                              ? "#4338ca"
                              : "#15803d",
                        }}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "#64748b",
                        fontSize: "0.9rem",
                      }}
                    >
                      {acc.classification}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      ${acc.currentBalance?.toLocaleString() || "0.00"}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#3b82f6",
                          marginRight: "0.5rem",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(acc.documentId)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Basic Modal Implementation */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "1rem",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingId ? "Edit Account" : "New Account"}
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Account Code
                </label>
                <input
                  required
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.25rem",
                  }}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Account Name
                </label>
                <input
                  required
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.25rem",
                  }}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Type
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Classification
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.classification}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        classification: e.target.value,
                      })
                    }
                  >
                    {CLASSIFICATIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.25rem",
                  }}
                  value={formData.currentBalance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      currentBalance: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                >
                  {isSubmitting ? "Saving..." : "Save Account"}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "#e2e8f0", flex: 1 }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
