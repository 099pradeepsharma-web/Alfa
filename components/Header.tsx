import React from 'react';
import { HomeIcon, LanguageIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

interface HeaderProps {
    onGoHome: () => void;
    showHomeButton: boolean;
}

const Header: React.FC<HeaderProps> = ({ onGoHome, showHomeButton }) => {
  const { language, setLanguage, t } = useLanguage();
  const { isLoggedIn, currentUser, logout } = useAuth();

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