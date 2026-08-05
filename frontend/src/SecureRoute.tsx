import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  
  try {
    // A JWT has 3 parts separated by dots. The middle part is the data payload.
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    
    const payload = JSON.parse(jsonPayload);
    
    // JWT expiration time is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000; 
    
    return Date.now() > expirationTime;
  } catch (error) {
    return true; // If we can't read it, assume it's broken/expired
  }
};

export default function ProtectedRoute() {
  const { user, logout } = useAuth();
  const token = localStorage.getItem("jwt_token");

  // 1. Check if token is missing OR if the time is up
  if (!user || isTokenExpired(token)) {
    
    // If it's expired but they still have user state, clean it up
    if (user) {
      logout();
    }
    
    return <Navigate to="/" replace />;
  }

  // 2. If valid and not expired, let them see the page!
  return <Outlet />;
}