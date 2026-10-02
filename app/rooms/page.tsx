'use client';

import React, { useEffect, useState } from 'react';
import {
  DoorOpen,
  Plus,
  Sparkles,
  Upload,
  FileText,
  Eye,
  X,
  Maximize2,
  Building2,
  Maximize,
  ExternalLink,
  Edit3,
  Trash2,
  Lock,
  AlertTriangle,
  Search,
} from 'lucide-react';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // User Role State & Permissions
  const [userRole, setUserRole] = useState<string>('SUPER ADMIN');

  useEffect(() => {
    const readRole = () => {
      if (typeof window !== 'undefined') {
        const role = localStorage.getItem('saf_user_role') || 'SUPER ADMIN';
        setUserRole(role);
      }
    };
    readRole();
    window.addEventListener('saf-role-changed', readRole);
    window.addEventListener('storage', readRole);
    return () => {
      window.removeEventListener('saf-role-changed', readRole);
      window.removeEventListener('storage', readRole);
    };
  }, []);

  // ONLY SUPER ADMIN CAN CREATE, EDIT, OR DELETE ROOMS
  const canManage = ['SUPER ADMIN'].includes(
    (userRole || '').trim().toUpperCase()
  );

  // Venue Filter & Room Search State
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string>('ALL');
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>('');

  // Full Screen Preview Modal State
  const [fullViewModal, setFullViewModal] = useState<{
    title: string;
    url: string;
    type: string;
  } | null>(null);

  // Auto-calculate Area in sq.m from Length and Width in mm
  const calcAreaFromMm = (lengthMm: string | number, widthMm: string | number): string => {
    const l = typeof lengthMm === 'number' ? lengthMm : parseFloat(lengthMm);
    const w = typeof widthMm === 'number' ? widthMm : parseFloat(widthMm);
    if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
      const areaSqm = (l / 1000) * (w / 1000);
      const formatted = Number.isInteger(areaSqm) ? areaSqm.toString() : areaSqm.toFixed(2);
      return `${formatted} sq.m`;
    }
    return '';
  };

  // Edit Room Modal State
  const [editRoomModal, setEditRoomModal] = useState<any | null>(null);
  const [editRoomFormData, setEditRoomFormData] = useState({
    venueId: '',
    roomNumber: '',
    roomName: '',
    floor: 'Ground Floor',
    length: '',
    width: '',
    area: '120 sq.m',
    height: '4.5 m',
    lightingInfo: 'Blackout enabled + DMX Track Lights',
    floorplan: '',
    elevation: '',
    techProdLayout: '',
    notes: '',
  });

  // Delete Room Modal State
  const [deleteRoomModal, setDeleteRoomModal] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Data for Create Room
  const [formData, setFormData] = useState({
    venueId: '',
    roomNumber: '',
    roomName: '',
    floor: 'Ground Floor',
    length: '',
    width: '',
    area: '120 sq.m',
    height: '4.5 m',
    lightingInfo: 'Blackout enabled + DMX Track Lights',
    floorplan: '',
    elevation: '',
    techProdLayout: '',
    notes: '',
  });

  useEffect(() => {
    fetchRooms();
    fetchVenues();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data.success) setRooms(data.rooms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const res = await fetch('/api/venues');
      const data = await res.json();
      if (data.success) {
        setVenues(data.venues || []);
        if (data.venues?.[0]) {
          setFormData((prev) => ({ ...prev, venueId: data.venues[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'floorplan' | 'elevation' | 'techProdLayout',
    isEdit: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        if (isEdit) {
          setEditRoomFormData((prev) => ({
            ...prev,
            [field]: data.url,
            ...(field === 'techProdLayout' ? { roomImage: data.url } : {}),
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            [field]: data.url,
            ...(field === 'techProdLayout' ? { roomImage: data.url } : {}),
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!canManage) return;
    try {
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      const activeEvent =
        eventsData.events?.find((e: any) => e.status === 'Active') || eventsData.events?.[0];
      const eventId = activeEvent?.id;

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          userRole,
          userName: 'Admin User',
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewModalOpen(false);
        setFormData({
          venueId: venues[0]?.id || '',
          roomNumber: '',
          roomName: '',
          floor: 'Ground Floor',
          length: '',
          width: '',
          area: '120 sq.m',
          height: '4.5 m',
          lightingInfo: 'Blackout enabled + DMX Track Lights',
          floorplan: '',
          elevation: '',
          techProdLayout: '',
          notes: '',
        });
        fetchRooms();
      } else {
        alert(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditRoomModal = (room: any) => {
    setEditRoomModal(room);
    setEditRoomFormData({
      venueId: room.venueId || '',
      roomNumber: room.roomNumber || '',
      roomName: room.roomName || '',
      floor: room.floor || '',
      length: room.length || '',
      width: room.width || '',
      area: room.area || '',
      height: room.height || '',
      lightingInfo: room.lightingInfo || '',
      floorplan: room.floorplan || '',
      elevation: room.elevation || '',
      techProdLayout: room.techProdLayout || room.roomImage || '',
      notes: room.notes || '',
    });
  };

  const handleUpdateRoom = async () => {
    if (!canManage || !editRoomModal) return;
    try {
      const res = await fetch(`/api/rooms/${editRoomModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole,
          userName: 'Admin User',
          ...editRoomFormData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditRoomModal(null);
        fetchRooms();
      } else {
        alert(data.error || 'Failed to update room');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRoom = async () => {
    if (!canManage || !deleteRoomModal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/rooms/${deleteRoomModal.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteRoomModal(null);
        fetchRooms();
      } else {
        alert(data.error || 'Failed to delete room');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesVenue = selectedVenueFilter === 'ALL' || r.venueId === selectedVenueFilter;
    const query = roomSearchQuery.trim().toLowerCase();
    if (!query) return matchesVenue;

    const matchesName = (r.roomName || '').toLowerCase().includes(query);
    const matchesCode = (r.roomNumber || '').toLowerCase().includes(query);
    const matchesVenueName = (r.venue?.venueName || '').toLowerCase().includes(query);

    return matchesVenue && (matchesName || matchesCode || matchesVenueName);
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <DoorOpen className="w-7 h-7 text-sky-400" /> Exhibition Rooms & Spatial Drawings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage floorplans, elevation technical drawings, height clearances, and blackout specs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManage ? (
            <button
              onClick={() => setNewModalOpen(true)}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add New Room
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3.5 py-2 rounded-xl">
              <Lock className="w-3.5 h-3.5" />
              <span>Read-Only Mode ({userRole})</span>
            </div>
          )}
        </div>
      </div>

      {/* Role Permission Notice for Non-Admins */}
      {!canManage && (
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <strong>Permission Notice:</strong> Editing and deleting rooms is restricted to{' '}
            <span className="font-bold underline text-amber-300">SUPER ADMIN</span> role. Switch your role using the header role switcher to enable management capabilities.
          </div>
        </div>
      )}

      {/* VENUE FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1c1c2a] p-3.5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* SEARCH INPUT */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              placeholder="Search by Room Name, Code, or Venue..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {roomSearchQuery && (
              <button onClick={() => setRoomSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* VENUE FILTER DROPDOWN */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 shrink-0">
              <Building2 className="w-4 h-4 text-sky-400" /> Filter by Venue:
            </label>
            <select
              value={selectedVenueFilter}
              onChange={(e) => setSelectedVenueFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ALL">🏛️ All Venues ({rooms.length})</option>
              {venues.map((v) => {
                const count = rooms.filter((r) => r.venueId === v.id).length;
                return (
                  <option key={v.id} value={v.id}>
                    📍 {v.venueName} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* ROOM COUNTER */}
        <div className="text-xs text-slate-400 font-semibold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0 text-center">
          Showing <strong className="text-sky-400">{filteredRooms.length}</strong> of {rooms.length} Rooms
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
          Loading Rooms...
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-12 text-center bg-[#1c1c2a] rounded-2xl border border-slate-800 text-slate-400 text-xs">
          No rooms match your filter query. Try selecting "All Venues" or clearing search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredRooms.map((r) => {
            return (
              <div
                key={r.id}
                className="p-3.5 rounded-2xl border border-slate-800 bg-[#1c1c2a] hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group shadow-md hover:shadow-sky-500/5"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Room Code, Venue Name & Actions */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[11px] font-black text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800/60 shrink-0">
                      R-{r.roomNumber}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 truncate flex items-center gap-1" title={r.venue?.venueName}>
                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{r.venue?.venueName || 'Complex'}</span>
                    </span>

                    {/* Edit & Delete Buttons */}
                    {canManage && (
                      <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 p-0.5 rounded-lg shrink-0">
                        <button
                          onClick={() => openEditRoomModal(r)}
                          title="Edit Room"
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteRoomModal(r)}
                          title="Delete Room"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Room Name */}
                  <h3 className="text-xs font-extrabold text-white truncate" title={r.roomName}>
                    {r.roomName}
                  </h3>

                  {/* Specs Summary Grid */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-950/80 p-2 rounded-xl text-slate-300 border border-slate-800/80">
                    <div>
                      <span className="text-[9px] text-slate-500 block">L x W</span>
                      <strong className="truncate block">{r.length && r.width ? `${r.length}x${r.width}` : 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Area</span>
                      <strong className="text-sky-400 truncate block">{r.area || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Floor</span>
                      <strong className="truncate block">{r.floor || 'Ground'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">Height</span>
                      <strong className="truncate block">{r.height || '4m'}</strong>
                    </div>
                  </div>

                  {/* Main Technical & Production Layout Thumbnail */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block truncate">
                      📐 Tech & Production drawing
                    </span>
                    {r.techProdLayout || r.roomImage ? (
                      <div
                        onClick={() =>
                          setFullViewModal({
                            title: `Room ${r.roomNumber} - Technical & Production Layout`,
                            url: r.techProdLayout || r.roomImage,
                            type: (r.techProdLayout || r.roomImage)?.endsWith('.pdf') ? 'PDF' : 'IMAGE',
                          })
                        }
                        className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950 h-24 cursor-pointer group/thumb hover:border-emerald-400 transition-all shadow-md"
                      >
                        {(r.techProdLayout || r.roomImage)?.endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-emerald-400 p-2">
                            <FileText className="w-6 h-6 mb-0.5" />
                            <span className="text-[10px] font-bold">Layout PDF</span>
                          </div>
                        ) : (
                          <img
                            src={r.techProdLayout || r.roomImage}
                            alt="Technical & Production Layout"
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 opacity-90 group-hover/thumb:opacity-100"
                          />
                        )}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-slate-100 text-[10px] font-bold">
                          <Maximize2 className="w-3.5 h-3.5 text-emerald-400 mr-1" /> View
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 h-20 flex flex-col items-center justify-center text-slate-600 text-[10px]">
                        <span>No drawing attached</span>
                      </div>
                    )}
                  </div>

                  {/* Interactive Buttons for Floorplan & Elevation Drawings */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {r.floorplan ? (
                      <button
                        onClick={() =>
                          setFullViewModal({
                            title: `Room ${r.roomNumber} - Floorplan Layout`,
                            url: r.floorplan,
                            type: r.floorplan?.endsWith('.pdf') ? 'PDF' : 'IMAGE',
                          })
                        }
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-sky-500/30 text-sky-400 hover:text-sky-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <FileText className="w-3 h-3" /> Floorplan
                      </button>
                    ) : (
                      <button
                        disabled
                        className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/50 text-slate-600 text-[10px] font-medium flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
                      >
                        <FileText className="w-3 h-3" /> Floorplan
                      </button>
                    )}

                    {r.elevation ? (
                      <button
                        onClick={() =>
                          setFullViewModal({
                            title: `Room ${r.roomNumber} - Elevation Drawing`,
                            url: r.elevation,
                            type: r.elevation?.endsWith('.pdf') ? 'PDF' : 'IMAGE',
                          })
                        }
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <FileText className="w-3 h-3" /> Elevation
                      </button>
                    ) : (
                      <button
                        disabled
                        className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/50 text-slate-600 text-[10px] font-medium flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
                      >
                        <FileText className="w-3 h-3" /> Elevation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL VIEW MODAL FOR DRAWINGS */}
      {fullViewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Maximize className="w-5 h-5 text-sky-400" /> {fullViewModal.title}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={fullViewModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-sky-400"
                >
                  Open Original <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setFullViewModal(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 rounded-xl p-2 flex items-center justify-center border border-slate-800">
              {fullViewModal.type === 'PDF' ? (
                <iframe
                  src={fullViewModal.url}
                  className="w-full h-[70vh] rounded-lg border-0"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={fullViewModal.url}
                  alt="Full View Drawing"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ROOM */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-sky-400" /> Create Room & Upload Drawings
              </h3>
              <button
                onClick={() => setNewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Select Exhibition Venue *</label>
                <select
                  value={formData.venueId}
                  onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.venueName} ({v.address || 'Main Venue'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Room Number Code *</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. R-102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Room Title *</label>
                  <input
                    type="text"
                    value={formData.roomName}
                    onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                    placeholder="e.g. Kinetic Sound Gallery"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {/* UPLOAD TECHNICAL & PRODUCTION LAYOUT (MAIN THUMBNAIL) */}
              <div>
                <label className="text-emerald-400 font-bold block mb-1">
                  🖼️ Upload Technical & Production Layout (Main Room Thumbnail - Image or PDF)
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <input
                    type="file"
                    accept=".pdf,.png,.jpeg,.jpg,.webp"
                    onChange={(e) => handleFileUpload(e, 'techProdLayout', false)}
                    className="text-xs text-slate-300 file:bg-emerald-500 file:text-slate-950 file:font-bold file:px-2.5 file:py-1 file:rounded-lg file:border-0 hover:file:bg-emerald-400 cursor-pointer w-full"
                  />
                </div>
                {formData.techProdLayout && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    ✓ Layout Uploaded: {formData.techProdLayout}
                  </p>
                )}
              </div>

              {/* UPLOAD FLOORPLAN */}
              <div>
                <label className="text-sky-400 font-bold block mb-1">
                  📐 Upload Room Floorplan (Image or PDF)
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <input
                    type="file"
                    accept=".pdf,.png,.jpeg,.jpg,.webp"
                    onChange={(e) => handleFileUpload(e, 'floorplan', false)}
                    className="text-xs text-slate-300 file:bg-sky-500 file:text-slate-950 file:font-bold file:px-2.5 file:py-1 file:rounded-lg file:border-0 hover:file:bg-sky-400 cursor-pointer w-full"
                  />
                </div>
                {formData.floorplan && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    ✓ Floorplan Uploaded: {formData.floorplan}
                  </p>
                )}
              </div>

              {/* UPLOAD ELEVATION */}
              <div>
                <label className="text-amber-400 font-bold block mb-1">
                  🏛️ Upload Room Elevation Drawing (Image or PDF)
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <input
                    type="file"
                    accept=".pdf,.png,.jpeg,.jpg,.webp"
                    onChange={(e) => handleFileUpload(e, 'elevation', false)}
                    className="text-xs text-slate-300 file:bg-amber-500 file:text-slate-950 file:font-bold file:px-2.5 file:py-1 file:rounded-lg file:border-0 hover:file:bg-amber-400 cursor-pointer w-full"
                  />
                </div>
                {formData.elevation && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    ✓ Elevation Uploaded: {formData.elevation}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Length (mm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={formData.length}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newArea = calcAreaFromMm(val, formData.width);
                      setFormData((prev) => ({
                        ...prev,
                        length: val,
                        ...(newArea ? { area: newArea } : {}),
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Width (mm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 12000"
                    value={formData.width}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newArea = calcAreaFromMm(formData.length, val);
                      setFormData((prev) => ({
                        ...prev,
                        width: val,
                        ...(newArea ? { area: newArea } : {}),
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-sky-400 block mb-1 font-semibold flex items-center gap-1">
                    ✨ Area (sq.m)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto sq.m"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full bg-slate-950 border border-sky-500/50 rounded-xl px-3 py-2 text-sky-300 font-bold text-xs focus:border-sky-400 focus:outline-none shadow-sm shadow-sky-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. Ground Floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Clear Height (m)</label>
                  <input
                    type="text"
                    placeholder="e.g. 4.5 m"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setNewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={uploading}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                {uploading ? 'Uploading...' : 'Save Room & Drawings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ROOM */}
      {editRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" /> Edit Room & Drawings
              </h3>
              <button onClick={() => setEditRoomModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Venue Location *</label>
                <select
                  value={editRoomFormData.venueId}
                  onChange={(e) => setEditRoomFormData({ ...editRoomFormData, venueId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.venueName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Room Number Code *</label>
                  <input
                    type="text"
                    value={editRoomFormData.roomNumber}
                    onChange={(e) => setEditRoomFormData({ ...editRoomFormData, roomNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Room Title *</label>
                  <input
                    type="text"
                    value={editRoomFormData.roomName}
                    onChange={(e) => setEditRoomFormData({ ...editRoomFormData, roomName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {/* RE-UPLOAD TECHNICAL & PRODUCTION LAYOUT */}
              <div>
                <label className="text-emerald-400 font-bold block mb-1">
                  🖼️ Upload/Replace Technical & Production Layout (Main Room Thumbnail - Image or PDF)
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <input
                    type="file"
                    accept=".pdf,.png,.jpeg,.jpg,.webp"
                    onChange={(e) => handleFileUpload(e, 'techProdLayout', true)}
                    className="text-xs text-slate-300 file:bg-emerald-500 file:text-slate-950 file:font-bold file:px-2.5 file:py-1 file:rounded-lg file:border-0 hover:file:bg-emerald-400 cursor-pointer w-full"
                  />
                </div>
                {editRoomFormData.techProdLayout && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    ✓ Current Layout: {editRoomFormData.techProdLayout}
                  </p>
                )}
              </div>

              {/* RE-UPLOAD FLOORPLAN */}
              <div>
                <label className="text-sky-400 font-bold block mb-1">
                  📐 Replace Floorplan Drawing (Image or PDF)
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <input
                    type="file"
                    accept=".pdf,.png,.jpeg,.jpg,.webp"
                    onChange={(e) => handleFileUpload(e, 'floorplan', true)}
                    className="text-xs text-slate-300 file:bg-sky-500 file:text-slate-950 file:font-bold file:px-2.5 file:py-1 file:rounded-lg file:border-0 hover:file:bg-sky-400 cursor-pointer w-full"
                  />
                </div>
                {editRoomFormData.floorplan && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    ✓ Current Floorplan: {editRoomFormData.floorplan}
                  </p>
                )}
              </div>

              {/* RE-UPLOAD ELEVATION */}
              <div>
                <label className="text-amber-400 font-bold block mb-1">
                  🏛️ Replace Elevation Drawing (Image or PDF)
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <input
                    type="file"
                    accept=".pdf,.png,.jpeg,.jpg,.webp"
                    onChange={(e) => handleFileUpload(e, 'elevation', true)}
                    className="text-xs text-slate-300 file:bg-amber-500 file:text-slate-950 file:font-bold file:px-2.5 file:py-1 file:rounded-lg file:border-0 hover:file:bg-amber-400 cursor-pointer w-full"
                  />
                </div>
                {editRoomFormData.elevation && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    ✓ Current Elevation: {editRoomFormData.elevation}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Length (mm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={editRoomFormData.length}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newArea = calcAreaFromMm(val, editRoomFormData.width);
                      setEditRoomFormData((prev) => ({
                        ...prev,
                        length: val,
                        ...(newArea ? { area: newArea } : {}),
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Width (mm)</label>
                  <input
                    type="number"
                    placeholder="e.g. 12000"
                    value={editRoomFormData.width}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newArea = calcAreaFromMm(editRoomFormData.length, val);
                      setEditRoomFormData((prev) => ({
                        ...prev,
                        width: val,
                        ...(newArea ? { area: newArea } : {}),
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs font-semibold focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-sky-400 block mb-1 font-semibold flex items-center gap-1">
                    ✨ Area (sq.m)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto sq.m"
                    value={editRoomFormData.area}
                    onChange={(e) => setEditRoomFormData({ ...editRoomFormData, area: e.target.value })}
                    className="w-full bg-slate-950 border border-sky-500/50 rounded-xl px-3 py-2 text-sky-300 font-bold text-xs focus:border-sky-400 focus:outline-none shadow-sm shadow-sky-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. Ground Floor"
                    value={editRoomFormData.floor}
                    onChange={(e) => setEditRoomFormData({ ...editRoomFormData, floor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Clear Height (m)</label>
                  <input
                    type="text"
                    placeholder="e.g. 4.5 m"
                    value={editRoomFormData.height}
                    onChange={(e) => setEditRoomFormData({ ...editRoomFormData, height: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditRoomModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRoom}
                disabled={uploading}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                {uploading ? 'Uploading...' : 'Update Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ROOM CONFIRMATION */}
      {deleteRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Delete Room</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete room{' '}
                <span className="font-bold text-slate-200">
                  {deleteRoomModal.roomNumber} ({deleteRoomModal.roomName})
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteRoomModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-rose-600/20"
              >
                {deleting ? 'Deleting...' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
