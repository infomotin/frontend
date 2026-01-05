"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../lib/api";

interface AddressEntity {
  id: number;
  documentId: string;
  name: string;
  bnName?: string;
}

interface SystemSettings {
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  currencySymbol: string;
  country: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  cityCorporation: string | null;
  zone: string | null;
  zipCode: string;
  address1: string;
  address2: string;
  timezone: string;
  dateFormat: string;
  units: {
    weight: string[];
    length: string[];
    volume: string[];
  };
  taxRate: number;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
}

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Dropdown lists
  const [countries, setCountries] = useState<AddressEntity[]>([]);
  const [divisions, setDivisions] = useState<AddressEntity[]>([]);
  const [districts, setDistricts] = useState<AddressEntity[]>([]);
  const [upazilas, setUpazilas] = useState<AddressEntity[]>([]);
  const [cityCorporations, setCityCorporations] = useState<AddressEntity[]>([]);
  const [zones, setZones] = useState<AddressEntity[]>([]);

  const [formData, setFormData] = useState<SystemSettings>({
    siteName: "RefuelOS",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    currency: "USD",
    currencySymbol: "$",
    country: null,
    division: null,
    district: null,
    upazila: null,
    cityCorporation: null,
    zone: null,
    zipCode: "",
    address1: "",
    address2: "",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    units: {
      weight: ["kg", "g", "lb", "oz"],
      length: ["m", "cm", "ft", "in"],
      volume: ["L", "ml", "gal", "qt"],
    },
    taxRate: 0,
    companyName: "",
    companyPhone: "",
    companyEmail: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        await loadInitialData();
        await loadSettings();
      } catch (err: any) {
        console.error("Initialization failed", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadInitialData = async () => {
    try {
      const res = await fetchAPI("/countries?sort=name:ASC");
      if (res.data) setCountries(res.data);
    } catch (err: any) {
      console.error("Failed to load countries. Check Strapi permissions.", err);
      if (err.message.includes("Forbidden")) {
        setError(
          "Strapi Permissions Error: Please ensure Public/Authenticated roles have 'find' access to all Address entities (Country, Division, etc.)"
        );
      }
    }
  };

  const loadSettings = async () => {
    try {
      // Populate relations to get names/IDs
      const res = await fetchAPI("/system-setting?populate=*");
      if (res.data) {
        const data = res.data;

        // Merge with existing formData to preserve structure
        setFormData((prev) => ({
          ...prev,
          ...data,
          country: data.country?.documentId || null,
          division: data.division?.documentId || null,
          district: data.district?.documentId || null,
          upazila: data.upazila?.documentId || null,
          cityCorporation: data.cityCorporation?.documentId || null,
          zone: data.zone?.documentId || null,
        }));

        // Fetch dependent lists if data exists
        if (data.country?.documentId) loadDivisions(data.country.documentId);
        if (data.division?.documentId) loadDistricts(data.division.documentId);
        if (data.district?.documentId) {
          loadUpazilas(data.district.documentId);
          loadCityCorporations(data.district.documentId);
        }
        if (data.cityCorporation?.documentId)
          loadZones(data.cityCorporation.documentId);
      }
    } catch (err: any) {
      if (err.message.includes("Not Found")) {
        console.log("No settings found, using defaults");
      } else {
        console.error("Failed to load settings", err);
      }
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

  const handleCountryChange = (val: string) => {
    setFormData({
      ...formData,
      country: val,
      division: null,
      district: null,
      upazila: null,
      cityCorporation: null,
      zone: null,
    });
    setDivisions([]);
    setDistricts([]);
    setUpazilas([]);
    setCityCorporations([]);
    setZones([]);
    if (val) loadDivisions(val);
  };

  const handleDivisionChange = (val: string) => {
    setFormData({
      ...formData,
      division: val,
      district: null,
      upazila: null,
      cityCorporation: null,
      zone: null,
    });
    setDistricts([]);
    setUpazilas([]);
    setCityCorporations([]);
    setZones([]);
    if (val) loadDistricts(val);
  };

  const handleDistrictChange = (val: string) => {
    setFormData({
      ...formData,
      district: val,
      upazila: null,
      cityCorporation: null,
      zone: null,
    });
    setUpazilas([]);
    setCityCorporations([]);
    setZones([]);
    if (val) {
      loadUpazilas(val);
      loadCityCorporations(val);
    }
  };

  const handleCityCorpChange = (val: string) => {
    setFormData({ ...formData, cityCorporation: val, zone: null });
    setZones([]);
    if (val) loadZones(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      // In Strapi v5, PUT to single type works if it exists, but might need POST if not
      // Simple strategy: Always try PUT, catch error if logic suggests otherwise
      await fetchAPI("/system-setting", {
        method: "PUT",
        body: JSON.stringify({ data: formData }),
      });

      setSuccessMessage("Settings saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUnit = (
    category: "weight" | "length" | "volume",
    index: number,
    value: string
  ) => {
    const newUnits = { ...formData.units };
    newUnits[category][index] = value;
    setFormData({ ...formData, units: newUnits });
  };

  const addUnit = (category: "weight" | "length" | "volume") => {
    const newUnits = { ...formData.units };
    newUnits[category].push("");
    setFormData({ ...formData, units: newUnits });
  };

  const removeUnit = (
    category: "weight" | "length" | "volume",
    index: number
  ) => {
    const newUnits = { ...formData.units };
    newUnits[category] = newUnits[category].filter((_, i) => i !== index);
    setFormData({ ...formData, units: newUnits });
  };

  if (loading)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading Settings...
      </div>
    );

  return (
    <div className="fade-in">
      <h1 className="page-title">System Settings</h1>

      {error && (
        <div
          style={{
            padding: "1rem",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            borderLeft: "4px solid #b91c1c",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: "1rem",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Branding Section */}
        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              margin: "0 0 1.5rem 0",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid var(--primary)",
            }}
          >
            Branding
          </h2>
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
                Site Name
              </label>
              <input
                type="text"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.siteName}
                onChange={(e) =>
                  setFormData({ ...formData, siteName: e.target.value })
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
                Company Name
              </label>
              <input
                type="text"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
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
                Primary Color
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="color"
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.25rem",
                  }}
                  value={formData.primaryColor || "#6366f1"}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
                />
                <input
                  type="text"
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.25rem",
                  }}
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
                />
              </div>
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
                Secondary Color
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="color"
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.25rem",
                  }}
                  value={formData.secondaryColor || "#8b5cf6"}
                  onChange={(e) =>
                    setFormData({ ...formData, secondaryColor: e.target.value })
                  }
                />
                <input
                  type="text"
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.25rem",
                  }}
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, secondaryColor: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              margin: "0 0 1.5rem 0",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid var(--primary)",
            }}
          >
            Bangladesh Detailed Address Setup
          </h2>
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
                Country
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.country || ""}
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c.documentId} value={c.documentId}>
                    {c.name} {c.bnName ? `(${c.bnName})` : ""}
                  </option>
                ))}
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
                Division
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.division || ""}
                onChange={(e) => handleDivisionChange(e.target.value)}
                disabled={!formData.country}
              >
                <option value="">Select Division</option>
                {divisions.map((d) => (
                  <option key={d.documentId} value={d.documentId}>
                    {d.name} {d.bnName ? `(${d.bnName})` : ""}
                  </option>
                ))}
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
                District
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.district || ""}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!formData.division}
              >
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.documentId} value={d.documentId}>
                    {d.name} {d.bnName ? `(${d.bnName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                height: "1px",
                background: "#e2e8f0",
                margin: "0.5rem 0",
              }}
            ></div>

            {/* Urban Section */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--primary)",
                }}
              >
                City Corporation (Urban)
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid var(--primary)",
                  borderRadius: "0.25rem",
                }}
                value={formData.cityCorporation || ""}
                onChange={(e) => handleCityCorpChange(e.target.value)}
                disabled={!formData.district}
              >
                <option value="">Select City Corporation</option>
                {cityCorporations.map((c) => (
                  <option key={c.documentId} value={c.documentId}>
                    {c.name} {c.bnName ? `(${c.bnName})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--primary)",
                }}
              >
                Zone
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid var(--primary)",
                  borderRadius: "0.25rem",
                }}
                value={formData.zone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, zone: e.target.value })
                }
                disabled={!formData.cityCorporation}
              >
                <option value="">Select Zone</option>
                {zones.map((z) => (
                  <option key={z.documentId} value={z.documentId}>
                    {z.name} {z.bnName ? `(${z.bnName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                textAlign: "center",
                margin: "0.5rem 0",
                fontWeight: 600,
                color: "#94a3b8",
                fontSize: "0.8rem",
              }}
            >
              --- OR ---
            </div>

            {/* Rural Section */}
            <div style={{ gridColumn: "span 2" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#64748b",
                }}
              >
                Upazila (Rural/Sub-district)
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.upazila || ""}
                onChange={(e) =>
                  setFormData({ ...formData, upazila: e.target.value })
                }
                disabled={!formData.district}
              >
                <option value="">Select Upazila</option>
                {upazilas.map((u) => (
                  <option key={u.documentId} value={u.documentId}>
                    {u.name} {u.bnName ? `(${u.bnName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                height: "1px",
                background: "#e2e8f0",
                margin: "0.5rem 0",
              }}
            ></div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                Zip Code
              </label>
              <input
                type="text"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.zipCode}
                onChange={(e) =>
                  setFormData({ ...formData, zipCode: e.target.value })
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
                Address Line 1
              </label>
              <input
                type="text"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.address1}
                onChange={(e) =>
                  setFormData({ ...formData, address1: e.target.value })
                }
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                }}
              >
                Address Line 2
              </label>
              <input
                type="text"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.address2}
                onChange={(e) =>
                  setFormData({ ...formData, address2: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Global Settings */}
        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              margin: "0 0 1.5rem 0",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid var(--primary)",
            }}
          >
            Global & Financial Settings
          </h2>
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
                Currency
              </label>
              <input
                type="text"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
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
                Currency Symbol
              </label>
              <input
                type="text"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.currencySymbol}
                onChange={(e) =>
                  setFormData({ ...formData, currencySymbol: e.target.value })
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
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.taxRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              margin: "0 0 1.5rem 0",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid var(--primary)",
            }}
          >
            Contact Information
          </h2>
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
                Phone
              </label>
              <input
                type="tel"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.companyPhone}
                onChange={(e) =>
                  setFormData({ ...formData, companyPhone: e.target.value })
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
                Email
              </label>
              <input
                type="email"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #cbd5e1",
                  borderRadius: "0.25rem",
                }}
                value={formData.companyEmail}
                onChange={(e) =>
                  setFormData({ ...formData, companyEmail: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Units of Measurement */}
        <div className="glass-panel" style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              margin: "0 0 1.5rem 0",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid var(--primary)",
            }}
          >
            Units of Measurement
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "2rem",
            }}
          >
            {(["weight", "length", "volume"] as const).map((category) => (
              <div key={category}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {category}
                  </label>
                  <button
                    type="button"
                    onClick={() => addUnit(category)}
                    className="btn btn-primary"
                    style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}
                  >
                    + Add
                  </button>
                </div>
                {formData.units[category].map((unit, idx) => (
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
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        border: "1px solid #cbd5e1",
                        borderRadius: "0.25rem",
                      }}
                      value={unit}
                      onChange={(e) =>
                        updateUnit(category, idx, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeUnit(category, idx)}
                      className="btn"
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "0.5rem",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
        >
          {isSubmitting ? "Saving Configuration..." : "Apply All Settings"}
        </button>
      </form>
    </div>
  );
}
