'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  DoorOpen,
  MapPin,
  Phone,
  Mail,
  ArrowUpRight,
  Sparkles,
  FileText,
  Upload,
  X,
  Eye,
  ExternalLink,
  Edit3,
  Trash2,
  Lock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function VenuesPage() {
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

  // SUPER ADMIN & TECH LAYOUT DESIGNER CAN CREATE, EDIT, OR DELETE VENUES & ROOMS
  const canManage = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'TECH LAYOUT DESIGNER',
    'TECHNICAL LAYOUT DESIGNER',
  ].includes((userRole || '').trim().toUpperCase());

  // Edit Venue Modal State
  const [editVenueModal, setEditVenueModal] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    venueName: '',
    address: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
    powerInfo: '',
    internetInfo: '',
    mainVenueImage: '',
    venueDocument: '',
    venueDocumentType: 'PDF',
  });

  // Delete Venue Modal State
  const [deleteVenueModal, setDeleteVenueModal] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Quick Room Edit / Delete Modal State within Venues Page
  const [editRoomModal, setEditRoomModal] = useState<any | null>(null);
  const [editRoomFormData, setEditRoomFormData] = useState({
    roomNumber: '',
    roomName: '',
    floor: '',
    length: '',
    width: '',
    area: '',
    height: '',
    lightingInfo: '',
    notes: '',
  });

  const [deleteRoomModal, setDeleteRoomModal] = useState<any | null>(null);

  // Form Data for Create Venue
  const [formData, setFormData] = useState({
    venueName: '',
    address: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
    powerInfo: 'Three-Phase 63A',
    internetInfo: '1Gbps Dedicated Fiber',
    mainVenueImage: '',
    venueDocument: '',
    venueDocumentType: 'PDF',
  });

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/venues');
      const data = await res.json();
      if (data.success) setVenues(data.venues || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'mainVenueImage' | 'venueDocument',
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
          if (field === 'mainVenueImage') {
            setEditFormData((prev) => ({ ...prev, mainVenueImage: data.url }));
          } else {
            setEditFormData((prev) => ({
              ...prev,
              venueDocument: data.url,
              venueDocumentType: data.fileType,
            }));
          }
        } else {
          if (field === 'mainVenueImage') {
            setFormData((prev) => ({ ...prev, mainVenueImage: data.url }));
          } else {
            setFormData((prev) => ({
              ...prev,
              venueDocument: data.url,
              venueDocumentType: data.fileType,
            }));
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateVenue = async () => {
    if (!canManage) return;
    try {
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      const activeEvent =
        eventsData.events?.find((e: any) => e.status === 'Active') || eventsData.events?.[0];
      const eventId = activeEvent?.id;

      const res = await fetch('/api/venues', {
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
          venueName: '',
          address: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          description: '',
          powerInfo: 'Three-Phase 63A',
          internetInfo: '1Gbps Dedicated Fiber',
          mainVenueImage: '',
          venueDocument: '',
          venueDocumentType: 'PDF',
        });
        fetchVenues();
      } else {
        alert(data.error || 'Failed to create venue');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditVenueModal = (venue: any) => {
    setEditVenueModal(venue);
    setEditFormData({
      venueName: venue.venueName || '',
      address: venue.address || '',
      contactName: venue.contactName || '',
      contactPhone: venue.contactPhone || '',
      contactEmail: venue.contactEmail || '',
      description: venue.description || '',
      powerInfo: venue.powerInfo || '',
      internetInfo: venue.internetInfo || '',
      mainVenueImage: venue.mainVenueImage || '',
      venueDocument: venue.venueDocument || '',
      venueDocumentType: venue.venueDocumentType || 'PDF',
    });
  };

  const handleUpdateVenue = async () => {
    if (!canManage || !editVenueModal) return;
    try {
      const res = await fetch(`/api/venues/${editVenueModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole,
          userName: 'Admin User',
          ...editFormData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditVenueModal(null);
        fetchVenues();
      } else {
        alert(data.error || 'Failed to update venue');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVenue = async () => {
    if (!canManage || !deleteVenueModal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/venues/${deleteVenueModal.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteVenueModal(null);
        fetchVenues();
      } else {
        alert(data.error || 'Failed to delete venue');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

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

  const openEditRoomModal = (room: any) => {
    setEditRoomModal(room);
    setEditRoomFormData({
      roomNumber: room.roomNumber || '',
      roomName: room.roomName || '',
      floor: room.floor || '',
      length: room.length || '',
      width: room.width || '',
      area: room.area || '',
      height: room.height || '',
      lightingInfo: room.lightingInfo || '',
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
        fetchVenues();
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
        fetchVenues();
      } else {
        alert(data.error || 'Failed to delete room');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-sky-400" /> Venues & Exhibition Complexes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage physical exhibition venues, PDF architectural layout files, and spatial specs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManage ? (
            <button
              onClick={() => setNewModalOpen(true)}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add New Venue
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
            <strong>Permission Notice:</strong> Editing and deleting venues and rooms is restricted to{' '}
            <span className="font-bold underline text-amber-300">SUPER ADMIN</span> role. Switch your role using the header role switcher to enable management capabilities.
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
          Loading Venues...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {venues.map((v) => (
            <div
              key={v.id}
              className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {v.mainVenueImage ? (
                      <img
                        src={v.mainVenueImage}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-sky-950 border border-sky-800 text-sky-300 font-bold flex items-center justify-center text-xl shadow-inner">
                        {v.venueName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        {v.venueName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        📍 {v.address || 'Kochi Exhibition Precinct'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      {v.rooms?.length || 0} Rooms
                    </span>

                    {/* SUPER ADMIN / EVENT ADMIN Edit & Delete buttons */}
                    {canManage && (
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                        <button
                          onClick={() => openEditVenueModal(v)}
                          title="Edit Venue"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteVenueModal(v)}
                          title="Delete Venue"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {v.description ||
                    'Primary exhibition space hosting large scale kinetic and interactive media installations.'}
                </p>

                {/* PDF or Document File Attachment Badge */}
                {v.venueDocument && (
                  <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-sky-300 font-semibold">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>Venue PDF / Structural Spec Attachment</span>
                    </div>
                    <a
                      href={v.venueDocument}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-sky-500 text-slate-950 font-bold px-3 py-1 rounded text-[11px] flex items-center gap-1 hover:bg-sky-400"
                    >
                      View Doc <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                      Power Infrastructure
                    </span>
                    <strong className="text-slate-200">{v.powerInfo || 'Standard Three-Phase'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                      Internet Connectivity
                    </span>
                    <strong className="text-slate-200">{v.internetInfo || 'High speed Fiber'}</strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Rooms & Spatial Zones:
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {v.rooms?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No rooms registered for this venue yet.
                    </p>
                  ) : (
                    v.rooms?.map((r: any) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center hover:border-slate-700 transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-200">
                            {r.roomNumber} - {r.roomName}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-2">
                            {r.floor} ({r.area || 'N/A'})
                          </span>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditRoomModal(r)}
                              title="Edit Room"
                              className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-sky-500/10"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteRoomModal(r)}
                              title="Delete Room"
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD NEW VENUE */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" /> Create New Exhibition Venue
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
                <label className="text-slate-400 block mb-1 font-semibold">Venue Name *</label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                  placeholder="e.g. Aspinwall House - Main Warehouse"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Address & Precinct</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Fort Kochi, Pier Road"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Upload Venue PDF / Structural Specs Document
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <input
                    type="file"
                    accept=".pdf,.png,.jpeg,.jpg,.webp"
                    onChange={(e) => handleFileUpload(e, 'venueDocument', false)}
                    className="text-xs text-slate-300 file:bg-sky-500 file:text-slate-950 file:font-bold file:px-2.5 file:py-1 file:rounded-lg file:border-0 hover:file:bg-sky-400 cursor-pointer w-full"
                  />
                </div>
                {formData.venueDocument && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    ✓ Attached Document: {formData.venueDocument}
                  </p>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Upload Main Venue Cover Image
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'mainVenueImage', false)}
                    className="text-xs text-slate-300 file:bg-slate-800 file:text-slate-200 file:font-semibold file:px-2.5 file:py-1 file:rounded-lg file:border-0 hover:file:bg-slate-700 cursor-pointer w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Power Specs</label>
                  <input
                    type="text"
                    value={formData.powerInfo}
                    onChange={(e) => setFormData({ ...formData, powerInfo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Internet Specs</label>
                  <input
                    type="text"
                    value={formData.internetInfo}
                    onChange={(e) => setFormData({ ...formData, internetInfo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Architectural layout and acoustic properties..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-16"
                />
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
                onClick={handleCreateVenue}
                disabled={uploading}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                {uploading ? 'Uploading...' : 'Save Venue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT VENUE */}
      {editVenueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" /> Edit Venue Details
              </h3>
              <button
                onClick={() => setEditVenueModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Venue Name *</label>
                <input
                  type="text"
                  value={editFormData.venueName}
                  onChange={(e) => setEditFormData({ ...editFormData, venueName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Address & Precinct</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              {/* PDF DOCUMENT ATTACHMENT UPLOAD */}
              <div>
                <label className="text-sky-400 font-bold block mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-400" /> Upload / Replace Venue PDF Document
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-sky-500/30 rounded-xl p-2.5 shadow-inner">
                  <Upload className="w-4 h-4 text-sky-400 shrink-0" />
                  <input
                    type="file"
                    accept=".pdf,application/pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, 'venueDocument', true)}
                    className="text-xs text-slate-300 file:bg-sky-500 file:text-slate-950 file:font-bold file:px-3 file:py-1 rounded-lg file:border-0 hover:file:bg-sky-400 cursor-pointer w-full"
                  />
                </div>
                {editFormData.venueDocument ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-sky-950/50 border border-sky-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-sky-300 font-semibold truncate max-w-[70%]">
                      <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="truncate">{editFormData.venueDocument.split('/').pop() || editFormData.venueDocument}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={editFormData.venueDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-sky-500 text-slate-950 font-bold px-2.5 py-1 rounded text-[10px] hover:bg-sky-400 flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setEditFormData((prev) => ({ ...prev, venueDocument: '' }))}
                        className="text-slate-400 hover:text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">Accepts PDF architectural layouts and structural specification documents.</p>
                )}
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Upload / Replace Cover Image
                </label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'mainVenueImage', true)}
                    className="text-xs text-slate-300 file:bg-slate-800 file:text-slate-200 file:font-semibold file:px-2.5 file:py-1 file:rounded-lg file:border-0 hover:file:bg-slate-700 cursor-pointer w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Power Specs</label>
                  <input
                    type="text"
                    value={editFormData.powerInfo}
                    onChange={(e) => setEditFormData({ ...editFormData, powerInfo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Internet Specs</label>
                  <input
                    type="text"
                    value={editFormData.internetInfo}
                    onChange={(e) => setEditFormData({ ...editFormData, internetInfo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold font-semibold">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditVenueModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateVenue}
                disabled={uploading}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                {uploading ? 'Uploading...' : 'Update Venue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE VENUE CONFIRMATION */}
      {deleteVenueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Delete Venue</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-200">{deleteVenueModal.venueName}</span>?
                This action cannot be undone and will remove all associated room records.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteVenueModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVenue}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-rose-600/20"
              >
                {deleting ? 'Deleting...' : 'Delete Venue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ROOM */}
      {editRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-sky-400" /> Edit Room Details
              </h3>
              <button onClick={() => setEditRoomModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Room Number *</label>
                  <input
                    type="text"
                    value={editRoomFormData.roomNumber}
                    onChange={(e) => setEditRoomFormData({ ...editRoomFormData, roomNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Floor</label>
                  <input
                    type="text"
                    value={editRoomFormData.floor}
                    onChange={(e) => setEditRoomFormData({ ...editRoomFormData, floor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Room Name *</label>
                <input
                  type="text"
                  value={editRoomFormData.roomName}
                  onChange={(e) => setEditRoomFormData({ ...editRoomFormData, roomName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
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
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Height</label>
                  <input
                    type="text"
                    value={editRoomFormData.height}
                    onChange={(e) => setEditRoomFormData({ ...editRoomFormData, height: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
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
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                Update Room
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
                ?
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
