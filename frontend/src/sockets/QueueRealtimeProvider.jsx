import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import { buildApiUrl } from "@/services/api";

const QueueRealtimeContext = createContext({
  status: "connecting",
  lastEventAt: null,
});

const WAIT_TIME_REFRESH_MS = 60000;
const POLLING_FALLBACK_MS = 10000;
const LIVE_QUERY_KEYS = [["triage"], ["queue"], ["dashboard"], ["track"]];

function invalidateLiveQueries(queryClient) {
  for (const queryKey of LIVE_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey });
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
  const queryClient = useQueryClient();
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
          invalidateLiveQueries(queryClient);
        },
      });
    } else {
      setStatus("polling");
      const pollingId = window.setInterval(() => {
        invalidateLiveQueries(queryClient);
      }, POLLING_FALLBACK_MS);

      stopRealtime = () => {
        window.clearInterval(pollingId);
      };
    }

    const waitTimerId = window.setInterval(() => {
      invalidateLiveQueries(queryClient);
    }, WAIT_TIME_REFRESH_MS);

    return () => {
      stopRealtime();
      window.clearInterval(waitTimerId);
    };
  }, [queryClient]);

  return (
    <QueueRealtimeContext.Provider value={{ status, lastEventAt }}>
      {children}
    </QueueRealtimeContext.Provider>
  );
}

export function useQueueRealtime() {
  return useContext(QueueRealtimeContext);
}
