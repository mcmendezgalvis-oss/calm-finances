import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dict, type Lang, type Strings } from "./strings";

interface Ctx {
  lang: Lang;
  t: Strings;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "fec.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "es" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <I18nContext.Provider value={{ lang, t: dict[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}