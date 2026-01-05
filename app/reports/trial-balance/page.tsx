"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

interface TrialBalanceItem {
  code: string;
  name: string;
  debit: number;
  credit: number;
}

export default function TrialBalancePage() {
  const [items, setItems] = useState<TrialBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadTrialBalance = async () => {
    try {
      setLoading(true);
      setError("");

      let url = "/journal-entries/trial-balance";
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetchAPI(url);
      if (res.data) {
        setItems(res.data);
        setTotalDebit(res.meta?.totalDebit || 0);
        setTotalCredit(res.meta?.totalCredit || 0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load trial balance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrialBalance();
  }, []);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const difference = totalDebit - totalCredit;

  return (
    <div className="fade-in">
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          borderBottom: "3px solid var(--primary)",
          paddingBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "2rem", color: "var(--primary)" }}>
          TRIAL BALANCE
        </h1>
        <p
          style={{
            margin: "0.5rem 0 0 0",
            color: "#64748b",
            fontSize: "0.95rem",
          }}
        >
          {startDate || endDate
            ? `Period: ${startDate || "Beginning"} to ${endDate || "Present"}`
            : "All Transactions"}
        </p>
      </div>

      {/* Date Filter */}
      <div
        className="glass-panel"
        style={{ padding: "1rem", marginBottom: "2rem" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: "1rem",
            alignItems: "end",
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
              Start Date
            </label>
            <input
              type="date"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.25rem",
              }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              End Date
            </label>
            <input
              type="date"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.25rem",
              }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <button
              onClick={loadTrialBalance}
              className="btn btn-primary"
              style={{ padding: "0.5rem 2rem" }}
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          <div style={{ fontSize: "1.2rem" }}>Generating Trial Balance...</div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "1.5rem",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "0.5rem",
            marginBottom: "2rem",
            border: "2px solid #fca5a5",
          }}
        >
          <strong>Error:</strong> {error}
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Make sure the backend is running and permissions are set for
            journal-entry.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Balance Status */}
          <div
            style={{
              marginBottom: "2rem",
              padding: "1.5rem",
              background: isBalanced ? "#dcfce7" : "#fee2e2",
              borderRadius: "0.75rem",
              border: `3px solid ${isBalanced ? "#22c55e" : "#ef4444"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong
                style={{
                  color: isBalanced ? "#166534" : "#991b1b",
                  fontSize: "1.2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>
                  {isBalanced ? "✓" : "⚠"}
                </span>
                {isBalanced ? "Books are Balanced" : "Books are NOT Balanced"}
              </strong>
              {!isBalanced && (
                <p style={{ margin: "0.5rem 0 0 0", color: "#991b1b" }}>
                  Difference: ${Math.abs(difference).toFixed(2)} (
                  {difference > 0 ? "Debit Heavy" : "Credit Heavy"})
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: isBalanced ? "#166534" : "#991b1b",
                  opacity: 0.8,
                }}
              >
                Total Entries
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: isBalanced ? "#166534" : "#991b1b",
                }}
              >
                {items.length}
              </div>
            </div>
          </div>

          {/* Trial Balance Table */}
          <div
            className="glass-panel"
            style={{
              overflow: "hidden",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead
                style={{
                  background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)",
                  borderBottom: "2px solid var(--primary)",
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "1rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      fontSize: "0.95rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Account Code
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      fontSize: "0.95rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Account Name
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      fontSize: "0.95rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      textAlign: "right",
                    }}
                  >
                    Debit
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      fontWeight: 700,
                      color: "var(--primary)",
                      fontSize: "0.95rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      textAlign: "right",
                    }}
                  >
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      <div
                        style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}
                      >
                        No transactions found
                      </div>
                      <div style={{ fontSize: "0.9rem" }}>
                        Create journal entries to see them here
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "1rem",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          color: "#475569",
                          fontSize: "0.95rem",
                        }}
                      >
                        {item.code}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#1e293b",
                          fontWeight: 500,
                        }}
                      >
                        {item.name}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: item.debit > 0 ? "#0f172a" : "#94a3b8",
                          fontFamily: "monospace",
                        }}
                      >
                        {item.debit > 0 ? `$${item.debit.toFixed(2)}` : "-"}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: item.credit > 0 ? "#0f172a" : "#94a3b8",
                          fontFamily: "monospace",
                        }}
                      >
                        {item.credit > 0 ? `$${item.credit.toFixed(2)}` : "-"}
                      </td>
                    </tr>
                  ))
                )}

                {/* Totals Row */}
                {items.length > 0 && (
                  <tr
                    style={{
                      background:
                        "linear-gradient(to bottom, #1e293b, #0f172a)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "1.05rem",
                    }}
                  >
                    <td
                      colSpan={2}
                      style={{
                        padding: "1.25rem 1rem",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      TOTAL
                    </td>
                    <td
                      style={{
                        padding: "1.25rem 1rem",
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontSize: "1.1rem",
                      }}
                    >
                      ${totalDebit.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "1.25rem 1rem",
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontSize: "1.1rem",
                      }}
                    >
                      ${totalCredit.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Report Footer */}
          {items.length > 0 && (
            <div
              style={{
                marginTop: "2rem",
                padding: "1rem",
                textAlign: "center",
                color: "#64748b",
                fontSize: "0.85rem",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <p style={{ margin: 0 }}>
                Generated on {new Date().toLocaleDateString()} at{" "}
                {new Date().toLocaleTimeString()}
              </p>
              <p style={{ margin: "0.25rem 0 0 0" }}>
                RefuelOS Accounting System
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
