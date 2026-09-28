'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileText, FileDown, Sparkles, Filter } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('INVENTORY');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${reportType}`);
      const data = await res.json();
      if (data.success) setReportData(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
    XLSX.writeFile(workbook, `SAF_Report_${reportType}_${Date.now()}.xlsx`);
  };

  const reportsList = [
    { id: 'ARTIST', name: 'Artist Report' },
    { id: 'VENUE', name: 'Venue Report' },
    { id: 'ROOM', name: 'Room Report' },
    { id: 'TECHNICAL_ALLOCATION', name: 'Technical Allocation Report' },
    { id: 'PRODUCTION_ALLOCATION', name: 'Production Allocation Report' },
    { id: 'INVENTORY', name: 'Master Inventory Report' },
    { id: 'PURCHASE', name: 'Purchase Request Report' },
    { id: 'RENTAL', name: 'Rental Record Report' },
    { id: 'PROCUREMENT', name: 'Procurement Summary Report' },
    { id: 'MOVEMENT', name: 'Inventory Movement Log Report' },
    { id: 'STAFF', name: 'Staff Assignment Report' },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-sky-400" /> Operational Reports & Exports
          </h1>
          <p className="text-xs text-slate-400 mt-1">Generate and export 11 operational reports into Excel / CSV</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={reportData.length === 0}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <FileDown className="w-4 h-4" /> Export Report to Excel (.xlsx)
        </button>
      </div>

      {/* Report Selector */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-sky-400" /> Select Report Type:
        </label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="bg-slate-900 text-xs font-bold text-slate-100 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
        >
          {reportsList.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" /> Generating Report Data...
            </div>
          ) : reportData.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No records found for this report.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                  {Object.keys(reportData[0] || {})
                    .filter((k) => typeof reportData[0][k] !== 'object')
                    .slice(0, 8)
                    .map((key) => (
                      <th key={key} className="py-3.5 px-4">
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {reportData.slice(0, 50).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    {Object.keys(row)
                      .filter((k) => typeof row[k] !== 'object')
                      .slice(0, 8)
                      .map((key) => (
                        <td key={key} className="py-3 px-4 text-slate-300">
                          {String(row[key])}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
