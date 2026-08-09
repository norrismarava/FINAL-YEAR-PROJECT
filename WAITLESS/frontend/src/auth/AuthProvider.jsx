import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { fetchCurrentStaff, loginStaff, saveStaffProfile } from "@/services/authApi";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { IdleTimeoutModal } from "@/components/ui/IdleTimeoutModal";
import {
  clearAuthSession,
  getStoredSessionExpiry,
  getStoredStaffUser,
  getStoredAuthToken,
  storeAuthSession,
} from "@/services/authSession";
import {
  decorateStaffUser,
  getStoredStaffWorkspaceProfile,
  storeStaffWorkspaceProfile,
} from "@/services/staffProfilePrefs";

const AuthContext = createContext({
  user: null,
  token: null,
  expiresAt: null,
  isAuthenticated: false,
  isReady: false,
  login: async () => {},
  logout: () => {},
  hasRole: () => false,
  updateProfile: () => {},
  updateAvatar: () => {},
  persistProfile: async () => {},
});

function isExpired(expiresAt) {
  return expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = getStoredAuthToken();
    const storedUser = getStoredStaffUser();
    const storedExpiry = getStoredSessionExpiry();

    if (!storedToken || !storedUser || isExpired(storedExpiry)) {
      clearAuthSession();
      setIsReady(true);
      return;
    }

    setToken(storedToken);
    setUser(decorateStaffUser(storedUser));
    setExpiresAt(storedExpiry);

    fetchCurrentStaff()
      .then((session) => {
        storeAuthSession(session);
        setToken(session.token);
        setUser(decorateStaffUser(session.user));
        setExpiresAt(session.expiresAt);
      })
      .catch(() => {
        clearAuthSession();
        setToken(null);
        setUser(null);
        setExpiresAt(null);
      })
      .finally(() => setIsReady(true));
  }, []);

  async function login(credentials) {
    const session = await loginStaff(credentials);
    const nextUser = decorateStaffUser(session.user);

    storeAuthSession(session);
    setToken(session.token);
    setUser(nextUser);
    setExpiresAt(session.expiresAt);
    return {
      ...session,
      user: nextUser,
    };
  }

  function logout() {
    clearAuthSession();
    setToken(null);
    setUser(null);
    setExpiresAt(null);
  }

  function hasRole(roles = []) {
    if (!user) {
      return false;
    }

    return user.role === "admin" || roles.includes(user.role);
  }

  function updateProfile(updates) {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      const nextProfile = {
        ...getStoredStaffWorkspaceProfile(currentUser.id),
        ...currentUser.workspaceProfile,
        ...updates,
      };

      storeStaffWorkspaceProfile(currentUser.id, nextProfile);

      return {
        ...currentUser,
        workspaceProfile: nextProfile,
      };
    });
  }

  function updateAvatar(avatarUrl) {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      const nextUser = {
        ...currentUser,
        avatarUrl,
      };

      storeAuthSession({
        token,
        expiresAt,
        user: nextUser,
      });

      return nextUser;
    });
  }

  async function persistProfile(payload) {
    await saveStaffProfile(payload);
    const session = await fetchCurrentStaff();
    const nextUser = decorateStaffUser(session.user);
    storeAuthSession(session);
    setUser(nextUser);
    setToken(session.token);
    setExpiresAt(session.expiresAt);
    return nextUser;
  }

  const handleIdleTimeout = useCallback(() => {
    logout();
  }, [logout]);

  const { warning, secondsLeft, dismiss } = useIdleTimeout({
    onTimeout: handleIdleTimeout,
    enabled: Boolean(user && token),
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        expiresAt,
        isAuthenticated: Boolean(user && token),
        isReady,
        login,
        logout,
        hasRole,
        updateProfile,
        updateAvatar,
        persistProfile,
      }}
    >
      {children}
      <IdleTimeoutModal
        show={warning}
        secondsLeft={secondsLeft}
        onDismiss={dismiss}
        onLogout={logout}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
