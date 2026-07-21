import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout, NotFoundPage } from "@/layouts/AppLayout";
import DashboardPage from "@/pages/dashboard";
import ForgotPasswordPage from "@/pages/forgot-password";
import Home from "@/pages/index";
import LoginPage from "@/pages/login";
import ProfilePage from "@/pages/profile";
import QueuePage from "@/pages/queue";
import RegisterPage from "@/pages/register";
import SelfRegisterPage from "@/pages/self-register";
import PatientRegisterPage from "@/pages/patient-register";
import PatientLoginPage from "@/pages/patient-login";
import PatientDashboardPage from "@/pages/patient-dashboard";
import ResetPasswordPage from "@/pages/reset-password";
import SettingsPage from "@/pages/settings";
import StaffRegisterPage from "@/pages/staff-register";
import {
  AppointmentsPage,
  DepartmentsPage,
  NotificationsPage,
  QueueAnalyticsPage,
  ReportsPage,
  StaffQueueBoardPage,
} from "@/pages/staff-modules";
import TrackPage from "@/pages/track";
import TriagePage from "@/pages/triage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route index element={<Home />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="self-register" element={<SelfRegisterPage />} />
        <Route path="patient/register" element={<PatientRegisterPage />} />
        <Route path="patient/login" element={<PatientLoginPage />} />
        <Route path="patient/dashboard" element={<PatientDashboardPage />} />

        {/* Staff routes under /admin */}
        <Route path="admin">
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={["triage", "clinician"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="register"
            element={
              <ProtectedRoute roles={["reception"]}>
                <RegisterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="triage"
            element={
              <ProtectedRoute roles={["triage"]}>
                <TriagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="track"
            element={
              <ProtectedRoute>
                <TrackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="queue"
            element={
              <ProtectedRoute>
                <StaffQueueBoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments"
            element={
              <ProtectedRoute>
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments"
            element={
              <ProtectedRoute>
                <AppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute>
                <QueueAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="staff"
            element={
              <ProtectedRoute roles={["admin"]}>
                <StaffRegisterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute roles={["admin", "triage", "clinician", "reception"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<LoginPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="staff-register" element={<StaffRegisterPage />} />
          <Route path="staff-signup" element={<Navigate to="/admin/staff-register" replace />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="register" element={<Navigate to="/admin/register" replace />} />
        <Route path="triage" element={<Navigate to="/admin/triage" replace />} />
        <Route path="settings" element={<Navigate to="/admin/settings" replace />} />
        <Route path="profile" element={<Navigate to="/admin/profile" replace />} />
        <Route path="login" element={<Navigate to="/admin/login" replace />} />
        <Route path="forgot-password" element={<Navigate to="/admin/forgot-password" replace />} />
        <Route path="reset-password" element={<Navigate to="/admin/reset-password" replace />} />
        <Route path="staff-register" element={<Navigate to="/admin/staff-register" replace />} />
        <Route path="staff-signup" element={<Navigate to="/admin/staff-register" replace />} />

        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
