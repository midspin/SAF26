'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Wrench,
  Building2,
  DoorOpen,
  User,
  Package,
  Layers,
  Search,
  Filter,
  FileDown,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Tag,
  Boxes,
  MapPin,
  Calendar,
  Send,
} from 'lucide-react';

interface Allocation {
  id: string;
  eventId?: string;
  inventoryItemId: string;
  artistId?: string;
  artworkId?: string;
  venueId?: string;
  roomId?: string;
  department: string;
  requestedQuantity: number;
  approvedQuantity: number;
  issuedQuantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
  status: string;
  requestedBy?: string;
  approvedBy?: string;
  issuedBy?: string;
  dispatchedByUserId?: string | null;
  dispatchedByName?: string | null;
  dispatchedUserRole?: string | null;
  transportedByName?: string | null;
  dispatchedAt?: string | null;
  allocationDate?: string;
  requiredDate?: string;
  returnDueDate?: string;
  notes?: string;
  createdAt: string;
  inventoryItem?: {
    id: string;
    safCode: string;
    element: string;
    inventoryCategory: string;
    subCategory: string;
    brandProject?: string;
    model?: string;
    serialNo?: string;
    uom?: string;
    condition?: string;
  };
  artist?: {
    id: string;
    artistName: string;
    country?: string;
  };
  artwork?: {
    id: string;
    artworkName: string;
  };
  venue?: {
    id: string;
    venueName: string;
  };
  room?: {
    id: string;
    roomNumber: string;
    roomName: string;
    floor?: string;
  };
}

interface TeamUser {
  id: string;
  name: string;
  role: string;
  department?: string;
}

