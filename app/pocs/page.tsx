'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function PocsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teams?tab=PROGRAMMING');
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-400 font-semibold space-y-4">
      <Sparkles className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
      <p>Redirecting to Teams & Staff (Programming Team / Artist POCs)...</p>
    </div>
  );
}
