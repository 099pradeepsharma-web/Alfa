import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Enhanced TypeScript interfaces for new schema
export interface Organization {
    id: string;
    name: string;
    type: 'school' | 'district' | 'organization';
    domain?: string;
    settings?: Record<string, any>;
    subscription_tier: 'free' | 'school' | 'district' | 'enterprise';
    max_students: number;
    max_teachers: number;
    created_at: string;
    updated_at: string;
}

export interface EnhancedProfile {
    id: string;
    org_id?: string;
    role: 'student' | 'teacher' | 'parent' | 'school_admin' | 'district_admin';
    full_name?: string;
    email?: string;
    grade?: string; // for students
    subject_specializations?: string[]; // for teachers
    school_name?: string;
    phone?: string;
    avatar_url?: string;
    settings?: Record<string, any>;
    last_active_at: string;
    created_at: string;
    updated_at: string;
}

export interface ParentChildLink {
    id: string;
    parent_id: string;
    child_id: string;
    relationship_type: 'parent' | 'guardian' | 'caregiver';
    created_at: string;
}

export interface ClassAssignment {
    id: string;
    teacher_id: string;
    student_id: string;
    subject: string;
    class_name?: string;
    org_id?: string;
    academic_year: string;
    is_active: boolean;
    created_at: string;
}

