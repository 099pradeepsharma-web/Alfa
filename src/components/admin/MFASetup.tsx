import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/supabase';

interface MFASetupProps {
  user: any;
  onComplete: (success: boolean) => void;
  className?: string;
}

export const MFASetup: React.FC<MFASetupProps> = ({
  user,
  onComplete,
  className = ''
}) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    generateMFASecret();
  }, []);

  const generateMFASecret = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // In a real implementation, this would call Supabase Auth API
      // For now, we'll simulate MFA setup
      const mockSecret = generateRandomSecret();
      const appName = 'Alfanumrik';
      const userEmail = user.email;
      
      // Generate TOTP URL for QR code
      const totpUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userEmail)}?secret=${mockSecret}&issuer=${encodeURIComponent(appName)}`;
      
      setSecret(mockSecret);
      setQrCode(totpUrl);
      
      // Generate backup codes
      const codes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setBackupCodes(codes);
      
    } catch (error) {
      console.error('MFA setup error:', error);
      setError('Failed to generate MFA secret. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const verifyMFACode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code from your authenticator app.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // In a real implementation, this would verify the TOTP code
      // For demo purposes, we'll simulate verification
      if (verificationCode === '123456' || verificationCode.length === 6) {
        setStep('complete');
        
        // Store MFA enabled status (in real implementation, this would be in Supabase)
        localStorage.setItem(`mfa_enabled_${user.id}`, 'true');
        localStorage.setItem(`mfa_secret_${user.id}`, secret);
        localStorage.setItem(`mfa_backup_codes_${user.id}`, JSON.stringify(backupCodes));
        
        setTimeout(() => {
          onComplete(true);
        }, 3000);
      } else {
        setError('Invalid code. Please check your authenticator app and try again.');
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add toast notification here
    });
  };

  const downloadBackupCodes = () => {
    const content = `Alfanumrik Backup Codes\n\nUser: ${user.email}\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nStore these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alfanumrik-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && step === 'setup') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up multi-factor authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Multi-Factor Authentication</h3>
          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {step === 'setup' && 'Step 1 of 2'}
            {step === 'verify' && 'Step 2 of 2'}
            {step === 'complete' && 'Complete'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg className="w-4 h-4 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Setup */}
      {step === 'setup' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">1. Install an Authenticator App</h4>
            <p className="text-sm text-gray-600 mb-4">
              Download one of these apps to your mobile device:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 border border-gray-200 rounded-lg text-center">
                <div className="text-lg mb-1">📱</div>
                <p className="text-sm font-medium">Google Authenticator</p>
                <p className="text-xs text-gray-500">iOS & Android</p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg text-center">
                <div className="text-lg mb-1">🔐</div>
                <p className="text-sm font-medium">Authy</p>
                <p className="text-xs text-gray-500">iOS & Android</p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg text-center">
                <div className="text-lg mb-1">🔑</div>
                <p className="text-sm font-medium">Microsoft Authenticator</p>
                <p className="text-xs text-gray-500">iOS & Android</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">2. Scan QR Code or Enter Secret</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {/* QR Code placeholder */}
              <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="text-center text-gray-500">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m0 0V4m0 0h2m13 16h-2M4 20h2m0 0v-4m0 0h2" />
                  </svg>
                  <p className="text-sm">QR Code</p>
                  <p className="text-xs">Scan with your authenticator app</p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Or enter this code manually:</p>
                <div className="flex items-center justify-center space-x-2">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                    {secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(secret)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue to Verification
          </button>
        </div>
      )}

      {/* Step 2: Verify */}
      {step === 'verify' && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Verify Your Setup</h4>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app to complete the setup.
            </p>
            
            <div className="max-w-xs mx-auto">
              <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="verification-code"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                  setVerificationCode(value);
                  setError('');
                }}
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('setup')}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={verifyMFACode}
              disabled={verificationCode.length !== 6 || isLoading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Complete Setup'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && (
        <div className="text-center space-y-6">
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">MFA Setup Complete!</h4>
            <p className="text-gray-600 mb-6">
              Your account is now protected with multi-factor authentication.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-yellow-800 mb-1">Save Your Backup Codes</h5>
                <p className="text-sm text-yellow-700 mb-3">
                  Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="block bg-white px-2 py-1 rounded text-xs font-mono text-center">
                      {code}
                    </code>
                  ))}
                </div>
                <button
                  onClick={downloadBackupCodes}
                  className="text-sm text-yellow-800 hover:text-yellow-900 font-medium underline"
                >
                  Download Backup Codes
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </p>
        </div>
      )}
    </div>
  );
};

export default MFASetup;