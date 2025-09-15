import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Hardcoded translation data has been removed to prevent redeclaration errors.
// In a real application, this data would be loaded from JSON files.
const enTranslations: Record<string, string> = {};
const hiTranslations: Record<string, string> = {};
const hiCurriculumTranslations: Record<string, string> = {};


const translations: Record<string, Record<string, string>> = {
  en: enTranslations,
  hi: hiTranslations,
};

const curriculumTranslations: Record<string, Record<string, string>> = {
  hi: hiCurriculumTranslations,
  en: {} // English curriculum keys are the same as the source, so no mapping needed.
};

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  tCurriculum: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('alfanumrik-language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('alfanumrik-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  const t = (key: string, replacements?: { [key: string]: string | number }) => {
    let translation = translations[language]?.[key] || translations['en']?.[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{{${rKey}}}`, String(replacements[rKey]));
      });
    }
    return translation;
  };

  const tCurriculum = (key: string) => {
    return curriculumTranslations[language]?.[key] || key;
  };


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tCurriculum }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};