"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

interface ProductAttribute {
  documentId: string;
  name: string;
}

interface ProductCategory {
  id: number;
  documentId: string;
  name: string;
  description: string;
  attributes?: ProductAttribute[];
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [allAttributes, setAllAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    attributes: [] as string[],
  });

  useEffect(() => {
    loadCategories();
    loadAllAttributes();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI(
        "/product-categories?populate=*&sort=name:ASC"
      );
      setCategories(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllAttributes = async () => {
    try {
      const res = await fetchAPI("/product-attributes?sort=name:ASC");
      setAllAttributes(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAttribute = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.includes(docId)
        ? prev.attributes.filter((id) => id !== docId)
        : [...prev.attributes, docId],
    }));
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
      setFormData({ name: "", description: "", attributes: [] });
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
      attributes: category.attributes?.map((a) => a.documentId) || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure?")) return;
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
            setFormData({ name: "", description: "", attributes: [] });
            setIsModalOpen(true);
          }}
        >
          + Add Category
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
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
                  Category Name
                </th>
                <th style={{ padding: "1rem", textAlign: "left" }}>
                  Linked Attributes
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
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600 }}>{cat.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {cat.description}
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {cat.attributes?.map((a) => (
                        <span
                          key={a.documentId}
                          style={{
                            background: "#f1f5f9",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                          }}
                        >
                          {a.name}
                        </span>
                      ))}
                      {(!cat.attributes || cat.attributes.length === 0) && (
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                          No attributes linked
                        </span>
                      )}
                    </div>
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
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2>{editingId ? "Edit Category" : "New Category"}</h2>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  required
                  className="form-input"
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
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  className="form-label"
                  style={{ display: "block", marginBottom: "0.75rem" }}
                >
                  Select Required Attributes
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                    background: "#f8fafc",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {allAttributes.map((attr) => (
                    <label
                      key={attr.documentId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.attributes.includes(attr.documentId)}
                        onChange={() => toggleAttribute(attr.documentId)}
                      />
                      {attr.name}
                    </label>
                  ))}
                  {allAttributes.length === 0 && (
                    <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                      No attributes defined yet. Go to Settings {">"} Product
                      Attributes.
                    </span>
                  )}
                </div>
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
