import React, { useEffect, useState } from 'react';
import { AuthService, ProfileService } from '../../services/supabase';

interface AuthCallbackProps {
  onAuthComplete: (success: boolean) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onAuthComplete }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get current session after magic link click
        const { session, user } = await AuthService.getSession();
        
        if (!session || !user) {
          setStatus('error');
          setMessage('Authentication failed. Please try signing in again.');
          onAuthComplete(false);
          return;
        }

        // Create or update user profile
        const profileData = {
          role: 'student' as const,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
          grade: user.user_metadata?.grade || 'Class 9',
          school_name: user.user_metadata?.school_name || null,
        };

        const profile = await ProfileService.upsertProfile(user.id, profileData);
        
        if (profile) {
          setStatus('success');
          setMessage('Authentication successful! Welcome to Alfanumrik.');
          
          // Redirect to main app after brief delay
          setTimeout(() => {
            onAuthComplete(true);
          }, 2000);
        } else {
          throw new Error('Failed to create profile');
        }

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('There was an error completing your authentication. Please try again.');
        onAuthComplete(false);
      }
    };

    handleAuthCallback();
  }, [onAuthComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Alfanumrik Logo */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Alfanumrik
          </h1>
        </div>

        {/* Status Indicator */}
        <div className="mb-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Status Message */}
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Action Buttons */}
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = 'mailto:099pradeepsharma@gmail.com'}
              className="w-full text-blue-600 hover:text-blue-700 font-medium"
            >
              Get Help
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;