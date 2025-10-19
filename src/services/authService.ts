import { createClient } from '@supabase/supabase-js';
import { Student, Teacher, Parent } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dkljgiwtzonycyoecnzd.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

type Role = 'student' | 'teacher' | 'parent';
type CurrentUser = Student | Teacher | Parent;

interface Session {
  user: CurrentUser;
  role: Role;
}

export const initializeDatabase = async () => {
  // Database initialization is handled by Supabase setup SQL
  return true;
};

export const login = async (role: Role, email: string, password: string): Promise<{ user: CurrentUser; role: Role }> => {
  // For demo purposes, return mock user data
  // In production, implement actual Supabase auth
  const mockUser: Student = {
    id: '1',
    name: 'Demo Student',
    email,
    grade: '8th Grade',
    school: 'Demo School',
    masteryLevel: 75,
    streakDays: 5,
    totalPoints: 1250,
    achievements: [],
    studyGoals: [],
    performanceHistory: []
  };
  
  return { user: mockUser, role: 'student' };
};

export const signup = async (userData: { name: string; grade: string; email: string; password: string }): Promise<{ user: CurrentUser; role: Role }> => {
  const newUser: Student = {
    id: Math.random().toString(36).substr(2, 9),
    name: userData.name,
    email: userData.email,
    grade: userData.grade,
    school: 'Demo School',
    masteryLevel: 0,
    streakDays: 0,
    totalPoints: 0,
    achievements: [],
    studyGoals: [],
    performanceHistory: []
  };
  
  return { user: newUser, role: 'student' };
};

export const logout = () => {
  localStorage.removeItem('alfanumrik_session');
};

export const getSession = (): Session | null => {
  const sessionData = localStorage.getItem('alfanumrik_session');
  return sessionData ? JSON.parse(sessionData) : null;
};

export const saveSession = (session: Session) => {
  localStorage.setItem('alfanumrik_session', JSON.stringify(session));
};

export const updateStudent = async (updatedData: Student): Promise<Student> => {
  // In production, update via Supabase
  return updatedData;
};
