import { createContext, useContext, useEffect, useState } from "react";

import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { buildApiUrl } from "@/services/api";

const QueueRealtimeContext = createContext({
  status: "connecting",
  lastEventAt: null,
});

const WAIT_TIME_REFRESH_MS = 60000;
const POLLING_FALLBACK_MS = 10000;

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

    let stopRealtime = () => {};

    if (typeof EventSource === "function") {
      stopRealtime = connectQueueEventStream({
        onStatusChange: setStatus,
        onEvent: (payload) => {
          setLastEventAt(payload.timestamp ?? new Date().toISOString());
          refreshLiveData();
        },
      });
    } else {
      setStatus("polling");
      const pollingId = window.setInterval(() => {
        refreshLiveData();
      }, POLLING_FALLBACK_MS);

      stopRealtime = () => {
        window.clearInterval(pollingId);
      };
    }

    const waitTimerId = window.setInterval(() => {
      refreshLiveData();
    }, WAIT_TIME_REFRESH_MS);

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
