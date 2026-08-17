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
  const { user, logout } = useAuth(); // Assuming you have a logout method to clear state
  const navigate = useNavigate();

  useEffect(() => {
    //FIX: Now we actually grab the token and check it!
    const token = localStorage.getItem("token"); // Or sessionStorage, wherever you store it

    if (user === null || isTokenExpired(token)) {
      if (isTokenExpired(token)) {
        // Optional: clear the stale user/token from state if expired
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