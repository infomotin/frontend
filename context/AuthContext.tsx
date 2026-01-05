"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  fetchAPI,
  setAuthToken,
  removeAuthToken,
  getAuthToken,
} from "../lib/api";

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in on mount
    const checkUser = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          // Verify token by fetching current user
          const userData = await fetchAPI("/users/me");
          if (userData) {
            setUser(userData);
          } else {
            removeAuthToken();
            setUser(null);
          }
        } catch (error) {
          console.log("Failed to fetch user", error);
          removeAuthToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  useEffect(() => {
    // Protect routes
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
    // Redirect to dashboard if logged in and on login page
    if (!loading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  const login = async (identifier: string, password: string) => {
    const data = await fetchAPI("/auth/local", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });

    if (data.jwt) {
      setAuthToken(data.jwt);
      setUser(data.user);
      router.push("/");
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    const data = await fetchAPI("/auth/local/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    if (data.jwt) {
      setAuthToken(data.jwt);
      setUser(data.user);
      router.push("/");
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
