"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../lib/api";

interface JournalItem {
  account: string;
  debit: number;
  credit: number;
  description: string;
}

interface JournalDetail {
  id: number;
  debit: number;
  credit: number;
  description: string;
  account?: {
    documentId: string;
    code: string;
    name: string;
  };
}

interface JournalEntry {
  documentId: string;
  entryDate: string;
  reference: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  details: JournalDetail[];
}

interface Account {
  documentId: string;
  code: string;
  name: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
    details: [
      { account: "", debit: 0, credit: 0, description: "" },
      { account: "", debit: 0, credit: 0, description: "" },
    ],
  });

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI(
        "/journal-entries?populate=details.account&sort=entryDate:DESC"
      );
      if (res.data) {
        setEntries(res.data);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load journal entries"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await fetchAPI("/chart-of-accounts?sort=code:ASC");
      if (res.data) {
        setAccounts(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load accounts", err);
    }
  };

  useEffect(() => {
    loadEntries();
    loadAccounts();
  }, []);

  const resetForm = () => {
    setFormData({
      entryDate: new Date().toISOString().split("T")[0],
      reference: "",
      description: "",
      details: [
        { account: "", debit: 0, credit: 0, description: "" },
        { account: "", debit: 0, credit: 0, description: "" },
      ],
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (entry: JournalEntry) => {
    // Load full entry details
    try {
      const res = await fetchAPI(
        `/journal-entries/${entry.documentId}?populate=details.account`
      );
      const fullEntry = res.data;

      setFormData({
        entryDate: fullEntry.entryDate,
        reference: fullEntry.reference,
        description: fullEntry.description,
        details: fullEntry.details.map((d: JournalDetail) => ({
          account: d.account?.documentId || "",
          debit: d.debit || 0,
          credit: d.credit || 0,
          description: d.description || "",
        })),
      });
      setEditingId(entry.documentId);
      setIsModalOpen(true);
    } catch (err: unknown) {
      alert(
        "Failed to load entry: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;

    try {
      await fetchAPI(`/journal-entries/${documentId}`, {
        method: "DELETE",
      });
      setEntries((prev) => prev.filter((e) => e.documentId !== documentId));
    } catch (err: unknown) {
      alert(
        "Failed to delete: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const addLine = () => {
    setFormData({
      ...formData,
      details: [
        ...formData.details,
        { account: "", debit: 0, credit: 0, description: "" },
      ],
    });
  };

  const removeLine = (index: number) => {
    if (formData.details.length <= 2) {
      alert("A journal entry must have at least 2 lines");
      return;
    }
    setFormData({
      ...formData,
      details: formData.details.filter((_, i) => i !== index),
    });
  };

  const updateLine = (
    index: number,
    field: keyof JournalItem,
    value: string | number
  ) => {
    const newDetails = [...formData.details];
    newDetails[index] = { ...newDetails[index], [field]: value } as JournalItem;
    setFormData({ ...formData, details: newDetails });
  };

  const calculateTotals = () => {
    const totalDebit = formData.details.reduce(
      (sum, item) => sum + (parseFloat(String(item.debit)) || 0),
      0
    );
    const totalCredit = formData.details.reduce(
      (sum, item) => sum + (parseFloat(String(item.credit)) || 0),
      0
    );
    return { totalDebit, totalCredit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const { totalDebit, totalCredit } = calculateTotals();

    // Validate double entry
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      setError(
        `Double entry validation failed: Debits ($${totalDebit.toFixed(
          2
        )}) must equal Credits ($${totalCredit.toFixed(2)})`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        details: formData.details.map((d) => ({
          account: d.account,
          debit: parseFloat(String(d.debit)) || 0,
          credit: parseFloat(String(d.credit)) || 0,
          description: d.description,
        })),
      };

      if (editingId) {
        await fetchAPI(`/journal-entries/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ data: payload }),
        });
      } else {
        await fetchAPI("/journal-entries", {
          method: "POST",
          body: JSON.stringify({ data: payload }),
        });
      }

      setIsModalOpen(false);
      resetForm();
      loadEntries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

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
          Journal Entries
        </h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + New Entry
        </button>
      </div>

      {loading && <div>Loading Journal...</div>}

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
                  Date
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Reference
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Description
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: 600,
                    color: "#64748b",
                    textAlign: "right",
                  }}
                >
                  Debit
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: 600,
                    color: "#64748b",
                    textAlign: "right",
                  }}
                >
                  Credit
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
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No journal entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.documentId}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <td style={{ padding: "1rem" }}>{entry.entryDate}</td>
                    <td
                      style={{
                        padding: "1rem",
                        fontFamily: "monospace",
                        fontWeight: 600,
                      }}
                    >
                      {entry.reference}
                    </td>
                    <td style={{ padding: "1rem" }}>{entry.description}</td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      ${entry.totalDebit?.toFixed(2) || "0.00"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      ${entry.totalCredit?.toFixed(2) || "0.00"}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleOpenEdit(entry)}
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
                        onClick={() => handleDelete(entry.documentId)}
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

      {/* Journal Entry Modal */}
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
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingId ? "Edit Journal Entry" : "New Journal Entry"}
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
                  gridTemplateColumns: "1fr 1fr 2fr",
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
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.entryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, entryDate: e.target.value })
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
                    Reference
                  </label>
                  <input
                    type="text"
                    placeholder="JE-001"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({ ...formData, reference: e.target.value })
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
                    Description
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Entry description"
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.25rem",
                    }}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <h3 style={{ margin: 0 }}>Journal Lines</h3>
                  <button
                    type="button"
                    onClick={addLine}
                    className="btn"
                    style={{ background: "#e0e7ff", padding: "0.5rem 1rem" }}
                  >
                    + Add Line
                  </button>
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem",
                  }}
                >
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th style={{ padding: "0.5rem", textAlign: "left" }}>
                        Account
                      </th>
                      <th style={{ padding: "0.5rem", textAlign: "left" }}>
                        Description
                      </th>
                      <th
                        style={{
                          padding: "0.5rem",
                          textAlign: "right",
                          width: "100px",
                        }}
                      >
                        Debit
                      </th>
                      <th
                        style={{
                          padding: "0.5rem",
                          textAlign: "right",
                          width: "100px",
                        }}
                      >
                        Credit
                      </th>
                      <th style={{ padding: "0.5rem", width: "50px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.details.map((line, index) => (
                      <tr
                        key={index}
                        style={{ borderBottom: "1px solid #e2e8f0" }}
                      >
                        <td style={{ padding: "0.5rem" }}>
                          <select
                            required
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.25rem",
                            }}
                            value={line.account}
                            onChange={(e) =>
                              updateLine(index, "account", e.target.value)
                            }
                          >
                            <option value="">Select Account</option>
                            {accounts.map((acc) => (
                              <option
                                key={acc.documentId}
                                value={acc.documentId}
                              >
                                {acc.code} - {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          <input
                            type="text"
                            placeholder="Line description"
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.25rem",
                            }}
                            value={line.description}
                            onChange={(e) =>
                              updateLine(index, "description", e.target.value)
                            }
                          />
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.25rem",
                              textAlign: "right",
                            }}
                            value={line.debit || ""}
                            onChange={(e) =>
                              updateLine(
                                index,
                                "debit",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: "1px solid #cbd5e1",
                              borderRadius: "0.25rem",
                              textAlign: "right",
                            }}
                            value={line.credit || ""}
                            onChange={(e) =>
                              updateLine(
                                index,
                                "credit",
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </td>
                        <td style={{ padding: "0.5rem", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#ef4444",
                              fontSize: "1.2rem",
                            }}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                      <td
                        colSpan={2}
                        style={{ padding: "0.75rem", textAlign: "right" }}
                      >
                        TOTALS:
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "right",
                          color: isBalanced ? "#166534" : "#991b1b",
                        }}
                      >
                        ${totalDebit.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "right",
                          color: isBalanced ? "#166534" : "#991b1b",
                        }}
                      >
                        ${totalCredit.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    background: isBalanced ? "#dcfce7" : "#fee2e2",
                    borderRadius: "0.5rem",
                  }}
                >
                  <strong style={{ color: isBalanced ? "#166534" : "#991b1b" }}>
                    {isBalanced
                      ? "✓ Entry is Balanced"
                      : "⚠ Entry is NOT Balanced - Debits must equal Credits"}
                  </strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !isBalanced}
                  style={{
                    flex: 1,
                    opacity: !isBalanced || isSubmitting ? 0.5 : 1,
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save Entry"}
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
