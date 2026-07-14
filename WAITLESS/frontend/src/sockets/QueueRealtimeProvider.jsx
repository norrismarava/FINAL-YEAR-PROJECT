import { createContext, useContext, useEffect, useState } from "react";

import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { buildApiUrl } from "@/services/api";

const QueueRealtimeContext = createContext({
  status: "connecting",
  lastEventAt: null,
});

const WAIT_TIME_REFRESH_MS = 60000;
const POLLING_FALLBACK_MS = 10000;

const STORAGE_KEY = "waitless_system_settings_v1";

function loadSystemSettings() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


function connectQueueEventStream({ onStatusChange, onEvent }) {
  const eventSource = new EventSource(buildApiUrl("/api/events"));

  eventSource.onopen = () => {
    onStatusChange("connected");
  };

  eventSource.onerror = () => {
    onStatusChange("reconnecting");
  };

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);

      if (payload.type === "connected") {
        return;
      }

      onEvent(payload);
    } catch (error) {
      console.error("Failed to parse a queue event.", error);
    }
  };

  return () => {
    eventSource.close();
  };
}

export function QueueRealtimeProvider({ children }) {
  const { refreshLiveData } = useLiveRefresh();
  const [status, setStatus] = useState("connecting");
  const [lastEventAt, setLastEventAt] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const systemSettings = loadSystemSettings() ?? {};
    const liveSyncEnabled = systemSettings.liveSyncEnabled ?? true;
    const pollingFallbackEnabled = systemSettings.queuePollingFallbackEnabled ?? true;
    const autoRefreshIntervalSec = systemSettings.autoRefreshIntervalSec ?? 10;

    if (!liveSyncEnabled) {
      setStatus("closed");
      return () => {
        // no-op
      };
    }

    let stopRealtime = () => {};

    if (typeof EventSource === "function") {
      stopRealtime = connectQueueEventStream({
        onStatusChange: setStatus,
        onEvent: (payload) => {
          setLastEventAt(payload.timestamp ?? new Date().toISOString());
          refreshLiveData();
        },
      });
    } else if (pollingFallbackEnabled) {
      setStatus("polling");
      const pollingId = window.setInterval(() => {
        refreshLiveData();
      }, POLLING_FALLBACK_MS);

      stopRealtime = () => {
        window.clearInterval(pollingId);
      };
    } else {
      setStatus("closed");
    }

    const autoRefreshIntervalMs = Math.max(2_000, Math.min(30_000, autoRefreshIntervalSec * 1000));
    const waitTimerId = window.setInterval(() => {
      refreshLiveData();
    }, autoRefreshIntervalMs);

    return () => {
      stopRealtime();
      window.clearInterval(waitTimerId);
    };
  }, [refreshLiveData]);


  return (
    <QueueRealtimeContext.Provider value={{ status, lastEventAt }}>
      {children}
    </QueueRealtimeContext.Provider>
  );
}

export function useQueueRealtime() {
  return useContext(QueueRealtimeContext);
}
