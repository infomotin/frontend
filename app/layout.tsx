"use client";

import "./globals.css";
import Sidebar from "../components/Sidebar";
import { Inter } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { SettingsProvider } from "../context/SettingsContext";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

// Wrapper to conditionally render Sidebar
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="layout-container">
      {!isLoginPage && <Sidebar />}
      <main className={isLoginPage ? "" : "main-content"}>{children}</main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <LayoutContent>{children}</LayoutContent>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
