'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Sparkles, Building2, DoorOpen } from 'lucide-react';

export default function InstallationsPage() {
  const [installations, setInstallations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/installations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInstallations(data.installations || []);
        setLoading(false);
      });
  }, []);

  const statuses = ['Planned', 'Ready', 'Installation Pending', 'Installation In Progress', 'Installed', 'Removed', 'Completed'];

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
          <MapPin className="w-7 h-7 text-sky-400" /> Artist Installation Progress Tracker
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Installation status lifecycle tracking across venues & rooms
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" /> Loading Installations...
        </div>
      ) : (
        <div className="space-y-3">
          {installations.map((inst) => (
            <div key={inst.id} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-100">{inst.artist?.artistName}</h3>
                  <span className="text-xs font-semibold text-sky-400">Artwork: {inst.artwork?.artworkName || 'Primary'}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> {inst.venue?.venueName} | <DoorOpen className="w-3.5 h-3.5" /> Room {inst.room?.roomNumber} ({inst.room?.roomName})
                </p>
                <p className="text-[11px] text-slate-500 italic mt-1">{inst.installationNotes}</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-950 text-sky-300 border border-sky-800 inline-block">
                  {inst.installationStatus}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Target: {inst.startDate} to {inst.endDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
