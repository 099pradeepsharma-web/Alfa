import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Student, Teacher, Parent, PerformanceRecord, StudyGoal, Achievement } from '../types';

// Environment validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Supabase configuration missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
    );
}

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // More secure for public clients
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'X-Client-Info': 'alfanumrik-web@0.1.0'
        }
    }
});

// TypeScript interfaces for database tables
export interface Profile {
    id: string;
    role: 'student' | 'teacher' | 'parent';
    full_name: string | null;
    grade: string | null;
    school_name: string | null;
    org_id: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface PerformanceRecord_DB {
    id: string;
    student_id: string;
    subject: string;
    chapter: string;
    score: number;
    total_questions: number;
    type: 'quiz' | 'exercise' | 'diagnostic' | 'practice';
    difficulty: 'Easy' | 'Medium' | 'Hard' | null;
    completed_date: string;
    created_at: string;
}

export interface StudyGoal_DB {
    id: string;
    student_id: string;
    text: string;
    is_completed: boolean;
    due_date: string | null;
    created_at: string;
    completed_at: string | null;
}

export interface Achievement_DB {
    id: string;
    student_id: string;
    title: string;
    description: string | null;
    icon: string;
    points: number;
    category: 'academic' | 'streak' | 'improvement' | 'milestone';
    created_at: string;
}

export interface Question_DB {
    id: string;
    student_id: string;
    subject: string;
    chapter: string;
    concept: string;
    question_text: string;
    ai_response: string | null;
    is_resolved: boolean;
    created_at: string;
    resolved_at: string | null;
}

// Authentication helper functions
export class AuthService {
    /**
     * Sign in with email using Magic Link (OTP)
     */
    static async signInWithEmail(email: string): Promise<{ error: any | null }> {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        app_name: 'Alfanumrik'
                    }
                }
            });
            
            return { error };
        } catch (error) {
            console.error('Email sign-in error:', error);
            return { error };
        }
    }

    /**
     * Sign in with Google OAuth (when enabled in Supabase dashboard)
     */
    static async signInWithGoogle(): Promise<{ error: any | null }> {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                }
            });
            
            return { error };
        } catch (error) {
            console.error('Google sign-in error:', error);
            return { error };
        }
    }

    /**
     * Sign out user
     */
    static async signOut(): Promise<{ error: any | null }> {
        const { error } = await supabase.auth.signOut();
        return { error };
    }

    /**
     * Get current user session
     */
    static async getSession(): Promise<{ session: Session | null; user: User | null }> {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Session error:', error);
            return { session: null, user: null };
        }
        return { session, user: session?.user || null };
    }

    /**
     * Listen to auth state changes
     */
    static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
}

// Profile management functions
export class ProfileService {
    /**
     * Get or create user profile
     */
    static async getProfile(userId: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error && error.code !== 'PGRST116') { // Not found error is ok
            console.error('Profile fetch error:', error);
            return null;
        }
        
        return data;
    }

    /**
     * Create or update user profile
     */
    static async upsertProfile(userId: string, profileData: Partial<Profile>): Promise<Profile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                ...profileData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (error) {
            console.error('Profile upsert error:', error);
            return null;
        }
        
        return data;
    }

    /**
     * Convert Supabase profile to app Student type
     */
    static profileToStudent(profile: Profile, performance: PerformanceRecord[] = [], achievements: Achievement[] = [], goals: StudyGoal[] = []): Student {
        return {
            id: profile.id,
            name: profile.full_name || 'Student',
            email: '', // Will be populated from auth.users if needed
            grade: profile.grade || 'Class 9',
            avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`,
            points: achievements.reduce((sum, a) => sum + (a.points || 0), 0),
            performance: performance.map(p => ({
                subject: p.subject,
                chapter: p.chapter,
                score: p.score,
                completedDate: p.completedDate,
                type: p.type || 'quiz',
                difficulty: p.difficulty || 'Medium',
                context: ''
            })),
            achievements: achievements,
            studyGoals: goals,
            school: profile.school_name || undefined,
            city: undefined,
            board: 'CBSE'
        };
    }
}

// Data sync functions
export class DataService {
    /**
     * Save performance record to cloud
     */
    static async savePerformance(performance: PerformanceRecord_DB): Promise<boolean> {
        const { error } = await supabase
            .from('performance')
            .insert(performance);
            
        if (error) {
            console.error('Performance save error:', error);
            return false;
        }
        
        return true;
    }

    /**
     * Get performance records for student
     */
    static async getPerformance(studentId: string, limit = 50): Promise<PerformanceRecord_DB[]> {
        const { data, error } = await supabase
            .from('performance')
            .select('*')
            .eq('student_id', studentId)
            .order('completed_date', { ascending: false })
            .limit(limit);
            
        if (error) {
            console.error('Performance fetch error:', error);
            return [];
        }
        
        return data || [];
    }

    /**
     * Save study goal to cloud
     */
    static async saveStudyGoal(goal: StudyGoal_DB): Promise<boolean> {
        const { error } = await supabase
            .from('study_goals')
            .insert(goal);
            
        if (error) {
            console.error('Study goal save error:', error);
            return false;
        }
        
        return true;
    }

    /**
     * Get study goals for student
     */
    static async getStudyGoals(studentId: string): Promise<StudyGoal_DB[]> {
        const { data, error } = await supabase
            .from('study_goals')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Study goals fetch error:', error);
            return [];
        }
        
        return data || [];
    }

    /**
     * Update study goal completion status
     */
    static async updateStudyGoal(goalId: string, updates: Partial<StudyGoal_DB>): Promise<boolean> {
        const { error } = await supabase
            .from('study_goals')
            .update(updates)
            .eq('id', goalId);
            
        if (error) {
            console.error('Study goal update error:', error);
            return false;
        }
        
        return true;
    }

    /**
     * Save achievement to cloud
     */
    static async saveAchievement(achievement: Achievement_DB): Promise<boolean> {
        const { error } = await supabase
            .from('achievements')
            .insert(achievement);
            
        if (error) {
            console.error('Achievement save error:', error);
            return false;
        }
        
        return true;
    }

    /**
     * Get achievements for student
     */
    static async getAchievements(studentId: string): Promise<Achievement_DB[]> {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Achievements fetch error:', error);
            return [];
        }
        
        return data || [];
    }

    /**
     * Save student question to cloud
     */
    static async saveQuestion(question: Question_DB): Promise<boolean> {
        const { error } = await supabase
            .from('questions')
            .insert(question);
            
        if (error) {
            console.error('Question save error:', error);
            return false;
        }
        
        return true;
    }

    /**
     * Get questions for student
     */
    static async getQuestions(studentId: string, limit = 20): Promise<Question_DB[]> {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (error) {
            console.error('Questions fetch error:', error);
            return [];
        }
        
        return data || [];
    }
}

// Connection health check
export const checkSupabaseConnection = async (): Promise<{
    connected: boolean;
    latency: number;
    error?: string;
}> => {
    const start = performance.now();
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        const latency = performance.now() - start;
        
        if (error) {
            return {
                connected: false,
                latency,
                error: error.message
            };
        }
        
        return {
            connected: true,
            latency
        };
    } catch (error) {
        return {
            connected: false,
            latency: performance.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

// Utility functions
export const isSupabaseConfigured = (): boolean => {
    return !!(supabaseUrl && supabaseAnonKey);
};

export const getSupabaseConfig = () => {
    return {
        url: supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        projectId: supabaseUrl ? supabaseUrl.split('//')[1]?.split('.')[0] : null
    };
};

export default supabase;