import { useCallback, useEffect, useState } from "react";

const SW_PATH = "/sw.js";
const SUBSCRIPTION_KEY = "waitless_push_subscription";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

async function registerSW() {
  if (!isSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    return reg;
  } catch {
    return null;
  }
}

async function subscribe(reg, vapidPublicKey) {
  if (!vapidPublicKey) return null;
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    window.localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(sub));
    return sub;
  } catch {
    return null;
  }
}

/**
 * Hook for managing web push notifications.
 *
 * @param {object} opts
 * @param {string} [opts.vapidPublicKey], VAPID public key for push subscription
 * @param {function} [opts.onSubscription], called when a subscription is created/updated
 * @returns {{
 *   supported: boolean,
 *   permission: NotificationPermission,
 *   subscribed: boolean,
 *   subscribe: () => Promise<void>,
 *   unsubscribe: () => Promise<void>,
 *   sendNotification: (payload: object) => Promise<void>,
 * }}
 */
export function useWebPush({ vapidPublicKey = "", onSubscription } = {}) {
  const [supported] = useState(isSupported());
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (!supported) return;
    registerSW().then((reg) => {
      if (reg) {
        setRegistration(reg);
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(Boolean(sub));
        });
      }
    });
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !registration) return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return;
    const sub = await subscribe(registration, vapidPublicKey);
    if (sub) {
      setSubscribed(true);
      onSubscription?.(sub);
    }
  }, [supported, registration, vapidPublicKey, onSubscription]);

  const unsubscribe = useCallback(async () => {
    if (!registration) return;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      window.localStorage.removeItem(SUBSCRIPTION_KEY);
      setSubscribed(false);
    }
  }, [registration]);

  const sendNotification = useCallback(
    async (payload) => {
      if (!registration) return;
      try {
        const sub = await registration.pushManager.getSubscription();
        if (!sub) return;
        await fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub, payload }),
        });
      } catch {
        // Push send endpoint may not exist in dev, silently ignore
      }
    },
    [registration],
  );

  return {
    supported,
    permission,
    subscribed,
    subscribe,
    unsubscribe,
    sendNotification,
  };
}
