"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

interface ProductAttribute {
  documentId: string;
  name: string;
  type: string;
  values: string[];
}

export default function ProductAttributesPage() {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "Size",
    values: [""],
  });

  const loadAttributes = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/product-attributes?sort=name:ASC");
      if (res.data) {
        setAttributes(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load product attributes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      type: "Size",
      values: [""],
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (attr: ProductAttribute) => {
    setFormData({
      name: attr.name,
      type: attr.type,
      values: attr.values || [""],
    });
    setEditingId(attr.documentId);
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this attribute?")) return;

    try {
      await fetchAPI(`/product-attributes/${documentId}`, {
        method: "DELETE",
      });
      setAttributes((prev) => prev.filter((a) => a.documentId !== documentId));
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const addValue = () => {
    setFormData({
      ...formData,
      values: [...formData.values, ""],
    });
  };

  const removeValue = (index: number) => {
    if (formData.values.length <= 1) {
      alert("An attribute must have at least one value");
      return;
    }
    setFormData({
      ...formData,
      values: formData.values.filter((_, i) => i !== index),
    });
  };

  const updateValue = (index: number, value: string) => {
    const newValues = [...formData.values];
    newValues[index] = value;
    setFormData({ ...formData, values: newValues });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Filter out empty values
    const cleanedValues = formData.values.filter((v) => v.trim() !== "");
    if (cleanedValues.length === 0) {
      setError("Please add at least one value");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        values: cleanedValues,
      };

      if (editingId) {
        await fetchAPI(`/product-attributes/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ data: payload }),
        });
      } else {
        await fetchAPI("/product-attributes", {
          method: "POST",
          body: JSON.stringify({ data: payload }),
        });
      }

      setIsModalOpen(false);
      resetForm();
      loadAttributes();
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
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
          Product Attributes
        </h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + New Attribute
        </button>
      </div>

      {loading && <div>Loading Attributes...</div>}

      {error && !isModalOpen && (
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
                  Name
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Type
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Values
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
              {attributes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No product attributes found.
                  </td>
                </tr>
              ) : (
                attributes.map((attr) => (
                  <tr
                    key={attr.documentId}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <td style={{ padding: "1rem", fontWeight: 600 }}>
                      {attr.name}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          background: "#e0e7ff",
                          color: "#4338ca",
                          fontWeight: 500,
                        }}
                      >
                        {attr.type}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {attr.values?.map((val, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "#f1f5f9",
                              borderRadius: "0.25rem",
                              fontSize: "0.85rem",
                            }}
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleOpenEdit(attr)}
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
                        onClick={() => handleDelete(attr.documentId)}
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

      {/* Modal */}
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
              maxWidth: "600px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingId ? "Edit Attribute" : "New Attribute"}
            </h2>

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
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
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
                    Attribute Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., Size"
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
                    <option value="Size">Size</option>
                    <option value="Color">Color</option>
                    <option value="Material">Material</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                    Values
                  </label>
                  <button
                    type="button"
                    onClick={addValue}
                    style={{
                      padding: "0.25rem 0.75rem",
                      background: "#e0e7ff",
                      border: "none",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    + Add Value
                  </button>
                </div>
                {formData.values.map((value, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <input
                      type="text"
                      placeholder={`e.g., ${
                        formData.type === "Size"
                          ? "Small, Medium, Large"
                          : formData.type === "Color"
                          ? "Red, Blue, Green"
                          : "Value"
                      }`}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.25rem",
                      }}
                      value={value}
                      onChange={(e) => updateValue(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeValue(idx)}
                      style={{
                        padding: "0.5rem 0.75rem",
                        background: "#fee2e2",
                        border: "none",
                        borderRadius: "0.25rem",
                        cursor: "pointer",
                        color: "#dc2626",
                        fontSize: "1.2rem",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                >
                  {isSubmitting ? "Saving..." : "Save Attribute"}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "#e2e8f0", flex: 1 }}
                  onClick={() => {
                    setIsModalOpen(false);
                    setError("");
                  }}
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