export default function VenueTechInventoryPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<
    | 'ARTIST_BY_VENUE'
    | 'ITEM_TYPE'
    | 'ARTIST_BY_ROOM'
    | 'ROOM_CONSOLIDATED'
    | 'VENUE_CONSOLIDATED'
  >('ARTIST_BY_VENUE');

  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [events, setEvents] = useState<any[]>([]);

  // Per-card / Per-group dispatch form state
  // key can be allocation.id or group key (e.g. artistId, roomId, venueId, itemType)
  const [dispatchForms, setDispatchForms] = useState<{
    [key: string]: {
      selectedUserId: string;
      customUserName: string;
      transportedByName: string;
    };
  }>({});

  const [submittingDispatch, setSubmittingDispatch] = useState<string | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [selectedEventId]);

  const fetchInitialData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [allocRes, userRes, eventRes] = await Promise.all([
        fetch(
          selectedEventId && selectedEventId !== 'ALL'
            ? `/api/inventory/allocations?eventId=${selectedEventId}`
            : '/api/inventory/allocations'
        ),
        fetch('/api/users'),
        fetch('/api/events'),
      ]);

      const allocData = await allocRes.json();
      const userData = await userRes.json();
      const eventData = await eventRes.json();

      if (allocData.success) {
        setAllocations(allocData.allocations || []);
      }

      if (userData.success) {
        // Filter users to tech and inventory teams or include all relevant staff
        const allUsers: TeamUser[] = userData.users || [];
        setUsers(allUsers);
      }

      if (eventData.success) {
        setEvents(eventData.events || []);
      }
    } catch (err) {
      console.error('Error loading venue tech inventory:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Tech & Inventory Team Users list
  const techAndInventoryUsers = useMemo(() => {
    return users.filter((u) => {
      const r = (u.role || '').toUpperCase();
      const d = (u.department || '').toUpperCase();
      return (
        r.includes('INVENTORY') ||
        r.includes('TECHNICAL') ||
        r.includes('TECH') ||
        r.includes('SUPER ADMIN') ||
        r.includes('INSTALLATION') ||
        d.includes('INVENTORY') ||
        d.includes('TECHNICAL')
      );
    });
  }, [users]);

  // Handle Dispatch Update for single item or multiple items
  const handleConfirmDispatch = async (
    targetKey: string,
    allocationIds: string[]
  ) => {
    if (allocationIds.length === 0) return;

    const form = dispatchForms[targetKey] || {
      selectedUserId: '',
      customUserName: '',
      transportedByName: '',
    };

    let dispatchedByName = '';
    let dispatchedUserRole = 'Inventory / Tech Team';
    let dispatchedByUserId = form.selectedUserId;

    if (form.selectedUserId === 'CUSTOM') {
      dispatchedByName = form.customUserName.trim();
    } else if (form.selectedUserId) {
      const u = users.find((usr) => usr.id === form.selectedUserId);
      if (u) {
        dispatchedByName = u.name;
        dispatchedUserRole = u.role || 'Tech/Inventory Team';
      }
    }

    if (!dispatchedByName) {
      alert('Please select or enter a user from Inventory / Tech Team.');
      return;
    }

    if (!form.transportedByName.trim()) {
      alert('Please enter the name of the person transporting the items.');
      return;
    }

    setSubmittingDispatch(targetKey);
    const nowIso = new Date().toISOString();

    // Optimistically update allocation dispatch state
    setAllocations((prevAllocations) =>
      prevAllocations.map((a) => {
        if (allocationIds.includes(a.id)) {
          return {
            ...a,
            dispatchedByUserId: dispatchedByUserId || null,
            dispatchedByName,
            dispatchedUserRole,
            transportedByName: form.transportedByName.trim(),
            dispatchedAt: nowIso,
          };
        }
        return a;
      })
    );

    try {
      const res = await fetch('/api/inventory/allocations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_DISPATCH',
          allocationIds,
          dispatchedByUserId,
          dispatchedByName,
          dispatchedUserRole,
          transportedByName: form.transportedByName.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          `✅ Handover timestamped & logged for ${allocationIds.length} item(s)!`
        );
        setTimeout(() => setSuccessMessage(null), 4000);
        // Silent background refresh
        fetchInitialData(false);
      } else {
        fetchInitialData(false);
        alert(data.error || 'Failed to update transport handover.');
      }
    } catch (err: any) {
      console.error(err);
      fetchInitialData(false);
      alert(err.message || 'Error updating transport handover.');
    } finally {
      setSubmittingDispatch(null);
    }
  };

  const updateDispatchForm = (
    key: string,
    field: 'selectedUserId' | 'customUserName' | 'transportedByName',
    value: string
  ) => {
    setDispatchForms((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {
          selectedUserId: '',
          customUserName: '',
          transportedByName: '',
        }),
        [field]: value,
      },
    }));
  };

  // Filtered Allocations based on search
  const filteredAllocations = useMemo(() => {
    return allocations.filter((a) => {
      const itemStr = `${a.inventoryItem?.safCode || ''} ${a.inventoryItem?.element || ''} ${a.inventoryItem?.inventoryCategory || ''} ${a.inventoryItem?.subCategory || ''} ${a.inventoryItem?.brandProject || ''} ${a.inventoryItem?.model || ''}`.toLowerCase();
      const artistStr = (a.artist?.artistName || '').toLowerCase();
      const venueStr = (a.venue?.venueName || '').toLowerCase();
      const roomStr = `${a.room?.roomNumber || ''} ${a.room?.roomName || ''}`.toLowerCase();
      const s = search.toLowerCase().trim();

      if (!s) return true;
      return (
        itemStr.includes(s) ||
        artistStr.includes(s) ||
        venueStr.includes(s) ||
        roomStr.includes(s)
      );
    });
  }, [allocations, search]);

  // VIEW 1: Allocated to Artist (Sorted by Venue with Artist Name & Room Number)
  const artistAllocationsSortedByVenue = useMemo(() => {
    const list = filteredAllocations.filter((a) => a.artist);
    return list.sort((a, b) => {
      const vA = (a.venue?.venueName || 'Unassigned Venue').toLowerCase();
      const vB = (b.venue?.venueName || 'Unassigned Venue').toLowerCase();
      if (vA !== vB) return vA.localeCompare(vB);

      const artA = (a.artist?.artistName || '').toLowerCase();
      const artB = (b.artist?.artistName || '').toLowerCase();
      if (artA !== artB) return artA.localeCompare(artB);

      const rmA = (a.room?.roomNumber || '').toLowerCase();
      const rmB = (b.room?.roomNumber || '').toLowerCase();
      return rmA.localeCompare(rmB);
    });
  }, [filteredAllocations]);

  // VIEW 2: Allocated Inventory (Sorted with Item Type - Projectors, Speakers, Media Player, etc.)
  const allocationsGroupedByItemType = useMemo(() => {
    const map: { [itemType: string]: Allocation[] } = {};

    filteredAllocations.forEach((a) => {
      const cat = (
        a.inventoryItem?.subCategory ||
        a.inventoryItem?.inventoryCategory ||
        'General Equipment'
      ).trim();

      if (!map[cat]) map[cat] = [];
      map[cat].push(a);
    });

    // Sort item type keys alphabetically
    const sortedKeys = Object.keys(map).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map((key) => ({
      itemType: key,
      items: map[key],
    }));
  }, [filteredAllocations]);

  // VIEW 3: Allocated to Artist (Sorted by Room No, Artist Name)
  const artistAllocationsSortedByRoom = useMemo(() => {
    const list = filteredAllocations.filter((a) => a.artist);
    return list.sort((a, b) => {
      const rmA = (a.room?.roomNumber || '9999').toLowerCase();
      const rmB = (b.room?.roomNumber || '9999').toLowerCase();
      if (rmA !== rmB) return rmA.localeCompare(rmB, undefined, { numeric: true });

      const artA = (a.artist?.artistName || '').toLowerCase();
      const artB = (b.artist?.artistName || '').toLowerCase();
      if (artA !== artB) return artA.localeCompare(artB);

      const vA = (a.venue?.venueName || '').toLowerCase();
      const vB = (b.venue?.venueName || '').toLowerCase();
      return vA.localeCompare(vB);
    });
  }, [filteredAllocations]);

  // VIEW 4: Allocated to Room (Consolidated list by Room & Venue)
  const consolidatedByRoom = useMemo(() => {
    const map: {
      [roomKey: string]: {
        venueName: string;
        roomNumber: string;
        roomName: string;
        roomId: string;
        allocations: Allocation[];
      };
    } = {};

    filteredAllocations.forEach((a) => {
      const rId = a.roomId || 'unassigned-room';
      const rNum = a.room?.roomNumber || 'N/A';
      const rName = a.room?.roomName || 'Unassigned Room';
      const vName = a.venue?.venueName || 'Unassigned Venue';
      const key = `${vName}___${rNum}___${rId}`;

      if (!map[key]) {
        map[key] = {
          venueName: vName,
          roomNumber: rNum,
          roomName: rName,
          roomId: rId,
          allocations: [],
        };
      }
      map[key].allocations.push(a);
    });

    return Object.values(map).sort((a, b) => {
      if (a.venueName !== b.venueName) return a.venueName.localeCompare(b.venueName);
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    });
  }, [filteredAllocations]);

  // VIEW 5: Allocated to Venue (Consolidated list by Venue)
  const consolidatedByVenue = useMemo(() => {
    const map: {
      [venueKey: string]: {
        venueId: string;
        venueName: string;
        allocations: Allocation[];
      };
    } = {};

    filteredAllocations.forEach((a) => {
      const vId = a.venueId || 'unassigned-venue';
      const vName = a.venue?.venueName || 'Unassigned Venue';

      if (!map[vName]) {
        map[vName] = {
          venueId: vId,
          venueName: vName,
          allocations: [],
        };
      }
      map[vName].allocations.push(a);
    });

    return Object.values(map).sort((a, b) => a.venueName.localeCompare(b.venueName));
  }, [filteredAllocations]);

  // Export Current Active List to Excel
  const exportToExcel = () => {
    let exportData: any[] = [];
    let fileName = `Venue_Tech_Inventory_${activeTab}_${Date.now()}.xlsx`;

    if (activeTab === 'ARTIST_BY_VENUE') {
      exportData = artistAllocationsSortedByVenue.map((a) => ({
        Venue: a.venue?.venueName || 'Unassigned',
        'Artist Name': a.artist?.artistName || 'N/A',
        'Room No': a.room?.roomNumber || 'N/A',
        'Room Name': a.room?.roomName || 'N/A',
        'SAF Code': a.inventoryItem?.safCode || 'N/A',
        'Item Element': a.inventoryItem?.element || 'N/A',
        Category: a.inventoryItem?.inventoryCategory || 'N/A',
        SubCategory: a.inventoryItem?.subCategory || 'N/A',
        'Brand / Model': `${a.inventoryItem?.brandProject || ''} ${a.inventoryItem?.model || ''}`,
        'Allocated Qty': a.issuedQuantity,
        'Dispatched By': a.dispatchedByName || 'Pending',
        'Role / Team': a.dispatchedUserRole || 'N/A',
        'Transported By': a.transportedByName || 'Pending',
        'Dispatch Date & Time': a.dispatchedAt
          ? new Date(a.dispatchedAt).toLocaleString()
          : 'Pending',
      }));
    } else if (activeTab === 'ITEM_TYPE') {
      allocationsGroupedByItemType.forEach((group) => {
        group.items.forEach((a) => {
          exportData.push({
            'Item Type / SubCategory': group.itemType,
            'SAF Code': a.inventoryItem?.safCode || 'N/A',
            'Item Element': a.inventoryItem?.element || 'N/A',
            Category: a.inventoryItem?.inventoryCategory || 'N/A',
            'Brand / Model': `${a.inventoryItem?.brandProject || ''} ${a.inventoryItem?.model || ''}`,
            'Allocated Qty': a.issuedQuantity,
            'Allocated To Artist': a.artist?.artistName || 'Room / Venue Allocation',
            'Venue Name': a.venue?.venueName || 'N/A',
            'Room No': a.room?.roomNumber || 'N/A',
            'Dispatched By': a.dispatchedByName || 'Pending',
            'Transported By': a.transportedByName || 'Pending',
            'Dispatch Timestamp': a.dispatchedAt
              ? new Date(a.dispatchedAt).toLocaleString()
              : 'Pending',
          });
        });
      });
    } else if (activeTab === 'ARTIST_BY_ROOM') {
      exportData = artistAllocationsSortedByRoom.map((a) => ({
        'Room No': a.room?.roomNumber || 'N/A',
        'Room Name': a.room?.roomName || 'N/A',
        'Artist Name': a.artist?.artistName || 'N/A',
        Venue: a.venue?.venueName || 'Unassigned',
        'SAF Code': a.inventoryItem?.safCode || 'N/A',
        'Item Element': a.inventoryItem?.element || 'N/A',
        Category: a.inventoryItem?.subCategory || a.inventoryItem?.inventoryCategory || 'N/A',
        'Allocated Qty': a.issuedQuantity,
        'Dispatched By': a.dispatchedByName || 'Pending',
        'Transported By': a.transportedByName || 'Pending',
        'Dispatch Timestamp': a.dispatchedAt
          ? new Date(a.dispatchedAt).toLocaleString()
          : 'Pending',
      }));
    } else if (activeTab === 'ROOM_CONSOLIDATED') {
      consolidatedByRoom.forEach((r) => {
        r.allocations.forEach((a) => {
          exportData.push({
            Venue: r.venueName,
            'Room No': r.roomNumber,
            'Room Name': r.roomName,
            'Artist Assigned': a.artist?.artistName || 'General Room Equipment',
            'SAF Code': a.inventoryItem?.safCode || 'N/A',
            'Item Element': a.inventoryItem?.element || 'N/A',
            SubCategory: a.inventoryItem?.subCategory || 'N/A',
            'Allocated Qty': a.issuedQuantity,
            'Dispatched By': a.dispatchedByName || 'Pending',
            'Transported By': a.transportedByName || 'Pending',
            'Dispatch Timestamp': a.dispatchedAt
              ? new Date(a.dispatchedAt).toLocaleString()
              : 'Pending',
          });
        });
      });
    } else if (activeTab === 'VENUE_CONSOLIDATED') {
      consolidatedByVenue.forEach((v) => {
        v.allocations.forEach((a) => {
          exportData.push({
            Venue: v.venueName,
            'Room No': a.room?.roomNumber || 'N/A',
            'Artist Assigned': a.artist?.artistName || 'General Venue Equipment',
            'SAF Code': a.inventoryItem?.safCode || 'N/A',
            'Item Element': a.inventoryItem?.element || 'N/A',
            Category: a.inventoryItem?.inventoryCategory || 'N/A',
            SubCategory: a.inventoryItem?.subCategory || 'N/A',
            'Allocated Qty': a.issuedQuantity,
            'Dispatched By': a.dispatchedByName || 'Pending',
            'Transported By': a.transportedByName || 'Pending',
            'Dispatch Timestamp': a.dispatchedAt
              ? new Date(a.dispatchedAt).toLocaleString()
              : 'Pending',
          });
        });
      });
    }

    if (exportData.length === 0) {
      alert('No allocation data available to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Venue Tech Inventory');
    XLSX.writeFile(workbook, fileName);
  };

  // Render Dispatch / Handover Form Component inside list rows or consolidated groups
  const renderDispatchHandoverBox = (
    targetKey: string,
    allocationIds: string[],
    existingDispatchInfo?: {
      dispatchedByName?: string | null;
      dispatchedUserRole?: string | null;
      transportedByName?: string | null;
      dispatchedAt?: string | null;
    }
  ) => {
    const form = dispatchForms[targetKey] || {
      selectedUserId: '',
      customUserName: '',
      transportedByName: '',
    };
    const isSubmitting = submittingDispatch === targetKey;

    const isFullyDispatched =
      existingDispatchInfo?.dispatchedByName &&
      existingDispatchInfo?.transportedByName &&
      existingDispatchInfo?.dispatchedAt;

    return (
      <div className="bg-[#1c1c2e] border border-[#2e2e48] rounded-xl p-3 mt-2 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-[#2a2a40]">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
              Dispatch & Transport Handover Log
            </span>
          </div>

          {isFullyDispatched && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Handover Logged
            </div>
          )}
        </div>

        {/* Existing Dispatch Logged Badge */}
        {isFullyDispatched && (
          <div className="mb-3 p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-300">
                  {new Date(existingDispatchInfo.dispatchedAt!).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(existingDispatchInfo.dispatchedAt!).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-slate-400 font-normal"> by </span>
                <span className="font-bold text-sky-300">
                  {existingDispatchInfo.dispatchedByName}
                </span>{' '}
                <span className="text-[10px] text-sky-400/80 bg-sky-900/40 px-1.5 py-0.5 rounded border border-sky-700/50">
                  {existingDispatchInfo.dispatchedUserRole || 'Tech/Inventory'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 text-[11px] font-bold">
              <Truck className="w-3.5 h-3.5" /> Transported by:{' '}
              <span className="text-white font-extrabold">
                {existingDispatchInfo.transportedByName}
              </span>
            </div>
          </div>
        )}

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
          {/* User Select Dropdown */}
          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select User (Inventory / Tech Team)
            </label>
            <select
              value={form.selectedUserId}
              onChange={(e) =>
                updateDispatchForm(targetKey, 'selectedUserId', e.target.value)
              }
              className="w-full bg-[#12121c] border border-[#33334e] text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="">-- Choose Staff Member --</option>
              {techAndInventoryUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
              <option value="CUSTOM">+ Enter Other Name Manually</option>
            </select>
          </div>

          {/* Custom Name field if CUSTOM is selected */}
          {form.selectedUserId === 'CUSTOM' && (
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Enter Staff Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex (Inventory Tech)"
                value={form.customUserName}
                onChange={(e) =>
                  updateDispatchForm(targetKey, 'customUserName', e.target.value)
                }
                className="w-full bg-[#12121c] border border-[#33334e] text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          )}

          {/* Transporting Person Field */}
          <div
            className={
              form.selectedUserId === 'CUSTOM' ? 'md:col-span-5' : 'md:col-span-5'
            }
          >
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Transporting Person Name (Driver / Logistics)
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar (Logistics Driver)"
              value={form.transportedByName}
              onChange={(e) =>
                updateDispatchForm(targetKey, 'transportedByName', e.target.value)
              }
              className="w-full bg-[#12121c] border border-[#33334e] text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Action Button */}
          <div className="md:col-span-3">
            <button
              onClick={() => handleConfirmDispatch(targetKey, allocationIds)}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {isFullyDispatched ? 'Update Dispatch' : 'Log Handover'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl shadow-lg shadow-sky-500/20 text-white">
            <Wrench className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2">
              Venue Tech Inventory Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Consolidated equipment allocations, venue & room deployment logs, and transport handover dispatch tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Event Selector */}
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="ALL">All Active Events</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name} ({evt.year})
              </option>
            ))}
          </select>

          {/* Export Button */}
          <button
            onClick={exportToExcel}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 shrink-0"
          >
            <FileDown className="w-4 h-4" /> Export View to Excel
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMessage}
        </div>
      )}

      {/* Search & Statistics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search Input */}
        <div className="md:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Item Name, SAF Code, Category, Artist, Room No, or Venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 text-xs font-medium text-slate-100 border border-slate-800 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-inner placeholder:text-slate-500"
          />
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-5 grid grid-cols-3 gap-2">
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Allocations
            </span>
            <span className="text-base font-extrabold text-sky-400">
              {filteredAllocations.length}
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Dispatched / Handed
            </span>
            <span className="text-base font-extrabold text-emerald-400">
              {filteredAllocations.filter((a) => a.dispatchedAt).length}
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Pending Transport
            </span>
            <span className="text-base font-extrabold text-amber-400">
              {filteredAllocations.filter((a) => !a.dispatchedAt).length}
            </span>
          </div>
        </div>
      </div>

      {/* VIEW TABS / Consolidated Lists Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ARTIST_BY_VENUE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ARTIST_BY_VENUE'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Allocated to Artist (Sorted by Venue)
        </button>

        <button
          onClick={() => setActiveTab('ITEM_TYPE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ITEM_TYPE'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" /> Allocated by Item Type (Projectors, Speakers, etc.)
        </button>

        <button
          onClick={() => setActiveTab('ARTIST_BY_ROOM')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ARTIST_BY_ROOM'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <DoorOpen className="w-4 h-4" /> Allocated to Artist (Sorted by Room No)
        </button>

        <button
          onClick={() => setActiveTab('ROOM_CONSOLIDATED')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ROOM_CONSOLIDATED'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Consolidated List (Allocated to Room)
        </button>

        <button
          onClick={() => setActiveTab('VENUE_CONSOLIDATED')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'VENUE_CONSOLIDATED'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" /> Consolidated List (Allocated to Venue)
        </button>
      </div>

      {/* CONTENT AREA */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          <Sparkles className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-3" />
          <p className="font-bold text-sm text-slate-300">
            Loading Venue Tech Inventory allocations...
          </p>
        </div>
      ) : filteredAllocations.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="font-bold text-base text-slate-300">
            No equipment allocations found
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search filter or active event context.
          </p>
        </div>
      ) : (
        <div>
          {/* TAB 1: Allocated to Artist (Sorted by Venue with Artist Name & Room No) */}
          {activeTab === 'ARTIST_BY_VENUE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  List 1: Allocated to Artist (Sorted by Venue → Artist Name → Room No)
                </span>
                <span className="text-xs text-sky-400 font-bold">
                  {artistAllocationsSortedByVenue.length} items
                </span>
              </div>

              <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Venue Name</th>
                        <th className="py-3.5 px-4">Artist Name</th>
                        <th className="py-3.5 px-4">Room No & Name</th>
                        <th className="py-3.5 px-4">Equipment Details (SAF Code & Element)</th>
                        <th className="py-3.5 px-4">Brand / Model</th>
                        <th className="py-3.5 px-4 text-center">Allocated Qty</th>
                        <th className="py-3.5 px-4">Handover / Transport Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {artistAllocationsSortedByVenue.map((alloc) => (
                        <tr
                          key={alloc.id}
                          className="hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-slate-100">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
                              {alloc.venue?.venueName || 'Unassigned Venue'}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-sky-300">
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4 text-purple-400 shrink-0" />
                              {alloc.artist?.artistName || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <DoorOpen className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                {alloc.room?.roomNumber
                                  ? `Room ${alloc.room.roomNumber}`
                                  : 'No Room'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                ({alloc.room?.roomName || 'General'})
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-100">
                              {alloc.inventoryItem?.element || 'Equipment Item'}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-sky-400">
                                {alloc.inventoryItem?.safCode || 'NO-CODE'}
                              </span>
                              <span>•</span>
                              <span>{alloc.inventoryItem?.subCategory || 'General'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {alloc.inventoryItem?.brandProject || 'N/A'} /{' '}
                            {alloc.inventoryItem?.model || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-extrabold text-xs">
                              {alloc.issuedQuantity} {alloc.inventoryItem?.uom || 'pcs'}
                            </span>
                          </td>
                          <td className="py-3 px-4 min-w-[340px]">
                            {renderDispatchHandoverBox(alloc.id, [alloc.id], {
                              dispatchedByName: alloc.dispatchedByName,
                              dispatchedUserRole: alloc.dispatchedUserRole,
                              transportedByName: alloc.transportedByName,
                              dispatchedAt: alloc.dispatchedAt,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Allocated Inventory (Sorted by Item Type - Projectors, Speakers, Media Player, etc.) */}
          {activeTab === 'ITEM_TYPE' && (
            <div className="space-y-6">
              <div className="px-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  List 2: Allocated Inventory — Grouped & Sorted by Item Type
                </span>
              </div>

              {allocationsGroupedByItemType.map((group) => {
                const groupAllocationIds = group.items.map((i) => i.id);

                return (
                  <div
                    key={group.itemType}
                    className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
                  >
                    {/* Item Type Group Header */}
                    <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl font-bold">
                          <Boxes className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            {group.itemType}
                          </h3>
                          <span className="text-xs text-slate-400 font-medium">
                            {group.items.length} allocation entries • Total Qty:{' '}
                            {group.items.reduce((acc, i) => acc + i.issuedQuantity, 0)}{' '}
                            units
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Group Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900/40 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4">SAF Code</th>
                            <th className="py-3 px-4">Item Name / Element</th>
                            <th className="py-3 px-4">Brand & Model</th>
                            <th className="py-3 px-4 text-center">Allocated Qty</th>
                            <th className="py-3 px-4">Allocated To (Artist / Room)</th>
                            <th className="py-3 px-4">Venue</th>
                            <th className="py-3 px-4">Dispatch Handover Log</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {group.items.map((alloc) => (
                            <tr
                              key={alloc.id}
                              className="hover:bg-slate-900/40 transition-colors"
                            >
                              <td className="py-3 px-4 font-mono font-bold text-sky-400">
                                {alloc.inventoryItem?.safCode || 'N/A'}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-100">
                                {alloc.inventoryItem?.element || 'Item'}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {alloc.inventoryItem?.brandProject || 'N/A'}{' '}
                                {alloc.inventoryItem?.model || ''}
                              </td>
                              <td className="py-3 px-4 text-center font-extrabold text-slate-100">
                                {alloc.issuedQuantity}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-200">
                                {alloc.artist?.artistName ? (
                                  <span className="text-purple-300 flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-purple-400" />
                                    {alloc.artist.artistName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <DoorOpen className="w-3.5 h-3.5 text-amber-400" />
                                    Room {alloc.room?.roomNumber || 'General'}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-300">
                                {alloc.venue?.venueName || 'Unassigned'}
                              </td>
                              <td className="py-3 px-4 min-w-[340px]">
                                {renderDispatchHandoverBox(alloc.id, [alloc.id], {
                                  dispatchedByName: alloc.dispatchedByName,
                                  dispatchedUserRole: alloc.dispatchedUserRole,
                                  transportedByName: alloc.transportedByName,
                                  dispatchedAt: alloc.dispatchedAt,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Consolidated Batch Handover for this Item Type */}
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                        Batch Handover Log for all {group.itemType} ({group.items.length}{' '}
                        items):
                      </span>
                      {renderDispatchHandoverBox(
                        `group_itemtype_${group.itemType}`,
                        groupAllocationIds
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Allocated to Artist (Sorted by Room No, Artist Name) */}
          {activeTab === 'ARTIST_BY_ROOM' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  List 3: Allocated to Artist (Sorted by Room No → Artist Name)
                </span>
                <span className="text-xs text-sky-400 font-bold">
                  {artistAllocationsSortedByRoom.length} items
                </span>
              </div>

              <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Room No & Name</th>
                        <th className="py-3.5 px-4">Artist Name</th>
                        <th className="py-3.5 px-4">Venue Name</th>
                        <th className="py-3.5 px-4">Equipment (SAF Code & Element)</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-center">Allocated Qty</th>
                        <th className="py-3.5 px-4">Handover / Transport Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {artistAllocationsSortedByRoom.map((alloc) => (
                        <tr
                          key={alloc.id}
                          className="hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-extrabold text-amber-300">
                            <div className="flex items-center gap-1.5">
                              <DoorOpen className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>
                                {alloc.room?.roomNumber
                                  ? `Room ${alloc.room.roomNumber}`
                                  : 'No Room'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                ({alloc.room?.roomName || 'General'})
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-purple-300">
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4 text-purple-400 shrink-0" />
                              {alloc.artist?.artistName || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-100">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
                              {alloc.venue?.venueName || 'Unassigned Venue'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-100">
                              {alloc.inventoryItem?.element || 'Equipment Item'}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-sky-400">
                                {alloc.inventoryItem?.safCode || 'NO-CODE'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {alloc.inventoryItem?.subCategory ||
                              alloc.inventoryItem?.inventoryCategory ||
                              'General'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-extrabold text-xs">
                              {alloc.issuedQuantity} {alloc.inventoryItem?.uom || 'pcs'}
                            </span>
                          </td>
                          <td className="py-3 px-4 min-w-[340px]">
                            {renderDispatchHandoverBox(alloc.id, [alloc.id], {
                              dispatchedByName: alloc.dispatchedByName,
                              dispatchedUserRole: alloc.dispatchedUserRole,
                              transportedByName: alloc.transportedByName,
                              dispatchedAt: alloc.dispatchedAt,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Allocated to Room (Consolidated List by Room & Venue) */}
          {activeTab === 'ROOM_CONSOLIDATED' && (
            <div className="space-y-6">
              <div className="px-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  List 4: Consolidated Inventory List Allocated to Rooms
                </span>
              </div>

              {consolidatedByRoom.map((roomGroup) => {
                const roomAllocationIds = roomGroup.allocations.map((a) => a.id);

                return (
                  <div
                    key={`${roomGroup.venueName}_${roomGroup.roomNumber}_${roomGroup.roomId}`}
                    className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
                  >
                    {/* Room Header */}
                    <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold">
                          <DoorOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            Room {roomGroup.roomNumber} - {roomGroup.roomName}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                            <span className="text-sky-400 font-bold">
                              {roomGroup.venueName}
                            </span>
                            <span>•</span>
                            <span>
                              {roomGroup.allocations.length} equipment items allocated
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Room Allocations Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900/40 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4">SAF Code</th>
                            <th className="py-3 px-4">Item Name / Element</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4 font-center text-center">Qty</th>
                            <th className="py-3 px-4">Assigned Artist / Purpose</th>
                            <th className="py-3 px-4">Dispatch Handover Log</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {roomGroup.allocations.map((alloc) => (
                            <tr
                              key={alloc.id}
                              className="hover:bg-slate-900/40 transition-colors"
                            >
                              <td className="py-3 px-4 font-mono font-bold text-sky-400">
                                {alloc.inventoryItem?.safCode || 'N/A'}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-100">
                                {alloc.inventoryItem?.element || 'Item'}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {alloc.inventoryItem?.subCategory ||
                                  alloc.inventoryItem?.inventoryCategory ||
                                  'General'}
                              </td>
                              <td className="py-3 px-4 text-center font-extrabold text-slate-100">
                                {alloc.issuedQuantity}
                              </td>
                              <td className="py-3 px-4 font-bold text-purple-300">
                                {alloc.artist?.artistName ? (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-purple-400" />
                                    {alloc.artist.artistName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-normal">
                                    General Room Setup
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 min-w-[340px]">
                                {renderDispatchHandoverBox(alloc.id, [alloc.id], {
                                  dispatchedByName: alloc.dispatchedByName,
                                  dispatchedUserRole: alloc.dispatchedUserRole,
                                  transportedByName: alloc.transportedByName,
                                  dispatchedAt: alloc.dispatchedAt,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Consolidated Batch Handover for Entire Room */}
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                        Batch Handover Log for Entire Room {roomGroup.roomNumber} (
                        {roomGroup.allocations.length} items):
                      </span>
                      {renderDispatchHandoverBox(
                        `group_room_${roomGroup.venueName}_${roomGroup.roomNumber}`,
                        roomAllocationIds
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: Allocated to Venue (Consolidated List by Venue) */}
          {activeTab === 'VENUE_CONSOLIDATED' && (
            <div className="space-y-6">
              <div className="px-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  List 5: Consolidated Inventory List Allocated to Venues
                </span>
              </div>

              {consolidatedByVenue.map((venueGroup) => {
                const venueAllocationIds = venueGroup.allocations.map((a) => a.id);

                return (
                  <div
                    key={venueGroup.venueName}
                    className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
                  >
                    {/* Venue Header */}
                    <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            {venueGroup.venueName}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium">
                            {venueGroup.allocations.length} total equipment items allocated
                            • Total Quantity:{' '}
                            <span className="text-sky-300 font-bold">
                              {venueGroup.allocations.reduce(
                                (acc, i) => acc + i.issuedQuantity,
                                0
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Venue Allocations Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900/40 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4">Room No & Name</th>
                            <th className="py-3 px-4">SAF Code</th>
                            <th className="py-3 px-4">Item Name / Element</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4 text-center">Allocated Qty</th>
                            <th className="py-3 px-4">Assigned Artist</th>
                            <th className="py-3 px-4">Dispatch Handover Log</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {venueGroup.allocations.map((alloc) => (
                            <tr
                              key={alloc.id}
                              className="hover:bg-slate-900/40 transition-colors"
                            >
                              <td className="py-3 px-4 font-bold text-amber-300">
                                <div className="flex items-center gap-1.5">
                                  <DoorOpen className="w-3.5 h-3.5 text-amber-400" />
                                  <span>
                                    {alloc.room?.roomNumber
                                      ? `Room ${alloc.room.roomNumber}`
                                      : 'General Venue'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-sky-400">
                                {alloc.inventoryItem?.safCode || 'N/A'}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-100">
                                {alloc.inventoryItem?.element || 'Item'}
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {alloc.inventoryItem?.subCategory ||
                                  alloc.inventoryItem?.inventoryCategory ||
                                  'General'}
                              </td>
                              <td className="py-3 px-4 text-center font-extrabold text-slate-100">
                                {alloc.issuedQuantity}
                              </td>
                              <td className="py-3 px-4 font-bold text-purple-300">
                                {alloc.artist?.artistName || 'N/A'}
                              </td>
                              <td className="py-3 px-4 min-w-[340px]">
                                {renderDispatchHandoverBox(alloc.id, [alloc.id], {
                                  dispatchedByName: alloc.dispatchedByName,
                                  dispatchedUserRole: alloc.dispatchedUserRole,
                                  transportedByName: alloc.transportedByName,
                                  dispatchedAt: alloc.dispatchedAt,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Consolidated Batch Handover for Entire Venue */}
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                        Batch Handover Log for Entire Venue ({venueGroup.venueName}) (
                        {venueGroup.allocations.length} items):
                      </span>
                      {renderDispatchHandoverBox(
                        `group_venue_${venueGroup.venueName}`,
                        venueAllocationIds
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
