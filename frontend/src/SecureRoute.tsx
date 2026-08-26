import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { getUserClearance } from "./api"; // 🔥 ADJUST THIS PATH TO YOUR api.ts FILE

const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    
    const payload = JSON.parse(jsonPayload);
    const expirationTime = payload.exp * 1000; 
    
    return Date.now() > expirationTime;
  } catch (error) {
    return true;
  }
};

interface ProtectedRouteProps {
  allowedClearances?: number[]; 
}

export default function ProtectedRoute({ allowedClearances }: ProtectedRouteProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 1. Authentication & Expiration Check
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (user === null || isTokenExpired(token)) {
      if (isTokenExpired(token)) {
        logout?.(); 
      }
      navigate("/");
    }
  }, [user, navigate, logout]);

  // Wait for AuthContext to boot up
  if (!user) {
    return null; 
  }

  // 2. AUTHORIZATION CHECK (The Hard Stop)
  if (allowedClearances) {
    // 🔥 Use YOUR existing function to pull the true clearance from the token!
    const currentClearance = getUserClearance();

    if (!allowedClearances.includes(currentClearance)) {
      // Physically crash the render tree so the protected page NEVER mounts.
      throw new Error(`403 Forbidden: Your clearance level [${currentClearance}] is not authorized to view this page.`);
    }
  }

  // 3. Authorized!
  return <Outlet />;
}