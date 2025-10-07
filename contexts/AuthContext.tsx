import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Student, StudyGoal, Achievement } from '../types';
import { MOCK_STUDENTS } from '../data/mockData';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import * as pineconeService from '../services/pineconeService';
import { ALL_ACHIEVEMENTS } from '../data/achievements';

interface AuthContextType {
  currentUser: Student | null;
  users: Student[];
  login: (studentId: string) => void;
  logout: () => void;
  signup: (userData: { name: string, grade: string, email: string }) => Promise<void>;
  updateUser: (updatedUser: Student) => void;
  addStudyGoal: (goalText: string) => Promise<void>;
  toggleStudyGoal: (goal: StudyGoal) => Promise<void>;
  removeStudyGoal: (goal: StudyGoal) => Promise<void>;
  addAchievement: (achievementId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Student | null>(() => {
    try {
        const storedUser = sessionStorage.getItem('alfanumrik-currentUser');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        return null;
    }
  });
  
  const [allUsers, setAllUsers] = useState<Student[]>(MOCK_STUDENTS);

  useEffect(() => {
    try {
        if (currentUser) {
            sessionStorage.setItem('alfanumrik-currentUser', JSON.stringify(currentUser));
        } else {
            sessionStorage.removeItem('alfanumrik-currentUser');
        }
    } catch (e) {
        console.error("Failed to update sessionStorage", e);
    }
  }, [currentUser]);

  // Effect to load study goals from DB when a user is logged in
  useEffect(() => {
    if (currentUser?.id) {
        const loadGoals = async () => {
            const goals = await pineconeService.getStudyGoals(currentUser.id);
            // Update user state only if the goals are different, to avoid loops
            if (JSON.stringify(goals) !== JSON.stringify(currentUser.studyGoals)) {
                setCurrentUser(prevUser => prevUser ? { ...prevUser, studyGoals: goals } : null);
            }
        };
        loadGoals();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]); // Depend on ID to run once per user session


  const login = useCallback((studentId: string) => {
    const user = allUsers.find(u => u.id === studentId);
    if (user) {
      setCurrentUser(user);
    }
  }, [allUsers]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);
  
  const signup = useCallback(async (userData: { name: string, grade: string, email: string }) => {
    const seed = userData.name.trim();
    const avatar = createAvatar(lorelei, { seed });
    const avatarUrl = await avatar.toDataUri();
    
    const newUser: Student = {
        id: `user-${Date.now()}`,
        name: userData.name,
        grade: userData.grade,
        email: userData.email,
        avatarUrl: avatarUrl,
        avatarSeed: seed,
        performance: [],
        achievements: [],
        points: 0,
        studyGoals: [],
    };
    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  }, []);
  
  const updateUser = useCallback((updatedUser: Student) => {
    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, []);
  
  const addStudyGoal = useCallback(async (goalText: string) => {
    if (!currentUser) return;
    const newGoal = await pineconeService.addStudyGoal(currentUser.id, goalText);
    setCurrentUser(prev => prev ? { ...prev, studyGoals: [newGoal, ...prev.studyGoals] } : null);
  }, [currentUser]);

  const toggleStudyGoal = useCallback(async (goal: StudyGoal) => {
      if (!currentUser) return;
      const updatedGoal = { ...goal, isCompleted: !goal.isCompleted };
      await pineconeService.updateStudyGoal(currentUser.id, updatedGoal);
      setCurrentUser(prev => prev ? { ...prev, studyGoals: prev.studyGoals.map(g => g.id === goal.id ? updatedGoal : g) } : null);
  }, [currentUser]);

  const removeStudyGoal = useCallback(async (goal: StudyGoal) => {
      if (!currentUser) return;
      await pineconeService.removeStudyGoal(currentUser.id, goal.id);
      setCurrentUser(prev => prev ? { ...prev, studyGoals: prev.studyGoals.filter(g => g.id !== goal.id) } : null);
  }, [currentUser]);

  const addAchievement = useCallback((achievementId: string) => {
    if (!currentUser) return;

    const achievementExists = currentUser.achievements.some(a => a.id === achievementId);
    if (achievementExists) return;

    const achievementToAdd = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievementToAdd) return;

    const newAchievement: Achievement = {
      ...achievementToAdd,
      timestamp: new Date().toISOString()
    };

    const updatedUser = {
      ...currentUser,
      achievements: [...currentUser.achievements, newAchievement]
    };
    
    setCurrentUser(updatedUser);
    pineconeService.addAchievement(currentUser.id, newAchievement);
    
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, users: allUsers, login, logout, signup, updateUser, addStudyGoal, toggleStudyGoal, removeStudyGoal, addAchievement }}>
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