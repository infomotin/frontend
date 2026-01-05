"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { fetchAPI } from "../lib/api";

interface SystemSettings {
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  iconUrl?: string;
}

interface SettingsContextType {
  settings: SystemSettings;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {
    siteName: "RefuelOS",
    primaryColor: "#1e293b",
    secondaryColor: "#3b82f6",
  },
  refreshSettings: async () => {},
  loading: true,
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "RefuelOS",
    primaryColor: "#1e293b",
    secondaryColor: "#3b82f6",
  });
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await fetchAPI("/system-setting?populate=*");
      if (res && res.data) {
        const data = res.data.attributes || res.data;
        const STRAPI_URL =
          process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

        setSettings({
          siteName: data.siteName || "RefuelOS",
          primaryColor: data.primaryColor || "#1e293b",
          secondaryColor: data.secondaryColor || "#3b82f6",
          logoUrl: data.siteLogo?.url
            ? `${STRAPI_URL}${data.siteLogo.url}`
            : undefined,
          iconUrl: data.siteIcon?.url
            ? `${STRAPI_URL}${data.siteIcon.url}`
            : undefined,
        });

        // Apply colors to CSS Variables
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          if (data.primaryColor)
            root.style.setProperty("--primary", data.primaryColor);
          if (data.secondaryColor)
            root.style.setProperty("--secondary", data.secondaryColor);

          // Generate a hover color (simulated for now)
          if (data.primaryColor)
            root.style.setProperty("--primary-hover", `${data.primaryColor}E6`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings in context", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
