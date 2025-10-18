import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/supabase';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthScreenProps {
    onAuthSuccess: (user: User, session: Session) => void;
}

/**
 * Main authentication screen with email and Google OAuth options
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [authMethod, setAuthMethod] = useState<'email' | 'google'>('email');

    useEffect(() => {
        // Check if user is already authenticated
        const checkAuth = async () => {
            const { session, user } = await AuthService.getSession();
            if (session && user) {
                onAuthSuccess(user, session);
            }
        };
        
        checkAuth();
        
        // Listen for auth changes
        const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                onAuthSuccess(session.user, session);
            } else if (event === 'SIGNED_OUT') {
                setMessage('');
                setError('');
            }
        });
        
        return () => subscription.unsubscribe();
    }, [onAuthSuccess]);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            const { error } = await AuthService.signInWithEmail(email);
            
            if (error) {
                setError(error.message || 'Failed to send login email');
            } else {
                setMessage(
                    `📧 Login link sent to ${email}! Check your email and click the link to continue.`
                );
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            const { error } = await AuthService.signInWithGoogle();
            
            if (error) {
                setError(error.message || 'Google sign-in failed');
                setLoading(false);
            }
            // If successful, page will redirect - don't set loading to false
        } catch (err) {
            setError('Google sign-in is not available. Please try email login.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white font-bold">A</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Alfanumrik</h1>
                    <p className="text-gray-600">Your AI-powered adaptive learning companion</p>
                </div>

                {/* Success Message */}
                {message && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 text-sm">{message}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Auth Method Selector */}
                <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setAuthMethod('email')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            authMethod === 'email'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Email Login
                    </button>
                    <button
                        onClick={() => setAuthMethod('google')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            authMethod === 'google'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Google Login
                    </button>
                </div>

                {/* Email Authentication */}
                {authMethod === 'email' && (
                    <form onSubmit={handleEmailSignIn} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="student@school.edu"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                disabled={loading}
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Sending login link...</span>
                                </div>
                            ) : (
                                'Send Login Link'
                            )}
                        </button>
                    </form>
                )}

                {/* Google Authentication */}
                {authMethod === 'google' && (
                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-3"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                            )}
                            <span>
                                {loading ? 'Redirecting...' : 'Continue with Google'}
                            </span>
                        </button>
                        
                        <p className="text-center text-sm text-gray-500">
                            Sign in with your school Google account for fastest access
                        </p>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">🎯 What's New:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Multi-device access - Continue learning on any device</li>
                        <li>• Cloud backup - Your progress is safe and secure</li>
                        <li>• Teacher insights - Teachers can monitor your progress</li>
                        <li>• Family sharing - Parents can see achievements</li>
                    </ul>
                </div>

                {/* Privacy Note */}
                <p className="mt-6 text-xs text-gray-500 text-center">
                    By signing in, you agree to our privacy-first approach. Your learning data is secure and only accessible by you and your authorized teachers/parents.
                </p>
            </div>
        </div>
    );
};

/**
 * Profile setup screen for first-time users
 */
interface ProfileSetupProps {
    user: User;
    onProfileComplete: (student: any) => void;
}

export const ProfileSetupScreen: React.FC<ProfileSetupProps> = ({ user, onProfileComplete }) => {
    const [fullName, setFullName] = useState('');
    const [grade, setGrade] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const grades = [
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        'Class 11', 'Class 12'
    ];

    const handleSetupProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!fullName.trim() || !grade) {
            setError('Please fill in all required fields');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            // Create profile in Supabase
            const { ProfileService } = await import('../services/supabase');
            
            const profile = await ProfileService.upsertProfile(user.id, {
                role: 'student',
                full_name: fullName,
                grade: grade,
                school_name: schoolName || null
            });
            
            if (!profile) {
                throw new Error('Failed to create profile');
            }
            
            // Convert to Student type and initialize sync
            const student = ProfileService.profileToStudent(profile);
            student.email = user.email || '';
            
            // Initialize cloud sync for this user
            const { cloudSync } = await import('../services/cloudSync');
            await cloudSync.initializeUserSync(user.id);
            
            onProfileComplete(student);
            
        } catch (err) {
            console.error('Profile setup error:', err);
            setError(err instanceof Error ? err.message : 'Failed to set up profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-white">🎓</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Profile</h1>
                    <p className="text-gray-600">Let's personalize your learning experience</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSetupProfile} className="space-y-6">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                            Grade/Class *
                        </label>
                        <select
                            id="grade"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            disabled={loading}
                            required
                        >
                            <option value="">Select your grade</option>
                            {grades.map((g) => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                            School Name (Optional)
                        </label>
                        <input
                            type="text"
                            id="schoolName"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="Enter your school name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Setting up your profile...</span>
                            </div>
                        ) : (
                            'Complete Setup & Start Learning'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Your profile helps us personalize your learning journey and enables teachers/parents to track your progress.</p>
                </div>
            </div>
        </div>
    );
};

/**
 * Quick sync status component for the header
 */
export const SyncStatusIndicator: React.FC = () => {
    const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSync: null, error: null });
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const { cloudSync } = require('../services/cloudSync');
        
        const updateStatus = () => {
            setSyncStatus(cloudSync.getSyncStatus());
        };
        
        updateStatus();
        const interval = setInterval(updateStatus, 2000);
        
        return () => clearInterval(interval);
    }, []);

    const getStatusIcon = () => {
        if (syncStatus.syncing) return '🔄';
        if (syncStatus.error) return '🔴';
        if (syncStatus.lastSync) return '✅';
        return '🟡';
    };

    const getStatusText = () => {
        if (syncStatus.syncing) return 'Syncing...';
        if (syncStatus.error) return 'Sync Error';
        if (syncStatus.lastSync) {
            const lastSync = new Date(syncStatus.lastSync);
            const now = new Date();
            const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60));
            return diffMinutes < 1 ? 'Just synced' : `${diffMinutes}m ago`;
        }
        return 'Not synced';
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center space-x-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                title={getStatusText()}
            >
                <span className="text-sm">{getStatusIcon()}</span>
                <span className="text-xs text-gray-600 hidden sm:inline">{getStatusText()}</span>
            </button>
            
            {showDetails && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48 z-50">
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={syncStatus.error ? 'text-red-600' : 'text-green-600'}>
                                {syncStatus.syncing ? 'Syncing' : syncStatus.error ? 'Error' : 'Connected'}
                            </span>
                        </div>
                        {syncStatus.lastSync && (
                            <div className="flex justify-between">
                                <span>Last sync:</span>
                                <span className="text-gray-600">
                                    {new Date(syncStatus.lastSync).toLocaleTimeString()}
                                </span>
                            </div>
                        )}
                        {syncStatus.error && (
                            <div className="text-red-600 text-xs mt-2 border-t pt-2">
                                {syncStatus.error}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthScreen;