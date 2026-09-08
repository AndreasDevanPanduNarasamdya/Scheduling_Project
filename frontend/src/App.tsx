import { Routes, Route } from "react-router-dom";
import LoginPage from "./view/login/LoginPage";
import ForgotPassword from "./view/login/ForgotPassword";
import Dashboard from "./view/homepage/Dashboard";
import Form from "./view/form/form";
import MainLayout from './MainLayout';
import ProtectedRoute from './SecureRoute';
import Management from "./view/scheduling/Management/Management";
import InboxList from "./view/inbox/InboxList";
import Timeline from "./view/scheduling/Timeline/Timeline";
import ActivationPage from "./view/activation/Activation";
import History from "./view/scheduling/ActivityLog/History";
import { AlertProvider } from './view/messagebox/AlertProvider';

export default function App() {
  return (
    <AlertProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/activate" element={<ActivationPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/form" element={<MainLayout><Form /></MainLayout>} />
          <Route path="/timeline" element={<MainLayout><Timeline /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedClearances={[1, 2]} />}>
          <Route path="/history" element={<MainLayout><History /></MainLayout>} />
          <Route path="/inbox" element={<MainLayout><InboxList /></MainLayout>} /> 
          <Route path="/management" element={<MainLayout><Management /></MainLayout>} />
        </Route>
      </Routes>
    </AlertProvider>
  );
}