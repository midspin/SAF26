'use client';

import React from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import PaginatedFetch from '@/components/PaginatedFetch';

interface AuditLogItem {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  newValueJson?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const fetchAuditLogs = async (page: number, pageSize: number) => {
    const res = await fetch(`/api/audit-logs?page=${page}&limit=${pageSize}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch audit logs');
    return {
      data: data.logs || [],
      hasMore: data.hasMore,
      totalCount: data.totalCount,
      nextPage: data.nextPage,
    };
  };

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 text-sky-400" /> Operational Audit Logs
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable audit trail of all artist edits, stock allocations, returns & imports
        </p>
      </div>

      <PaginatedFetch<AuditLogItem>
        queryKey={['audit-logs']}
        fetcher={fetchAuditLogs}
        pageSize={25}
        loadMoreText="Load More Audit Logs (+25)"
        renderItem={(log) => (
          <div
            key={log.id}
            className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-sky-400">{log.userName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                  {log.userRole}
                </span>
                <span className="text-slate-400">executed</span>
                <strong className="text-slate-100">{log.action}</strong>
                <span className="text-slate-400">on</span>
                <span className="font-mono text-amber-300 font-semibold bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 text-[11px]">
                  {log.entityType}
                </span>
              </div>
              {log.newValueJson && (
                <p className="text-[10px] text-slate-400 font-mono mt-1.5 truncate max-w-2xl bg-slate-950/60 px-2 py-1 rounded border border-slate-800/60">
                  Data: {log.newValueJson}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-500 flex items-center sm:justify-end gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" /> {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}

