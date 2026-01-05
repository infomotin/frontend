"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

interface ProductSubCategory {
  documentId: string;
  name: string;
}

interface ProductChildCategory {
  id: number;
  documentId: string;
  name: string;
  subCategory?: ProductSubCategory;
}

export default function ProductChildCategoriesPage() {
  const [childCategories, setChildCategories] = useState<
    ProductChildCategory[]
  >([]);
  const [subCategories, setSubCategories] = useState<ProductSubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    subCategory: "",
  });

  useEffect(() => {
    loadChildCategories();
    loadSubCategories();
  }, []);

  const loadChildCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI(
        "/product-child-categories?populate=*&sort=name:ASC"
      );
      setChildCategories(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubCategories = async () => {
    try {
      const res = await fetchAPI("/product-sub-categories?sort=name:ASC");
      setSubCategories(res.data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const path = editingId
        ? `/product-child-categories/${editingId}`
        : "/product-child-categories";

      await fetchAPI(path, {
        method,
        body: JSON.stringify({ data: formData }),
      });

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", subCategory: "" });
      loadChildCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (child: ProductChildCategory) => {
    setEditingId(child.documentId);
    setFormData({
      name: child.name,
      subCategory: child.subCategory?.documentId || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetchAPI(`/product-child-categories/${documentId}`, {
        method: "DELETE",
      });
      loadChildCategories();
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
          Product Child-Categories
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", subCategory: "" });
            setIsModalOpen(true);
          }}
        >
          + Add Child-Category
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
                  Child-Category
                </th>
                <th style={{ padding: "1rem", textAlign: "left" }}>
                  Sub-Category
                </th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {childCategories.map((child) => (
                <tr
                  key={child.documentId}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {child.name}
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
                      {child.subCategory?.name || "N/A"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleEdit(child)}
                      className="btn-icon"
                      style={{ color: "#3b82f6", marginRight: "0.5rem" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(child.documentId)}
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
            <h2>{editingId ? "Edit Child-Category" : "New Child-Category"}</h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group">
                <label className="form-label">Sub-Category</label>
                <select
                  required
                  className="form-input"
                  style={{ width: "100%" }}
                  value={formData.subCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subCategory: e.target.value })
                  }
                >
                  <option value="">Select Sub-Category</option>
                  {subCategories.map((sub) => (
                    <option key={sub.documentId} value={sub.documentId}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Child-Category Name</label>
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
