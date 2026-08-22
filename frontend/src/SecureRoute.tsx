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
import Timeline from "./view/scheduling/Timeline";
import ActivationPage from "./view/activation/Activation";
import History from "./view/scheduling/History";

// 🔥 NEW IMPORTS FOR RBAC
import { getUserClearance } from "./api";
import { Clearance } from "./types";

// ==========================================
// THE RAW GOOGLE-STYLE 403 ERROR PAGE
// ==========================================
function Forbidden403() {
  return (
    <div style={{ padding: "40px", fontFamily: "arial, sans-serif", backgroundColor: "#fff", height: "100vh", color: "#000", textAlign: "left" }}>
      <p style={{ fontWeight: "bold", fontSize: "16px", margin: "0 0 15px 0" }}>
        403. <span style={{ color: "#777", fontWeight: "normal" }}>That's an error.</span>
      </p>
      <p style={{ fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
        Your client does not have permission to get URL <code style={{fontFamily: "monospace"}}>{window.location.pathname}</code> from this server.
        <br /><br />
        <span style={{ color: "#777" }}>That's all we know.</span>
      </p>
    </div>
  );
}

// ==========================================
// ROUTE INTERCEPTOR
// ==========================================
function RequireClearance({ children, allowed }: { children: React.JSX.Element, allowed: Clearance[] }) {
  const currentClearance = getUserClearance();
  
  if (!allowed.includes(currentClearance)) {
    return <Forbidden403 />; // Slams the door before the layout even loads
  }
  
  return children;
}

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
        
        {/* === UNRESTRICTED ROUTES (ALL STAFF CAN ACCESS) === */}
        <Route 
          path="/dashboard" 
          element={user ? <MainLayout><Dashboard /></MainLayout> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/form" 
          element={user ? <MainLayout><Form /></MainLayout> : <Navigate to="/" />} 
        />

        <Route 
          path="/timeline" 
          element={user ? <MainLayout><Timeline /></MainLayout> : <Navigate to="/" />} 
        />

        {/* === RESTRICTED ROUTES (SUPERVISOR & ADMIN ONLY) === */}
        <Route 
          path="/management" 
          element={user ? (
            <RequireClearance allowed={[Clearance.Admin, Clearance.Supervisor]}>
              <MainLayout><Management /></MainLayout>
            </RequireClearance>
          ) : <Navigate to="/" />} 
        />

        <Route 
          path="/inbox" 
          element={user ? (
            <RequireClearance allowed={[Clearance.Admin, Clearance.Supervisor]}>
              <MainLayout><InboxList /></MainLayout>
            </RequireClearance>
          ) : <Navigate to="/" />} 
        />

        <Route 
          path="/history" 
          element={user ? (
            <RequireClearance allowed={[Clearance.Admin, Clearance.Supervisor]}>
              <MainLayout><History /></MainLayout>
            </RequireClearance>
          ) : <Navigate to="/" />} 
        />

      </Route>
    </Routes>
  );
}