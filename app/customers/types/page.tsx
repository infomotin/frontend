"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

interface CustomerType {
  id: number;
  documentId: string;
  name: string;
  eligibleForCoins: boolean;
}

export default function CustomerTypesPage() {
  const [types, setTypes] = useState<CustomerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    eligibleForCoins: false,
  });

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/customer-types?sort=name:ASC");
      setTypes(res.data || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load customer types"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const path = editingId
        ? `/customer-types/${editingId}`
        : "/customer-types";

      await fetchAPI(path, {
        method,
        body: JSON.stringify({ data: formData }),
      });

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", eligibleForCoins: false });
      loadTypes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  const handleEdit = (type: CustomerType) => {
    setEditingId(type.documentId);
    setFormData({
      name: type.name,
      eligibleForCoins: type.eligibleForCoins,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (
      !confirm(
        "Are you sure? This may affect customers assigned to this category."
      )
    )
      return;
    try {
      await fetchAPI(`/customer-types/${documentId}`, { method: "DELETE" });
      loadTypes();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
    }
  };

  return (
    <div className="fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
            Customer Categories
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Define customer groups and loyalty eligibility settings
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", eligibleForCoins: false });
            setIsModalOpen(true);
          }}
          style={{ padding: "0.75rem 1.5rem" }}
        >
          + Create Category
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fef2f2",
            color: "#ef4444",
            borderRadius: "0.75rem",
            marginBottom: "1.5rem",
            border: "1px solid #fee2e2",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: "1rem", color: "#64748b" }}>
            Loading categories...
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(0,0,0,0.02)",
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <th
                  style={{
                    padding: "1.25rem 1rem",
                    color: "#475569",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Category Name
                </th>
                <th
                  style={{
                    padding: "1.25rem 1rem",
                    color: "#475569",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Loyalty Eligibility
                </th>
                <th
                  style={{
                    padding: "1.25rem 1rem",
                    color: "#475569",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: "4rem 2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No categories defined yet.
                  </td>
                </tr>
              ) : (
                types.map((type) => (
                  <tr
                    key={type.documentId}
                    className="table-row-hover"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                  >
                    <td
                      style={{
                        padding: "1.25rem 1rem",
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {type.name}
                    </td>
                    <td style={{ padding: "1.25rem 1rem" }}>
                      <span
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "2rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: type.eligibleForCoins
                            ? "#ecfdf5"
                            : "#f1f5f9",
                          color: type.eligibleForCoins ? "#059669" : "#64748b",
                        }}
                      >
                        {type.eligibleForCoins ? "🪙 Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ padding: "1.25rem 1rem", textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          onClick={() => handleEdit(type)}
                          className="btn-icon"
                          style={{
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            background: "#f1f5f9",
                            color: "#3b82f6",
                            border: "none",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(type.documentId)}
                          className="btn-icon"
                          style={{
                            padding: "0.5rem",
                            borderRadius: "0.5rem",
                            background: "#fef2f2",
                            color: "#ef4444",
                            border: "none",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="glass-panel fade-in"
            style={{
              background: "white",
              padding: "2.5rem",
              borderRadius: "1.5rem",
              width: "100%",
              maxWidth: "450px",
            }}
          >
            <h2 style={{ marginBottom: "2rem", fontSize: "1.25rem" }}>
              {editingId ? "Edit Category" : "New Category"}
            </h2>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  required
                  type="text"
                  className="form-input"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                  }}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  background: "#f8fafc",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                }}
              >
                <input
                  type="checkbox"
                  id="eligibleForCoins"
                  style={{
                    width: "1.25rem",
                    height: "1.25rem",
                    cursor: "pointer",
                  }}
                  checked={formData.eligibleForCoins}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eligibleForCoins: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="eligibleForCoins"
                  style={{
                    fontWeight: 600,
                    color: "#1e293b",
                    cursor: "pointer",
                  }}
                >
                  Eligible for Loyalty Coins
                </label>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "1rem" }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1, padding: "1rem" }}
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
