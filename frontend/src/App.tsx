import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./view/login/LoginPage";
import ForgotPassword from "./view/login/ForgotPassword";
import Dashboard from "./view/homepage/Dashboard";
import Form from "./view/form/Form";
import { useAuth } from "./context/AuthContext";
import MainLayout from './MainLayout';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* If they are kicked to "/", they need a page to land on! */}
      <Route path="/" element={<LoginPage />} />

      <Route path="/ForgotPassword" element={<ForgotPassword />} />

      <Route 
        path="/dashboard" 
        element={user ? <MainLayout><Dashboard /></MainLayout> : <Navigate to="/" />} 
      />
      
      <Route 
        path="/form" 
        element={user ? <MainLayout><Form /></MainLayout> : <Navigate to="/" />} 
      />
    </Routes>
  );
}