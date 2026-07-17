import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Tier = "pro_plus" | "pro" | null;

interface AuthState {
  tier: Tier;
  isVip: boolean;
  isAdmin: boolean;
  adminToken: string | null;
  setVipAccess: (tier: Tier, token?: string | null) => void;
  setAdminToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  tier: null,
  isVip: false,
  isAdmin: false,
  adminToken: null,
  setVipAccess: () => {},
  setAdminToken: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<Tier>(() => {
    const stored = localStorage.getItem("mr_analyst_tier");
    return (stored as Tier) || null;
  });
  const [adminToken, setAdminTokenState] = useState<string | null>(() =>
    localStorage.getItem("mr_analyst_admin_token"),
  );

  const isVip = tier !== null;
  const isAdmin = adminToken !== null;

  const setVipAccess = (newTier: Tier, token?: string | null) => {
    setTier(newTier);
    if (newTier) {
      localStorage.setItem("mr_analyst_tier", newTier);
    } else {
      localStorage.removeItem("mr_analyst_tier");
    }
    if (token) {
      setAdminTokenState(token);
      localStorage.setItem("mr_analyst_admin_token", token);
    }
  };

  const setAdminToken = (token: string | null) => {
    setAdminTokenState(token);
    if (token) {
      localStorage.setItem("mr_analyst_admin_token", token);
    } else {
      localStorage.removeItem("mr_analyst_admin_token");
    }
  };

  const logout = () => {
    setTier(null);
    setAdminTokenState(null);
    localStorage.removeItem("mr_analyst_tier");
    localStorage.removeItem("mr_analyst_admin_token");
  };

  // Expose admin token to the API client's auth getter
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as Window & { __mrAnalystToken?: string | null }).__mrAnalystToken = adminToken;
    }
  }, [adminToken]);

  return (
    <AuthContext.Provider value={{ tier, isVip, isAdmin, adminToken, setVipAccess, setAdminToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
