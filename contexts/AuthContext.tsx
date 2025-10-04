import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { User, Student, Achievement, PerformanceRecord } from '../types';
import * as authService from '../services/authService';
import * as pineconeService from '../services/pineconeService';
import * as db from '../services/databaseService';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

interface AuthContextType {
  currentUser: Student | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, grade: string) => Promise<void>;
  logout: () => void;
  updateStudentPoints: (pointsToAdd: number) => void;
  updateUserProfile: (updatedData: { 
      name: string; 
      grade: string; 
      school: string;
      city: string;
      board: string;
      avatarSeed: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true); // Start true to check session
    const [error, setError] = useState<string | null>(null);

    const handleLoginSuccess = useCallback(async (user: User) => {
        const performance = await pineconeService.getPerformanceRecords(user.id);
        const achievements = await pineconeService.getAchievements(user.id);
        
        const totalPoints = performance.reduce((sum, record) => sum + record.score, 0);

        const studentProfile: Student = {
            id: user.id,
            name: user.name,
            grade: user.grade,
            avatarUrl: user.avatarUrl,
            avatarSeed: user.avatarSeed || user.name,
            school: user.school || '',
            city: user.city || '',
            board: user.board || '',
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

    const updateStudentPoints = (pointsToAdd: number) => {
        setCurrentUser(prevUser => {
            if (!prevUser) return null;
            const newPoints = prevUser.points + pointsToAdd;
            return { ...prevUser, points: newPoints };
        });
    };
    
    const updateUserProfile = async (updatedData: { 
        name: string; 
        grade: string; 
        school: string;
        city: string;
        board: string;
        avatarSeed: string;
    }) => {
        if (!currentUser) return;
        
        setLoading(true);
        setError(null);
    
        try {
            const userFromDb = await db.findUserById(currentUser.id);
            if (!userFromDb) throw new Error("User not found");
    
            const seed = updatedData.avatarSeed.trim() || updatedData.name.trim();
            const hasSeedChanged = (userFromDb.avatarSeed || userFromDb.name) !== seed;
    
            let newAvatarUrl = userFromDb.avatarUrl;
            if (hasSeedChanged) {
                const avatar = createAvatar(lorelei, { seed });
                newAvatarUrl = await avatar.toDataUri();
            }
    
            const updatedUser: User = {
                ...userFromDb,
                name: updatedData.name.trim(),
                grade: updatedData.grade,
                school: updatedData.school.trim(),
                city: updatedData.city.trim(),
                board: updatedData.board.trim(),
                avatarUrl: newAvatarUrl,
                avatarSeed: seed,
            };
    
            await db.updateUser(updatedUser);
    
            setCurrentUser(prevUser => {
                if (!prevUser) return null;
                return {
                    ...prevUser,
                    name: updatedUser.name,
                    grade: updatedUser.grade,
                    school: updatedUser.school,
                    city: updatedUser.city,
                    board: updatedUser.board,
                    avatarUrl: updatedUser.avatarUrl,
                    avatarSeed: updatedUser.avatarSeed,
                };
            });
    
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        currentUser,
        isLoggedIn: !!currentUser,
        loading,
        error,
        login,
        signup,
        logout,
        updateStudentPoints,
        updateUserProfile
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