import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout, NotFoundPage } from "@/layouts/AppLayout";
import DashboardPage from "@/pages/dashboard";
import ForgotPasswordPage from "@/pages/forgot-password";
import Home from "@/pages/index";
import LoginPage from "@/pages/login";
import QueuePage from "@/pages/queue";
import RegisterPage from "@/pages/register";
import ResetPasswordPage from "@/pages/reset-password";
import StaffRegisterPage from "@/pages/staff-register";
import TrackPage from "@/pages/track";
import TriagePage from "@/pages/triage";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";


export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="staff-register" element={<StaffRegisterPage />} />
        <Route path="staff-signup" element={<Navigate to="/staff-register" replace />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="triage" element={<TriagePage />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
