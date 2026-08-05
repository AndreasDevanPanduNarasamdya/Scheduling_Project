import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

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
  const token = localStorage.getItem("jwt_token");

  if (!user || isTokenExpired(token)) {
    
    if (user) {
      logout();
    }
    
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}