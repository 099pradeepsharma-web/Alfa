import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-lg border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-700"
      style={{
        borderColor: 'rgba(var(--c-border-color), 1)'
      }}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="h-5 w-5" />
      ) : (
        <SunIcon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;