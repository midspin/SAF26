'use client';

import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Sparkles, AlertTriangle } from 'lucide-react';

export default function RequirementsPage() {
  const [activeTab, setActiveTab] = useState<'TECHNICAL' | 'PRODUCTION'>('TECHNICAL');
  const [techReqs, setTechReqs] = useState<any[]>([]);
  const [prodReqs, setProdReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/requirements')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTechReqs(data.technical || []);
          setProdReqs(data.production || []);
        }
        setLoading(false);
      });
  }, []);

  const list = activeTab === 'TECHNICAL' ? techReqs : prodReqs;

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
          <Wrench className="w-7 h-7 text-sky-400" /> Technical & Production Requirements
        </h1>
        <p className="text-xs text-slate-400 mt-1">Specific equipment, rigging, fabrication, carpentry, transport & power specs</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('TECHNICAL')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'TECHNICAL' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          TECHNICAL REQUIREMENTS ({techReqs.length})
        </button>
        <button
          onClick={() => setActiveTab('PRODUCTION')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'PRODUCTION' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          PRODUCTION REQUIREMENTS ({prodReqs.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" /> Loading Requirements...
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">{r.description}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                    {r.requirementType}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Artist: <strong className="text-slate-200">{r.artist?.artistName}</strong> | Specification: {r.specification || 'Standard'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-200 block">{r.quantity} Units</span>
                <span className="text-[10px] text-amber-400 font-semibold">{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
