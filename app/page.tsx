"use client";

import { useState, useEffect } from "react";
import { fetchAPI } from "../lib/api";

export default function Home() {
  const [stats, setStats] = useState({
    salesToday: 0,
    fuelStock: 0,
    requisitions: 0,
    employees: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to fetch products to test connection
        const productsData = await fetchAPI("/products");
        setConnectionStatus("connected");

        const productsCount = productsData.data ? productsData.data.length : 0;

        try {
          const reqData = await fetchAPI("/requisitions");
          const reqCount = reqData.data ? reqData.data.length : 0;
          setStats((prev) => ({ ...prev, requisitions: reqCount }));
        } catch (e) {
          console.warn("Requisitions not accessible");
        }

        setStats((prev) => ({
          ...prev,
          fuelStock: productsCount * 5000, // Dummy multiplier for demo
        }));
      } catch (error: any) {
        setConnectionStatus("error");
        setErrorMessage(error.message);
      }
    };

    loadData();
  }, []);

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
          Dashboard Overview
        </h1>
        <div
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "2rem",
            background:
              connectionStatus === "connected"
                ? "#dcfce7"
                : connectionStatus === "error"
                ? "#fee2e2"
                : "#f1f5f9",
            color:
              connectionStatus === "connected"
                ? "#166534"
                : connectionStatus === "error"
                ? "#991b1b"
                : "#475569",
            fontSize: "0.875rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "currentColor",
            }}
          ></div>
          {connectionStatus === "connected"
            ? "Backend Connected"
            : connectionStatus === "error"
            ? "Backend Error"
            : "Checking..."}
        </div>
      </div>

      {connectionStatus === "error" && (
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid #fecaca",
            background: "#fff1f2",
          }}
        >
          <h3
            style={{
              color: "#991b1b",
              fontSize: "1.1rem",
              marginBottom: "0.5rem",
            }}
          >
            ⚠️ Connection / Permission Error
          </h3>
          <p style={{ color: "#7f1d1d", marginBottom: "1rem" }}>
            Could not fetch data from Strapi. Error:{" "}
            <strong>{errorMessage}</strong>
          </p>
          <div
            style={{
              background: "white",
              padding: "1rem",
              borderRadius: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            <strong>How to fix:</strong>
            <ol style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>
                Open <strong>Strapi Admin</strong> at{" "}
                <a
                  href="http://localhost:1337/admin"
                  target="_blank"
                  style={{ color: "blue", textDecoration: "underline" }}
                >
                  http://localhost:1337/admin
                </a>
              </li>
              <li>
                Go to <strong>Settings</strong> {">"}{" "}
                <strong>Users & Permissions</strong> {">"}{" "}
                <strong>Roles</strong>.
              </li>
              <li>
                Click on <strong>Public</strong>.
              </li>
              <li>
                Scroll down to find <strong>Product</strong>,{" "}
                <strong>Sale</strong>, <strong>Requisition</strong>, etc.
              </li>
              <li>
                Check the boxes for <strong>find</strong> and{" "}
                <strong>findOne</strong> for each module.
              </li>
              <li>
                Click <strong>Save</strong>.
              </li>
              <li>Refresh this page.</li>
            </ol>
          </div>
        </div>
      )}

      <div className="grid-dashboard">
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3
            style={{
              color: "#64748b",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            Total Sales Today
          </h3>
          <p style={{ fontSize: "2rem", fontWeight: "700" }}>
            ${stats.salesToday.toLocaleString()}
          </p>
          <span style={{ color: "var(--accent)", fontSize: "0.875rem" }}>
            --
          </span>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3
            style={{
              color: "#64748b",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            Fuel Stock Level
          </h3>
          <p style={{ fontSize: "2rem", fontWeight: "700" }}>
            {stats.fuelStock.toLocaleString()} L
          </p>
          <span style={{ color: "#f59e0b", fontSize: "0.875rem" }}>
            Estimate based on products
          </span>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3
            style={{
              color: "#64748b",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            Pending Requisitions
          </h3>
          <p style={{ fontSize: "2rem", fontWeight: "700" }}>
            {stats.requisitions}
          </p>
          <span style={{ color: "#3b82f6", fontSize: "0.875rem" }}>
            Requires Action
          </span>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3
            style={{
              color: "#64748b",
              fontSize: "0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            Active Employees
          </h3>
          <p style={{ fontSize: "2rem", fontWeight: "700" }}>
            {stats.employees}
          </p>
          <span style={{ color: "#22c55e", fontSize: "0.875rem" }}>
            System Ready
          </span>
        </div>
      </div>
    </div>
  );
}
