"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

interface ProductAttribute {
  documentId: string;
  name: string;
  inputType: string;
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
    inputType: "Text",
    values: [] as string[],
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
      inputType: "Text",
      values: [],
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
      inputType: attr.inputType || "Text",
      values: attr.values || [],
    });
    setEditingId(attr.documentId);
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this attribute?")) return;
    try {
      await fetchAPI(`/product-attributes/${documentId}`, { method: "DELETE" });
      loadAttributes();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const addValue = () => {
    setFormData({ ...formData, values: [...formData.values, ""] });
  };

  const removeValue = (idx: number) => {
    setFormData({
      ...formData,
      values: formData.values.filter((_, i) => i !== idx),
    });
  };

  const updateValue = (idx: number, val: string) => {
    const next = [...formData.values];
    next[idx] = val;
    setFormData({ ...formData, values: next });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        name: formData.name,
        inputType: formData.inputType,
        values:
          formData.inputType === "Select"
            ? formData.values.filter((v) => v.trim() !== "")
            : null,
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

      {loading ? (
        <div>Loading...</div>
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
                <th style={{ padding: "1rem" }}>Name</th>
                <th style={{ padding: "1rem" }}>Input Type</th>
                <th style={{ padding: "1rem" }}>Values / Data</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
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
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        background: "#e0e7ff",
                        color: "#4338ca",
                        fontSize: "0.8rem",
                      }}
                    >
                      {attr.inputType}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {attr.inputType === "Select" ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.25rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {attr.values?.map((v, i) => (
                          <span
                            key={i}
                            style={{
                              background: "#f1f5f9",
                              padding: "0.1rem 0.4rem",
                              borderRadius: "0.2rem",
                              fontSize: "0.75rem",
                            }}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                        Dynamic {attr.inputType} Input
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleOpenEdit(attr)}
                      className="btn-icon"
                      style={{ color: "#3b82f6", marginRight: "0.5rem" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(attr.documentId)}
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
            }}
          >
            <h2>{editingId ? "Edit Attribute" : "New Attribute"}</h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group">
                <label className="form-label">
                  Attribute Name (e.g. Color, Expiry Date)
                </label>
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
                <label className="form-label">Input Type</label>
                <select
                  className="form-input"
                  value={formData.inputType}
                  onChange={(e) =>
                    setFormData({ ...formData, inputType: e.target.value })
                  }
                >
                  <option value="Text">Text (Serial No, Batch)</option>
                  <option value="Number">Number (Size, Qty)</option>
                  <option value="Date">Date (Expiry, Mfg Date)</option>
                  <option value="Select">Select (Color, Material)</option>
                  <option value="Boolean">Yes/No (Warranty, Eligible)</option>
                </select>
              </div>

              {formData.inputType === "Select" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <label className="form-label">Options</label>
                    <button
                      type="button"
                      onClick={addValue}
                      className="btn"
                      style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                    >
                      + Add
                    </button>
                  </div>
                  {formData.values.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <input
                        className="form-input"
                        style={{ flex: 1 }}
                        value={v}
                        onChange={(e) => updateValue(i, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeValue(i)}
                        style={{
                          color: "red",
                          border: "none",
                          background: "none",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
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
