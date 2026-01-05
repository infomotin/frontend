"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../lib/api";

interface AddressEntity {
  id: number;
  documentId: string;
  name: string;
  bnName?: string;
}

interface Customer {
  id: number;
  documentId: string;
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  customerType: string;
  creditLimit: number;
  currentBalance: number;
  country?: AddressEntity;
  division?: AddressEntity;
  district?: AddressEntity;
  upazila?: AddressEntity;
  cityCorporation?: AddressEntity;
  zone?: AddressEntity;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine: "",
    customerType: "Retail",
    creditLimit: 0,
    country: "",
    division: "",
    district: "",
    upazila: "",
    cityCorporation: "",
    zone: "",
  });

  // Address Dropdowns Data
  const [countries, setCountries] = useState<AddressEntity[]>([]);
  const [divisions, setDivisions] = useState<AddressEntity[]>([]);
  const [districts, setDistricts] = useState<AddressEntity[]>([]);
  const [upazilas, setUpazilas] = useState<AddressEntity[]>([]);
  const [cityCorporations, setCityCorporations] = useState<AddressEntity[]>([]);
  const [zones, setZones] = useState<AddressEntity[]>([]);

  useEffect(() => {
    loadCustomers();
    loadInitialAddressData();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI("/customers?populate=*");
      setCustomers(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const loadInitialAddressData = async () => {
    try {
      const res = await fetchAPI("/countries?sort=name:ASC");
      setCountries(res.data || []);
    } catch (err) {
      console.error("Failed to load countries", err);
    }
  };

  const loadDivisions = async (countryId: string) => {
    try {
      const res = await fetchAPI(
        `/divisions?filters[country][documentId][$eq]=${countryId}&sort=name:ASC`
      );
      setDivisions(res.data || []);
    } catch (err) {
      console.error("Failed to load divisions", err);
    }
  };

  const loadDistricts = async (divisionId: string) => {
    try {
      const res = await fetchAPI(
        `/districts?filters[division][documentId][$eq]=${divisionId}&sort=name:ASC`
      );
      setDistricts(res.data || []);
    } catch (err) {
      console.error("Failed to load districts", err);
    }
  };

  const loadUpazilas = async (districtId: string) => {
    try {
      const res = await fetchAPI(
        `/upazilas?filters[district][documentId][$eq]=${districtId}&sort=name:ASC`
      );
      setUpazilas(res.data || []);
    } catch (err) {
      console.error("Failed to load upazilas", err);
    }
  };

  const loadCityCorporations = async (districtId: string) => {
    try {
      const res = await fetchAPI(
        `/city-corporations?filters[district][documentId][$eq]=${districtId}&sort=name:ASC`
      );
      setCityCorporations(res.data || []);
    } catch (err) {
      console.error("Failed to load city corporations", err);
    }
  };

  const loadZones = async (cityCorpId: string) => {
    try {
      const res = await fetchAPI(
        `/zones?filters[cityCorporation][documentId][$eq]=${cityCorpId}&sort=name:ASC`
      );
      setZones(res.data || []);
    } catch (err) {
      console.error("Failed to load zones", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const path = editingId ? `/customers/${editingId}` : "/customers";

      const payload = {
        data: {
          ...formData,
          country: formData.country || null,
          division: formData.division || null,
          district: formData.district || null,
          upazila: formData.upazila || null,
          cityCorporation: formData.cityCorporation || null,
          zone: formData.zone || null,
        },
      };

      await fetchAPI(path, {
        method,
        body: JSON.stringify(payload),
      });

      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
      loadCustomers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save customer");
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.documentId);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      addressLine: customer.addressLine || "",
      customerType: customer.customerType,
      creditLimit: customer.creditLimit,
      country: customer.country?.documentId || "",
      division: customer.division?.documentId || "",
      district: customer.district?.documentId || "",
      upazila: customer.upazila?.documentId || "",
      cityCorporation: customer.cityCorporation?.documentId || "",
      zone: customer.zone?.documentId || "",
    });

    if (customer.country?.documentId)
      loadDivisions(customer.country.documentId);
    if (customer.division?.documentId)
      loadDistricts(customer.division.documentId);
    if (customer.district?.documentId) {
      loadUpazilas(customer.district.documentId);
      loadCityCorporations(customer.district.documentId);
    }
    if (customer.cityCorporation?.documentId)
      loadZones(customer.cityCorporation.documentId);

    setIsModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await fetchAPI(`/customers/${documentId}`, { method: "DELETE" });
      loadCustomers();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete customer"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      addressLine: "",
      customerType: "Retail",
      creditLimit: 0,
      country: "",
      division: "",
      district: "",
      upazila: "",
      cityCorporation: "",
      zone: "",
    });
    setDivisions([]);
    setDistricts([]);
    setUpazilas([]);
    setCityCorporations([]);
    setZones([]);
  };

  const handleAddrChange = (field: string, val: string) => {
    const updates: Record<string, string> = { [field]: val };

    if (field === "country") {
      updates.division = "";
      updates.district = "";
      updates.upazila = "";
      updates.cityCorporation = "";
      updates.zone = "";
      setDivisions([]);
      setDistricts([]);
      setUpazilas([]);
      setCityCorporations([]);
      setZones([]);
      if (val) loadDivisions(val);
    } else if (field === "division") {
      updates.district = "";
      updates.upazila = "";
      updates.cityCorporation = "";
      updates.zone = "";
      setDistricts([]);
      setUpazilas([]);
      setCityCorporations([]);
      setZones([]);
      if (val) loadDistricts(val);
    } else if (field === "district") {
      updates.upazila = "";
      updates.cityCorporation = "";
      updates.zone = "";
      setUpazilas([]);
      setCityCorporations([]);
      setZones([]);
      if (val) {
        loadUpazilas(val);
        loadCityCorporations(val);
      }
    } else if (field === "cityCorporation") {
      updates.zone = "";
      setZones([]);
      if (val) loadZones(val);
    }

    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="fade-in">
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>
            Customers
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Manage your customer base and credit relationships
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setEditingId(null);
            setIsModalOpen(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
          }}
        >
          <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>+</span>
          Add Customer
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: "1rem", color: "#64748b" }}>
            Loading customers...
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "#fff1f2",
            color: "#e11d48",
            borderRadius: "0.75rem",
            marginBottom: "1.5rem",
            border: "1px solid #ffe4e6",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span>⚠️</span>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
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
                  <th
                    style={{
                      padding: "1.25rem 1rem",
                      fontWeight: 600,
                      color: "#475569",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.025em",
                    }}
                  >
                    Customer Info
                  </th>
                  <th
                    style={{
                      padding: "1.25rem 1rem",
                      fontWeight: 600,
                      color: "#475569",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.025em",
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: "1.25rem 1rem",
                      fontWeight: 600,
                      color: "#475569",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.025em",
                    }}
                  >
                    Location
                  </th>
                  <th
                    style={{
                      padding: "1.25rem 1rem",
                      fontWeight: 600,
                      color: "#475569",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.025em",
                      textAlign: "right",
                    }}
                  >
                    Credit Limit
                  </th>
                  <th
                    style={{
                      padding: "1.25rem 1rem",
                      fontWeight: 600,
                      color: "#475569",
                      fontSize: "0.85rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.025em",
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "4rem 2rem",
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                        👥
                      </div>
                      <p>No customers found. Add your first customer!</p>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.documentId}
                      className="table-row-hover"
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                    >
                      <td style={{ padding: "1.25rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>
                          {customer.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#64748b",
                            marginTop: "0.25rem",
                          }}
                        >
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                            {customer.email}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "1.25rem 1rem" }}>
                        <span
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "2rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background:
                              customer.customerType === "Retail"
                                ? "#eff6ff"
                                : customer.customerType === "Corporate"
                                ? "#f5f3ff"
                                : "#ecfdf5",
                            color:
                              customer.customerType === "Retail"
                                ? "#2563eb"
                                : customer.customerType === "Corporate"
                                ? "#7c3aed"
                                : "#059669",
                          }}
                        >
                          {customer.customerType}
                        </span>
                      </td>
                      <td style={{ padding: "1.25rem 1rem" }}>
                        <div style={{ fontSize: "0.9rem", color: "#475569" }}>
                          {customer.district?.name || "N/A"}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          {customer.division?.name || "N/A"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "1.25rem 1rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        ${customer.creditLimit.toLocaleString()}
                      </td>
                      <td
                        style={{ padding: "1.25rem 1rem", textAlign: "right" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => handleEdit(customer)}
                            className="btn-icon"
                            title="Edit Customer"
                            style={{
                              padding: "0.5rem",
                              borderRadius: "0.5rem",
                              background: "#f1f5f9",
                              border: "none",
                              color: "#3b82f6",
                              cursor: "pointer",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.documentId)}
                            className="btn-icon"
                            title="Delete Customer"
                            style={{
                              padding: "0.5rem",
                              borderRadius: "0.5rem",
                              background: "#fef2f2",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal - Redesigned matching Suppliers */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="glass-panel fade-in"
            style={{
              background: "white",
              padding: "2.5rem",
              borderRadius: "1.5rem",
              width: "100%",
              maxWidth: "750px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
                {editingId ? "Edit Customer Details" : "Create New Customer"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Basic Info Section */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                    }}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    placeholder="e.g. +1 234 567 890"
                    value={formData.phone}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                    }}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
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
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="john@example.com"
                    value={formData.email}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                    }}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type</label>
                  <select
                    className="form-input"
                    value={formData.customerType}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                      background: "white",
                    }}
                    onChange={(e) =>
                      setFormData({ ...formData, customerType: e.target.value })
                    }
                  >
                    <option value="Retail">Retail</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Government">Government</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Credit Limit ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.creditLimit}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                  }}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditLimit: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Address Section */}
              <div
                className="address-section"
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
                    marginBottom: "1.25rem",
                    color: "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  📍 Delivery Address
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Country
                    </label>
                    <select
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.4rem",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.85rem",
                      }}
                      value={formData.country}
                      onChange={(e) =>
                        handleAddrChange("country", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.documentId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Division
                    </label>
                    <select
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.4rem",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.85rem",
                      }}
                      value={formData.division}
                      onChange={(e) =>
                        handleAddrChange("division", e.target.value)
                      }
                      disabled={!formData.country}
                    >
                      <option value="">Select</option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.documentId}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.75rem" }}
                    >
                      District
                    </label>
                    <select
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.4rem",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.85rem",
                      }}
                      value={formData.district}
                      onChange={(e) =>
                        handleAddrChange("district", e.target.value)
                      }
                      disabled={!formData.division}
                    >
                      <option value="">Select</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.documentId}>
                          {d.name}
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
                    marginTop: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.75rem", color: "#6366f1" }}
                    >
                      Upazila
                    </label>
                    <select
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.4rem",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.85rem",
                      }}
                      value={formData.upazila}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          upazila: e.target.value,
                          cityCorporation: "",
                          zone: "",
                        });
                        setZones([]);
                      }}
                      disabled={
                        !formData.district || !!formData.cityCorporation
                      }
                    >
                      <option value="">Select</option>
                      {upazilas.map((u) => (
                        <option key={u.id} value={u.documentId}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.75rem", color: "#f59e0b" }}
                    >
                      City Corp
                    </label>
                    <select
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.4rem",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.85rem",
                      }}
                      value={formData.cityCorporation}
                      onChange={(e) =>
                        handleAddrChange("cityCorporation", e.target.value)
                      }
                      disabled={!formData.district || !!formData.upazila}
                    >
                      <option value="">Select</option>
                      {cityCorporations.map((c) => (
                        <option key={c.id} value={c.documentId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label
                      className="form-label"
                      style={{ fontSize: "0.75rem", color: "#f59e0b" }}
                    >
                      Zone
                    </label>
                    <select
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "0.4rem",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.85rem",
                      }}
                      value={formData.zone}
                      onChange={(e) =>
                        setFormData({ ...formData, zone: e.target.value })
                      }
                      disabled={!formData.cityCorporation}
                    >
                      <option value="">Select</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.documentId}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label" style={{ fontSize: "0.75rem" }}>
                    Detail Address Line
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "0.4rem",
                      border: "1px solid #e2e8f0",
                      fontSize: "0.85rem",
                    }}
                    placeholder="House No, Road No, Flat No..."
                    value={formData.addressLine}
                    onChange={(e) =>
                      setFormData({ ...formData, addressLine: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    padding: "1rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {editingId ? "Update Customer" : "Create Customer"}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    color: "#64748b",
                    padding: "1rem",
                    fontSize: "1rem",
                    fontWeight: 600,
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
