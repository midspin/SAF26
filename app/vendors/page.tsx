'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Plus, Sparkles } from 'lucide-react';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vendors')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setVendors(data.vendors || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
          <Building2 className="w-7 h-7 text-sky-400" /> Vendor Directory
        </h1>
        <p className="text-xs text-slate-400 mt-1">Approved vendors providing purchase & rental services</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" /> Loading Vendors...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((v) => (
            <div key={v.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100">{v.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  {v.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">Company: {v.company} | Contact: {v.contactPerson}</p>
              <p className="text-xs text-slate-300">📧 {v.email} | 📞 {v.phone}</p>
              <p className="text-[11px] text-slate-500">📍 {v.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
