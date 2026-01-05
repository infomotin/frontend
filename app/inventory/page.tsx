"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "../../lib/api";

interface Product {
  id: number;
  documentId: string;
  name: string;
  type: string;
  sku: string;
  stockQuantity: number;
  unit: string;
  sellingPrice: number;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetchAPI("/products?populate=*");
        if (res.data) {
          setProducts(res.data);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load inventory.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (loading) return <div className="p-8">Loading Inventory...</div>;

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
          Inventory Management
        </h1>
        <button className="btn btn-primary">+ Add Product</button>
      </div>

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
          <strong>Connection Error:</strong> {error}
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Ensure Strapi is running and <strong>Public Permissions</strong> are
            enabled for Products.
            <br />
            Go to Strapi Admin {">"} Settings {">"} Users & Permissions {">"}{" "}
            Roles {">"} Public {">"} Product {">"} Check &apos;find&apos; and
            &apos;findOne&apos;.
          </p>
        </div>
      )}

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
                Name
              </th>
              <th
                style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
              >
                Type
              </th>
              <th
                style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
              >
                SKU
              </th>
              <th
                style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
              >
                Stock
              </th>
              <th
                style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
              >
                Price
              </th>
              <th
                style={{ padding: "1rem", fontWeight: 600, color: "#64748b" }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No products found. Add some in Strapi Admin!
                </td>
              </tr>
            ) : (
              products.map((item: Product) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <td style={{ padding: "1rem", fontWeight: 500 }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        background:
                          item.type === "Fuel" ? "#dbeafe" : "#f1f5f9",
                        color: item.type === "Fuel" ? "#1e40af" : "#475569",
                      }}
                    >
                      {item.type || "General"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontFamily: "monospace",
                      color: "#64748b",
                    }}
                  >
                    {item.sku || "-"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {item.stockQuantity} {item.unit}
                  </td>
                  <td style={{ padding: "1rem" }}>${item.sellingPrice}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ color: "#22c55e", fontSize: "0.875rem" }}>
                      In Stock
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
