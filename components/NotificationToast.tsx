'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, X, Sparkles, ArrowUpRight, ShieldAlert } from 'lucide-react';

export default function NotificationToast() {
  const [activeToast, setActiveToast] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('SUPER ADMIN');
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Initialize role and seen IDs from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('saf_user_role') || 'SUPER ADMIN';
      setUserRole(storedRole);

      try {
        const storedSeen = sessionStorage.getItem('saf_seen_notif_ids');
        if (storedSeen) {
          const arr = JSON.parse(storedSeen);
          if (Array.isArray(arr)) {
            seenIdsRef.current = new Set(arr);
          }
        }
      } catch (e) {}
    }

    const handleRoleChange = () => {
      if (typeof window !== 'undefined') {
        const role = localStorage.getItem('saf_user_role') || 'SUPER ADMIN';
        setUserRole(role);
      }
    };

    window.addEventListener('saf-role-changed', handleRoleChange);
    window.addEventListener('storage', handleRoleChange);
    return () => {
      window.removeEventListener('saf-role-changed', handleRoleChange);
      window.removeEventListener('storage', handleRoleChange);
    };
  }, []);

  // Web Audio API Audio Synthesis Chime Generator
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Tone 1: High C (523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.18, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      // Tone 2: Harmonious E (659.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  };

  // Poll for new notifications targeting the current role
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const normRole = (userRole || '').trim().toUpperCase();

        const recipientRoles = [
          'SUPER ADMIN',
          'SUPERADMIN',
          'TECHNICAL TEAM',
          'TECHNICAL HEAD',
          'TECH HEAD',
          'PRODUCTION TEAM',
          'PRODUCTION & LAYOUT',
          'PRODUCTION AND LAYOUT',
          'INVENTORY TEAM',
          'INVENTORY MANAGER',
          'INVENTORY HEAD',
          'PROCUREMENT MANAGER',
          'PROCUREMENT HEAD',
        ];

        const isRecipient = recipientRoles.includes(normRole);
        if (!isRecipient) return;

        const res = await fetch(`/api/notifications?role=${encodeURIComponent(userRole)}&limit=10`);
        const data = await res.json();

        if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
          // Find the newest unseen notification
          const newest = data.notifications[0];

          if (newest && !seenIdsRef.current.has(newest.id)) {
            // Mark as seen
            seenIdsRef.current.add(newest.id);
            try {
              sessionStorage.setItem(
                'saf_seen_notif_ids',
                JSON.stringify(Array.from(seenIdsRef.current))
              );
            } catch (e) {}

            // Trigger Pop-up Toast and Sound
            setActiveToast(newest);
            playNotificationSound();

            // Auto-hide toast after 7 seconds
            setTimeout(() => {
              setActiveToast((prev: any) => (prev?.id === newest.id ? null : prev));
            }, 7000);
          }
        }
      } catch (err) {
        console.error('Notification check error:', err);
      }
    };

    // Initial check and interval polling
    checkNotifications();
    const interval = setInterval(checkNotifications, 3000);
    return () => clearInterval(interval);
  }, [userRole]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full animate-in slide-in-from-top-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-sky-500 p-4 rounded-2xl shadow-[0_0_40px_rgba(56,189,248,0.4)] flex items-start gap-3 relative overflow-hidden">
        {/* Glow accent bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 to-indigo-500 animate-pulse" />

        <div className="w-10 h-10 rounded-xl bg-sky-950/80 border border-sky-500/50 flex items-center justify-center text-sky-400 shrink-0 mt-0.5 shadow-inner">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 pr-6 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800">
              Role Notification
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Just now</span>
          </div>

          <h4 className="text-xs font-black text-white flex items-center gap-1">
            {activeToast.title}
          </h4>

          <p className="text-[11px] text-slate-300 leading-snug">
            {activeToast.message}
          </p>

          {activeToast.link && (
            <Link
              href={activeToast.link}
              onClick={() => setActiveToast(null)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 mt-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-sky-500 transition-all"
            >
              Open Resource <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
