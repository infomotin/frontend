"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../../lib/api";

interface BalanceSheetData {
  assets: Array<{ code: string; name: string; balance: number }>;
  liabilities: Array<{ code: string; name: string; balance: number }>;
  equity: Array<{ code: string; name: string; balance: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadBalanceSheet = async () => {
    try {
      setLoading(true);
      setError("");

      let url = "/journal-entries/balance-sheet";
      if (asOfDate) url += `?asOfDate=${asOfDate}`;

      const res = await fetchAPI(url);
      if (res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load balance sheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalanceSheet();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
        <div style={{ fontSize: "1.2rem" }}>Generating Balance Sheet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <h1 className="page-title">Balance Sheet</h1>
        <div
          style={{
            padding: "1.5rem",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "0.5rem",
            border: "2px solid #fca5a5",
          }}
        >
          <strong>Error:</strong> {error}
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Make sure the backend is running and permissions are set for
            journal-entry.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return <div>No data available</div>;

  const totalLiabilitiesAndEquity = data.totalLiabilities + data.totalEquity;
  const isBalanced =
    Math.abs(data.totalAssets - totalLiabilitiesAndEquity) < 0.01;

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
          BALANCE SHEET
        </h1>
        <p
          style={{
            margin: "0.5rem 0 0 0",
            color: "#64748b",
            fontSize: "0.95rem",
          }}
        >
          As of{" "}
          {new Date(asOfDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Date Filter */}
      <div
        className="glass-panel"
        style={{ padding: "1rem", marginBottom: "2rem" }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              As of Date
            </label>
            <input
              type="date"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.25rem",
              }}
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
          </div>
          <div>
            <button
              onClick={loadBalanceSheet}
              className="btn btn-primary"
              style={{ padding: "0.5rem 2rem" }}
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Balance Status */}
      <div
        style={{
          marginBottom: "2rem",
          padding: "1.5rem",
          background: isBalanced ? "#dcfce7" : "#fee2e2",
          borderRadius: "0.75rem",
          border: `3px solid ${isBalanced ? "#22c55e" : "#ef4444"}`,
        }}
      >
        <strong
          style={{
            color: isBalanced ? "#166534" : "#991b1b",
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>{isBalanced ? "✓" : "⚠"}</span>
          {isBalanced
            ? "Balance Sheet is Balanced (Assets = Liabilities + Equity)"
            : "Balance Sheet is NOT Balanced"}
        </strong>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        {/* ASSETS */}
        <div
          className="glass-panel"
          style={{
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              padding: "1.5rem",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              borderBottom: "3px solid #5a67d8",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              ASSETS
            </h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {data.assets.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No asset accounts
                  </td>
                </tr>
              ) : (
                data.assets.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 500, color: "#1e293b" }}>
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#64748b",
                          fontFamily: "monospace",
                        }}
                      >
                        {item.code}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "right",
                        fontWeight: 600,
                        fontFamily: "monospace",
                        color: "#0f172a",
                      }}
                    >
                      ${item.balance.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
              <tr
                style={{
                  background: "linear-gradient(to bottom, #1e293b, #0f172a)",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                <td
                  style={{
                    padding: "1.25rem 1rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Total Assets
                </td>
                <td
                  style={{
                    padding: "1.25rem 1rem",
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontSize: "1.1rem",
                  }}
                >
                  ${data.totalAssets.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* LIABILITIES & EQUITY */}
        <div>
          {/* LIABILITIES */}
          <div
            className="glass-panel"
            style={{
              marginBottom: "2rem",
              overflow: "hidden",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "white",
                borderBottom: "3px solid #ec4899",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                LIABILITIES
              </h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {data.liabilities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      No liability accounts
                    </td>
                  </tr>
                ) : (
                  data.liabilities.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 500, color: "#1e293b" }}>
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#64748b",
                            fontFamily: "monospace",
                          }}
                        >
                          {item.code}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "right",
                          fontWeight: 600,
                          fontFamily: "monospace",
                          color: "#0f172a",
                        }}
                      >
                        ${item.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
                <tr
                  style={{
                    background: "linear-gradient(to bottom, #1e293b, #0f172a)",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  <td
                    style={{
                      padding: "1.25rem 1rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Total Liabilities
                  </td>
                  <td
                    style={{
                      padding: "1.25rem 1rem",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontSize: "1.1rem",
                    }}
                  >
                    ${data.totalLiabilities.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* EQUITY */}
          <div
            className="glass-panel"
            style={{
              overflow: "hidden",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                color: "white",
                borderBottom: "3px solid #0ea5e9",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                EQUITY
              </h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {data.equity.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      No equity accounts
                    </td>
                  </tr>
                ) : (
                  data.equity.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 500, color: "#1e293b" }}>
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#64748b",
                            fontFamily: "monospace",
                          }}
                        >
                          {item.code}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "right",
                          fontWeight: 600,
                          fontFamily: "monospace",
                          color: "#0f172a",
                        }}
                      >
                        ${item.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
                <tr
                  style={{
                    background: "linear-gradient(to bottom, #1e293b, #0f172a)",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  <td
                    style={{
                      padding: "1.25rem 1rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Total Equity
                  </td>
                  <td
                    style={{
                      padding: "1.25rem 1rem",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontSize: "1.1rem",
                    }}
                  >
                    ${data.totalEquity.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Liabilities + Equity */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              background: isBalanced ? "#dbeafe" : "#fee2e2",
              borderRadius: "0.75rem",
              border: `3px solid ${isBalanced ? "#3b82f6" : "#ef4444"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 700,
                fontSize: "1.2rem",
              }}
            >
              <span
                style={{ textTransform: "uppercase", letterSpacing: "1px" }}
              >
                Total Liabilities + Equity
              </span>
              <span style={{ fontFamily: "monospace" }}>
                ${totalLiabilitiesAndEquity.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Footer */}
      <div
        style={{
          marginTop: "3rem",
          padding: "1rem",
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.85rem",
          borderTop: "2px solid #e2e8f0",
        }}
      >
        <p style={{ margin: 0 }}>
          Generated on {new Date().toLocaleDateString()} at{" "}
          {new Date().toLocaleTimeString()}
        </p>
        <p style={{ margin: "0.25rem 0 0 0" }}>RefuelOS Accounting System</p>
      </div>
    </div>
  );
}
