import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuestOnly } from "@/components/GuestOnly";
import { LogoLoader } from "@/components/LogoLoader";
import { AppLayout, NotFoundPage } from "@/layouts/AppLayout";
import Home from "@/pages/index";
import { I18nProvider } from "@/i18n/I18nProvider";

const DashboardPage = lazy(() => import("@/pages/dashboard"));
const AuditTrailPage = lazy(() => import("@/pages/audit-trail"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const LoginChooserPage = lazy(() => import("@/pages/login-chooser"));
const PatientsPage = lazy(() => import("@/pages/patients"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const QueuePage = lazy(() => import("@/pages/queue"));
const RegisterPage = lazy(() => import("@/pages/register"));
const SelfRegisterPage = lazy(() => import("@/pages/self-register"));
const KioskPage = lazy(() => import("@/pages/kiosk"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const StaffSignupPage = lazy(() => import("@/pages/staff-signup"));
const UsersPage = lazy(() => import("@/pages/users"));
const StaffAccessCodesPage = lazy(() => import("@/pages/staff-access-codes"));
const TrackPage = lazy(() => import("@/pages/track"));
const TriagePage = lazy(() => import("@/pages/triage"));
const DepartmentBoardPage = lazy(() => import("@/pages/department-board"));

const AppointmentsPage = lazy(() => import("@/pages/appointments"));

const lazyNamed = (loader, exportName) =>
  lazy(() => loader().then((module) => ({ default: module[exportName] })));
const staffModule = (exportName) => lazyNamed(() => import("@/pages/staff-modules"), exportName);
const staffModuleExtra = (exportName) =>
  lazyNamed(() => import("@/pages/staff-modules-extra"), exportName);

const AdminDashboardPage = staffModule("AdminDashboardPage");
const DepartmentsPage = staffModule("DepartmentsPage");
const LabPage = staffModule("LabPage");
const NotificationsPage = staffModule("NotificationsPage");
const OIClinicPage = staffModule("OIClinicPage");
const PharmacyPage = staffModule("PharmacyPage");
const QueueAnalyticsPage = staffModule("QueueAnalyticsPage");
const ReportsPage = staffModule("ReportsPage");
const StaffQueueBoardPage = staffModule("StaffQueueBoardPage");
const HospitalsPage = staffModuleExtra("HospitalsPage");
const AIInsightsPage = staffModuleExtra("AIInsightsPage");
const SyncPage = staffModuleExtra("SyncPage");
const AppointmentRemindersPage = staffModuleExtra("AppointmentRemindersPage");
const FollowUpsPage = staffModuleExtra("FollowUpsPage");

export default function App() {
  return (
    <I18nProvider>
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#050817]"><LogoLoader size={56} decorative /></div>}>
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes — guest-only pages bounce signed-in users to their workspace */}
        <Route index element={<GuestOnly><Home /></GuestOnly>} />
        <Route path="track" element={<GuestOnly><TrackPage /></GuestOnly>} />
        <Route path="queue" element={<GuestOnly staffTo="/admin/queue"><QueuePage /></GuestOnly>} />
        <Route path="department-board" element={<DepartmentBoardPage />} />
        <Route path="self-register" element={<GuestOnly><SelfRegisterPage /></GuestOnly>} />
        <Route path="kiosk" element={<GuestOnly><KioskPage /></GuestOnly>} />
        {/* Patients no longer have accounts — legacy portal URLs go home */}
        <Route path="patient/*" element={<Navigate to="/" replace />} />

        {/* Staff routes under /admin */}
        <Route path="admin">
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="register"
            element={
              <ProtectedRoute roles={["reception", "receptionist"]}>
                <RegisterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="triage"
            element={
              <ProtectedRoute roles={["triage", "clinician", "reception"]}>
                <TriagePage />
              </ProtectedRoute>
            }
          />
          <Route path="track" element={<Navigate to="/admin/queue" replace />} />
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
            path="pharmacy"
            element={
              <ProtectedRoute roles={["clinician", "triage", "pharmacist"]}>
                <PharmacyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="laboratory"
            element={
              <ProtectedRoute roles={["clinician", "triage", "lab-tech", "radiologist"]}>
                <LabPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="oi-clinic"
            element={
              <ProtectedRoute roles={["clinician", "triage"]}>
                <OIClinicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin-dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboardPage />
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
            path="ai-insights"
            element={
              <ProtectedRoute>
                <AIInsightsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="hospitals"
            element={
              <ProtectedRoute roles={["admin"]}>
                <HospitalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="sync"
            element={
              <ProtectedRoute roles={["admin"]}>
                <SyncPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reminders"
            element={
              <ProtectedRoute>
                <AppointmentRemindersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="follow-ups"
            element={
              <ProtectedRoute>
                <FollowUpsPage />
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
          <Route path="staff" element={<Navigate to="/admin/users" replace />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="patients"
            element={
              <ProtectedRoute roles={["admin", "reception", "clinician", "triage"]}>
                <PatientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="access-codes"
            element={
              <ProtectedRoute roles={["admin"]}>
                <StaffAccessCodesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AuditTrailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute roles={["admin", "triage", "clinician", "reception", "receptionist"]}>
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
          <Route path="login" element={<GuestOnly><LoginChooserPage variant="staff" /></GuestOnly>} />
          <Route path="forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
          <Route path="reset-password" element={<GuestOnly><ResetPasswordPage /></GuestOnly>} />
          <Route path="staff-register" element={<Navigate to="/admin/staff" replace />} />
          <Route path="staff-signup" element={<GuestOnly><StaffSignupPage /></GuestOnly>} />
        </Route>

        {/* Legacy redirects */}
        <Route path="dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="register" element={<Navigate to="/admin/register" replace />} />
        <Route path="triage" element={<Navigate to="/admin/triage" replace />} />
        <Route path="settings" element={<Navigate to="/admin/settings" replace />} />
        <Route path="profile" element={<Navigate to="/admin/profile" replace />} />
        <Route path="login" element={<GuestOnly><LoginChooserPage variant="staff" /></GuestOnly>} />
        <Route path="forgot-password" element={<Navigate to="/admin/forgot-password" replace />} />
        <Route path="reset-password" element={<Navigate to="/admin/reset-password" replace />} />
        <Route path="staff-register" element={<Navigate to="/admin/staff" replace />} />
        <Route path="staff-signup" element={<Navigate to="/admin/staff-signup" replace />} />

        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </Suspense>
    </I18nProvider>
  );
}
