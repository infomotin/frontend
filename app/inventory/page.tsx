"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchAPI, uploadFile, STRAPI_URL } from "../../lib/api";

interface StrapiImage {
  id: number;
  url: string;
}

interface ProductAttribute {
  documentId: string;
  name: string;
  inputType: string;
  values?: string[];
}

interface Category {
  documentId: string;
  name: string;
  attributes?: ProductAttribute[];
}

interface Brand {
  documentId: string;
  name: string;
}

interface Manufacturer {
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
  attributeValues?: Record<string, string>;
  alertLevel?: number;
  image?: StrapiImage | null;
  category?: Category;
  subCategory?: Category;
  childCategory?: Category;
  brand?: Brand;
  manufacturer?: Manufacturer;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

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
    brand: "",
    manufacturer: "",
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
    attributeValues: {} as Record<string, string>,
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

  const loadCategories = async () => {
    try {
      const res = await fetchAPI(
        "/product-categories?populate=*&sort=name:ASC"
      );
      if (res.data) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBrands = async () => {
    try {
      const res = await fetchAPI("/product-brands?sort=name:ASC");
      if (res.data) setBrands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadManufacturers = async () => {
    try {
      const res = await fetchAPI("/product-manufacturers?sort=name:ASC");
      if (res.data) setManufacturers(res.data);
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
    loadCategories();
    loadBrands();
    loadManufacturers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      subCategory: "",
      childCategory: "",
      brand: "",
      manufacturer: "",
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
      attributeValues: {},
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

  const handleOpenEdit = async (product: any) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category?.documentId || "",
      subCategory: product.subCategory?.documentId || "",
      childCategory: product.childCategory?.documentId || "",
      brand: product.brand?.documentId || "",
      manufacturer: product.manufacturer?.documentId || "",
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
      attributeValues: product.attributeValues || {},
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
    if (!confirm("Are you sure?")) return;
    try {
      await fetchAPI(`/products/${documentId}`, { method: "DELETE" });
      loadProducts();
    } catch (err: any) {
      alert("Failed: " + err.message);
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
        brand: formData.brand || null,
        manufacturer: formData.manufacturer || null,
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

  const selectedCategory = categories.find(
    (c) => c.documentId === formData.category
  );
  const relevantAttributes = selectedCategory?.attributes || [];

  const handleAttributeChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      attributeValues: {
        ...formData.attributeValues,
        [name]: value,
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
              <th style={{ padding: "1rem" }}>Product</th>
              <th style={{ padding: "1rem" }}>Brand & Category</th>
              <th style={{ padding: "1rem" }}>Stock</th>
              <th style={{ padding: "1rem" }}>Status</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => (
              <tr
                key={item.documentId}
                style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              >
                <td style={{ padding: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    {item.image?.url ? (
                      <Image
                        src={`${STRAPI_URL}${item.image.url}`}
                        alt={item.name}
                        width={40}
                        height={40}
                        style={{ borderRadius: "0.25rem", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "#f1f5f9",
                          borderRadius: "0.25rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                        }}
                      >
                        N/A
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                          fontFamily: "monospace",
                        }}
                      >
                        {item.sku}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#3b82f6",
                    }}
                  >
                    {item.brand?.name || "No Brand"}
                  </div>
                  <div style={{ fontSize: "0.85rem" }}>
                    {item.category?.name || "General"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {item.subCategory?.name ? `→ ${item.subCategory.name}` : ""}
                  </div>
                </td>
                <td style={{ padding: "1rem" }}>
                  <div style={{ fontWeight: 700 }}>
                    {item.stockQuantity} {item.baseUnit}
                  </div>
                </td>
                <td style={{ padding: "1rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "1rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background:
                        item.stockQuantity > (item.alertLevel || 10)
                          ? "#ecfdf5"
                          : "#fef2f2",
                      color:
                        item.stockQuantity > (item.alertLevel || 10)
                          ? "#059669"
                          : "#ef4444",
                    }}
                  >
                    {item.stockQuantity > (item.alertLevel || 10)
                      ? "IN STOCK"
                      : "LOW STOCK"}
                  </span>
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
            ))}
          </tbody>
        </table>
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
              padding: "2.5rem",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginBottom: "2rem" }}>
              {editingId ? "Edit Product" : "New Universal Product"}
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              {/* Part 1: Classification */}
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
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#64748b",
                    marginBottom: "1rem",
                  }}
                >
                  1. Product Classification
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <select
                      className="form-input"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b.documentId} value={b.documentId}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manufacturer</label>
                    <select
                      className="form-input"
                      value={formData.manufacturer}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          manufacturer: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Manufacturer</option>
                      {manufacturers.map((m) => (
                        <option key={m.documentId} value={m.documentId}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Main Category</label>
                    <select
                      required
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          category: e.target.value,
                          subCategory: "",
                          childCategory: "",
                          attributeValues: {},
                        });
                        loadSubCategories(e.target.value);
                      }}
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
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          subCategory: e.target.value,
                          childCategory: "",
                        });
                        loadChildCategories(e.target.value);
                      }}
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

              {/* Part 2: Dynamic Attributes */}
              {relevantAttributes.length > 0 && (
                <div
                  style={{
                    background: "#fffbeb",
                    padding: "1.5rem",
                    borderRadius: "1rem",
                    border: "1px solid #fef3c7",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#b45309",
                      marginBottom: "1rem",
                    }}
                  >
                    2. Specific Attributes (Dynamic)
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1.5rem",
                    }}
                  >
                    {relevantAttributes.map((attr) => (
                      <div key={attr.documentId} className="form-group">
                        <label className="form-label">{attr.name}</label>
                        {attr.inputType === "Select" ? (
                          <select
                            className="form-input"
                            value={formData.attributeValues[attr.name] || ""}
                            onChange={(e) =>
                              handleAttributeChange(attr.name, e.target.value)
                            }
                          >
                            <option value="">Select {attr.name}</option>
                            {attr.values?.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={
                              attr.inputType === "Date"
                                ? "date"
                                : attr.inputType === "Number"
                                ? "number"
                                : "text"
                            }
                            className="form-input"
                            value={formData.attributeValues[attr.name] || ""}
                            onChange={(e) =>
                              handleAttributeChange(attr.name, e.target.value)
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Part 3: Basic Details */}
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
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Code</label>
                  <input
                    className="form-input"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="form-input"
                  accept="image/*"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      marginTop: "0.5rem",
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "0.5rem",
                    }}
                  />
                )}
              </div>

              {/* Part 4: Units & Stock */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Base Unit</label>
                  <input
                    className="form-input"
                    value={formData.baseUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, baseUnit: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost Price</label>
                  <input
                    type="number"
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
                  <label className="form-label">Initial Stock</label>
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
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  borderTop: "1px solid #eee",
                  paddingTop: "1.5rem",
                }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "1rem" }}
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
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
