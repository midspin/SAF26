'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Sparkles } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLogs(data.logs || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 text-sky-400" /> Operational Audit Logs
        </h1>
        <p className="text-xs text-slate-400 mt-1">Immutable audit trail of all artist edits, stock allocations, returns & imports</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" /> Loading Audit Trail...
        </div>
      ) : (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-sky-400">{log.userName}</span> ({log.userRole}) executed{' '}
                <strong className="text-slate-100">{log.action}</strong> on <span className="font-mono text-amber-300">{log.entityType}</span>
                {log.newValueJson && (
                  <p className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-xl">
                    Data: {log.newValueJson}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
