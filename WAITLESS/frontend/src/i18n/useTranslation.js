import { useI18n } from "./I18nProvider";
import { translations } from "./translations";

export function useTranslation() {
  const { lang, changeLang } = useI18n();

  const t = (key) => {
    const dict = translations[lang] ?? translations.en;
    return dict[key] ?? translations.en[key] ?? key;
  };

  return { t, lang, changeLang };
}
