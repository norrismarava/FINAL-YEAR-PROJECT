import { useEffect, useState } from "react";

const THEME_KEY = "waitless_theme_v1";
const THEME_EVENT = "waitless:theme";
const DARK_MEDIA = "(prefers-color-scheme: dark)";
const VALID_PREFERENCES = ["light", "dark", "system"];

// The user's theme preference: "light" | "dark" | "system".
// "system" defers to the device/OS preference via prefers-color-scheme.
export function getThemePreference() {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return VALID_PREFERENCES.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(DARK_MEDIA).matches
  );
}

export function getEffectiveTheme(preference = getThemePreference()) {
  if (preference === "system") {
    return systemPrefersDark() ? "dark" : "light";
  }
  return preference;
}

export function applyTheme(effectiveTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
}

export function setThemePreference(preference) {
  if (!VALID_PREFERENCES.includes(preference)) return;
  try {
    window.localStorage.setItem(THEME_KEY, preference);
  } catch {
    // storage unavailable — still apply for this session
  }
  applyTheme(getEffectiveTheme(preference));
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function useTheme() {
  const [preference, setPreference] = useState(getThemePreference);
  const [effectiveTheme, setEffectiveTheme] = useState(() => getEffectiveTheme());

  useEffect(() => {
    const sync = () => {
      const nextPreference = getThemePreference();
      const nextEffective = getEffectiveTheme(nextPreference);
      setPreference(nextPreference);
      setEffectiveTheme(nextEffective);
      applyTheme(nextEffective);
    };

    sync();

    // Re-evaluate when the OS theme changes while "system" is selected.
    const media = window.matchMedia(DARK_MEDIA);
    media.addEventListener?.("change", sync);
    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener?.("change", sync);
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    preference,
    theme: effectiveTheme,
    isDark: effectiveTheme === "dark",
    setPreference: setThemePreference,
  };
}
