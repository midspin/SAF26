'use client';

import React, { useEffect, useState } from 'react';
import ImageUploadInput from '@/components/ImageUploadInput';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Building2,
  Users,
  Palette,
  Wrench,
  Layers,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

import { canUserViewModule } from '@/lib/permissions';

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  // User & Role State
  const [activeRole, setActiveRole] = useState<string>('SUPER ADMIN');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(true);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    year: new Date().getFullYear().toString(),
    status: 'Active',
    startDate: '',
    endDate: '',
    location: '',
    address: '',
    email: '',
    contact: '',
    logo: '',
    coverPage: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Active Context Feedback
  const [activeSuccessMsg, setActiveSuccessMsg] = useState<string | null>(null);

  // Sync role from localStorage / windows event
  useEffect(() => {
    const syncRole = () => {
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem('saf_user_session');
        const savedRole = localStorage.getItem('saf_user_role');
        let currentRole = 'SUPER ADMIN';
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            currentRole = parsed.role || 'SUPER ADMIN';
          } catch (e) {
            console.error(e);
          }
        } else if (savedRole) {
          currentRole = savedRole;
        }
        setActiveRole(currentRole);
        setIsSuperAdmin(currentRole.trim().toUpperCase() === 'SUPER ADMIN');
      }
    };

    syncRole();
    window.addEventListener('saf-role-changed', syncRole);
    window.addEventListener('saf-auth-changed', syncRole);
    window.addEventListener('storage', syncRole);

    return () => {
      window.removeEventListener('saf-role-changed', syncRole);
      window.removeEventListener('saf-auth-changed', syncRole);
      window.removeEventListener('storage', syncRole);
    };
  }, []);

  if (!canUserViewModule(activeRole, 'events')) {
    return (
      <div className="p-12 text-center bg-[#1c1c2a] rounded-3xl border border-rose-500/30 my-8 space-y-3">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-black text-white">Access Denied — Events Module [NV]</h2>
        <p className="text-xs text-slate-400">
          The Events module is hidden completely and unauthorized for your assigned role (<strong>{activeRole}</strong>).
        </p>
      </div>
    );
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      code: '',
      year: new Date().getFullYear().toString(),
      status: 'Active',
      startDate: '',
      endDate: '',
      location: '',
      address: '',
      email: '',
      contact: '',
      logo: '',
      coverPage: '',
      description: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (evt: any) => {
    setEditingEvent(evt);
    setFormData({
      name: evt.name || '',
      code: evt.code || '',
      year: (evt.year || new Date().getFullYear()).toString(),
      status: evt.status || 'Active',
      startDate: evt.startDate || '',
      endDate: evt.endDate || '',
      location: evt.location || '',
      address: evt.address || '',
      email: evt.email || '',
      contact: evt.contact || '',
      logo: evt.logo || '',
      coverPage: evt.coverPage || '',
      description: evt.description || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Event Name and Event Code are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        fetchEvents();
      } else {
        setFormError(data.error || 'Failed to save event.');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error saving event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setEventToDelete(null);
        fetchEvents();
      } else {
        alert(data.error || 'Failed to delete event.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error deleting event.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectActiveContext = (evt: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saf_active_event_id', evt.id);
      window.dispatchEvent(new Event('saf-event-changed'));
      setActiveSuccessMsg(`Active event switched to ${evt.name}`);
      setTimeout(() => setActiveSuccessMsg(null), 3000);
    }
  };

  // Filtered Events List
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.location && evt.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || evt.status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-16 select-none">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-[#8b5cf6]" /> Event Management Center
          </h1>
          <p className="text-xs text-[#8a8d9b] mt-0.5">
            Super Admin master directory — configure festival editions, locations, branding, contacts, and logos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            className="bg-[#232334] hover:bg-[#2c2c40] text-[#38bdf8] border border-white/10 text-xs font-extrabold px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          {isSuperAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create New Event
            </button>
          )}
        </div>
      </div>

      {/* SUPER ADMIN RESTRICTION NOTICE IF NOT SUPER ADMIN */}
      {!isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Read-Only Access:</strong> Event creation, editing, and deletion features are restricted strictly to <strong>SUPER ADMIN</strong> accounts.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 shrink-0">
            Role: {activeRole}
          </span>
        </div>
      )}

      {/* ACTIVE CONTEXT SUCCESS TOAST */}
      {activeSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">{activeSuccessMsg}</span>
        </div>
      )}

      {/* CONTROLS & SEARCH BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#232334] p-4 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] bg-[#1c1c2a] rounded-2xl px-4 py-2 border border-white/10 focus-within:border-[#8b5cf6] transition-colors">
          <Search className="w-4 h-4 text-[#8a8d9b]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events by title, code, or location..."
            className="bg-transparent text-xs text-white placeholder-[#8a8d9b] focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'PLANNING', 'COMPLETED', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all cursor-pointer border ${
                statusFilter === st
                  ? 'bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-md shadow-purple-500/20'
                  : 'bg-[#1c1c2a] text-[#8a8d9b] border-white/5 hover:text-white hover:border-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* EVENTS GRID */}
      {loading ? (
        <div className="p-12 text-center text-[#8a8d9b] text-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-[#8b5cf6] animate-spin mx-auto" />
          <p className="font-semibold">Loading events database...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#232334] border border-white/5 text-center text-[#8a8d9b] space-y-3">
          <Calendar className="w-10 h-10 text-[#8b5cf6]/40 mx-auto" />
          <h3 className="text-sm font-extrabold text-white">No Events Found</h3>
          <p className="text-xs">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No events match your search filters.'
              : 'No events created yet. Click "Create New Event" above to create your first event edition.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isCompleted = evt.status?.toLowerCase() === 'completed';
            const isPlanning = evt.status?.toLowerCase() === 'planning';
            const isArchived = evt.status?.toLowerCase() === 'archived';

            const statusClass = isCompleted
              ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30'
              : isPlanning
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : isArchived
              ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
              : 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30';

            return (
              <div
                key={evt.id}
                className="rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#8b5cf6]/40 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* COVER IMAGE & LOGO BANNER */}
                  <div className="relative h-44 bg-gradient-to-r from-[#1c1c2a] to-[#2c2c40] overflow-hidden">
                    {evt.coverPage ? (
                      <img
                        src={evt.coverPage}
                        alt={evt.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#6366f1]/30 via-[#8b5cf6]/20 to-[#38bdf8]/30 flex items-center justify-center p-6 text-center">
                        <Sparkles className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#232334] via-transparent to-black/40" />

                    {/* Code & Status Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 shadow-md">
                        {evt.code} ({evt.year})
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl border backdrop-blur-md shadow-md ${statusClass}`}>
                        {evt.status || 'Active'}
                      </span>
                    </div>

                    {/* Logo Avatar Overlay */}
                    <div className="absolute -bottom-4 left-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#1c1c2a] border-2 border-[#8b5cf6] p-1 shadow-2xl flex items-center justify-center overflow-hidden">
                        {evt.logo ? (
                          <img src={evt.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                        ) : (
                          <Calendar className="w-6 h-6 text-[#8b5cf6]" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CARD BODY CONTENT */}
                  <div className="p-6 pt-7 space-y-4">
                    <div>
                      <h3 className="text-base font-black text-white leading-snug tracking-tight group-hover:text-[#38bdf8] transition-colors">
                        {evt.name}
                      </h3>
                      {evt.description && (
                        <p className="text-xs text-[#8a8d9b] mt-1 line-clamp-2">{evt.description}</p>
                      )}
                    </div>

                    {/* METADATA GRID */}
                    <div className="space-y-2 text-xs text-[#8a8d9b] border-t border-b border-white/5 py-3">
                      {evt.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
                          <span className="text-white font-medium truncate">{evt.location}</span>
                        </div>
                      )}
                      {evt.address && (
                        <p className="text-[11px] text-[#8a8d9b] pl-5 line-clamp-1">{evt.address}</p>
                      )}
                      {(evt.startDate || evt.endDate) && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                          <span className="text-white font-mono text-[11px]">
                            {evt.startDate || 'TBD'} - {evt.endDate || 'TBD'}
                          </span>
                        </div>
                      )}
                      {evt.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                          <span className="text-white truncate">{evt.email}</span>
                        </div>
                      )}
                      {evt.contact && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#a855f7] shrink-0" />
                          <span className="text-white">{evt.contact}</span>
                        </div>
                      )}
                    </div>

                    {/* LINKED STAT COUNTS */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded-xl bg-[#1c1c2a] border border-white/5">
                        <span className="block font-bold text-white text-xs">{evt._count?.artists || 0}</span>
                        <span className="text-[#8a8d9b] uppercase font-semibold">Artists</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#1c1c2a] border border-white/5">
                        <span className="block font-bold text-white text-xs">{evt._count?.artworks || 0}</span>
                        <span className="text-[#8a8d9b] uppercase font-semibold">Artworks</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#1c1c2a] border border-white/5">
                        <span className="block font-bold text-white text-xs">{evt._count?.venues || 0}</span>
                        <span className="text-[#8a8d9b] uppercase font-semibold">Venues</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#1c1c2a] border border-white/5">
                        <span className="block font-bold text-white text-xs">{evt._count?.inventoryItems || 0}</span>
                        <span className="text-[#8a8d9b] uppercase font-semibold">Inventory</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER ACTIONS */}
                <div className="p-4 bg-[#1c1c2a]/80 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSelectActiveContext(evt)}
                    className="bg-[#232334] hover:bg-[#2c2c40] text-[#38bdf8] border border-white/10 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Set as current active event context"
                  >
                    <Layers className="w-3.5 h-3.5" /> Select Context
                  </button>

                  {isSuperAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(evt)}
                        className="p-2 rounded-xl bg-[#232334] hover:bg-[#2c2c40] text-white border border-white/10 transition-all cursor-pointer"
                        title="Edit Event Configuration"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                      </button>
                      <button
                        onClick={() => {
                          setEventToDelete(evt);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL (SUPER ADMIN ONLY) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#161622]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#232334] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-8">
            {/* MODAL HEADER */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#1c1c2a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingEvent ? 'Edit Event Details' : 'Create New Event Edition'}
                  </h3>
                  <p className="text-xs text-[#8a8d9b]">
                    Super Admin Event Configuration — Title, Code, Dates, Location, Branding & Contacts
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-2xl bg-[#232334] hover:bg-[#2c2c40] text-[#8a8d9b] hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSaveEvent} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Event Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                    Event Title / Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Serendipity Arts Festival 2026"
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-[#8a8d9b] focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                    Event Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAF2026"
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-mono text-white placeholder-[#8a8d9b] focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              {/* Year & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6]"
                  >
                    <option value="Active">Active</option>
                    <option value="Planning">Planning</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
              </div>

              {/* Location & Address */}
              <div className="space-y-3 border-t border-white/10 pt-3">
                <h4 className="text-xs font-extrabold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Event Venue Location & Physical Address
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                      Location / City
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Panaji, Goa, India"
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-[#8a8d9b] focus:outline-none focus:border-[#8b5cf6]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                      Full Physical Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Nagalli Hills Complex, Dona Paula, Goa"
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-[#8a8d9b] focus:outline-none focus:border-[#8b5cf6]"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 border-t border-white/10 pt-3">
                <h4 className="text-xs font-extrabold text-[#10b981] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Official Contact Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. info@serendipityarts.org"
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-[#8a8d9b] focus:outline-none focus:border-[#8b5cf6]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="e.g. +91 832 245 6789"
                      className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-[#8a8d9b] focus:outline-none focus:border-[#8b5cf6]"
                    />
                  </div>
                </div>
              </div>

              {/* Branding (Logo & Cover Page Upload) */}
              <div className="space-y-4 border-t border-white/10 pt-3">
                <h4 className="text-xs font-extrabold text-[#a855f7] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Event Branding & Artwork Attachments
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadInput
                    label="Event Logo"
                    value={formData.logo}
                    onChange={(url) => setFormData({ ...formData, logo: url })}
                    placeholder="Upload event logo image..."
                  />

                  <ImageUploadInput
                    label="Event Cover Page / Banner"
                    value={formData.coverPage}
                    onChange={(url) => setFormData({ ...formData, coverPage: url })}
                    placeholder="Upload cover banner image..."
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 border-t border-white/10 pt-3">
                <label className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">
                  Event Description & Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary notes, theme details, and festival description..."
                  className="w-full bg-[#1c1c2a] border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-[#8a8d9b] focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-[#1c1c2a] text-[#8a8d9b] hover:text-white border border-white/10 text-xs font-extrabold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-xs font-extrabold shadow-lg shadow-indigo-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && eventToDelete && (
        <div className="fixed inset-0 z-50 bg-[#161622]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#232334] border border-rose-500/30 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Delete Event?</h3>
                <p className="text-xs text-[#8a8d9b]">Super Admin Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{eventToDelete.name}</strong> ({eventToDelete.code})?
              This will permanently delete the event configuration from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setEventToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#1c1c2a] text-[#8a8d9b] hover:text-white text-xs font-extrabold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />} Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
