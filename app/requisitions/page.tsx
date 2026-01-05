"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../../lib/api";

interface Requisition {
  id: number;
  documentId: string;
  requisitionNo: string;
  requestDate: string;
  department: string;
  status: string;
  items: any; // Using any for the JSON field for simplicity
}

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequisitions() {
      try {
        // Populate requestedBy to show who asked for it (if available)
        const res = await fetchAPI(
          "/requisitions?populate=*&sort=requestDate:DESC"
        );
        if (res.data) {
          setRequisitions(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load requisitions");
      } finally {
        setLoading(false);
      }
    }
    loadRequisitions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return { bg: "#dcfce7", text: "#166534" };
      case "Rejected":
        return { bg: "#fee2e2", text: "#991b1b" };
      case "Pending Approval":
        return { bg: "#ffedd5", text: "#9a3412" };
      default:
        return { bg: "#f1f5f9", text: "#475569" };
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
          Requisitions
        </h1>
        <button className="btn btn-primary">+ New Request</button>
      </div>

      {loading && <div>Loading Requests...</div>}

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
                  Req No.
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Date
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Department
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Items
                </th>
                <th
                  style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {requisitions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No requisitions found.
                  </td>
                </tr>
              ) : (
                requisitions.map((req) => {
                  const statusStyle = getStatusColor(req.status);
                  return (
                    <tr
                      key={req.id}
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                    >
                      <td
                        style={{
                          padding: "1rem",
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {req.requisitionNo}
                      </td>
                      <td style={{ padding: "1rem" }}>{req.requestDate}</td>
                      <td style={{ padding: "1rem" }}>{req.department}</td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#64748b",
                          fontSize: "0.9rem",
                        }}
                      >
                        {Array.isArray(req.items)
                          ? `${req.items.length} items`
                          : "View Details"}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            fontWeight: 500,
                          }}
                        >
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
