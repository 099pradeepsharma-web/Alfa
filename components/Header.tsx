import React, { useState, useEffect, useRef } from 'react';
import { HomeIcon, LanguageIcon, MagnifyingGlassIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import Logo from './Logo';
import { Grade, Subject, Chapter, Student, Teacher, Parent } from '../types';
import ProfileModal from './ProfileModal';

interface HeaderProps {
    onGoHome: () => void;
    showHomeButton: boolean;
    curriculum: Grade[];
    onSearchSelect: (grade: Grade, subject: Subject, chapter: Chapter) => void;
    isLoggedIn: boolean;
    user: Student | Teacher | Parent | null;
    userRole: 'student' | 'teacher' | 'parent' | null;
    onUpdateProfile: (data: any) => Promise<void>;
    profileUpdateLoading: boolean;
    profileUpdateError: string | null;
    onLogout: () => void;
}

type SearchResult = {
    grade: Grade;
    subject: Subject;
    chapter: Chapter;
};


const Header: React.FC<HeaderProps> = ({ 
    onGoHome, 
    showHomeButton, 
    curriculum, 
    onSearchSelect, 
    isLoggedIn, 
    user,
    userRole,
    onUpdateProfile,
    profileUpdateLoading,
    profileUpdateError,
    onLogout
}) => {
  const { language, setLanguage, t, tCurriculum } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


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
    <>
      <header>
        <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size={48} />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
                {t('appTitle')}
              </h1>
              <p className="text-xs font-medium text-text-secondary -mt-1 hidden sm:block">
                  {t('appSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
              {/* SEARCH BAR START (Student Only) */}
              {userRole === 'student' && (
                  <div ref={searchContainerRef} className="relative hidden md:block">
                      <div className="relative">
                          <MagnifyingGlassIcon aria-hidden="true" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                          <input 
                              type="text"
                              placeholder="Search for chapters, subjects..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onFocus={() => setIsResultsVisible(true)}
                              className="appearance-none w-48 lg:w-64 pl-10 pr-4"
                              aria-label="Search curriculum"
                          />
                      </div>
                      {isResultsVisible && searchQuery.length > 1 && (
                          <div className="absolute top-full mt-2 w-full max-w-sm lg:max-w-md bg-surface rounded-lg shadow-2xl border border-border-color z-50 max-h-96 overflow-y-auto">
                              {searchResults.length > 0 ? (
                                  <ul className="divide-y divide-border-color" role="listbox">
                                      {searchResults.map((result, index) => (
                                          <li key={`${result.chapter.title}-${index}`} role="option" aria-selected="false">
                                              <button onClick={() => handleResultClick(result)} className="w-full text-left p-3 hover:bg-bg-primary transition-colors">
                                                  <p className="font-semibold text-text-primary">{tCurriculum(result.chapter.title)}</p>
                                                  <p className="text-xs text-text-secondary">
                                                      {tCurriculum(result.grade.level)} &bull; {tCurriculum(result.subject.name)}
                                                  </p>
                                              </button>
                                          </li>
                                      ))}
                                  </ul>
                              ) : (
                                  <p className="p-4 text-center text-sm text-text-secondary">No results found for "{searchQuery}"</p>
                              )}
                          </div>
                      )}
                  </div>
              )}
              {/* SEARCH BAR END */}
              <div className="relative">
                <LanguageIcon aria-hidden="true" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <select 
                  value={language} 
                  onChange={handleLanguageChange}
                  aria-label="Select language"
                  className="appearance-none pl-10 pr-4"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
              {showHomeButton && (
                  <button onClick={onGoHome} aria-label={t('home')} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors duration-200">
                      <HomeIcon className="h-5 w-5"/>
                      <span className="hidden sm:inline">{t('home')}</span>
                  </button>
              )}
              {isLoggedIn && (
                  <>
                      {userRole === 'student' && user && 'avatarUrl' in user && (
                          <button onClick={() => setIsProfileModalOpen(true)} className="rounded-full w-10 h-10 overflow-hidden border-2 border-slate-600 hover:border-primary transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary">
                              <img src={user.avatarUrl} alt="User profile" className="w-full h-full object-cover" />
                          </button>
                      )}
                      {userRole !== 'student' && user && (
                           <span className="font-semibold text-text-secondary">{user.name}</span>
                      )}
                      <button onClick={onLogout} aria-label={t('logoutButton')} className="p-2.5 rounded-lg border-2 bg-surface text-text-primary transition-colors duration-200 hover:bg-bg-primary" style={{ borderColor: 'rgba(var(--c-border-color), 1)' }}>
                        <ArrowLeftOnRectangleIcon className="h-5 w-5"/>
                      </button>
                  </>
              )}
          </div>
        </div>
      </header>
      {userRole === 'student' && user && 'avatarUrl' in user && (
        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          grades={curriculum.map(g => ({ level: g.level, description: g.description }))}
          updateUserProfile={onUpdateProfile}
          loading={profileUpdateLoading}
          error={profileUpdateError}
        />
      )}
    </>
  );
};

export default React.memo(Header);