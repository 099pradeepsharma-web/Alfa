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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('No user returned from Supabase');
  
  const user = data.user;
  const userRole: Role = (user.user_metadata?.role as Role) ?? 'student';

  return { user: user as unknown as CurrentUser, role: userRole };
};

export const signup = async (userData: { name: string; grade: string; email: string; password: string }): Promise<{ user: CurrentUser; role: Role }> => {
  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: { name: userData.name, grade: userData.grade, role: 'student' }
    }
  });
  if (error) throw error;
  if (!data.user) throw new Error('No user returned from Supabase');
  
  const user = data.user;
  return { user: user as unknown as CurrentUser, role: 'student' };
};

export const logout = () => {
  supabase.auth.signOut();
};

export const getSession = (): Session | null => {
  const sessionData = supabase.auth.getSession();
  if (!sessionData) return null;
  return { user: sessionData.data.user as unknown as CurrentUser, role: (sessionData.data.user?.user_metadata?.role as Role) ?? 'student' };
};

export const saveSession = (session: Session) => {
  // Supabase automatically manages session persistence
};

export const updateStudent = async (updatedData: Student): Promise<Student> => {
  // In production, update via Supabase
  return updatedData;
};