// Enhanced Authentication Service with role gating
export class EnhancedAuthService {
    /**
     * Sign in with role-based redirect
     */
    static async signInWithEmailAndRole(
        email: string, 
        expectedRole?: string
    ): Promise<{ error: any | null; needsRoleVerification?: boolean }> {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        app_name: 'Alfanumrik',
                        expected_role: expectedRole
                    }
                }
            });
            
            return { error, needsRoleVerification: !!expectedRole };
        } catch (error) {
            console.error('Enhanced email sign-in error:', error);
            return { error };
        }
    }

    /**
     * Verify user has required role after authentication
     */
    static async verifyUserRole(
        userId: string, 
        requiredRole: string
    ): Promise<{ hasRole: boolean; actualRole?: string; orgId?: string }> {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role, org_id')
                .eq('id', userId)
                .single();
                
            if (error || !profile) {
                return { hasRole: false };
            }
            
            return {
                hasRole: profile.role === requiredRole,
                actualRole: profile.role,
                orgId: profile.org_id
            };
        } catch (error) {
            console.error('Role verification error:', error);
            return { hasRole: false };
        }
    }

    /**
     * Get user's complete profile with org info
     */
    static async getUserWithOrg(userId: string): Promise<{
        profile: EnhancedProfile | null;
        organization: Organization | null;
        error?: string;
    }> {
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    organization:organizations(id, name, type, domain, subscription_tier)
                `)
                .eq('id', userId)
                .single();
                
            if (profileError) {
                return { profile: null, organization: null, error: profileError.message };
            }
            
            return {
                profile: profile,
                organization: profile.organization,
                error: undefined
            };
        } catch (error) {
            return {
                profile: null,
                organization: null,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// Organization Management Service
export class OrganizationService {
    /**
     * Create new organization
     */
    static async createOrganization(
        organizationData: Partial<Organization>
    ): Promise<Organization | null> {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .insert({
                    name: organizationData.name,
                    type: organizationData.type || 'school',
                    domain: organizationData.domain,
                    subscription_tier: organizationData.subscription_tier || 'free',
                    max_students: organizationData.max_students || 100,
                    max_teachers: organizationData.max_teachers || 10,
                    settings: organizationData.settings || {},
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
                
            if (error) {
                console.error('Organization creation error:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Organization creation error:', error);
            return null;
        }
    }

    /**
     * Get organization by domain
     */
    static async getOrganizationByDomain(domain: string): Promise<Organization | null> {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('domain', domain)
                .single();
                
            if (error && error.code !== 'PGRST116') {
                console.error('Organization fetch error:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Organization fetch error:', error);
            return null;
        }
    }

    /**
     * Get organization stats
     */
    static async getOrganizationStats(orgId: string): Promise<{
        totalStudents: number;
        totalTeachers: number;
        activeClasses: number;
        totalParents: number;
    }> {
        try {
            const { data: stats } = await supabase.rpc('get_org_stats', {
                org_id: orgId
            });
            
            return stats || {
                totalStudents: 0,
                totalTeachers: 0,
                activeClasses: 0,
                totalParents: 0
            };
        } catch (error) {
            console.error('Organization stats error:', error);
            return {
                totalStudents: 0,
                totalTeachers: 0,
                activeClasses: 0,
                totalParents: 0
            };
        }
    }
}

// Parent-Child Relationship Service
export class FamilyService {
    /**
     * Link parent to child
     */
    static async linkParentChild(
        parentId: string,
        childId: string,
        relationshipType: 'parent' | 'guardian' | 'caregiver' = 'parent'
    ): Promise<ParentChildLink | null> {
        try {
            const { data, error } = await supabase
                .from('parent_child_links')
                .insert({
                    parent_id: parentId,
                    child_id: childId,
                    relationship_type: relationshipType
                })
                .select()
                .single();
                
            if (error) {
                console.error('Parent-child link error:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Parent-child link error:', error);
            return null;
        }
    }

    /**
     * Get children for a parent
     */
    static async getChildrenForParent(parentId: string): Promise<EnhancedProfile[]> {
        try {
            const { data, error } = await supabase
                .from('parent_child_links')
                .select(`
                    child:profiles!parent_child_links_child_id_fkey(*)
                `)
                .eq('parent_id', parentId);
                
            if (error) {
                console.error('Children fetch error:', error);
                return [];
            }
            
            return data?.map(link => link.child).filter(Boolean) || [];
        } catch (error) {
            console.error('Children fetch error:', error);
            return [];
        }
    }

    /**
     * Get parents for a child
     */
    static async getParentsForChild(childId: string): Promise<EnhancedProfile[]> {
        try {
            const { data, error } = await supabase
                .from('parent_child_links')
                .select(`
                    parent:profiles!parent_child_links_parent_id_fkey(*)
                `)
                .eq('child_id', childId);
                
            if (error) {
                console.error('Parents fetch error:', error);
                return [];
            }
            
            return data?.map(link => link.parent).filter(Boolean) || [];
        } catch (error) {
            console.error('Parents fetch error:', error);
            return [];
        }
    }
}

// Teacher-Class Assignment Service
export class ClassroomService {
    /**
     * Assign teacher to student for a subject
     */
    static async assignTeacherToStudent(
        teacherId: string,
        studentId: string,
        subject: string,
        className?: string,
        orgId?: string
    ): Promise<ClassAssignment | null> {
        try {
            const { data, error } = await supabase
                .from('class_assignments')
                .insert({
                    teacher_id: teacherId,
                    student_id: studentId,
                    subject: subject,
                    class_name: className,
                    org_id: orgId,
                    academic_year: new Date().getFullYear().toString(),
                    is_active: true
                })
                .select()
                .single();
                
            if (error) {
                console.error('Class assignment error:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Class assignment error:', error);
            return null;
        }
    }

    /**
     * Get students for a teacher
     */
    static async getStudentsForTeacher(
        teacherId: string,
        subject?: string
    ): Promise<(EnhancedProfile & { subjects: string[] })[]> {
        try {
            let query = supabase
                .from('class_assignments')
                .select(`
                    subject,
                    student:profiles!class_assignments_student_id_fkey(*)
                `)
                .eq('teacher_id', teacherId)
                .eq('is_active', true);
                
            if (subject) {
                query = query.eq('subject', subject);
            }
            
            const { data, error } = await query;
                
            if (error) {
                console.error('Teacher students fetch error:', error);
                return [];
            }
            
            // Group subjects by student
            const studentMap = new Map();
            data?.forEach(assignment => {
                const studentId = assignment.student.id;
                if (!studentMap.has(studentId)) {
                    studentMap.set(studentId, {
                        ...assignment.student,
                        subjects: []
                    });
                }
                studentMap.get(studentId).subjects.push(assignment.subject);
            });
            
            return Array.from(studentMap.values());
        } catch (error) {
            console.error('Teacher students fetch error:', error);
            return [];
        }
    }

    /**
     * Get teachers for a student
     */
    static async getTeachersForStudent(
        studentId: string
    ): Promise<(EnhancedProfile & { subjects: string[] })[]> {
        try {
            const { data, error } = await supabase
                .from('class_assignments')
                .select(`
                    subject,
                    teacher:profiles!class_assignments_teacher_id_fkey(*)
                `)
                .eq('student_id', studentId)
                .eq('is_active', true);
                
            if (error) {
                console.error('Student teachers fetch error:', error);
                return [];
            }
            
            // Group subjects by teacher
            const teacherMap = new Map();
            data?.forEach(assignment => {
                const teacherId = assignment.teacher.id;
                if (!teacherMap.has(teacherId)) {
                    teacherMap.set(teacherId, {
                        ...assignment.teacher,
                        subjects: []
                    });
                }
                teacherMap.get(teacherId).subjects.push(assignment.subject);
            });
            
            return Array.from(teacherMap.values());
        } catch (error) {
            console.error('Student teachers fetch error:', error);
            return [];
        }
    }
}

// Enhanced Data Service with org isolation
export class EnhancedDataService {
    /**
     * Save performance with org context
     */
    static async savePerformanceWithOrg(
        performanceData: any,
        orgId?: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('performance')
                .insert({
                    ...performanceData,
                    org_id: orgId
                });
                
            if (error) {
                console.error('Performance save error:', error);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Performance save error:', error);
            return false;
        }
    }

    /**
     * Get org-wide performance analytics
     */
    static async getOrgPerformanceAnalytics(
        orgId: string,
        timeframe: 'week' | 'month' | 'quarter' = 'month'
    ): Promise<{
        avgScore: number;
        totalQuizzes: number;
        subjectBreakdown: { subject: string; avgScore: number; count: number }[];
        trendData: { date: string; avgScore: number }[];
    }> {
        try {
            // This would typically use a more complex query or stored procedure
            const { data, error } = await supabase
                .from('performance')
                .select('score, subject, completed_date')
                .eq('org_id', orgId)
                .gte('completed_date', this.getDateFromTimeframe(timeframe));
                
            if (error || !data) {
                return {
                    avgScore: 0,
                    totalQuizzes: 0,
                    subjectBreakdown: [],
                    trendData: []
                };
            }
            
            // Process data for analytics
            const totalQuizzes = data.length;
            const avgScore = data.reduce((sum, item) => sum + item.score, 0) / totalQuizzes;
            
            // Subject breakdown
            const subjectMap = new Map();
            data.forEach(item => {
                if (!subjectMap.has(item.subject)) {
                    subjectMap.set(item.subject, { scores: [], count: 0 });
                }
                subjectMap.get(item.subject).scores.push(item.score);
                subjectMap.get(item.subject).count++;
            });
            
            const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, data]) => ({
                subject,
                avgScore: data.scores.reduce((a, b) => a + b, 0) / data.count,
                count: data.count
            }));
            
            return {
                avgScore: Math.round(avgScore * 10) / 10,
                totalQuizzes,
                subjectBreakdown,
                trendData: [] // Would implement trend calculation here
            };
        } catch (error) {
            console.error('Org analytics error:', error);
            return {
                avgScore: 0,
                totalQuizzes: 0,
                subjectBreakdown: [],
                trendData: []
            };
        }
    }

    private static getDateFromTimeframe(timeframe: 'week' | 'month' | 'quarter'): string {
        const now = new Date();
        const daysBack = {
            week: 7,
            month: 30,
            quarter: 90
        }[timeframe];
        
        now.setDate(now.getDate() - daysBack);
        return now.toISOString();
    }
}

// Role-based permission helpers
export class PermissionService {
    static async canAccessStudent(requesterId: string, studentId: string): Promise<boolean> {
        try {
            // Check if requester is the student themselves
            if (requesterId === studentId) {
                return true;
            }
            
            // Check if requester is a teacher of the student
            const { data: assignments } = await supabase
                .from('class_assignments')
                .select('id')
                .eq('teacher_id', requesterId)
                .eq('student_id', studentId)
                .eq('is_active', true)
                .limit(1);
                
            if (assignments && assignments.length > 0) {
                return true;
            }
            
            // Check if requester is a parent of the student
            const { data: parentLinks } = await supabase
                .from('parent_child_links')
                .select('id')
                .eq('parent_id', requesterId)
                .eq('child_id', studentId)
                .limit(1);
                
            if (parentLinks && parentLinks.length > 0) {
                return true;
            }
            
            // Check if requester is an admin in the same org
            const { data: requesterProfile } = await supabase
                .from('profiles')
                .select('role, org_id')
                .eq('id', requesterId)
                .single();
                
            const { data: studentProfile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', studentId)
                .single();
                
            if (requesterProfile && studentProfile && 
                requesterProfile.org_id === studentProfile.org_id &&
                ['school_admin', 'district_admin'].includes(requesterProfile.role)) {
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    }

    static async getUserRole(userId: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
                
            return error ? null : data.role;
        } catch (error) {
            console.error('Role fetch error:', error);
            return null;
        }
    }
}

export default {
    EnhancedAuthService,
    OrganizationService,
    FamilyService,
    ClassroomService,
    EnhancedDataService,
    PermissionService
};