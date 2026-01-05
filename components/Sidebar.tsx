"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { name: "Dashboard", path: "/" },
  { name: "Accounts", path: "/accounts" },
  { name: "Requisitions", path: "/requisitions" },
  { name: "Inventory", path: "/inventory" },
  { name: "Sales", path: "/sales" },
  { name: "Customers", path: "/customers" },
  { name: "HR & Payroll", path: "/hr" },
  { name: "Reports", path: "/reports" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>RefuelOS</div>

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
