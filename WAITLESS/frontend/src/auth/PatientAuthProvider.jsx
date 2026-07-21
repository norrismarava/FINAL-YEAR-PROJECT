import { createContext, useContext, useEffect, useState } from "react";

import { fetchCurrentPatient, loginPatientAccount } from "@/services/patientAuthApi";
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

  return (
    <PatientAuthContext.Provider
      value={{
        patientUser,
        patientToken,
        isPatientAuthenticated: Boolean(patientUser && patientToken),
        isPatientReady,
        patientLogin,
        patientLogout,
      }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  return useContext(PatientAuthContext);
}
