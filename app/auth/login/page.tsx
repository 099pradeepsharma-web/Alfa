'use client';

// Simple login page scaffold using Supabase client
// Supports: email+password and magic link

import React, { useState } from 'react';
import { getBrowserSupabase } from '../../../src/services/supabase';

export default function LoginPage() {
  const supabase = getBrowserSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Signing in...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setStatus(error ? `Error: ${error.message}` : 'Signed in! Redirecting...');
    if (!error) window.location.href = '/';
  };

  const sendMagicLink = async () => {
    setStatus('Sending magic link...');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/auth/callback' } });
    setStatus(error ? `Error: ${error.message}` : 'Magic link sent! Check your email.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-600 mb-6">Sign in to access your dashboard</p>

        <form onSubmit={signInWithPassword} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg p-2" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg p-2" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium">Sign in</button>
        </form>

        <div className="text-center text-sm text-gray-500 my-4">or</div>

        <button onClick={sendMagicLink} className="w-full bg-gray-100 text-gray-800 rounded-lg py-2 font-medium">Send Magic Link</button>

        {status && <div className="mt-4 text-sm text-gray-700">{status}</div>}
      </div>
    </div>
  );
}
