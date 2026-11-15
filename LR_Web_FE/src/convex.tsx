import { ConvexReactClient, ConvexProvider } from "convex/react";
import React, { type ReactNode, useState } from "react";
import { apiUrl } from "./api/client";

const convexUrl = typeof import.meta.env.VITE_CONVEX_URL === "string" 
  ? import.meta.env.VITE_CONVEX_URL.trim() 
  : "";

export const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export const AppConvexProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (!convex) {
    // Pokud Convex ještě není inicializován v .env, aplikace nespadne a funguje v offline/fallback režimu
    return <>{children}</>;
  }

  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
};

export function useAppAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem("user_role") || localStorage.getItem("convex_auth_token"));
  });
  const [role, setRole] = useState<"admin" | "owner" | null>(() => {
    const r = localStorage.getItem("user_role");
    return r === "admin" || r === "owner" ? r : null;
  });

  const logout = async () => {
    try {
      await fetch(apiUrl("logout.php"), { credentials: "include" });
    } catch {
      // ignore
    }
    localStorage.removeItem("user_role");
    localStorage.removeItem("convex_auth_token");
    setIsAuthenticated(false);
    setRole(null);
  };

  return { isAuthenticated, role, logout };
}
