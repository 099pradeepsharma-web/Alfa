import React, { useState } from 'react';
import { Grade } from '../types';
import { useLanguage } from '../contexts/Language-context';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon, AcademicCapIcon, IdentificationIcon, ExclamationCircleIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';
import Logo from '../components/Logo';

interface AuthScreenProps {
  grades: Grade[];
  onBack: () => void;
}

const AuthIllustration = () => (
    <svg viewBox="0 0 100 100" className="w-full max-w-sm mx-auto">
        <defs>
            <filter id="auth-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <path d="M 50 10 C 90 30, 90 70, 50 90 S 10 70, 10 30, 50 10" fill="none" stroke="rgba(var(--c-primary), 0.1)" strokeWidth="1" />
        <path d="M 20 20 C 60 40, 40 60, 80 80" fill="none" stroke="rgba(var(--c-primary), 0.1)" strokeWidth="1" />
        <path d="M 20 80 C 60 60, 40 40, 80 20" fill="none" stroke="rgba(var(--c-primary), 0.1)" strokeWidth="1" />
    </svg>
);

export const LoginScreen: React.FC<AuthScreenProps> = ({ grades, onBack }) => {
  const { t, tCurriculum } = useLanguage();
  const { login, signup, loading, error: authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(grades.find(g => g.level === 'Grade 10')?.level || grades[0]?.level || '');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password, grade);
      }
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
        <button onClick={onBack} className="flex items-center text-text-secondary hover:text-text-primary font-semibold transition mb-6">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('backToRoleSelection')}
        </button>
        <div className="auth-container">
            <div className="auth-brand-panel">
                <AuthIllustration />
                <h2 className="text-3xl font-bold text-center mt-4 text-text-primary">Unlock Your Brilliance</h2>
                <p className="text-text-secondary text-center mt-2 max-w-xs">Your personal AI study partner to master CBSE concepts and excel in exams.</p>
            </div>

            <div className="auth-form-panel dashboard-highlight-card p-8">
                <div className="text-center mb-6">
                    <Logo size={56} />
                    <h2 className="text-3xl font-bold text-text-primary mt-4">{isLogin ? t('loginButton') : t('createAccountButton')}</h2>
                    <p className="text-text-secondary">{isLogin ? t('loginPrompt') : t('signupPrompt')}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <>
                            <div>
                                <label htmlFor="name" className="block text-sm font-bold text-text-secondary mb-1">{t('studentNameLabel')}</label>
                                <div className="relative">
                                     <IdentificationIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                     <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('studentNamePlaceholder')} required className="w-full pl-10"/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="grade" className="block text-sm font-bold text-text-secondary mb-1">{t('gradeLabel')}</label>
                                <div className="relative">
                                    <AcademicCapIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                    <select id="grade" value={grade} onChange={e => setGrade(e.target.value)} required className="w-full pl-10">
                                        {grades.map(g => <option key={g.level} value={g.level}>{tCurriculum(g.level)}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-bold text-text-secondary mb-1">Email</label>
                        <div className="relative">
                            <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@school.com" required className="w-full pl-10"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-bold text-text-secondary mb-1">Password</label>
                        <div className="relative">
                            <KeyIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10" />
                        </div>
                    </div>

                    {(authError || formError) && (
                        <div className="bg-red-900/40 border border-red-700 text-red-300 p-3 rounded-lg text-sm flex items-center gap-2">
                            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                            <span>{authError || formError}</span>
                        </div>
                    )}

                    <div>
                        <button type="submit" disabled={loading} className="w-full btn-accent flex items-center justify-center">
                            {loading ? <LoadingSpinner /> : (isLogin ? t('loginButton') : t('createAccountButton'))}
                        </button>
                    </div>
                </form>
                
                <p className="text-center text-sm text-text-secondary mt-6">
                    {isLogin ? t('signupInstead') : t('loginInstead')}
                    <button onClick={() => { setIsLogin(!isLogin); setFormError(null); }} className="font-semibold text-primary hover:underline ml-1">
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};
