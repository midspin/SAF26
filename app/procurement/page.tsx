'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, ExternalLink, Filter, Search, CheckCircle2, Clock, DollarSign, X } from 'lucide-react';

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<'PURCHASE' | 'RENTAL'>('PURCHASE');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [reqType, setReqType] = useState<'PURCHASE' | 'RENTAL'>('PURCHASE');
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Equipment',
    quantity: 1,
    estimatedUnitCost: 500,
    rentalRate: 100,
    rentalStart: '',
    rentalEnd: '',
    vendorId: '',
    purchaseLink: '',
    rentalLink: '',
    notes: '',
  });

  useEffect(() => {
    fetchProcurementData();
    fetchVendors();
  }, []);

  const fetchProcurementData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/procurement');
      const data = await res.json();
      if (data.success) {
        setPurchases(data.purchases || []);
        setRentals(data.rentals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      if (data.success) setVendors(data.vendors || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRequest = async () => {
    try {
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      const activeEvent = eventsData.events?.find((e: any) => e.status === 'Active') || eventsData.events?.[0];
      const eventId = activeEvent?.id;

      const res = await fetch('/api/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reqType,
          eventId,
          department: 'TECHNICAL',
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchProcurementData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-sky-400" /> Procurement & Vendor Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Separate transaction workflows for Purchase Requests and Rental Records with clickable links
          </p>
        </div>
        <button
          onClick={() => {
            setReqType(activeTab);
            setModalOpen(true);
          }}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Raise {activeTab === 'PURCHASE' ? 'Purchase Request' : 'Rental Request'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('PURCHASE')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'PURCHASE' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Purchase Requests</span>
          <span className="bg-sky-950 text-sky-400 px-2 py-0.5 rounded text-[10px]">{purchases.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('RENTAL')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'RENTAL' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Rental Records</span>
          <span className="bg-amber-950 text-amber-400 px-2 py-0.5 rounded text-[10px]">{rentals.length}</span>
        </button>
      </div>

      {/* Content Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Item Name & Spec</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Direct Link</th>
                <th className="py-3.5 px-4 text-center">Qty</th>
                <th className="py-3.5 px-4 text-right">Cost</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {activeTab === 'PURCHASE' ? (
                purchases.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-500">No purchase requests.</td></tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-100">{p.itemName}</span>
                        <span className="text-[10px] block text-slate-500">{p.specification || p.category}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{p.department}</td>
                      <td className="py-3.5 px-4 text-slate-300">{p.vendor?.name || 'Unassigned'}</td>
                      <td className="py-3.5 px-4">
                        {p.purchaseLink ? (
                          <a href={p.purchaseLink} target="_blank" className="text-sky-400 hover:underline flex items-center gap-1">
                            Link <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200">{p.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">${p.finalCost || p.estimatedTotal || 0}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                rentals.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-500">No rental records.</td></tr>
                ) : (
                  rentals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-100">{r.itemName}</span>
                        <span className="text-[10px] block text-slate-500">Rental: {r.rentalStart} to {r.rentalEnd}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{r.department}</td>
                      <td className="py-3.5 px-4 text-slate-300">{r.vendor?.name || 'Unassigned'}</td>
                      <td className="py-3.5 px-4">
                        {r.rentalLink ? (
                          <a href={r.rentalLink} target="_blank" className="text-amber-400 hover:underline flex items-center gap-1">
                            Rental Link <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200">{r.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-400">${r.actualTotal || r.estimatedTotal || 0}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Raise {reqType} Request</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Item Name *</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="e.g. 20W RGB Laser System"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Preferred Vendor</label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="">-- Choose Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {reqType === 'PURCHASE' ? 'Purchase URL Link' : 'Rental URL Link'}
                </label>
                <input
                  type="url"
                  value={reqType === 'PURCHASE' ? formData.purchaseLink : formData.rentalLink}
                  onChange={(e) =>
                    reqType === 'PURCHASE'
                      ? setFormData({ ...formData, purchaseLink: e.target.value })
                      : setFormData({ ...formData, rentalLink: e.target.value })
                  }
                  placeholder="https://vendor.com/product-link"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
