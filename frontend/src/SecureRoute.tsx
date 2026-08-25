import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";

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

export default function ProtectedRoute() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (user === null || isTokenExpired(token)) {
      if (isTokenExpired(token)) {
        logout?.(); 
      }
      navigate("/");
    }
  }, [user, navigate, logout]);

  if (!user) {
    return null; 
  }
  
  return <Outlet />;
}