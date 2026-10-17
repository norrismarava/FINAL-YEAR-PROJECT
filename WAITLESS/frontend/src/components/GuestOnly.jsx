import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { LogoLoader } from "@/components/LogoLoader";
import { resolveStaffLandingPath } from "@/services/staffProfilePrefs";

/**
 * Guest-only routes — pages meant for people who are NOT signed in
 * (landing, kiosk self-registration, login, patient signup).
 * A signed-in staff member goes to their workspace; a signed-in
 * patient goes to the patient portal.
 */
export function GuestOnly({ children, patientTo, staffTo }) {
  const { isAuthenticated, isReady, user } = useAuth();
  const { isPatientAuthenticated, isPatientReady } = usePatientAuth();
  const location = useLocation();

  if (!isReady || !isPatientReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LogoLoader size={48} decorative />
      </div>
    );
  }

  if (isAuthenticated) {
    const target = staffTo ? `${staffTo}${location.search}` : resolveStaffLandingPath(user);
    return <Navigate to={target} replace />;
  }

  if (isPatientAuthenticated) {
    const target = patientTo
      ? `${patientTo}${location.search}`
      : "/patient/dashboard";
    return <Navigate to={target} replace />;
  }

  return children;
}
