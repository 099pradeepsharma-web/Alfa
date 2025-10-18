import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Student, Teacher, Parent, StudyGoal, Achievement } from '../types';
import * as authService from '../services/authService';
import * as pineconeService from '../services/pineconeService';
import { ALL_ACHIEVEMENTS } from '../data/achievements';
import LoadingSpinner from '../components/LoadingSpinner';

type Role = 'student' | 'teacher' | 'parent';
type CurrentUser = Student | Teacher | Parent;

interface AuthContextType {
  currentUser: CurrentUser | null;
  currentRole: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  users: Student[];
  login: (role: Role, email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (userData: { name: string, grade: string, email: string, password: string }) => Promise<void>;
  updateUser: (updatedUser: Student) => Promise<void>;
  addStudyGoal: (goalText: string, dueDate?: string) => Promise<void>;
  toggleStudyGoal: (goal: StudyGoal) => Promise<void>;
  removeStudyGoal: (goal: StudyGoal) => Promise<void>;
  addAchievement: (achievementId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<Student[]>([]);

  // Initialize auth state on app load
  useEffect(() => {
    const initialize = async () => {
      await authService.initializeDatabase();
      const session = authService.getSession();
      if (session) {
        setCurrentUser(session.user);
        setCurrentRole(session.role);
        if (session.user.id && session.role === 'student') {
            const goals = await pineconeService.getStudyGoals(session.user.id);
            setCurrentUser(prev => prev ? {...prev, studyGoals: goals} : null);
        }
      }
      setIsLoading(false);
    };
    initialize();
  }, []);

  const login = async (role: Role, email: string, password: string) => {
    const { user, role: loggedInRole } = await authService.login(role, email, password);
    setCurrentUser(user);
    setCurrentRole(loggedInRole);
    if (user.id && loggedInRole === 'student') {
      const goals = await pineconeService.getStudyGoals(user.id);
      setCurrentUser(prev => prev ? {...prev, studyGoals: goals} : null);
    }
  };

  const signup = async (userData: { name: string, grade: string, email: string, password: string }) => {
    const { user, role } = await authService.signup(userData);
    setCurrentUser(user);
    setCurrentRole(role);
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentRole(null);
  };

  const updateUser = async (updatedData: Student) => {
      if (!currentUser || currentRole !== 'student') throw new Error("Not authorized to update student profile.");
      
      const updatedUser = await authService.updateStudent(updatedData);
      
      const session = { user: updatedUser, role: 'student' as Role };
      authService.saveSession(session);
      setCurrentUser(updatedUser);
  };

  const addStudyGoal = useCallback(async (goalText: string, dueDate?: string) => {
    if (!currentUser || currentRole !== 'student') return;
    const newGoal = await pineconeService.addStudyGoal(currentUser.id, goalText, dueDate);
    setCurrentUser(prev => prev ? { ...prev, studyGoals: [newGoal, ...(prev as Student).studyGoals] } as Student : null);
  }, [currentUser, currentRole]);

  const toggleStudyGoal = useCallback(async (goal: StudyGoal) => {
    if (!currentUser || currentRole !== 'student') return;
    const updatedGoal = { ...goal, isCompleted: !goal.isCompleted };
    await pineconeService.updateStudyGoal(currentUser.id, updatedGoal);
    setCurrentUser(prev => prev ? { ...prev, studyGoals: (prev as Student).studyGoals.map(g => g.id === goal.id ? updatedGoal : g) } as Student : null);
  }, [currentUser, currentRole]);

  const removeStudyGoal = useCallback(async (goal: StudyGoal) => {
    if (!currentUser || currentRole !== 'student') return;
    await pineconeService.removeStudyGoal(currentUser.id, goal.id);
    setCurrentUser(prev => prev ? { ...prev, studyGoals: (prev as Student).studyGoals.filter(g => g.id !== goal.id) } as Student : null);
  }, [currentUser, currentRole]);

  const addAchievement = useCallback((achievementId: string) => {
    if (!currentUser || currentRole !== 'student') return;
    const studentUser = currentUser as Student;

    const achievementExists = studentUser.achievements.some(a => a.id === achievementId);
    if (achievementExists) return;

    const achievementToAdd = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievementToAdd) return;

    const newAchievement: Achievement = { ...achievementToAdd, timestamp: new Date().toISOString() };
    const updatedUser = { ...studentUser, achievements: [...studentUser.achievements, newAchievement] };
    
    setCurrentUser(updatedUser);
    authService.saveSession({ user: updatedUser, role: 'student' });
    pineconeService.addAchievement(currentUser.id, newAchievement);
  }, [currentUser, currentRole]);

  const value = {
    currentUser,
    currentRole,
    isAuthenticated: !!currentUser,
    isLoading,
    users,
    login,
    logout,
    signup,
    updateUser,
    addStudyGoal,
    toggleStudyGoal,
    removeStudyGoal,
    addAchievement,
  };
  
  // Render a loading screen while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-bg-primary">
        <LoadingSpinner />
      </div>
    );
  }

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
