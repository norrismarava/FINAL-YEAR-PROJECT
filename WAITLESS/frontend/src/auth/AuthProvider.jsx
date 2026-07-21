import { createContext, useContext, useEffect, useState } from "react";

import { fetchCurrentStaff, loginStaff } from "@/services/authApi";
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
