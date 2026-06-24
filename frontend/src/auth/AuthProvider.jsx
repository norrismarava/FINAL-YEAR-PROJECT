import { createContext, useContext, useEffect, useState } from "react";

import { fetchCurrentStaff, loginStaff } from "@/services/authApi";
import {
  clearAuthSession,
  getStoredSessionExpiry,
  getStoredStaffUser,
  getStoredAuthToken,
  storeAuthSession,
} from "@/services/authSession";

const AuthContext = createContext({
  user: null,
  token: null,
  expiresAt: null,
  isAuthenticated: false,
  isReady: false,
  login: async () => {},
  logout: () => {},
  hasRole: () => false,
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
    setUser(storedUser);
    setExpiresAt(storedExpiry);

    fetchCurrentStaff()
      .then((session) => {
        storeAuthSession(session);
        setToken(session.token);
        setUser(session.user);
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

    storeAuthSession(session);
    setToken(session.token);
    setUser(session.user);
    setExpiresAt(session.expiresAt);
    return session;
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
