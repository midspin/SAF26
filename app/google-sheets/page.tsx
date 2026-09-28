'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Play, Database, FileSpreadsheet, Sparkles } from 'lucide-react';

export default function GoogleSheetsAdminPage() {
  const [config, setConfig] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchGoogleSheetsData();
  }, []);

  const fetchGoogleSheetsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/google-sheets');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setStats(data.stats);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async (action: string) => {
    setSyncing(true);
    setMessage('');
    try {
      const res = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
        fetchGoogleSheetsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-indigo-900/40 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-950 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Mandatory Rule Enforced
              </span>
              <span className="text-slate-400 text-xs font-mono">PostgreSQL → Google Sheets (1-Way Mirror)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-50">Google Sheets Integration & Admin Panel</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              PostgreSQL is the single source of truth. Google Sheets is an automatically synchronized reporting layer.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSyncNow('SYNC_NOW')}
              disabled={syncing}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              <span>Sync Now</span>
            </button>
          </div>
        </div>
      </div>

      {config && !config.configured && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Google Sheets API Setup Required in `.env`</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            To enable real-time streaming to Google Sheets, populate <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>, <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">GOOGLE_PRIVATE_KEY</code>, and Spreadsheet IDs in your local <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300">.env</code> file.
          </p>
        </div>
      )}

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Connected Google Account</span>
          <strong className="text-xs font-bold text-slate-100 block mt-1">{config?.connectedAccount || 'ops-sync@saf.org'}</strong>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-emerald-400 uppercase block">Synced Record Queue</span>
          <strong className="text-xl font-extrabold text-emerald-400 block mt-1">{stats?.syncedCount || 0}</strong>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-amber-400 uppercase block">Pending Sync Queue</span>
          <strong className="text-xl font-extrabold text-amber-400 block mt-1">{stats?.pendingCount || 0}</strong>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] text-rose-400 uppercase block">Failed Sync Retries</span>
          <strong className="text-xl font-extrabold text-rose-400 block mt-1">{stats?.failedCount || 0}</strong>
        </div>
      </div>

      {/* Google Workbooks Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Workbook 1: Technical */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-400" /> Google Workbook 1: TECHNICAL INVENTORY & ALLOCATION
            </h3>
            <span className="text-[10px] font-mono text-slate-400">ID: {config?.techWorkbookId}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
              <strong className="text-slate-200 block">Tab 1 — FULL INVENTORY</strong>
              <span className="text-[11px] text-slate-400">All 15 legacy fields + operational quantities</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
              <strong className="text-slate-200 block">Tab 2 — TECHNICAL ALLOCATION</strong>
              <span className="text-[11px] text-slate-400">Filtered for Usage Type = TECHNICAL</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
              <strong className="text-slate-200 block">Tab 3 — TECHNICAL PROCUREMENT</strong>
              <span className="text-[11px] text-slate-400">Purchases & Rentals for Technical Team</span>
            </div>
          </div>
        </div>

        {/* Workbook 2: Production */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" /> Google Workbook 2: PRODUCTION & OTHER INVENTORY
            </h3>
            <span className="text-[10px] font-mono text-slate-400">ID: {config?.prodWorkbookId}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
              <strong className="text-slate-200 block">Tab 1 — OTHER / PRODUCTION ALLOCATION</strong>
              <span className="text-[11px] text-slate-400">Filtered for Usage Type = PRODUCTION / OTHER</span>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
              <strong className="text-slate-200 block">Tab 2 — OTHER / PRODUCTION PROCUREMENT</strong>
              <span className="text-[11px] text-slate-400">Purchases & Rentals for Production Team</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Queue Logs */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Sync Log Audit Queue</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="font-mono text-sky-400 font-bold">{log.tabName}</span> | Operation: {log.operation}
                <p className="text-[10px] text-slate-500 mt-0.5">Entity ID: {log.entityId} ({log.entityType})</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {log.status}
                </span>
                <span className="text-[9px] text-slate-500 block mt-1">{new Date(log.lastAttempt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
