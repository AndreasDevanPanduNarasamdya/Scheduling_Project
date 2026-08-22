import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface StaffInfo {
  staffId: string;
  firstName?: string;
  lastName?: string;
  position?: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  clearance?: string | number; // Optional depending on how you use it
  
  // 🔥 ADD THESE 4 LINES SO TYPESCRIPT KNOWS THEY EXIST:
  staffId?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  
  // (Keep whatever else you already have in here, like `staff?: any`)
  staff?: {
    staffId: string;
    firstName: string;
    lastName: string;
    position: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser, rawToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem("user_info");

    // console.log("AUTH INIT");
    // console.log("user_info:", savedUser);

    return savedUser ? JSON.parse(savedUser) : null;
});
  const navigate = useNavigate();

  const login = (userData: AuthUser, rawToken?: string) => {
    setUser(userData);

    localStorage.setItem(
        "user_info",
        JSON.stringify(userData)
    );

    if (rawToken) {
        localStorage.setItem("token", rawToken);
    }
};

  const logout = () => {
    localStorage.removeItem("token");
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