import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { fetchCurrentPatient, loginPatientAccount } from "@/services/patientAuthApi";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { IdleTimeoutModal } from "@/components/ui/IdleTimeoutModal";
import {
  clearPatientSession,
  getStoredPatientExpiry,
  getStoredPatientToken,
  getStoredPatientUser,
  storePatientSession,
} from "@/services/patientAuthSession";

const PatientAuthContext = createContext({
  patientUser: null,
  patientToken: null,
  isPatientAuthenticated: false,
  isPatientReady: false,
  patientLogin: async () => {},
  patientLogout: () => {},
  updatePatientAvatar: () => {},
});

function isExpired(expiresAt) {
  return expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
}

export function PatientAuthProvider({ children }) {
  const [patientUser, setPatientUser] = useState(null);
  const [patientToken, setPatientToken] = useState(null);
  const [isPatientReady, setIsPatientReady] = useState(false);

  useEffect(() => {
    const storedToken = getStoredPatientToken();
    const storedUser = getStoredPatientUser();
    const storedExpiry = getStoredPatientExpiry();

    if (!storedToken || !storedUser || isExpired(storedExpiry)) {
      clearPatientSession();
      setIsPatientReady(true);
      return;
    }

    setPatientToken(storedToken);
    setPatientUser(storedUser);

    fetchCurrentPatient()
      .then((session) => {
        storePatientSession(session);
        setPatientToken(session.token);
        setPatientUser(session.user);
      })
      .catch(() => {
        clearPatientSession();
        setPatientToken(null);
        setPatientUser(null);
      })
      .finally(() => setIsPatientReady(true));
  }, []);

  async function patientLogin(credentials) {
    const session = await loginPatientAccount(credentials);
    storePatientSession(session);
    setPatientToken(session.token);
    setPatientUser(session.user);
    return session;
  }

  function patientLogout() {
    clearPatientSession();
    setPatientToken(null);
    setPatientUser(null);
  }

  // Drop the patient session if the server reports it expired (401),
  // so the portal routes bounce back to /login.
  useEffect(() => {
    const onExpired = () => patientLogout();
    window.addEventListener("waitless:auth-expired", onExpired);
    return () => window.removeEventListener("waitless:auth-expired", onExpired);
  }, []);

  function updatePatientAvatar(avatarUrl) {
    setPatientUser((current) => {
      if (!current) return current;
      const next = { ...current, avatarUrl };
      if (patientToken) {
        const expiry = getStoredPatientExpiry();
        storePatientSession({
          token: patientToken,
          user: next,
          expiresAt: expiry,
        });
      }
      return next;
    });
  }

  const handleIdleTimeout = useCallback(() => {
    patientLogout();
  }, []);

  const { warning, secondsLeft, dismiss } = useIdleTimeout({
    onTimeout: handleIdleTimeout,
    enabled: Boolean(patientUser && patientToken),
  });

  return (
    <PatientAuthContext.Provider
      value={{
        patientUser,
        patientToken,
        isPatientAuthenticated: Boolean(patientUser && patientToken),
        isPatientReady,
        patientLogin,
        patientLogout,
        updatePatientAvatar,
      }}
    >
      {children}
      <IdleTimeoutModal
        show={warning}
        secondsLeft={secondsLeft}
        onDismiss={dismiss}
        onLogout={patientLogout}
      />
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  return useContext(PatientAuthContext);
}
