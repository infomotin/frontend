"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { fetchAPI, uploadFile, STRAPI_URL } from "../../../lib/api";

interface StrapiImage {
  id: number;
  url: string;
}

interface ProductManufacturer {
  id: number;
  documentId: string;
  name: string;
  address: string;
  contactNumber: string;
  logo?: StrapiImage | null;
}

export default function ProductManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<ProductManufacturer[]>([]);
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
    address: "",
    contactNumber: "",
    logo: null as StrapiImage | null,
  });

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI(
        "/product-manufacturers?populate=*&sort=name:ASC"
      );
      setManufacturers(res.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load manufacturers");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", address: "", contactNumber: "", logo: null });
    setLogoFile(null);
    setLogoPreview("");
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
        ...formData,
        logo: logoId || null,
      };

      const method = editingId ? "PUT" : "POST";
      const path = editingId
        ? `/product-manufacturers/${editingId}`
        : "/product-manufacturers";

      await fetchAPI(path, {
        method,
        body: JSON.stringify({ data: payload }),
      });

      setIsModalOpen(false);
      resetForm();
      loadManufacturers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (m: ProductManufacturer) => {
    setEditingId(m.documentId);
    setFormData({
      name: m.name,
      address: m.address || "",
      contactNumber: m.contactNumber || "",
      logo: m.logo || null,
    });
    if (m.logo?.url) {
      setLogoPreview(`${STRAPI_URL}${m.logo.url}`);
    } else {
      setLogoPreview("");
    }
    setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetchAPI(`/product-manufacturers/${documentId}`, {
        method: "DELETE",
      });
      loadManufacturers();
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
          Product Manufacturers
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          + Add Manufacturer
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
                <th style={{ padding: "1rem", textAlign: "left" }}>Address</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Contact</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {manufacturers.map((m) => (
                <tr
                  key={m.documentId}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <td style={{ padding: "1rem" }}>
                    {m.logo?.url ? (
                      <Image
                        src={`${STRAPI_URL}${m.logo.url}`}
                        alt={m.name}
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
                        N/A
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {m.address || "N/A"}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {m.contactNumber || "N/A"}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleEdit(m)}
                      className="btn-icon"
                      style={{ color: "#3b82f6", marginRight: "0.5rem" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(m.documentId)}
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
            <h2>{editingId ? "Edit Manufacturer" : "New Manufacturer"}</h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div className="form-group">
                <label className="form-label">Manufacturer Name</label>
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
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  style={{ width: "100%" }}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input
                  className="form-input"
                  style={{ width: "100%" }}
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNumber: e.target.value })
                  }
                />
              </div>

              {/* Logo Upload */}
              <div className="form-group">
                <label className="form-label">Manufacturer Logo</label>
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
