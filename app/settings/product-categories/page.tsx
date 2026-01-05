"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

interface ProductCategory {
  id: number;
  documentId: string;
  name: string;
  description: string;
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/product-categories?sort=name:ASC");
      setCategories(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const path = editingId
        ? `/product-categories/${editingId}`
        : "/product-categories";

      await fetchAPI(path, {
        method,
        body: JSON.stringify({ data: formData }),
      });

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", description: "" });
      loadCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingId(category.documentId);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (
      !confirm(
        "Are you sure? This will affect sub-categories and products attached to this category."
      )
    )
      return;
    try {
      await fetchAPI(`/product-categories/${documentId}`, { method: "DELETE" });
      loadCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

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
          Product Categories
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", description: "" });
            setIsModalOpen(true);
          }}
        >
          + Add Main Category
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading...</div>
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "rgba(0,0,0,0.02)",
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <th style={{ padding: "1rem", textAlign: "left" }}>Name</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>
                  Description
                </th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.documentId}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {cat.name}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {cat.description || "N/A"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleEdit(cat)}
                      className="btn-icon"
                      style={{ color: "#3b82f6", marginRight: "0.5rem" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.documentId)}
                      className="btn-icon"
                      style={{ color: "#ef4444" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div
          className="modal-overlay"
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
            className="glass-panel"
            style={{
              background: "white",
              padding: "2rem",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <h2>{editingId ? "Edit Category" : "New Category"}</h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  required
                  className="form-input"
                  style={{ width: "100%" }}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ width: "100%" }}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1 }}
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
