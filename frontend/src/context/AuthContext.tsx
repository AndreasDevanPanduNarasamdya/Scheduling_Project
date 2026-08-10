import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface StaffInfo {
  staffId: string;
  firstName?: string;
  lastName?: string;
  position?: string;
}

interface AuthUser {
  userId: string;
  email: string;
  staff?: StaffInfo;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem("user_info");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const navigate = useNavigate();

  const login = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem("user_info", JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_info");
    setUser(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}