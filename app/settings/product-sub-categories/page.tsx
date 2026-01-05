"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

interface ProductCategory {
  documentId: string;
  name: string;
}

interface ProductSubCategory {
  id: number;
  documentId: string;
  name: string;
  category?: ProductCategory;
}

export default function ProductSubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<ProductSubCategory[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
  });

  useEffect(() => {
    loadSubCategories();
    loadCategories();
  }, []);

  const loadSubCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI(
        "/product-sub-categories?populate=*&sort=name:ASC"
      );
      setSubCategories(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetchAPI("/product-categories?sort=name:ASC");
      setCategories(res.data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const path = editingId
        ? `/product-sub-categories/${editingId}`
        : "/product-sub-categories";

      await fetchAPI(path, {
        method,
        body: JSON.stringify({ data: formData }),
      });

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", category: "" });
      loadSubCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (sub: ProductSubCategory) => {
    setEditingId(sub.documentId);
    setFormData({
      name: sub.name,
      category: sub.category?.documentId || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetchAPI(`/product-sub-categories/${documentId}`, {
        method: "DELETE",
      });
      loadSubCategories();
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
          Product Sub-Categories
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", category: "" });
            setIsModalOpen(true);
          }}
        >
          + Add Sub-Category
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
                <th style={{ padding: "1rem", textAlign: "left" }}>
                  Sub-Category
                </th>
                <th style={{ padding: "1rem", textAlign: "left" }}>
                  Parent Category
                </th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subCategories.map((sub) => (
                <tr
                  key={sub.documentId}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {sub.name}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        background: "#f1f5f9",
                        borderRadius: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      {sub.category?.name || "N/A"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleEdit(sub)}
                      className="btn-icon"
                      style={{ color: "#3b82f6", marginRight: "0.5rem" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(sub.documentId)}
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
            <h2>{editingId ? "Edit Sub-Category" : "New Sub-Category"}</h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group">
                <label className="form-label">Parent Category</label>
                <select
                  required
                  className="form-input"
                  style={{ width: "100%" }}
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.documentId} value={cat.documentId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sub-Category Name</label>
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
