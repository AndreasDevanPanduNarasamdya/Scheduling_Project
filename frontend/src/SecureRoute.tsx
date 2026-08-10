import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Or a loading spinner while checking auth
  }

  // Outlet renders whatever nested route matches (e.g. /dashboard, /management)
  return <Outlet />;
}