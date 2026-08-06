import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./view/login/LoginPage";
import ForgotPassword from "./view/login/ForgotPassword";
import Dashboard from "./view/homepage/Dashboard";
import Form from "./view/form/form";
import { useAuth } from "./context/AuthContext";
import MainLayout from './MainLayout';
import ProtectedRoute from './SecureRoute';
import Management from "./view/scheduling/Management";
import InboxList from "./view/inbox/InboxList";
import ActivationPage from "./view/activation/activation";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route path="/ForgotPassword" element={<ForgotPassword />} />

      <Route 
        path="/activate" 
        element={<ActivationPage />} 
      />

      <Route element={<ProtectedRoute />}>
        <Route 
          path="/dashboard" 
          element={user ? <MainLayout><Dashboard /></MainLayout> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/form" 
          element={user ? <MainLayout><Form /></MainLayout> : <Navigate to="/" />} 
        />

        <Route 
          path="/management" 
          element={user ? <MainLayout><Management /></MainLayout> : <Navigate to="/" />} 
        />

        <Route 
          path="/inbox" 
          element={user ? <MainLayout><InboxList /></MainLayout> : <Navigate to="/" />} 
        />
      </Route>
    </Routes>
  );
}