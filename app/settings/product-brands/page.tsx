"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { fetchAPI, uploadFile, STRAPI_URL } from "../../../lib/api";

interface StrapiImage {
  id: number;
  url: string;
}

interface ProductBrand {
  id: number;
  documentId: string;
  name: string;
  description: string;
  logo?: StrapiImage | null;
}

export default function ProductBrandsPage() {
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Media State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: null as StrapiImage | null,
  });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/product-brands?populate=*&sort=name:ASC");
      setBrands(res.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoFile(file);
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let logoId = formData.logo?.id;
      if (logoFile) {
        const uploaded = await uploadFile(logoFile);
        logoId = uploaded.id;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        logo: logoId || null,
      };

      const method = editingId ? "PUT" : "POST";
      const path = editingId
        ? `/product-brands/${editingId}`
        : "/product-brands";

      await fetchAPI(path, {
        method,
        body: JSON.stringify({ data: payload }),
      });

      setIsModalOpen(false);
      resetForm();
      loadBrands();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", logo: null });
    setLogoFile(null);
    setLogoPreview("");
  };

  const handleEdit = (brand: ProductBrand) => {
    setEditingId(brand.documentId);
    setFormData({
      name: brand.name,
      description: brand.description || "",
      logo: brand.logo || null,
    });
    if (brand.logo?.url) {
      setLogoPreview(`${STRAPI_URL}${brand.logo.url}`);
    } else {
      setLogoPreview("");
    }
    setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetchAPI(`/product-brands/${documentId}`, { method: "DELETE" });
      loadBrands();
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
          Product Brands
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          + Add Brand
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
                <th style={{ padding: "1rem", textAlign: "left" }}>Logo</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Name</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>
                  Description
                </th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr
                  key={brand.documentId}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <td style={{ padding: "1rem" }}>
                    {brand.logo?.url ? (
                      <Image
                        src={`${STRAPI_URL}${brand.logo.url}`}
                        alt={brand.name}
                        width={40}
                        height={40}
                        style={{
                          borderRadius: "0.25rem",
                          objectFit: "contain",
                        }}
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
                          fontSize: "0.7rem",
                          color: "#94a3b8",
                        }}
                      >
                        No Logo
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {brand.name}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {brand.description || "N/A"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleEdit(brand)}
                      className="btn-icon"
                      style={{ color: "#3b82f6", marginRight: "0.5rem" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(brand.documentId)}
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
            <h2>{editingId ? "Edit Brand" : "New Brand"}</h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group">
                <label className="form-label">Brand Name</label>
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

              {/* Logo Upload */}
              <div className="form-group">
                <label className="form-label">Brand Logo</label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  {logoPreview && (
                    <div
                      style={{
                        position: "relative",
                        width: "60px",
                        height: "60px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.5rem",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={logoPreview}
                        alt="Preview"
                        fill
                        style={{ objectFit: "contain" }}
                        unoptimized
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {isSubmitting ? "Saving..." : "Save"}
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
