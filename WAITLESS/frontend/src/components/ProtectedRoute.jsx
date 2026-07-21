import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isReady, hasRole } = useAuth();
  const navigate = useNavigate();

  const hasRequiredRole = !roles || hasRole(roles);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate("/admin/login");
      return;
    }
    if (isReady && isAuthenticated && roles && !hasRole(roles)) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, isReady, roles, hasRole, navigate]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return null;
  }

  return children;
}
