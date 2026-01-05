"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

type TabType =
  | "countries"
  | "divisions"
  | "districts"
  | "upazilas"
  | "city-corporations"
  | "zones";

interface AddressItem extends AddressEntity {
  country?: AddressEntity;
  division?: AddressEntity;
  district?: AddressEntity;
  cityCorporation?: AddressEntity;
  ward?: string;
}

interface AddressFormData {
  name: string;
  bnName: string;
  code: string;
  country: string;
  division: string;
  district: string;
  cityCorporation: string;
  ward: string;
}

export default function AddressSetupPage() {
  const [activeTab, setActiveTab] = useState<TabType>("countries");
  const [items, setItems] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Parent data for relations
  const [countries, setCountries] = useState<AddressEntity[]>([]);
  const [divisions, setDivisions] = useState<AddressEntity[]>([]);
  const [districts, setDistricts] = useState<AddressEntity[]>([]);
  const [cityCorps, setCityCorps] = useState<AddressEntity[]>([]);

  const [formData, setFormData] = useState<AddressFormData>({
    name: "",
    bnName: "",
    code: "",
    country: "",
    division: "",
    district: "",
    cityCorporation: "",
    ward: "",
  });

  useEffect(() => {
    const init = async () => {
      setError("");
      await loadItems();
      await loadParentData();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadParentData = async () => {
    try {
      const [cRes, vRes, dRes, ccRes] = await Promise.all([
        fetchAPI("/countries?sort=name:ASC"),
        fetchAPI("/divisions?sort=name:ASC"),
        fetchAPI("/districts?sort=name:ASC"),
        fetchAPI("/city-corporations?sort=name:ASC"),
      ]);
      setCountries(cRes.data || []);
      setDivisions(vRes.data || []);
      setDistricts(dRes.data || []);
      setCityCorps(ccRes.data || []);
    } catch (err: any) {
      console.error("Failed to load parent data", err);
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");
      let endpoint = `/${activeTab}?sort=name:ASC`;

      if (activeTab === "divisions") endpoint += "&populate=country";
      if (activeTab === "districts") endpoint += "&populate=division";
      if (activeTab === "upazilas") endpoint += "&populate=district";
      if (activeTab === "city-corporations") endpoint += "&populate=district";
      if (activeTab === "zones") endpoint += "&populate=cityCorporation";

      const res = await fetchAPI(endpoint);
      setItems(res.data || []);
    } catch (err: any) {
      console.error(`Failed to load ${activeTab}`, err);
      if (err.message.includes("Forbidden")) {
        setError(
          `Access Denied: Please enable 'find' permission for '${activeTab}' in Strapi Admin Settings.`
        );
      } else {
        setError(err.message || "Failed to load items");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      bnName: "",
      code: "",
      country: "",
      division: "",
      district: "",
      cityCorporation: "",
      ward: "",
    });
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.documentId);
    setFormData({
      name: item.name,
      bnName: item.bnName || "",
      code: item.code || "",
      country: item.country?.documentId || "",
      division: item.division?.documentId || "",
      district: item.district?.documentId || "",
      cityCorporation: item.cityCorporation?.documentId || "",
      ward: item.ward || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetchAPI(`/${activeTab}/${id}`, { method: "DELETE" });
      loadItems();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        name: formData.name,
        bnName: formData.bnName,
      };

      if (activeTab === "countries") data.code = formData.code;
      if (activeTab === "divisions") data.country = formData.country;
      if (activeTab === "districts") data.division = formData.division;
      if (activeTab === "upazilas") {
        data.district = formData.district;
        data.ward = formData.ward;
      }
      if (activeTab === "city-corporations") data.district = formData.district;
      if (activeTab === "zones") {
        data.cityCorporation = formData.cityCorporation;
        data.ward = formData.ward;
      }

      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId
        ? `/${activeTab}/${editingId}`
        : `/${activeTab}`;

      await fetchAPI(endpoint, {
        method,
        body: JSON.stringify({ data }),
      });

      setIsModalOpen(false);
      resetForm();
      loadItems();
    } catch (err: any) {
      setError(err.message || "Save failed");
    }
  };

  const renderParentName = (item: any) => {
    if (activeTab === "divisions") return item.country?.name;
    if (activeTab === "districts") return item.division?.name;
    if (activeTab === "upazilas") return item.district?.name;
    if (activeTab === "city-corporations") return item.district?.name;
    if (activeTab === "zones") return item.cityCorporation?.name;
    return null;
  };

  const getParentLabel = () => {
    if (activeTab === "divisions") return "Country";
    if (activeTab === "districts") return "Division";
    if (activeTab === "upazilas") return "District";
    if (activeTab === "city-corporations") return "District";
    if (activeTab === "zones") return "City Corporation";
    return "";
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
        <h1 className="page-title" style={{ margin: 0 }}>
          Address Setup
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          + Add New {activeTab.slice(0, -1).replace("-", " ")}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            borderLeft: "4px solid #dc2626",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "2rem",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "0.5rem",
          overflowX: "auto",
        }}
      >
        {(
          [
            "countries",
            "divisions",
            "districts",
            "upazilas",
            "city-corporations",
            "zones",
          ] as TabType[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              background: activeTab === tab ? "var(--primary)" : "transparent",
              color: activeTab === tab ? "white" : "#64748b",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: 600,
              textTransform: "capitalize",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {tab.replace("-", " ")}
          </button>
        ))}
      </div>

      <div className="glass-panel">
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            Loading Items...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name (EN)</th>
                <th>Name (BN)</th>
                {getParentLabel() && <th>{getParentLabel()}</th>}
                {activeTab === "countries" && <th>Code</th>}
                {(activeTab === "upazilas" || activeTab === "zones") && (
                  <th>Ward</th>
                )}
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "#94a3b8",
                    }}
                  >
                    No items found. Make sure permissions are set in Strapi
                    Admin.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.documentId}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>{item.bnName || "-"}</td>
                    {getParentLabel() && (
                      <td>{renderParentName(item) || "-"}</td>
                    )}
                    {activeTab === "countries" && (
                      <td>
                        <code>{item.code}</code>
                      </td>
                    )}
                    {(activeTab === "upazilas" || activeTab === "zones") && (
                      <td>{item.ward || "-"}</td>
                    )}
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn"
                        style={{ padding: "0.4rem", marginRight: "0.5rem" }}
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn"
                        style={{
                          padding: "0.4rem",
                          background: "#fee2e2",
                          color: "#dc2626",
                        }}
                        onClick={() => handleDelete(item.documentId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="glass-panel"
            style={{ width: "100%", maxWidth: "500px", padding: "2rem" }}
          >
            <h2 style={{ marginBottom: "1.5rem" }}>
              {editingId ? "Edit" : "Add New"}{" "}
              {activeTab.slice(0, -1).replace("-", " ")}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  Name (English)
                </label>
                <input
                  type="text"
                  required
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.3rem",
                  }}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  Name (Bengali)
                </label>
                <input
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.3rem",
                  }}
                  value={formData.bnName}
                  onChange={(e) =>
                    setFormData({ ...formData, bnName: e.target.value })
                  }
                />
              </div>

              {activeTab === "countries" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Country Code (e.g. BD)
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.3rem",
                    }}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                </div>
              )}

              {activeTab === "divisions" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Country
                  </label>
                  <select
                    required
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.3rem",
                    }}
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                  >
                    <option value="">Select Country</option>
                    {countries.map((c) => (
                      <option key={c.documentId} value={c.documentId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === "districts" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    Division
                  </label>
                  <select
                    required
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.3rem",
                    }}
                    value={formData.division}
                    onChange={(e) =>
                      setFormData({ ...formData, division: e.target.value })
                    }
                  >
                    <option value="">Select Division</option>
                    {divisions.map((d) => (
                      <option key={d.documentId} value={d.documentId}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === "upazilas" && (
                <>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                      }}
                    >
                      District
                    </label>
                    <select
                      required
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.3rem",
                      }}
                      value={formData.district}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                    >
                      <option value="">Select District</option>
                      {districts.map((d) => (
                        <option key={d.documentId} value={d.documentId}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                      }}
                    >
                      Ward
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.3rem",
                      }}
                      value={formData.ward}
                      onChange={(e) =>
                        setFormData({ ...formData, ward: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {activeTab === "city-corporations" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    District
                  </label>
                  <select
                    required
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.3rem",
                    }}
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.documentId} value={d.documentId}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === "zones" && (
                <>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                      }}
                    >
                      City Corporation
                    </label>
                    <select
                      required
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.3rem",
                      }}
                      value={formData.cityCorporation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cityCorporation: e.target.value,
                        })
                      }
                    >
                      <option value="">Select City Corporation</option>
                      {cityCorps.map((cc) => (
                        <option key={cc.documentId} value={cc.documentId}>
                          {cc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                      }}
                    >
                      Ward
                    </label>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.3rem",
                      }}
                      value={formData.ward}
                      onChange={(e) =>
                        setFormData({ ...formData, ward: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1 }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
