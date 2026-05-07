"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Language, defaultLanguage, languages } from '@/lib/i18n';
import { en, loadTranslations, type Translations } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const VALID_LANGS = new Set(languages.map((l) => l.code));

// Cache resolved translation modules so we only pay the dynamic-import cost once per language.
const cache: Partial<Record<Language, Translations>> = { en };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [t, setT] = useState<Translations>(en);
  const pathname = usePathname();

  // Restore the saved language from localStorage on mount.
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang && VALID_LANGS.has(savedLang) && savedLang !== defaultLanguage) {
      setLanguageState(savedLang);
    }
  }, []);

  // Load the active translation bundle whenever the effective language changes.
  const effectiveLanguage: Language = pathname === '/proveedores' ? 'es' : language;

  useEffect(() => {
    const cached = cache[effectiveLanguage];
    if (cached) {
      setT(cached);
      return;
    }
    let cancelled = false;
    loadTranslations(effectiveLanguage).then((mod) => {
      cache[effectiveLanguage] = mod;
      if (!cancelled) setT(mod);
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveLanguage]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language: effectiveLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
