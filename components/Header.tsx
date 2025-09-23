import React, { useState, useEffect, useRef } from 'react';
import { HomeIcon, LanguageIcon, ArrowRightOnRectangleIcon, UserCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import { Grade, Subject, Chapter } from '../types';

interface HeaderProps {
    onGoHome: () => void;
    showHomeButton: boolean;
    curriculum: Grade[];
    onSearchSelect: (grade: Grade, subject: Subject, chapter: Chapter) => void;
}

type SearchResult = {
    grade: Grade;
    subject: Subject;
    chapter: Chapter;
};


const Header: React.FC<HeaderProps> = ({ onGoHome, showHomeButton, curriculum, onSearchSelect }) => {
  const { language, setLanguage, t, tCurriculum } = useLanguage();
  const { isLoggedIn, currentUser, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    curriculum.forEach(grade => {
      grade.subjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
          if (
            tCurriculum(grade.level).toLowerCase().includes(lowerCaseQuery) ||
            tCurriculum(subject.name).toLowerCase().includes(lowerCaseQuery) ||
            tCurriculum(chapter.title).toLowerCase().includes(lowerCaseQuery)
          ) {
            results.push({ grade, subject, chapter });
          }
        });
      });
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  }, [searchQuery, curriculum, tCurriculum]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setIsResultsVisible(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleResultClick = (result: SearchResult) => {
    onSearchSelect(result.grade, result.subject, result.chapter);
    setSearchQuery('');
    setSearchResults([]);
    setIsResultsVisible(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };
  
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Logo size={48} />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {t('appTitle')}<sup>™</sup>
            </h1>
            <p className="text-xs font-medium text-primary -mt-1 hidden sm:block" style={{color: 'rgb(var(--c-primary))'}}>
                {t('appSubtitle')}
            </p>
          </div>
        </div>
         <div className="flex items-center gap-2 md:gap-4">
            {/* SEARCH BAR START */}
            <div ref={searchContainerRef} className="relative hidden md:block">
                <div className="relative">
                    <MagnifyingGlassIcon aria-hidden="true" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                    <input 
                        type="text"
                        placeholder="Search for chapters, subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsResultsVisible(true)}
                        className="appearance-none w-48 lg:w-64 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md pl-10 pr-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                        style={{borderColor: 'rgba(var(--c-primary), 0.3)'}}
                        aria-label="Search curriculum"
                    />
                </div>
                {isResultsVisible && searchQuery.length > 1 && (
                    <div className="absolute top-full mt-2 w-full max-w-sm lg:max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
                        {searchResults.length > 0 ? (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-700" role="listbox">
                                {searchResults.map((result, index) => (
                                    <li key={`${result.chapter.title}-${index}`} role="option" aria-selected="false">
                                        <button onClick={() => handleResultClick(result)} className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{tCurriculum(result.chapter.title)}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {tCurriculum(result.grade.level)} &bull; {tCurriculum(result.subject.name)}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No results found for "{searchQuery}"</p>
                        )}
                    </div>
                )}
            </div>
            {/* SEARCH BAR END */}
            <ThemeToggle />
            <div className="relative">
              <LanguageIcon aria-hidden="true" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
              <select 
                value={language} 
                onChange={handleLanguageChange}
                aria-label="Select language"
                className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md pl-10 pr-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                style={{borderColor: 'rgba(var(--c-primary), 0.3)'}}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>
            {showHomeButton && (
                 <button onClick={onGoHome} aria-label={t('home')} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-dark dark:hover:text-primary-dark transition-colors duration-200" style={{color: 'rgb(var(--c-primary-dark))'}}>
                    <HomeIcon className="h-5 w-5"/>
                    <span className="hidden sm:inline">{t('home')}</span>
                </button>
            )}
            {isLoggedIn && currentUser && (
                <>
                    <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <UserCircleIcon className="h-6 w-6 text-primary" style={{color: 'rgb(var(--c-primary))'}}/>
                        <span>{currentUser.name}</span>
                    </div>
                    <button onClick={logout} aria-label={t('logoutButton')} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200">
                        <ArrowRightOnRectangleIcon className="h-5 w-5"/>
                        <span className="hidden sm:inline">{t('logoutButton')}</span>
                    </button>
                </>
            )}
         </div>
      </div>
    </header>
  );
};

export default React.memo(Header);