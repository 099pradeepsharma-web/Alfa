import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/Language-context';
import { Grade, Teacher, Parent } from '../types';
import { CURRICULUM } from '../data/curriculum';
import { MOCK_TEACHERS, MOCK_PARENTS } from '../data/mockData';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, User, GraduationCap, Heart } from 'lucide-react';

interface AuthScreenProps {
  onBack: () => void;
  onNonStudentLogin: (user: Teacher | Parent, role: 'teacher' | 'parent') => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onBack, onNonStudentLogin }) => {
    const { users, login, signup } = useAuth();
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

    const handleRoleChange = (role: Role) => {
        setActiveRole(role);
        resetForm();
    };

    // "Login-free" effect for Teacher and Parent roles
    useEffect(() => {
        if (activeRole === 'teacher' || activeRole === 'parent') {
            setIsLoading(true);
            setError(null);
            // Simulate a quick, automatic login
            setTimeout(() => {
                if (activeRole === 'teacher') {
                    const teacher = MOCK_TEACHERS[0];
                    if (teacher) {
                        onNonStudentLogin(teacher, 'teacher');
                    } else {
                        setError("Mock teacher account not found.");
                        setIsLoading(false);
                    }
                } else if (activeRole === 'parent') {
                    const parent = MOCK_PARENTS[0];
                    if (parent) {
                        onNonStudentLogin(parent, 'parent');
                    } else {
                        setError("Mock parent account not found.");
                        setIsLoading(false);
                    }
                }
                // Don't need to set isLoading to false here, as the component will unmount on successful login
            }, 500);
        }
    }, [activeRole, onNonStudentLogin]);

    const handleStudentLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setTimeout(() => { // Simulate network delay
            // For this demo, any student login attempt logs in the first mock student.
            const user = users[0];
            if (user) {
                login(user.id);
            } else {
                setError("No mock student accounts available to log in.");
                setIsLoading(false);
            }
        }, 500);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim()) return;
        setIsLoading(true);
        setError(null);
        await signup({ name, grade, email });
        // The component will unmount upon successful signup/login
    };

    const roleConfig = {
        student: { icon: User, title: 'Student' },
        teacher: { icon: GraduationCap, title: 'Teacher' },
        parent: { icon: Heart, title: 'Parent' },
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
                        {Object.keys(roleConfig).map((role) => {
                            const { icon: Icon, title } = roleConfig[role as Role];
                            const isActive = activeRole === role;
                            return (
                                <button
                                    key={role}
                                    onClick={() => handleRoleChange(role as Role)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold border-b-2 transition-colors ${
                                        isActive ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {activeRole === 'student' ? (
                    isLoginView ? (
                        <div className="animate-fade-in">
                            <h3 className="text-2xl font-bold text-text-primary text-center">Welcome, {roleConfig[activeRole].title}!</h3>
                             <p className="text-center text-sm text-text-secondary mt-2">For demo, any credentials log you in as the first student.</p>
                            <form onSubmit={handleStudentLogin} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full" />
                                </div>
                                {error && <p className="text-sm text-status-danger text-center">{error}</p>}
                                <button type="submit" disabled={isLoading} className="w-full btn-accent flex items-center justify-center h-12">
                                    {isLoading ? <LoadingSpinner /> : 'Login'}
                                </button>
                            </form>
                            <p className="text-center text-sm text-text-secondary mt-6">
                                Don't have an account? {' '}
                                <button onClick={() => setIsLoginView(false)} className="font-semibold text-primary hover:underline">
                                    Sign Up
                                </button>
                            </p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <h3 className="text-2xl font-bold text-text-primary text-center">Create Student Account</h3>
                            <form onSubmit={handleSignup} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Full Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Ananya Sharma" className="w-full" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Grade</label>
                                    <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full">
                                        {grades.map(g => <option key={g} value={g}>{tCurriculum(g)}</option>)}
                                    </select>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full btn-accent flex items-center justify-center h-12">
                                    {isLoading ? <LoadingSpinner /> : 'Create Account'}
                                </button>
                            </form>
                             <p className="text-center text-sm text-text-secondary mt-6">
                                Already have an account? {' '}
                                <button onClick={() => setIsLoginView(true)} className="font-semibold text-primary hover:underline">
                                    Login
                                </button>
                            </p>
                        </div>
                    )
                ) : (
                    // For teacher and parent, show a loading/message view
                    <div className="animate-fade-in text-center py-8 min-h-[200px] flex flex-col justify-center items-center">
                        {isLoading && (
                            <>
                                <LoadingSpinner />
                                <p className="mt-4 text-text-secondary">Logging in as {roleConfig[activeRole].title}...</p>
                            </>
                        )}
                        {error && <p className="text-sm text-status-danger text-center">{error}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthScreen;
