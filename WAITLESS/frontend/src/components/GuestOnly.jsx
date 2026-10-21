import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { LogoLoader } from "@/components/LogoLoader";
import { resolveStaffLandingPath } from "@/services/staffProfilePrefs";

/**
 * Guest-only routes — pages meant for people who are NOT signed in
 * (landing, kiosk self-registration, staff login).
 * A signed-in staff member goes to their workspace.
 */
export function GuestOnly({ children, staffTo }) {
  const { isAuthenticated, isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) {
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

  return children;
}
