// Role Guard Utilities
// Centralized role checking and permission management

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  SCHOOL_ADMIN: 'school_admin',
  DISTRICT_ADMIN: 'district_admin'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ADMIN_ROLES = new Set([ROLES.SCHOOL_ADMIN, ROLES.DISTRICT_ADMIN]);
export const EDUCATOR_ROLES = new Set([ROLES.TEACHER, ROLES.SCHOOL_ADMIN, ROLES.DISTRICT_ADMIN]);
export const PARENT_ROLES = new Set([ROLES.PARENT]);
export const STUDENT_ROLES = new Set([ROLES.STUDENT]);

/**
 * Check if user has admin privileges
 */
export function ensureAdmin(role?: string | null): boolean {
  return role ? ADMIN_ROLES.has(role as UserRole) : false;
}

/**
 * Check if user has educator privileges (teacher or admin)
 */
export function ensureEducator(role?: string | null): boolean {
  return role ? EDUCATOR_ROLES.has(role as UserRole) : false;
}

/**
 * Check if user has parent privileges
 */
export function ensureParent(role?: string | null): boolean {
  return role ? PARENT_ROLES.has(role as UserRole) : false;
}

/**
 * Check if user has student privileges
 */
export function ensureStudent(role?: string | null): boolean {
  return role ? STUDENT_ROLES.has(role as UserRole) : false;
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role?: string | null) {
  const permissions = {
    // Admin permissions
    canManageOrganization: ensureAdmin(role),
    canConfigureLMS: ensureAdmin(role),
    canCustomizePortal: ensureAdmin(role),
    canViewAllUsers: ensureAdmin(role),
    canManageSubscription: ensureAdmin(role),
    canAccessAnalytics: ensureAdmin(role),
    
    // Educator permissions
    canViewStudentData: ensureEducator(role),
    canGenerateContent: ensureEducator(role),
    canAssignHomework: ensureEducator(role),
    canContactParents: ensureEducator(role),
    canViewClassAnalytics: ensureEducator(role),
    
    // Parent permissions
    canViewChildrenData: ensureParent(role),
    canContactTeachers: ensureParent(role),
    canViewProgress: ensureParent(role),
    
    // Student permissions
    canTakeQuizzes: ensureStudent(role),
    canViewOwnProgress: ensureStudent(role) || ensureParent(role),
    canSetGoals: ensureStudent(role),
    
    // Universal permissions
    canViewDashboard: Boolean(role),
    canUpdateProfile: Boolean(role)
  };
  
  return permissions;
}

/**
 * Get dashboard route based on user role
 */
export function getDashboardRoute(role?: string | null): string {
  switch (role) {
    case ROLES.SCHOOL_ADMIN:
    case ROLES.DISTRICT_ADMIN:
      return '/admin';
    case ROLES.TEACHER:
      return '/teacher';
    case ROLES.PARENT:
      return '/parent';
    case ROLES.STUDENT:
      return '/student';
    default:
      return '/';
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role?: string | null): string {
  switch (role) {
    case ROLES.STUDENT:
      return 'Student';
    case ROLES.TEACHER:
      return 'Teacher';
    case ROLES.PARENT:
      return 'Parent';
    case ROLES.SCHOOL_ADMIN:
      return 'School Admin';
    case ROLES.DISTRICT_ADMIN:
      return 'District Admin';
    default:
      return 'User';
  }
}

/**
 * Check if role can access specific resource
 */
export function canAccessResource(
  userRole: string | null, 
  resourceType: 'student_data' | 'teacher_tools' | 'admin_settings' | 'parent_dashboard',
  resourceOrgId?: string,
  userOrgId?: string
): boolean {
  // Check org isolation first (if both org IDs provided)
  if (resourceOrgId && userOrgId && resourceOrgId !== userOrgId) {
    return false;
  }
  
  switch (resourceType) {
    case 'student_data':
      return ensureEducator(userRole) || ensureParent(userRole);
    case 'teacher_tools':
      return ensureEducator(userRole);
    case 'admin_settings':
      return ensureAdmin(userRole);
    case 'parent_dashboard':
      return ensureParent(userRole);
    default:
      return false;
  }
}

/**
 * Throw error with appropriate message for unauthorized access
 */
export function throwUnauthorized(requiredRole?: string): never {
  if (requiredRole) {
    throw new Error(`Access denied. Required role: ${getRoleDisplayName(requiredRole)}`);
  }
  throw new Error('Access denied. Authentication required.');
}

export default {
  ROLES,
  ADMIN_ROLES,
  EDUCATOR_ROLES,
  PARENT_ROLES,
  STUDENT_ROLES,
  ensureAdmin,
  ensureEducator,
  ensureParent,
  ensureStudent,
  getUserPermissions,
  getDashboardRoute,
  getRoleDisplayName,
  canAccessResource,
  throwUnauthorized,
  getServerSession
};