'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WeaveLogo from '@/components/WeaveLogo';
import {
  User,
  Sparkles,
  ArrowRight,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('saf_user_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.role) {
            router.push('/dashboard');
          }
        } catch (e) {
          // invalid session, clear
          localStorage.removeItem('saf_user_session');
        }
      }
    }
  }, [router]);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const u = customUser !== undefined ? customUser : username;
    const p = customPass !== undefined ? customPass : password;

    if (!u.trim() || !p) {
      setError('Please enter both Username and Password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.trim(), password: p }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        // Save session in local storage and cookies
        localStorage.setItem('saf_user_session', JSON.stringify(data.user));
        localStorage.setItem('saf_user_role', data.user.role);
        document.cookie = `saf_auth_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=86400;`;

        window.dispatchEvent(new Event('saf-role-changed'));
        window.dispatchEvent(new Event('saf-auth-changed'));

        // Redirect based on role permissions
        if (data.user.role === 'PROGRAMMING TEAM' || data.user.role === 'PROGRAMMING') {
          router.push('/artists');
        } else if (data.user.role === 'PRODUCTION TEAM' || data.user.role === 'PRODUCTION & LAYOUT' || data.user.role === 'VENUE MANAGER') {
          router.push('/venues');
        } else if (data.user.role === 'INVENTORY TEAM' || data.user.role === 'PROCUREMENT MANAGER') {
          router.push('/procurement');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#161622] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#8b5cf6] selection:text-white overflow-x-hidden">
      {/* Background Animated Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8b5cf6]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#38bdf8]/15 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 relative mb-2">
        {/* Centered Large Animated Logo with Tagline below (No ORBITA text or extra headers) */}
        <div className="flex justify-center">
          <WeaveLogo size="xl" layout="vertical" showTitle={true} showTagline={true} />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
        <div className="bg-[#1c1c2a]/90 backdrop-blur-xl py-8 px-6 shadow-2xl border border-white/10 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={(e) => handleLogin(e)}>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Username or Email</label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full bg-[#232334] text-white text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] placeholder:text-slate-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#232334] text-white text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] placeholder:text-slate-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:brightness-110 shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
