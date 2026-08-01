// FILE: src/App.tsx
import { Routes, Route } from "react-router-dom";
import LoginPage from "./view/login/LoginPage";
import ForgotPassword from "./view/login/ForgotPassword";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />
    </Routes>
  );
}