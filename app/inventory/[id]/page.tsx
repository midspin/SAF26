'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Package,
  ArrowLeft,
  Clock,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  QrCode,
  Edit,
  Sparkles,
  Ban,
  Wrench,
  ShieldCheck,
} from 'lucide-react';

export default function Inventory360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unflagging, setUnflagging] = useState(false);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/${id}`);
      const data = await res.json();
      if (data.success) setItem(data.item);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnflagFaultyItem = async () => {
    if (!confirm('Are you sure you want to unflag this item as Faulty? It will be marked as OK and restored to live available inventory stock.')) return;
    setUnflagging(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNFLAG_FAULTY',
          condition: 'OK',
          performedBy: 'Admin User',
          notes: 'Unflagged via Inventory 360 - Restored to live available stock',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchItemDetails();
      }
    } catch (err) {
      console.error('Error unflagging faulty item:', err);
    } finally {
      setUnflagging(false);
    }
  };

  if (loading || !item) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Sparkles className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading Inventory 360° View...</p>
      </div>
    );
  }

  const isFaultyItem = item.isFaulty || /faulty|damaged|red/i.test(item.condition || '');

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link href="/inventory" className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Inventory Pool
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Asset ID: {item.assetId}</span>
        </div>
      </div>

      {/* FAULTY / RED FLAGGED UNFLAG ACTION BANNER */}
      {isFaultyItem && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900/90 to-slate-900 border-2 border-rose-600/80 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-rose-900/90 text-rose-200 border border-rose-500 shadow-inner shrink-0">
              <Ban className="w-6 h-6 text-rose-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-200 bg-rose-950 px-2.5 py-0.5 rounded border border-rose-700">
                  FAULTY (RED FLAGGED)
                </span>
                <span className="text-xs text-rose-300 font-semibold">Blocked from Spatial & Artist Allocation</span>
              </div>
              <p className="text-xs text-rose-200/90 mt-1 font-medium">
                This item is currently flagged as faulty in the database. Unflagging it will clear the faulty lock, set condition to OK, and restore available stock.
              </p>
            </div>
          </div>
          <button
            onClick={handleUnflagFaultyItem}
            disabled={unflagging}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2 whitespace-nowrap cursor-pointer hover:scale-105 shrink-0"
          >
            <Wrench className="w-4 h-4" />
            {unflagging ? 'Restoring Stock...' : 'Unflag & Make Live (Restore to Available Inventory)'}
          </button>
        </div>
      )}

      {/* Hero Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/60 border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm font-bold text-sky-400 bg-sky-950 px-3 py-1 rounded-lg border border-sky-800">
                {item.safCode}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-800 text-sky-300">
                {item.inventoryUsageType}
              </span>
              {isFaultyItem && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-700">
                  Faulty (Red)
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-50">{item.element}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {item.inventoryCategory} › {item.subCategory} | Location: <strong className="text-slate-200">{item.location}</strong>
            </p>
          </div>

          {/* Stock Metrics Box */}
          <div className="grid grid-cols-4 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
            <div className="px-2">
              <span className="text-[10px] text-slate-400 uppercase block">Total</span>
              <span className="text-lg font-bold text-slate-100">{item.totalQuantity}</span>
            </div>
            <div className="px-2 border-l border-slate-800">
              <span className="text-[10px] text-emerald-400 uppercase block">Available</span>
              <span className={`text-lg font-extrabold ${isFaultyItem ? 'text-rose-400 line-through' : 'text-emerald-400'}`}>
                {item.availableQuantity}
              </span>
            </div>
            <div className="px-2 border-l border-slate-800">
              <span className="text-[10px] text-sky-400 uppercase block">Allocated</span>
              <span className="text-lg font-bold text-sky-400">{item.allocatedQuantity}</span>
            </div>
            <div className="px-2 border-l border-slate-800">
              <span className="text-[10px] text-amber-400 uppercase block">Damaged</span>
              <span className="text-lg font-bold text-amber-400">{item.damagedQuantity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 15 LEGACY FIELDS & QR CODE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 15 Legacy Columns Grid */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            Exact 15 Legacy Field Specifications
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">1. SAF Code</span>
              <strong className="text-sky-400 font-mono text-xs">{item.safCode}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">2. Category</span>
              <strong className="text-slate-200">{item.inventoryCategory}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">3. Sub Category</span>
              <strong className="text-slate-200">{item.subCategory}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">4. Element</span>
              <strong className="text-slate-200">{item.element}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">5. Year of Purchase</span>
              <strong className="text-slate-200">{item.yearOfPurchase || 'Na'}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">6. Brand / Project</span>
              <strong className="text-slate-200">{item.brandProject || 'Na'}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">7. Model</span>
              <strong className="text-slate-200">{item.model || 'Na'}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">8. Size / LWH</span>
              <strong className="text-slate-200">{item.sizeLwh || 'Na'}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">9. UOM</span>
              <strong className="text-slate-200">{item.uom || 'Nos'}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">10. Serial No</span>
              <strong className="text-slate-200 font-mono">{item.serialNo || 'Na'}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">11. Quantity</span>
              <strong className="text-emerald-400 font-bold">{item.totalQuantity}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">12. Location</span>
              <strong className="text-slate-200">{item.location}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">13. Condition</span>
                <strong className={isFaultyItem ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {item.condition}
                </strong>
              </div>
              {isFaultyItem && (
                <button
                  onClick={handleUnflagFaultyItem}
                  disabled={unflagging}
                  className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Wrench className="w-3 h-3 text-emerald-400" /> Unflag
                </button>
              )}
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">14. Throw Ratio</span>
              <strong className="text-slate-200">{item.throwRatio || 'Na'}</strong>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[10px] uppercase">15. Remarks</span>
              <strong className="text-slate-200 text-[11px] truncate block">{item.remarks || 'None'}</strong>
            </div>
          </div>
        </div>

        {/* Right 1 Col: QR Code Widget */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <QrCode className="w-4 h-4" /> Operational QR Label
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-xl">
            <QRCodeSVG value={`SAF_INV:${item.safCode}:${item.assetId}`} size={140} />
          </div>
          <div className="text-xs text-slate-400 font-mono">
            <p className="font-bold text-slate-200">{item.safCode}</p>
            <p className="text-[10px] text-slate-500">{item.assetId}</p>
          </div>
        </div>
      </div>

      {/* ACTIVE ALLOCATIONS & MOVEMENT AUDIT TRAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocations */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Deployed Allocations ({item.allocations?.length || 0})
          </h3>
          {item.allocations?.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No active allocations recorded for this stock item.</p>
          ) : (
            <div className="space-y-2.5">
              {item.allocations.map((alloc: any) => (
                <div key={alloc.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{alloc.artist?.artistName || 'General Venue Deployment'}</span>
                    <span className="font-bold text-sky-400">{alloc.issuedQuantity} Units</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Venue: {alloc.venue?.venueName} | Room: {alloc.room?.roomNumber}
                  </p>
                  <p className="text-[10px] text-slate-500">Status: {alloc.status} | Notes: {alloc.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Movement History */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" /> Stock Movement Audit History ({item.movements?.length || 0})
          </h3>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {item.movements?.map((m: any) => (
              <div key={m.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200">{m.movementType}</span> ({m.quantity} units)
                  <p className="text-[10px] text-slate-400 mt-0.5">{m.reason || 'Routine movement'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-sky-400 block">{m.performedBy}</span>
                  <span className="text-[9px] text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
