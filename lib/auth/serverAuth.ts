import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Server-side authentication utilities for Next.js App Router
// Adapt these functions based on your current Supabase auth setup

export interface ServerSession {
  userId: string | null;
  role: string | null;
  orgId: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

/**
 * Get server-side session information
 * Adapt this to your current auth pattern
 */
export async function getServerSession(): Promise<ServerSession> {
  try {
    // Option 1: If using @supabase/auth-helpers-nextjs
    const supabase = createServerComponentClient({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return {
        userId: null,
        role: null,
        orgId: null,
        email: null,
        isAuthenticated: false
      };
    }

    // Get user profile with role and org
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id, full_name')
      .eq('id', session.user.id)
      .single();

    return {
      userId: session.user.id,
      role: profile?.role || null,
      orgId: profile?.org_id || null,
      email: session.user.email || null,
      isAuthenticated: true
    };
    
  } catch (error) {
    console.error('Server session error:', error);
    
    // Option 2: Fallback to cookies if auth-helpers not available
    const cookieStore = cookies();
    const userId = cookieStore.get('user-id')?.value || null;
    const role = cookieStore.get('user-role')?.value || null;
    const orgId = cookieStore.get('user-org')?.value || null;
    const email = cookieStore.get('user-email')?.value || null;
    
    return {
      userId,
      role,
      orgId,
      email,
      isAuthenticated: !!userId
    };
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(role: string | null): boolean {
  return role === 'school_admin' || role === 'district_admin';
}

/**
 * Check if user has teacher role
 */
export function isTeacher(role: string | null): boolean {
  return role === 'teacher';
}

/**
 * Check if user has parent role
 */
export function isParent(role: string | null): boolean {
  return role === 'parent';
}

/**
 * Get organization details for server components
 */
export async function getOrganizationInfo(orgId: string | null) {
  if (!orgId) return null;
  
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, type, subscription_tier')
      .eq('id', orgId)
      .single();
      
    return org;
  } catch (error) {
    console.error('Organization fetch error:', error);
    return null;
  }
}

/**
 * Require admin access or throw redirect
 */
export async function requireAdmin() {
  const session = await getServerSession();
  
  if (!session.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  if (!isAdmin(session.role)) {
    throw new Error('Admin access required');
  }
  
  return session;
}

/**
 * Get user permissions for server components
 */
export async function getUserPermissions(userId: string | null) {
  if (!userId) {
    return {
      canManageOrg: false,
      canViewAllStudents: false,
      canGenerateContent: false,
      canConfigureLMS: false
    };
  }
  
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    const role = profile?.role;
    
    return {
      canManageOrg: isAdmin(role),
      canViewAllStudents: isAdmin(role) || isTeacher(role),
      canGenerateContent: isAdmin(role) || isTeacher(role),
      canConfigureLMS: isAdmin(role)
    };
  } catch (error) {
    console.error('Permissions check error:', error);
    return {
      canManageOrg: false,
      canViewAllStudents: false,
      canGenerateContent: false,
      canConfigureLMS: false
    };
  }
}

export default {
  getServerSession,
  isAdmin,
  isTeacher,
  isParent,
  getOrganizationInfo,
  requireAdmin,
  getUserPermissions
};