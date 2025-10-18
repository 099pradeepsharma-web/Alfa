
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// These will be populated by the async fetch
const translations: Record<string, Record<string, string>> = {};
const curriculumTranslations: Record<string, Record<string, string>> = {};

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  tCurriculum: (key: string) => string;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// A flag to ensure we only fetch translations once per session
let translationsLoaded = false;

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(translationsLoaded);
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('alfanumrik-language') || 'en';
  });

  useEffect(() => {
    // Only fetch if they haven't been loaded in this session
    if (!translationsLoaded) {
        const fetchTranslations = async () => {
            try {
                const [en, hi, curriculumHi] = await Promise.all([
                    fetch('./translations/en.json').then(res => res.json()),
                    fetch('./translations/hi.json').then(res => res.json()),
                    fetch('./translations/curriculum_hi.json').then(res => res.json())
                ]);
                translations['en'] = en;
                translations['hi'] = hi;
                curriculumTranslations['hi'] = curriculumHi;
                curriculumTranslations['en'] = {}; // English keys are the source
                
                translationsLoaded = true; // Set flag so we don't fetch again
                setIsLoaded(true); // Trigger re-render
            } catch (error) {
                console.error("Failed to load translation files", error);
                // Even on error, we mark as loaded to prevent retries, and the app will use keys as fallback
                translationsLoaded = true;
                setIsLoaded(true);
            }
        };
        fetchTranslations();
    }
  }, []); // Empty dependency array means this runs only once on mount

  useEffect(() => {
    localStorage.setItem('alfanumrik-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  const t = (key: string, replacements?: { [key: string]: string | number }) => {
    // If not loaded yet, return the key to prevent blank text and FOUC
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
    <LanguageContext.Provider value={{ language, setLanguage, t, tCurriculum, isLoaded }}>
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
