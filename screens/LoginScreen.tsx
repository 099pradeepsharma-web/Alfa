import React, { useState } from 'react';
import { Grade } from '../types';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, AcademicCapIcon, IdentificationIcon, ExclamationCircleIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';

interface AuthScreenProps {
  grades: Grade[];
  onBack: () => void;
}

const LoginScreen: React.FC<AuthScreenProps> = ({ grades, onBack }) => {
  const { t, tCurriculum } = useLanguage();
  const { login, signup, loading, error } = useAuth();

  const [isLoginView, setIsLoginView] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setGradeLevel('');
    setFormError(null);
  };
  
  const toggleView = () => {
    setIsLoginView(!isLoginView);
    clearForm();
  };

  const validateSignup = (): boolean => {
    if (!name.trim() || !email.trim() || !password.trim() || !gradeLevel) {
      setFormError("All fields are required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
        if (isLoginView) {
            if (!email || !password) {
                setFormError("Email and password are required.");
                return;
            }
            await login(email, password);
            // On success, App.tsx will handle the redirect
        } else {
            if (!validateSignup()) return;
            await signup(name, email, password, gradeLevel);
        }
    } catch (err) {
        // The AuthContext will set the global error, which we can display.
        // Or we can display it locally if we prefer
        setFormError((err as Error).message);
    }
  };

  const displayedError = formError || error;

  return (
    <div className="max-w-md mx-auto animate-fade-in">
       <button onClick={onBack} className="flex items-center text-primary hover:text-primary-dark font-semibold transition mb-6" style={{color: 'rgb(var(--c-primary))'}}>
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {t('backToRoles')}
      </button>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
            <div className="inline-block p-3 bg-primary-light rounded-full mb-3" style={{backgroundColor: 'rgb(var(--c-primary-light))'}}>
                <AcademicCapIcon className="h-10 w-10 text-primary-dark" style={{color: 'rgb(var(--c-primary-dark))'}}/>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{isLoginView ? t('welcomeBackLearner') : t('joinTheAdventure')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{isLoginView ? t('loginPrompt') : t('signupPrompt')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginView && (
            <div>
                <label htmlFor="student-name" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                {t('studentNameLabel')}
                </label>
                <div className="relative">
                    <IdentificationIcon className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input type="text" id="student-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('studentNamePlaceholder')}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                    required />
                </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Email Address</label>
            <div className="relative">
              <EnvelopeIcon className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                required />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Password</label>
            <div className="relative">
              <KeyIcon className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                required />
            </div>
          </div>

          {!isLoginView && (
            <div>
                <label htmlFor="grade-select" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                {t('gradeLabel')}
                </label>
                <div className="relative">
                    <AcademicCapIcon className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <select id="grade-select" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition appearance-none"
                    required >
                    <option value="" disabled>{t('selectGradePlaceholder')}</option>
                    {grades.map(grade => (
                        <option key={grade.level} value={grade.level}>{tCurriculum(grade.level)}</option>
                    ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
          )}
          
          {displayedError && (
            <div role="status" className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-center text-sm font-semibold text-red-700 dark:text-red-300 animate-fade-in">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0"/>
                <span>{displayedError}</span>
            </div>
          )}

          <div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center px-8 py-3 text-white font-bold rounded-lg btn-primary-gradient disabled:opacity-70">
              {loading ? <LoadingSpinner /> : (isLoginView ? t('loginButton') : t('createAccountButton'))}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
            <button onClick={toggleView} className="text-sm font-semibold text-primary hover:underline" style={{color: 'rgb(var(--c-primary))'}}>
                {isLoginView ? t('signupInstead') : t('loginInstead')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;