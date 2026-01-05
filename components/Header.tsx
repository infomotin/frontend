"use client";

import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import styles from "./Header.module.css";

export default function Header() {
  const { user } = useAuth();
  const { settings } = useSettings();

  return (
    <header className={styles.header}>
      {/* Brand & Logo Stack */}
      <div className={styles.brand}>
        <div className={styles.companyName}>{settings.siteName}</div>
        {settings.logoUrl && (
          <img
            src={settings.logoUrl}
            alt="Logo"
            className={styles.headerLogo}
          />
        )}
      </div>

      {/* 2. Global Search */}
      <div className={styles.searchWrapper}>
        <span style={{ opacity: 0.5 }}>🔍</span>
        <input
          type="text"
          placeholder="Search for orders, products..."
          className={styles.searchInput}
        />
      </div>

      {/* 2. Right Side Actions */}
      <div className={styles.actions}>
        {/* Language Switcher */}
        <button className={styles.langBtn}>
          <span>🇺🇸</span>
          <span>EN</span>
          <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>▼</span>
        </button>

        {/* Notification Icon */}
        <button className={styles.iconBtn}>
          <span style={{ fontSize: "1.25rem" }}>🔔</span>
          <span className={styles.badge}>3</span>
        </button>

        <div className={styles.divider}></div>

        {/* User Profile Info */}
        <div className={styles.userProfile}>
          <div className={styles.userDetails}>
            <span className={styles.userName}>
              {user?.username || "Guest User"}
            </span>
            <span className={styles.userRole}>{user?.email || "Manager"}</span>
          </div>
          <div className={styles.avatar}>
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
