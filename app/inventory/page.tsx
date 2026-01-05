"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchAPI, uploadFile, STRAPI_URL } from "../../lib/api";

interface StrapiImage {
  id: number;
  url: string;
}

interface Category {
  documentId: string;
  name: string;
}

interface Product {
  documentId: string;
  name: string;
  sku: string;
  stockQuantity: number;
  baseUnit: string;
  purchaseUnit: string;
  saleUnit: string;
  purchaseToSaleFactor: number;
  saleToBaseFactor: number;
  costPrice: number;
  sellingPrice: number;
  description?: string;
  attributes?: Record<string, string>;
  alertLevel?: number;
  image?: StrapiImage | null;
  category?: Category;
  subCategory?: Category;
  childCategory?: Category;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [childCategories, setChildCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Media State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    subCategory: "",
    childCategory: "",
    baseUnit: "Pcs",
    purchaseUnit: "Pcs",
    saleUnit: "Pcs",
    purchaseToSaleFactor: 1,
    saleToBaseFactor: 1,
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    alertLevel: 10,
    description: "",
    attributes: {} as Record<string, string>,
    image: null as StrapiImage | null,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/products?populate=*");
      if (res.data) setProducts(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  const loadAttributes = async () => {
    try {
      const res = await fetchAPI("/product-attributes");
      if (res.data) setAttributes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetchAPI("/product-categories?sort=name:ASC");
      if (res.data) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubCategories = async (catId: string) => {
    try {
      const res = await fetchAPI(
        `/product-sub-categories?filters[category][documentId][$eq]=${catId}&sort=name:ASC`
      );
      setSubCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadChildCategories = async (subId: string) => {
    try {
      const res = await fetchAPI(
        `/product-child-categories?filters[subCategory][documentId][$eq]=${subId}&sort=name:ASC`
      );
      setChildCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadAttributes();
    loadCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      subCategory: "",
      childCategory: "",
      baseUnit: "Pcs",
      purchaseUnit: "Pcs",
      saleUnit: "Pcs",
      purchaseToSaleFactor: 1,
      saleToBaseFactor: 1,
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      alertLevel: 10,
      description: "",
      attributes: {},
      image: null,
    });
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setSubCategories([]);
    setChildCategories([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(file);
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category?.documentId || "",
      subCategory: product.subCategory?.documentId || "",
      childCategory: product.childCategory?.documentId || "",
      baseUnit: product.baseUnit || "Pcs",
      purchaseUnit: product.purchaseUnit || "Pcs",
      saleUnit: product.saleUnit || "Pcs",
      purchaseToSaleFactor: product.purchaseToSaleFactor || 1,
      saleToBaseFactor: product.saleToBaseFactor || 1,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      alertLevel: product.alertLevel || 10,
      description: product.description || "",
      attributes: product.attributes || {},
      image: product.image || null,
    });
    setEditingId(product.documentId);
    if (product.image?.url) {
      setImagePreview(`${STRAPI_URL}${product.image.url}`);
    } else {
      setImagePreview("");
    }

    if (product.category?.documentId)
      loadSubCategories(product.category.documentId);
    if (product.subCategory?.documentId)
      loadChildCategories(product.subCategory.documentId);

    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetchAPI(`/products/${documentId}`, { method: "DELETE" });
      loadProducts();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let imageId = formData.image?.id;
      if (imageFile) {
        const uploaded = await uploadFile(imageFile);
        imageId = uploaded.id;
      }

      const payload = {
        ...formData,
        image: imageId || null,
        category: formData.category || null,
        subCategory: formData.subCategory || null,
        childCategory: formData.childCategory || null,
      };

      if (editingId) {
        await fetchAPI(`/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ data: payload }),
        });
      } else {
        await fetchAPI("/products", {
          method: "POST",
          body: JSON.stringify({ data: payload }),
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

  const handleCategoryChange = (val: string) => {
    setFormData({
      ...formData,
      category: val,
      subCategory: "",
      childCategory: "",
    });
    setSubCategories([]);
    setChildCategories([]);
    if (val) loadSubCategories(val);
  };

  const handleSubCategoryChange = (val: string) => {
    setFormData({ ...formData, subCategory: val, childCategory: "" });
    setChildCategories([]);
    if (val) loadChildCategories(val);
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
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
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
                <th style={{ padding: "1rem" }}>Name / SKU</th>
                <th style={{ padding: "1rem" }}>Categories</th>
                <th style={{ padding: "1rem" }}>Stock</th>
                <th style={{ padding: "1rem" }}>Unit Price</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr
                    key={item.documentId}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontFamily: "monospace",
                        }}
                      >
                        {item.sku}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontSize: "0.85rem", color: "#1e293b" }}>
                        {item.category?.name || "N/A"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {item.subCategory?.name
                          ? `> ${item.subCategory.name}`
                          : ""}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color:
                            item.stockQuantity <= (item.alertLevel || 10)
                              ? "#ef4444"
                              : "#22c55e",
                        }}
                      >
                        {item.stockQuantity} {item.baseUnit}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div>Buy: ${item.costPrice}</div>
                      <div style={{ fontWeight: 600 }}>
                        Sell: ${item.sellingPrice}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="btn-icon"
                        style={{ color: "#3b82f6", marginRight: "0.5rem" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.documentId)}
                        className="btn-icon"
                        style={{ color: "#ef4444" }}
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
      </div>

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
            padding: "2rem",
          }}
        >
          <div
            className="glass-panel"
            style={{
              background: "white",
              padding: "2rem",
              width: "95%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingId ? "Edit Product" : "New Product"}
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Category Hierarchy */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    marginBottom: "1rem",
                    color: "#475569",
                  }}
                >
                  PRODUCT CLASSIFICATION
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      required
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.documentId} value={c.documentId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sub-Category</label>
                    <select
                      className="form-input"
                      disabled={!formData.category}
                      value={formData.subCategory}
                      onChange={(e) => handleSubCategoryChange(e.target.value)}
                    >
                      <option value="">Select Sub-Category</option>
                      {subCategories.map((s) => (
                        <option key={s.documentId} value={s.documentId}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Child-Category</label>
                    <select
                      className="form-input"
                      disabled={!formData.subCategory}
                      value={formData.childCategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          childCategory: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Child-Category</option>
                      {childCategories.map((cc) => (
                        <option key={cc.documentId} value={cc.documentId}>
                          {cc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
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
                  <label className="form-label">SKU / Barcode</label>
                  <input
                    className="form-input"
                    style={{ width: "100%" }}
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Units & Conversion (Universal Design) */}
              <div
                style={{
                  background: "#f0f9ff",
                  padding: "1.5rem",
                  borderRadius: "1rem",
                  border: "1px solid #bae6fd",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    marginBottom: "1rem",
                    color: "#0369a1",
                  }}
                >
                  UNIT & CONVERSION (e.g. Box {">"} Strip {">"} Tablet)
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Purchase Unit</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Box"
                      value={formData.purchaseUnit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchaseUnit: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sale Unit</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Strip"
                      value={formData.saleUnit}
                      onChange={(e) =>
                        setFormData({ ...formData, saleUnit: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base Unit (Smallest)</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Tablet"
                      value={formData.baseUnit}
                      onChange={(e) =>
                        setFormData({ ...formData, baseUnit: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">
                      How many <strong>{formData.saleUnit}</strong> in one{" "}
                      <strong>{formData.purchaseUnit}</strong>?
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.purchaseToSaleFactor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchaseToSaleFactor: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      How many <strong>{formData.baseUnit}</strong> in one{" "}
                      <strong>{formData.saleUnit}</strong>?
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.saleToBaseFactor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          saleToBaseFactor: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Cost / Buy Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPrice: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellingPrice: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Stock (in {formData.baseUnit})
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Alert Level</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.alertLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alertLevel: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Image & Description */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label className="form-label">Product Image</label>
                  <input
                    type="file"
                    onChange={handleImageChange}
                    style={{ fontSize: "0.8rem" }}
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      style={{
                        width: "100%",
                        height: "100px",
                        objectFit: "contain",
                        marginTop: "0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #ddd",
                      }}
                    />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Notes</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    style={{ width: "100%" }}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #eee",
                }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 2, padding: "1rem" }}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                    ? "Update Product"
                    : "Save Product"}
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
