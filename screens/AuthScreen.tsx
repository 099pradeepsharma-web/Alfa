import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/Language-context';
import { Grade } from '../types';
import { CURRICULUM } from '../data/curriculum';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, User, GraduationCap, Heart } from 'lucide-react';

interface AuthScreenProps {
  onBack: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onBack }) => {
    const { login, signup } = useAuth();
    const { t, tCurriculum } = useLanguage();
    
    type Role = 'student' | 'teacher' | 'parent';
    const [activeRole, setActiveRole] = useState<Role>('student');
    const [isLoginView, setIsLoginView] = useState(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('Grade 10');
    const [error, setError] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    const grades = CURRICULUM.map(g => g.level);

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setName('');
        setGrade('Grade 10');
        setError(null);
    };

    useEffect(() => {
        resetForm();
    }, [isLoginView, activeRole]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await login(activeRole, email, password);
            // On success, AuthContext will trigger a re-render in App.tsx, navigating away.
        } catch (err: any) {
            setError(err.message || 'Login failed.');
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            await signup({ name, grade, email, password });
            // On success, AuthContext will trigger a re-render in App.tsx.
        } catch (err: any) {
            setError(err.message || 'Signup failed.');
            setIsLoading(false);
        }
    };

    const roleConfig = {
        student: { icon: User, title: 'Student' },
        teacher: { icon: GraduationCap, title: 'Teacher' },
        parent: { icon: Heart, title: 'Parent' },
    };
    
    const demoCredentials = {
        student: { email: 'student@alfanumrik.com', pass: 'password123' },
        teacher: { email: 'teacher@alfanumrik.com', pass: 'password123' },
        parent: { email: 'parent@alfanumrik.com', pass: 'password123' },
    };

    return (
        <div className="max-w-md mx-auto animate-fade-in relative pt-12">
            <button onClick={onBack} className="absolute top-0 left-0 flex items-center text-text-secondary hover:text-text-primary font-semibold transition z-10">
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back
            </button>
            <div className="dashboard-highlight-card p-8">
                <div className="mb-6">
                    <div className="flex justify-center border-b border-border">
                        {Object.entries(roleConfig).map(([role, config]) => {
                            const isActive = activeRole === role;
                            return (
                                <button
                                    key={role}
                                    onClick={() => setActiveRole(role as Role)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold border-b-2 transition-colors ${
                                        isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    <config.icon className="h-5 w-5" />
                                    <span>{config.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {isLoginView ? (
                    <div className="animate-fade-in">
                        <h3 className="text-2xl font-bold text-text-primary text-center">Welcome, {roleConfig[activeRole].title}!</h3>
                        <div className="text-center text-xs text-text-secondary mt-2 bg-surface p-2 rounded-md">
                            <p><strong>Demo Credentials:</strong></p>
                            <p>Email: <strong>{demoCredentials[activeRole].email}</strong></p>
                            <p>Password: <strong>{demoCredentials[activeRole].pass}</strong></p>
                        </div>
                        <form onSubmit={handleLogin} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">{t('emailLabel')}</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">{t('passwordLabel')}</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full" required />
                            </div>
                            {error && <p className="text-sm text-status-danger text-center">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full btn-accent flex items-center justify-center h-12">
                                {isLoading ? <LoadingSpinner /> : t('loginButton')}
                            </button>
                        </form>
                        {activeRole === 'student' && (
                            <p className="text-center text-sm text-text-secondary mt-6">
                                {t('signupInstead')}
                                <button onClick={() => setIsLoginView(false)} className="font-semibold text-primary hover:underline ml-1">
                                    Sign Up
                                </button>
                            </p>
                        )}
                    </div>
                ) : ( // Signup View (Student only)
                    <div className="animate-fade-in">
                        <h3 className="text-2xl font-bold text-text-primary text-center">Create Student Account</h3>
                        <form onSubmit={handleSignup} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">{t('nameLabel')}</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Ananya Sharma" className="w-full" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">{t('emailLabel')}</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">{t('passwordLabel')}</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-secondary mb-1">{t('gradeLabel')}</label>
                                <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full">
                                    {grades.map(g => <option key={g} value={g}>{tCurriculum(g)}</option>)}
                                </select>
                            </div>
                             {error && <p className="text-sm text-status-danger text-center">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full btn-accent flex items-center justify-center h-12">
                                {isLoading ? <LoadingSpinner /> : t('createAccountButton')}
                            </button>
                        </form>
                         <p className="text-center text-sm text-text-secondary mt-6">
                             {t('loginInstead')}
                            <button onClick={() => setIsLoginView(true)} className="font-semibold text-primary hover:underline ml-1">
                                Login
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthScreen;
