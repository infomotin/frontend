"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "../../lib/api";

interface Product {
  documentId: string;
  name: string;
  type: string;
  sku: string;
  stockQuantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  description?: string;
  attributes?: Record<string, string>;
  alertLevel?: number;
}

interface ProductAttribute {
  documentId: string;
  name: string;
  type: string;
  values: string[];
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
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
    sku: "",
    type: "General",
    unit: "pcs",
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    alertLevel: 10,
    description: "",
    attributes: {} as Record<string, string>,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/products?populate=*");
      if (res.data) {
        setProducts(res.data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load inventory.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAttributes = async () => {
    try {
      const res = await fetchAPI("/product-attributes");
      if (res.data) {
        setAttributes(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load attributes", err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadAttributes();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      type: "General",
      unit: "pcs",
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      alertLevel: 10,
      description: "",
      attributes: {},
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      type: product.type,
      unit: product.unit,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      alertLevel: product.alertLevel || 10,
      description: product.description || "",
      attributes: product.attributes || {},
    });
    setEditingId(product.documentId);
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await fetchAPI(`/products/${documentId}`, {
        method: "DELETE",
      });
      setProducts((prev) => prev.filter((p) => p.documentId !== documentId));
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
        await fetchAPI(`/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ data: formData }),
        });
      } else {
        await fetchAPI("/products", {
          method: "POST",
          body: JSON.stringify({ data: formData }),
        });
      }

      setIsModalOpen(false);
      resetForm();
      loadProducts();
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAttribute = (attrName: string, value: string) => {
    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        [attrName]: value,
      },
    });
  };

  if (loading) return <div className="p-8">Loading Inventory...</div>;

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
          Inventory Management
        </h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Add Product
        </button>
      </div>

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
          <strong>Connection Error:</strong> {error}
        </div>
      )}

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
                SKU
              </th>
              <th
                style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
              >
                Stock
              </th>
              <th
                style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
              >
                Price
              </th>
              <th
                style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
              >
                Status
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
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No products found. Add some products!
                </td>
              </tr>
            ) : (
              products.map((item: Product) => (
                <tr
                  key={item.documentId}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <td style={{ padding: "1rem", fontWeight: 500 }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        background:
                          item.type === "Fuel" ? "#dbeafe" : "#f1f5f9",
                        color: item.type === "Fuel" ? "#1e40af" : "#475569",
                      }}
                    >
                      {item.type || "General"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontFamily: "monospace",
                      color: "#64748b",
                    }}
                  >
                    {item.sku || "-"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {item.stockQuantity} {item.unit}
                  </td>
                  <td style={{ padding: "1rem" }}>${item.sellingPrice}</td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        color:
                          item.stockQuantity > (item.alertLevel || 10)
                            ? "#22c55e"
                            : "#ef4444",
                        fontSize: "0.875rem",
                      }}
                    >
                      {item.stockQuantity > (item.alertLevel || 10)
                        ? "In Stock"
                        : "Low Stock"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleOpenEdit(item)}
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
                      onClick={() => handleDelete(item.documentId)}
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

      {/* Product Modal */}
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
            overflowY: "auto",
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "1rem",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingId ? "Edit Product" : "New Product"}
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
              {/* Basic Information */}
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
                      fontWeight: 500,
                    }}
                  >
                    Product Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., Diesel Premium"
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
                      fontWeight: 500,
                    }}
                  >
                    SKU
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., PROD-001"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
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
                    <option value="General">General</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Lube">Lube</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Liters, pcs, kg"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Pricing */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Cost Price *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.costPrice || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Selling Price *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.sellingPrice || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellingPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Margin
                  </label>
                  <input
                    type="text"
                    readOnly
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                      background: "#f8fafc",
                    }}
                    value={
                      formData.sellingPrice > 0
                        ? `${(
                            ((formData.sellingPrice - formData.costPrice) /
                              formData.sellingPrice) *
                            100
                          ).toFixed(1)}%`
                        : "0%"
                    }
                  />
                </div>
              </div>

              {/* Stock */}
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
                      fontWeight: 500,
                    }}
                  >
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.stockQuantity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.alertLevel || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alertLevel: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Product description..."
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.25rem",
                    fontFamily: "inherit",
                  }}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* Product Attributes */}
              {attributes.length > 0 && (
                <div>
                  <h3
                    style={{
                      margin: "0 0 1rem 0",
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    Product Attributes
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    {attributes.map((attr) => (
                      <div key={attr.documentId}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.5rem",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                          }}
                        >
                          {attr.name}
                        </label>
                        <select
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            border: "1px solid #cbd5e1",
                            borderRadius: "0.25rem",
                          }}
                          value={formData.attributes[attr.name] || ""}
                          onChange={(e) =>
                            updateAttribute(attr.name, e.target.value)
                          }
                        >
                          <option value="">Select {attr.name}</option>
                          {attr.values?.map((val, idx) => (
                            <option key={idx} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
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
