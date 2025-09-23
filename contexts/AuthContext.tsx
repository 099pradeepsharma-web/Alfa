import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User, Student, Achievement, PerformanceRecord } from '../types';
import * as authService from '../services/authService';
import * as pineconeService from '../services/pineconeService';
import * as db from '../services/databaseService';

interface AuthContextType {
  currentUser: Student | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, grade: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// FIX: Changed component definition to use React.FC for better prop type inference, including children.
export const AuthProvider: React.FC = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true); // Start true to check session
    const [error, setError] = useState<string | null>(null);

    const handleLoginSuccess = useCallback(async (user: User) => {
        const performance = await pineconeService.getPerformanceRecords(user.id);
        const achievements = await pineconeService.getAchievements(user.id);
        
        // FIX: Calculate total points from performance records to satisfy the Student type, which requires a `points` property. A simple sum of scores is used as a placeholder for a more complex point system.
        const totalPoints = performance.reduce((sum, record) => sum + record.score, 0);

        const studentProfile: Student = {
            id: user.id,
            name: user.name,
            grade: user.grade,
            avatarUrl: user.avatarUrl,
            performance: performance,
            achievements: achievements,
            points: totalPoints,
        };
        setCurrentUser(studentProfile);
        sessionStorage.setItem('alfanumrik-userId', user.id.toString());
        setError(null);
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            const userId = sessionStorage.getItem('alfanumrik-userId');
            if (userId) {
                const user = await db.findUserById(parseInt(userId, 10));
                if (user) {
                    await handleLoginSuccess(user);
                }
            }
            setLoading(false);
        };
        checkSession();
    }, [handleLoginSuccess]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const user = await authService.login(email, password);
            await handleLoginSuccess(user);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (name: string, email: string, password: string, grade: string) => {
        setLoading(true);
        setError(null);
        try {
            const newUser = await authService.signup(name, email, password, grade);
            await handleLoginSuccess(newUser);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('alfanumrik-userId');
        setError(null);
    };
    
    const value = {
        currentUser,
        isLoggedIn: !!currentUser,
        loading,
        error,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
