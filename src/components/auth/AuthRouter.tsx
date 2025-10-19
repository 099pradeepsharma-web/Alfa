import React, { useEffect, useState } from 'react';
import { EnhancedAuthService, PermissionService } from '../../services/enhanced-supabase';
import { AuthService } from '../../services/supabase';
import AuthCallback from './AuthCallback';

interface AuthRouterProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallbackComponent?: React.ComponentType;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any | null;
  profile: any | null;
  hasRequiredRole: boolean;
  error?: string;
}

export const AuthRouter: React.FC<AuthRouterProps> = ({
  children,
  requiredRole,
  fallbackComponent: FallbackComponent
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    profile: null,
    hasRequiredRole: false
  });

  const [showCallback, setShowCallback] = useState(false);

  useEffect(() => {
    // Check for auth callback in URL
    const urlParams = new URLSearchParams(window.location.search);
    const isCallback = window.location.pathname === '/auth/callback' || 
                      urlParams.has('access_token') || 
                      urlParams.has('code');
    
    if (isCallback) {
      setShowCallback(true);
      return;
    }

    checkAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleAuthChange(session.user);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          profile: null,
          hasRequiredRole: false
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requiredRole]);

  const checkAuthStatus = async () => {
    try {
      const { session, user } = await AuthService.getSession();
      
      if (!session || !user) {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          profile: null,
          hasRequiredRole: false
        });
        return;
      }

      await handleAuthChange(user);
    } catch (error) {
      console.error('Auth status check error:', error);
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        profile: null,
        hasRequiredRole: false,
        error: 'Authentication check failed'
      });
    }
  };

  const handleAuthChange = async (user: any) => {
    try {
      // Get user profile with org info
      const { profile, organization, error } = await EnhancedAuthService.getUserWithOrg(user.id);
      
      if (error || !profile) {
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: user,
          profile: null,
          hasRequiredRole: false,
          error: 'Profile not found or incomplete'
        });
        return;
      }

      // Check role requirements
      let hasRequiredRole = true;
      if (requiredRole) {
        const roleVerification = await EnhancedAuthService.verifyUserRole(
          user.id,
          requiredRole
        );
        hasRequiredRole = roleVerification.hasRole;
      }

      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        user: user,
        profile: { ...profile, organization },
        hasRequiredRole
      });
      
    } catch (error) {
      console.error('Auth change handling error:', error);
      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        user: user,
        profile: null,
        hasRequiredRole: false,
        error: 'Profile loading failed'
      });
    }
  };

  const handleCallbackComplete = (success: boolean) => {
    if (success) {
      setShowCallback(false);
      // Force re-check auth status
      checkAuthStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Redirect to login on failure
      window.location.href = '/';
    }
  };

  // Show callback handler
  if (showCallback) {
    return <AuthCallback onAuthComplete={handleCallbackComplete} />;
  }

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authState.isAuthenticated) {
    return FallbackComponent ? <FallbackComponent /> : (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to access your learning dashboard.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Missing or incomplete profile
  if (!authState.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Setup Required</h1>
          <p className="text-gray-600 mb-6">
            {authState.error || 'Your profile needs to be completed before you can access the platform.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Retry Profile Setup
            </button>
            <button
              onClick={async () => {
                await AuthService.signOut();
                window.location.href = '/';
              }}
              className="w-full text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign Out & Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Role verification failed
  if (requiredRole && !authState.hasRequiredRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-2">
            This area requires <span className="font-semibold">{requiredRole}</span> access.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your current role: <span className="font-semibold">{authState.profile.role}</span>
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={async () => {
                await AuthService.signOut();
                window.location.href = '/';
              }}
              className="w-full text-gray-600 hover:text-gray-700 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success: render protected content
  return (
    <div className="auth-context">
      {React.cloneElement(children as React.ReactElement, {
        user: authState.user,
        profile: authState.profile,
        organization: authState.profile.organization
      })}
    </div>
  );
};

export default AuthRouter;