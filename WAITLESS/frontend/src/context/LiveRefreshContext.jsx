import { createContext, useCallback, useContext, useMemo, useState } from "react";

const LiveRefreshContext = createContext({
  refreshToken: 0,
  refreshLiveData: () => {},
});

export function LiveRefreshProvider({ children }) {
  const [refreshToken, setRefreshToken] = useState(0);

  const refreshLiveData = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({ refreshToken, refreshLiveData }),
    [refreshLiveData, refreshToken],
  );

  return (
    <LiveRefreshContext.Provider value={value}>
      {children}
    </LiveRefreshContext.Provider>
  );
}

export function useLiveRefresh() {
  return useContext(LiveRefreshContext);
}
