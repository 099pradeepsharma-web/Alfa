import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

const translations: Record<string, Record<string, string>> = {};
const curriculumTranslations: Record<string, Record<string, string>> = {};

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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchTranslations = async () => {
        try {
            // In a real build system, these would be imported directly.
            // Using fetch to simulate loading from external files.
            const [en, hi, curriculumHi] = await Promise.all([
                fetch('./translations/en.json').then(res => res.json()),
                fetch('./translations/hi.json').then(res => res.json()),
                fetch('./translations/curriculum_hi.json').then(res => res.json())
            ]);
            translations['en'] = en;
            translations['hi'] = hi;
            curriculumTranslations['hi'] = curriculumHi;
            curriculumTranslations['en'] = {}; // English keys are the source
            setIsLoaded(true);
        } catch (error) {
            console.error("Failed to load translation files", error);
        }
    };
    fetchTranslations();
  }, []);

  useEffect(() => {
    localStorage.setItem('alfanumrik-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  const t = (key: string, replacements?: { [key: string]: string | number }) => {
    if (!isLoaded) return key;
    let translation = translations[language]?.[key] || translations['en']?.[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{{${rKey}}}`, String(replacements[rKey]));
      });
    }
    return translation;
  };

  const tCurriculum = (key: string) => {
    if (!isLoaded) return key;
    return curriculumTranslations[language]?.[key] || key;
  };


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tCurriculum }}>
      {isLoaded ? children : null /* Or a loading spinner */}
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