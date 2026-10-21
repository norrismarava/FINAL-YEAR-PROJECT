import { createContext, useContext, useEffect, useState } from "react";

import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { buildApiUrl } from "@/services/api";

const QueueRealtimeContext = createContext({
  status: "connecting",
  lastEventAt: null,
  lastEvent: null,
});

const POLLING_FALLBACK_MS = 10000;

const NOTIFIABLE_EVENTS = new Set([
  "ticket.called",
  "ticket.recalled",
  "ticket.transferred",
  "ticket.auto-classified",
]);

let audioContext = null;

function playFocusTone() {
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);
    gain.connect(audioContext.destination);
    for (const [delay, freq] of [[0, 880], [0.12, 1174.66]]) {
      const osc = audioContext.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(audioContext.currentTime + delay);
      osc.stop(audioContext.currentTime + delay + 0.25);
    }
  } catch {
    // Audio unavailable — ignore
  }
}

function showDesktopNotification(event) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return;
  }
  try {
    const ticket = event.payload ?? {};
    const titleMap = {
      "ticket.called": "Patient called",
      "ticket.recalled": "Ticket recalled",
      "ticket.transferred": "Ticket transferred",
      "ticket.auto-classified": "Emergency escalation",
    };
    const title = titleMap[event.type] ?? "Queue update";
    const body =
      [ticket.ticket, ticket.department, ticket.room ? `Room ${ticket.room}` : null]
        .filter(Boolean)
        .join(" · ") || "A queue event just arrived.";
    new Notification(title, { body, tag: `waitless-${event.type}` });
  } catch {
    // Notifications unavailable — ignore
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
  const [systemSettings] = useSystemSettings();
  const [status, setStatus] = useState("connecting");
  const [lastEventAt, setLastEventAt] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  const liveSyncEnabled = systemSettings.liveSyncEnabled ?? true;
  const pollingFallbackEnabled = systemSettings.queuePollingFallbackEnabled ?? true;
  const autoRefreshIntervalSec = systemSettings.autoRefreshIntervalSec ?? 10;
  const notificationDesktop = systemSettings.notificationDesktop ?? true;
  const notificationFocusSound = systemSettings.notificationFocusSound ?? false;
  const reducedMotion = systemSettings.reducedMotion ?? false;

  // Reduced motion — applied to the whole document in real time.
  useEffect(() => {
    document.documentElement.classList.toggle("reduced-motion", reducedMotion);
    return () => {
      document.documentElement.classList.remove("reduced-motion");
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

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
          const event = { type: payload.type, payload: payload.payload ?? payload, timestamp: payload.timestamp ?? new Date().toISOString() };
          setLastEvent(event);
          setLastEventAt(event.timestamp);
          refreshLiveData();

          const unfocused = document.hidden || !document.hasFocus();
          if (unfocused) {
            if (notificationDesktop && NOTIFIABLE_EVENTS.has(event.type)) {
              showDesktopNotification(event);
            }
            if (notificationFocusSound) {
              playFocusTone();
            }
          }
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
  }, [refreshLiveData, liveSyncEnabled, pollingFallbackEnabled, autoRefreshIntervalSec, notificationDesktop, notificationFocusSound]);


  return (
    <QueueRealtimeContext.Provider value={{ status, lastEventAt, lastEvent }}>
      {children}
    </QueueRealtimeContext.Provider>
  );
}

export function useQueueRealtime() {
  return useContext(QueueRealtimeContext);
}
