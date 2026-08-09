import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "waitless_lang";

export const LANGUAGES = {
  en: { label: "English", flag: "EN" },
  sn: { label: "chiShona", flag: "SN" },
  nd: { label: "isiNdebele", flag: "ND" },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LANGUAGES[stored]) {
        setLang(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const changeLang = useCallback((next) => {
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ lang, changeLang }), [lang, changeLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return { lang: "en", changeLang: () => {} };
  }
  return ctx;
}
