"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

const menuItems = [
  { name: "Dashboard", path: "/" },
  { name: "Accounts", path: "/accounts" },
  { name: "Journal", path: "/journal" },
  { name: "Requisitions", path: "/requisitions" },
  { name: "Inventory", path: "/inventory" },
  { name: "Sales", path: "/sales" },
  { name: "Customers", path: "/customers" },
  { name: "Customer Types", path: "/customers/types" },
  { name: "Suppliers", path: "/suppliers" },
  { name: "HR & Payroll", path: "/hr" },
  { name: "Trial Balance", path: "/reports/trial-balance" },
  { name: "Balance Sheet", path: "/reports/balance-sheet" },
  { name: "Settings", path: "/settings" },
  { name: "Product Category", path: "/settings/product-categories" },
  { name: "Product Sub-Category", path: "/settings/product-sub-categories" },
  {
    name: "Product Child-Category",
    path: "/settings/product-child-categories",
  },
  { name: "Product Attributes", path: "/settings/product-attributes" },
  { name: "Address Setup", path: "/settings/address" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { settings } = useSettings();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        {settings.logoUrl ? (
          <Image
            src={settings.logoUrl}
            alt={settings.siteName}
            width={150}
            height={40}
            style={{ objectFit: "contain", maxHeight: "40px" }}
          />
        ) : (
          settings.siteName
        )}
      </div>

      {user && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "0.5rem",
            fontSize: "0.85rem",
          }}
        >
          <span style={{ display: "block", opacity: 0.6 }}>Logged in as:</span>
          <strong>{user.username}</strong>
        </div>
      )}

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`${styles.link} ${
              pathname === item.path ? styles.active : ""
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: "auto", marginBottom: "1rem" }}>
        <button
          onClick={logout}
          className={styles.link}
          style={{
            width: "100%",
            textAlign: "left",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#f87171",
          }}
        >
          Logout
        </button>
      </div>

      <div className={styles.footer}>© 2026 Antigravity</div>
    </aside>
  );
}
