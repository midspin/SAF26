'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { parseSmartInventoryExcel } from '@/lib/excel-parser';
import {
  Package,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Trash2,
  Upload,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
  X,
  CheckCircle2,
  FileDown,
  Ban,
  ShieldAlert,
  Wrench,
  Layers,
  UserCheck,
} from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [usageFilter, setUsageFilter] = useState('ALL');
  const [faultyOnlyFilter, setFaultyOnlyFilter] = useState(false);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [retireModalOpen, setRetireModalOpen] = useState(false);
  const [selectedItemForRetire, setSelectedItemForRetire] = useState<any>(null);
  const [retireQty, setRetireQty] = useState(1);
  const [retireReason, setRetireReason] = useState('Damaged');

  // Allocation modal state (Production / Technical Team)
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [selectedItemForAlloc, setSelectedItemForAlloc] = useState<any>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [allocForm, setAllocForm] = useState({
    artistId: '',
    artworkId: '',
    venueId: '',
    roomId: '',
    department: 'PRODUCTION',
    quantity: 1,
    requiredDate: '',
    returnDueDate: '',
    notes: '',
  });
  const [allocating, setAllocating] = useState(false);

  // Excel direct upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedExcelRows, setParsedExcelRows] = useState<any[]>([]);
  const [faultyDetectedCount, setFaultyDetectedCount] = useState(0);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Form State for manual add
  const [formData, setFormData] = useState({
    safCode: '',
    inventoryCategory: 'Production',
    subCategory: 'General',
    element: '',
    yearOfPurchase: '2026',
    brandProject: '',
    model: '',
    sizeLwh: '',
    uom: 'Nos',
    serialNo: '',
    totalQuantity: 1,
    location: 'Central Warehouse',
    condition: 'OK',
    throwRatio: 'Na',
    remarks: '',
    inventoryUsageType: 'PRODUCTION',
    isFaulty: false,
  });

  // Read URL query tab parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        const u = tabParam.toUpperCase();
        if (u === 'PRODUCTION') {
          setUsageFilter('PRODUCTION');
          setFormData((prev) => ({ ...prev, inventoryUsageType: 'PRODUCTION', inventoryCategory: 'Production' }));
        } else if (u === 'TECHNICAL') {
          setUsageFilter('TECHNICAL');
          setFormData((prev) => ({ ...prev, inventoryUsageType: 'TECHNICAL', inventoryCategory: 'Technical' }));
        } else if (u === 'FAULTY') {
          setFaultyOnlyFilter(true);
        } else if (u === 'ALL') {
          setUsageFilter('ALL');
          setFaultyOnlyFilter(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const url = selectedEventId && selectedEventId !== 'ALL' ? `/api/inventory?eventId=${selectedEventId}` : '/api/inventory';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocationDropdowns = async () => {
    try {
      const [artRes, venRes] = await Promise.all([
        fetch('/api/artists'),
        fetch('/api/venues'),
      ]);
      const artData = await artRes.json();
      const venData = await venRes.json();
      if (artData.success) setArtists(artData.artists || []);
      if (venData.success) setVenues(venData.venues || []);
    } catch (err) {
      console.error('Error fetching allocation dropdowns:', err);
    }
  };

  const handleOpenAllocateModal = (item: any) => {
    setSelectedItemForAlloc(item);
    setAllocForm({
      artistId: '',
      artworkId: '',
      venueId: '',
      roomId: '',
      department: item.inventoryUsageType || 'PRODUCTION',
      quantity: 1,
      requiredDate: '',
      returnDueDate: '',
      notes: '',
    });
    fetchAllocationDropdowns();
    setAllocateModalOpen(true);
  };

  const handleConfirmAllocate = async () => {
    if (!selectedItemForAlloc) return;
    setAllocating(true);
    try {
      const activeEvtId = selectedItemForAlloc.eventId || await getActiveEventId();
      const res = await fetch('/api/inventory/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeEvtId,
          inventoryItemId: selectedItemForAlloc.id,
          artistId: allocForm.artistId || null,
          artworkId: allocForm.artworkId || null,
          venueId: allocForm.venueId || null,
          roomId: allocForm.roomId || null,
          department: allocForm.department || selectedItemForAlloc.inventoryUsageType || 'PRODUCTION',
          requestedQuantity: allocForm.quantity,
          approvedBy: 'Production Team',
          requiredDate: allocForm.requiredDate || null,
          returnDueDate: allocForm.returnDueDate || null,
          notes: allocForm.notes || 'Allocated by Production Team',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAllocateModalOpen(false);
        fetchInventory();
      } else {
        alert(data.message || data.error || 'Failed to allocate item');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error executing allocation');
    } finally {
      setAllocating(false);
    }
  };

  const getActiveEventId = async (): Promise<string> => {
    if (events.length > 0) {
      const active = events.find((e) => e.status === 'Active') || events[0];
      return active?.id;
    }
    const eventsRes = await fetch('/api/events');
    const eventsData = await eventsRes.json();
    const active = eventsData.events?.find((e: any) => e.status === 'Active') || eventsData.events?.[0];
    return active?.id;
  };

  const handleUnflagItem = async (itemId: string) => {
    if (!confirm('Unflag this item as Faulty and restore it to live available inventory?')) return;
    try {
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNFLAG_FAULTY',
          condition: 'OK',
          performedBy: 'Admin User',
          notes: 'Unflagged via Inventory Pool table',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchInventory();
      }
    } catch (err) {
      console.error('Error unflagging inventory item:', err);
    }
  };

  const handleDirectExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array', cellStyles: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const { rows, faultyCount } = parseSmartInventoryExcel(worksheet);

      setParsedExcelRows(rows);
      setFaultyDetectedCount(faultyCount);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmDirectUpload = async () => {
    if (parsedExcelRows.length === 0) return;
    setIsProcessingUpload(true);
    try {
      const eventId = await getActiveEventId();

      const res = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMMIT',
          eventId,
          fileName: uploadedFile?.name || 'Uploaded Inventory.xlsx',
          rows: parsedExcelRows,
          resolutions: {},
          defaultUsageType: usageFilter === 'PRODUCTION' ? 'PRODUCTION' : 'TECHNICAL',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUploadModalOpen(false);
        setUploadedFile(null);
        setParsedExcelRows([]);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const eventId = await getActiveEventId();

      const payload = {
        eventId,
        ...formData,
        condition: formData.isFaulty ? 'Faulty (Red Flagged)' : formData.condition,
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Error creating inventory item');
      } else {
        setAddModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetireItem = async () => {
    if (!selectedItemForRetire) return;
    try {
      const url = `/api/inventory?id=${selectedItemForRetire.id}&quantity=${retireQty}&reason=${encodeURIComponent(retireReason)}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRetireModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter((item) => {
    const isFaultyItem = item.isFaulty || /faulty|damaged|red/i.test(item.condition || '');
    if (faultyOnlyFilter && !isFaultyItem) return false;
    if (usageFilter !== 'ALL' && item.inventoryUsageType !== usageFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSaf = item.safCode?.toLowerCase().includes(q);
      const matchElem = item.element?.toLowerCase().includes(q);
      const matchCat = item.inventoryCategory?.toLowerCase().includes(q);
      const matchSub = item.subCategory?.toLowerCase().includes(q);
      const matchBrand = item.brandProject?.toLowerCase().includes(q);
      const matchModel = item.model?.toLowerCase().includes(q);
      const matchSerial = item.serialNo?.toLowerCase().includes(q);
      const matchLoc = item.location?.toLowerCase().includes(q);
      return matchSaf || matchElem || matchCat || matchSub || matchBrand || matchModel || matchSerial || matchLoc;
    }
    return true;
  });

  const productionItemsCount = items.filter((i) => i.inventoryUsageType === 'PRODUCTION').length;
  const technicalItemsCount = items.filter((i) => i.inventoryUsageType === 'TECHNICAL').length;
  const faultyItemsCount = items.filter((i) => i.isFaulty || /faulty|damaged|red/i.test(i.condition || '')).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
              {usageFilter === 'PRODUCTION' ? (
                <>
                  <Layers className="w-7 h-7 text-amber-400" /> Production Team Inventory & Allocations
                </>
              ) : usageFilter === 'TECHNICAL' ? (
                <>
                  <Wrench className="w-7 h-7 text-sky-400" /> Technical Team Inventory
                </>
              ) : (
                <>
                  <Package className="w-7 h-7 text-sky-400" /> Master Inventory Pool
                </>
              )}
            </h1>
            <span
              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                usageFilter === 'PRODUCTION'
                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                  : 'bg-sky-950 text-sky-400 border-sky-800'
              }`}
            >
              {filteredItems.length} Items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {usageFilter === 'PRODUCTION'
              ? 'Complete Production Team inventory table (Easel, Furniture, Pedestals, Light Boxes, Screens, AC units, etc.) with allocation controls'
              : 'Preserving exact legacy fields from Inventory sheets + Red Flagged Faulty item allocation protection'}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload .xlsx File
          </button>
          <Link
            href="/inventory/import"
            className="bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/80 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Migration Wizard
          </Link>
          <button
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                inventoryUsageType: usageFilter === 'PRODUCTION' ? 'PRODUCTION' : 'TECHNICAL',
                inventoryCategory: usageFilter === 'PRODUCTION' ? 'Production' : 'Technical',
              }));
              setAddModalOpen(true);
            }}
            className={`font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 ${
              usageFilter === 'PRODUCTION'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
            }`}
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS FOR MASTER / TECHNICAL / PRODUCTION / FAULTY */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => {
            setUsageFilter('ALL');
            setFaultyOnlyFilter(false);
          }}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            usageFilter === 'ALL' && !faultyOnlyFilter
              ? 'border-sky-500 text-sky-400 bg-sky-950/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Package className="w-4 h-4" /> Master Inventory ({items.length})
        </button>

        <button
          onClick={() => {
            setUsageFilter('PRODUCTION');
            setFaultyOnlyFilter(false);
          }}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            usageFilter === 'PRODUCTION' && !faultyOnlyFilter
              ? 'border-amber-500 text-amber-400 bg-amber-950/40'
              : 'border-transparent text-slate-400 hover:text-amber-300 hover:bg-slate-900/50'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" /> Production Team Table ({productionItemsCount})
        </button>

        <button
          onClick={() => {
            setUsageFilter('TECHNICAL');
            setFaultyOnlyFilter(false);
          }}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            usageFilter === 'TECHNICAL' && !faultyOnlyFilter
              ? 'border-sky-400 text-sky-300 bg-sky-950/40'
              : 'border-transparent text-slate-400 hover:text-sky-200 hover:bg-slate-900/50'
          }`}
        >
          <Wrench className="w-4 h-4 text-sky-400" /> Technical Team Table ({technicalItemsCount})
        </button>

        <button
          onClick={() => {
            setFaultyOnlyFilter(true);
          }}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            faultyOnlyFilter
              ? 'border-rose-500 text-rose-300 bg-rose-950/40'
              : 'border-transparent text-slate-400 hover:text-rose-300 hover:bg-slate-900/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" /> Faulty (Red) ({faultyItemsCount})
        </button>
      </div>

      {/* SPECIAL BANNER FOR PRODUCTION TEAM TABLE */}
      {usageFilter === 'PRODUCTION' && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border border-amber-500/40 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                Production Team Table
              </h2>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Items in this table can be allocated directly by the Production Team to Artists, Artworks, Venues & Rooms.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-300 bg-amber-950 px-3 py-1 rounded-lg border border-amber-800">
              {filteredItems.length} Production Items Listed
            </span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 flex-1 focus-within:border-sky-500">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SAF Code (Ac-15, PRD-0001), Element, Serial #, Model, Location..."
            className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFaultyOnlyFilter(!faultyOnlyFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              faultyOnlyFilter
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Show Faulty (Red) Only</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent text-xs font-bold text-sky-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-100">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-slate-900 text-slate-100">
                  {ev.name} ({ev.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={usageFilter}
              onChange={(e) => {
                setUsageFilter(e.target.value);
                setFaultyOnlyFilter(false);
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Usage Types</option>
              <option value="PRODUCTION" className="bg-slate-900">PRODUCTION</option>
              <option value="TECHNICAL" className="bg-slate-900">TECHNICAL</option>
              <option value="OTHER" className="bg-slate-900">OTHER</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Data Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-3">SAF Code</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Sub Category</th>
                <th className="py-3.5 px-3">Element</th>
                <th className="py-3.5 px-3">Year</th>
                <th className="py-3.5 px-3">Brand | Project</th>
                <th className="py-3.5 px-3">Model</th>
                <th className="py-3.5 px-3">Size/LWH</th>
                <th className="py-3.5 px-3">Serial No</th>
                <th className="py-3.5 px-3 text-center">Qty (Tot/Avail/Alloc)</th>
                <th className="py-3.5 px-3">Location & Zone</th>
                <th className="py-3.5 px-3">Condition</th>
                <th className="py-3.5 px-3">Remarks</th>
                <th className="py-3.5 px-3">Allocated Artist</th>
                <th className="py-3.5 px-3">Allocated Venue & Room</th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-500">
                    <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
                    Loading Production & Inventory Data Table...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-bold text-slate-300 mb-1">No inventory items found</p>
                    <p className="text-xs text-slate-500">Try adjusting search query or uploading an inventory excel sheet.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isFaultyItem = item.isFaulty || /faulty|damaged|red/i.test(item.condition || '');

                  // Calculate active allocated artist and venue/room
                  const activeAllocations = item.allocations || [];
                  const allocatedArtistNames: string[] = Array.from(
                    new Set(activeAllocations.map((a: any) => a.artist?.artistName).filter(Boolean))
                  ) as string[];
                  const allocatedVenueNames: string[] = Array.from(
                    new Set(activeAllocations.map((a: any) => a.venue?.venueName).filter(Boolean))
                  ) as string[];
                  const allocatedRoomNumbers: string[] = Array.from(
                    new Set(
                      activeAllocations
                        .map((a: any) => (a.room?.roomNumber ? `${a.room.roomNumber} (${a.room.roomName || ''})` : null))
                        .filter(Boolean)
                    )
                  ) as string[];

                  const isProduction = item.inventoryUsageType === 'PRODUCTION';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isFaultyItem
                          ? 'bg-rose-950/40 hover:bg-rose-900/50 border-l-4 border-l-rose-500'
                          : isProduction
                          ? 'hover:bg-amber-950/20 border-l-2 border-l-amber-500/40'
                          : 'hover:bg-slate-900/40'
                      }`}
                    >
                      {/* 1. SAF Code */}
                      <td className="py-3 px-3">
                        <Link
                          href={`/inventory/${item.id}`}
                          className={`font-mono text-xs font-bold px-2 py-1 rounded border inline-block whitespace-nowrap ${
                            isFaultyItem
                              ? 'bg-rose-900/80 text-rose-200 border-rose-700'
                              : isProduction
                              ? 'bg-amber-950/80 text-amber-400 border-amber-800/80'
                              : 'bg-sky-950/80 text-sky-400 border-sky-800'
                          }`}
                        >
                          {item.safCode}
                        </Link>
                      </td>

                      {/* 2. Inventory Category */}
                      <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                        {item.inventoryCategory || 'Na'}
                      </td>

                      {/* 3. Sub Category */}
                      <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                        {item.subCategory || 'Na'}
                      </td>

                      {/* 4. Element */}
                      <td className="py-3 px-3">
                        <span className={`font-bold ${isFaultyItem ? 'text-rose-200' : 'text-slate-100'}`}>
                          {item.element}
                        </span>
                        {isFaultyItem && (
                          <span className="text-[10px] font-extrabold text-rose-400 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                            <Ban className="w-3 h-3 text-rose-500" /> RED FLAGGED - CANNOT ALLOCATE
                          </span>
                        )}
                      </td>

                      {/* 5. Year of Purchase */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {item.yearOfPurchase || 'Na'}
                      </td>

                      {/* 6. Brand | Project */}
                      <td className="py-3 px-3 text-slate-200 font-medium whitespace-nowrap">
                        {item.brandProject || 'Na'}
                      </td>

                      {/* 7. Model */}
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {item.model || 'Na'}
                      </td>

                      {/* 8. Size/LWH */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {item.sizeLwh || 'Na'}
                      </td>

                      {/* 9. Serial No */}
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {item.serialNo || 'Na'}
                      </td>

                      {/* 10. Qty */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
                          <span className="text-slate-200 font-bold" title="Total Quantity">
                            {item.totalQuantity}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span
                            className={
                              isFaultyItem
                                ? 'text-rose-400 font-bold line-through'
                                : 'text-emerald-400 font-extrabold'
                            }
                            title="Available Quantity"
                          >
                            {item.availableQuantity}
                          </span>
                          <span className="text-slate-600">/</span>
                          <span className="text-amber-400 font-bold" title="Allocated Quantity">
                            {item.allocatedQuantity}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 block text-center uppercase tracking-tighter">
                          Tot / Avail / Alloc
                        </span>
                      </td>

                      {/* 11. Location */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {item.location || 'Warehouse Storage'}
                      </td>

                      {/* 12. Condition */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isFaultyItem ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-900/90 text-rose-200 border border-rose-600 flex items-center gap-1 shadow-lg">
                              <Ban className="w-3 h-3 text-rose-400" /> FAULTY (RED)
                            </span>
                            <button
                              onClick={() => handleUnflagItem(item.id)}
                              className="bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                              title="Unflag Faulty item - restore to live available inventory stock"
                            >
                              <Wrench className="w-3 h-3 text-emerald-400" /> Unflag
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.condition === 'OK' || item.condition === 'Ok'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {item.condition || 'Ok'}
                          </span>
                        )}
                      </td>

                      {/* 13. Remarks */}
                      <td className="py-3 px-3 text-slate-400 max-w-[140px] truncate" title={item.remarks || ''}>
                        {item.remarks || '—'}
                      </td>

                      {/* 14. ALLOCATED ARTIST */}
                      <td className="py-3 px-3 text-slate-200 whitespace-nowrap">
                        {allocatedArtistNames.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {allocatedArtistNames.map((name, idx) => (
                              <span key={idx} className="font-bold text-amber-300 flex items-center gap-1 text-xs">
                                🎨 {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Unallocated</span>
                        )}
                      </td>

                      {/* 15. ALLOCATED VENUE & ROOM NO */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {allocatedVenueNames.length > 0 || allocatedRoomNumbers.length > 0 ? (
                          <div>
                            <span className="font-bold text-slate-200 block text-xs">
                              📍 {allocatedVenueNames.join(', ') || 'Venue Assigned'}
                            </span>
                            {allocatedRoomNumbers.length > 0 && (
                              <span className="text-[11px] font-mono text-indigo-300 block">
                                🚪 Room: {allocatedRoomNumbers.join(', ')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Warehouse Storage</span>
                        )}
                      </td>

                      {/* 16. Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isFaultyItem && item.availableQuantity > 0 && (
                            <button
                              onClick={() => handleOpenAllocateModal(item)}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                              title="Allocate item to Artist, Venue, or Room"
                            >
                              <Plus className="w-3.5 h-3.5" /> Allocate
                            </button>
                          )}
                          {isFaultyItem && (
                            <button
                              onClick={() => handleUnflagItem(item.id)}
                              className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow"
                              title="Unflag & Make Live"
                            >
                              <Wrench className="w-3.5 h-3.5 text-emerald-400" /> Unflag
                            </button>
                          )}
                          <Link
                            href={`/inventory/${item.id}`}
                            className="p-1.5 rounded bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-400 transition-colors"
                            title="Open Inventory 360°"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedItemForRetire(item);
                              setRetireQty(1);
                              setRetireModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Remove / Retire Stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ALLOCATE ITEM (PRODUCTION TEAM / TECHNICAL TEAM) */}
      {allocateModalOpen && selectedItemForAlloc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold text-slate-100">
                  Allocate Production Inventory Item
                </h3>
              </div>
              <button onClick={() => setAllocateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-slate-100 text-sm">{selectedItemForAlloc.element}</p>
              <p className="text-slate-400 font-mono">
                SAF Code: <span className="text-amber-400 font-bold">{selectedItemForAlloc.safCode}</span> | Category: {selectedItemForAlloc.inventoryCategory} ({selectedItemForAlloc.subCategory})
              </p>
              <div className="flex items-center gap-3 mt-2 font-mono text-[11px] pt-1 border-t border-slate-900">
                <span className="text-slate-300">Total Stock: <strong>{selectedItemForAlloc.totalQuantity}</strong></span>
                <span className="text-emerald-400 font-bold">Available: {selectedItemForAlloc.availableQuantity}</span>
                <span className="text-amber-400 font-bold">Allocated: {selectedItemForAlloc.allocatedQuantity}</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block font-bold mb-1">Target Artist / Installation</label>
                <select
                  value={allocForm.artistId}
                  onChange={(e) => setAllocForm({ ...allocForm, artistId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium"
                >
                  <option value="">-- Select Artist (Optional if Venue Only) --</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      🎨 {a.artistName} {a.city ? `(${a.city}, ${a.country})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block font-bold mb-1">Target Venue</label>
                  <select
                    value={allocForm.venueId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      setAllocForm({ ...allocForm, venueId: vId, roomId: '' });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium"
                  >
                    <option value="">-- Select Venue --</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        📍 {v.venueName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block font-bold mb-1">Target Room / Zone</label>
                  <select
                    value={allocForm.roomId}
                    onChange={(e) => setAllocForm({ ...allocForm, roomId: e.target.value })}
                    disabled={!allocForm.venueId}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium disabled:opacity-50"
                  >
                    <option value="">-- Select Room --</option>
                    {(venues.find((v) => v.id === allocForm.venueId)?.rooms || []).map((r: any) => (
                      <option key={r.id} value={r.id}>
                        🚪 Room {r.roomNumber} ({r.roomName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block font-bold mb-1">Quantity to Allocate *</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItemForAlloc.availableQuantity}
                    value={allocForm.quantity}
                    onChange={(e) =>
                      setAllocForm({
                        ...allocForm,
                        quantity: Math.min(selectedItemForAlloc.availableQuantity, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-extrabold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block font-bold mb-1">Allocating Team</label>
                  <select
                    value={allocForm.department}
                    onChange={(e) => setAllocForm({ ...allocForm, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium"
                  >
                    <option value="PRODUCTION">PRODUCTION TEAM</option>
                    <option value="TECHNICAL">TECHNICAL TEAM</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block font-bold mb-1">Required Date</label>
                  <input
                    type="date"
                    value={allocForm.requiredDate}
                    onChange={(e) => setAllocForm({ ...allocForm, requiredDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block font-bold mb-1">Return Due Date</label>
                  <input
                    type="date"
                    value={allocForm.returnDueDate}
                    onChange={(e) => setAllocForm({ ...allocForm, returnDueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block font-bold mb-1">Allocation Purpose / Notes</label>
                <textarea
                  rows={2}
                  value={allocForm.notes}
                  onChange={(e) => setAllocForm({ ...allocForm, notes: e.target.value })}
                  placeholder="e.g. Allocated for stage setup, lounge seating, framing or exhibition backdrop"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setAllocateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAllocate}
                disabled={allocating || (!allocForm.artistId && !allocForm.venueId)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {allocating ? 'Allocating...' : 'Confirm Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT UPLOAD EXCEL (.XLSX) WITH FAULTY DETECTION */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" /> Direct Upload Inventory Excel (.xlsx)
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl text-center bg-slate-950/40">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleDirectExcelFileChange}
                  className="hidden"
                  id="directExcel"
                />
                <label htmlFor="directExcel" className="cursor-pointer block">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <span className="font-bold text-slate-200 block">
                    {uploadedFile ? uploadedFile.name : 'Click to select .xlsx file'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Rows marked in RED or tagged Faulty will be imported as Faulty & blocked from allocation
                  </span>
                </label>
              </div>

              {parsedExcelRows.length > 0 && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span>
                      Total Rows Parsed: <strong className="text-slate-100">{parsedExcelRows.length}</strong>
                    </span>
                    {faultyDetectedCount > 0 && (
                      <span className="text-rose-400 font-extrabold flex items-center gap-1 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                        <Ban className="w-3.5 h-3.5" /> {faultyDetectedCount} Faulty (Red Flagged) Items
                      </span>
                    )}
                  </div>

                  {/* Preview list */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {parsedExcelRows.map((r, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded text-[11px] flex justify-between border ${
                          r.isFaulty
                            ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-mono font-bold">
                          [{r.safCode}] {r.element}
                        </span>
                        <span>
                          {r.isFaulty ? '⚠️ FAULTY (CANNOT ALLOCATE)' : `Qty: ${r.totalQuantity} (${r.condition})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <a
                href="/api/sample-excel"
                download="Inventory TECH 2026.xlsx"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <FileDown className="w-3.5 h-3.5" /> Download Sample Excel
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDirectUpload}
                  disabled={parsedExcelRows.length === 0 || isProcessingUpload}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                >
                  {isProcessingUpload ? 'Importing...' : 'Import to Inventory Pool'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL INVENTORY ITEM */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">
                Add New {formData.inventoryUsageType} Inventory Item
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">SAF Code *</label>
                <input
                  type="text"
                  value={formData.safCode}
                  onChange={(e) => setFormData({ ...formData, safCode: e.target.value })}
                  placeholder="e.g. PRD-0001 or Ac-15"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Element Name *</label>
                <input
                  type="text"
                  value={formData.element}
                  onChange={(e) => setFormData({ ...formData, element: e.target.value })}
                  placeholder="e.g. Easel Stand or Light Box"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Total Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Usage Type / Department</label>
                <select
                  value={formData.inventoryUsageType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inventoryUsageType: e.target.value,
                      inventoryCategory: e.target.value === 'PRODUCTION' ? 'Production' : 'Technical',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium"
                >
                  <option value="PRODUCTION">PRODUCTION</option>
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Mark as Faulty / Red Flagged?</label>
                <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-rose-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFaulty}
                    onChange={(e) => setFormData({ ...formData, isFaulty: e.target.checked })}
                    className="accent-rose-500"
                  />
                  <span className="font-bold">Faulty (Red Flagged)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Save Inventory Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RETIRE / REMOVE INVENTORY */}
      {retireModalOpen && selectedItemForRetire && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Retire / Remove Inventory
              </h3>
              <button onClick={() => setRetireModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="font-bold text-slate-100">{selectedItemForRetire.element}</p>
                <p className="text-slate-400 font-mono">
                  SAF Code: {selectedItemForRetire.safCode} | Current Total: {selectedItemForRetire.totalQuantity}
                </p>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Quantity to Remove</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItemForRetire.totalQuantity}
                  value={retireQty}
                  onChange={(e) => setRetireQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reason for Removal</label>
                <select
                  value={retireReason}
                  onChange={(e) => setRetireReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="Damaged Beyond Repair">Damaged Beyond Repair</option>
                  <option value="Lost / Missing">Lost / Missing</option>
                  <option value="Sold / Transferred">Sold / Transferred</option>
                  <option value="Obsolete / Retired">Obsolete / Retired</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setRetireModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRetireItem}
                className="bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
