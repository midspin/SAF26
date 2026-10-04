'use client';

import React, { useEffect, useState } from 'react';
import SuggestImagesModal from '@/components/SuggestImagesModal';
import {
  Palette,
  Plus,
  Search,
  Sparkles,
  Upload,
  FileText,
  Eye,
  X,
  Edit3,
  Trash2,
  Lock,
  AlertTriangle,
  ExternalLink,
  Layers,
  User,
  Info,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtistFilter, setSelectedArtistFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Role State
  const [userRole, setUserRole] = useState<string>('SUPER ADMIN');

  // Modal States
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<any | null>(null);

  // Auto-Suggest Images Modal State
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [suggestArtistName, setSuggestArtistName] = useState('');
  const [suggestArtworkTitle, setSuggestArtworkTitle] = useState('');
  const [suggestIsEdit, setSuggestIsEdit] = useState(false);

  const openSuggestModal = (artistId: string, artworkTitle: string, isEdit: boolean = false) => {
    const artistObj = artists.find((a) => a.id === artistId);
    setSuggestArtistName(artistObj?.artistName || '');
    setSuggestArtworkTitle(artworkTitle);
    setSuggestIsEdit(isEdit);
    setSuggestModalOpen(true);
  };
  const [deleteModal, setDeleteModal] = useState<any | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    title: string;
    url: string;
    type: string;
  } | null>(null);

  // Form State for Adding New Artwork
  const [formData, setFormData] = useState({
    artistId: '',
    artworkName: '',
    installationType: 'Projection',
    medium: '',
    dimensions: '',
    weight: '',
    images: '', // JSON string array
    description: '',
    notes: '',
  });

  // Form State for Editing Artwork
  const [editFormData, setEditFormData] = useState({
    artistId: '',
    artworkName: '',
    installationType: 'Projection',
    medium: '',
    dimensions: '',
    weight: '',
    images: '', // JSON string array
    description: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const canManage = ['SUPER ADMIN', 'PROGRAMMING', 'PROGRAMMER', 'PROGRAMMERS'].includes(
    (userRole || '').trim().toUpperCase()
  );

  const fetchArtworks = async () => {
    try {
      const res = await fetch('/api/artworks');
      const data = await res.json();
      if (data.success) setArtworks(data.artworks || []);
    } catch (err) {
      console.error('Failed to fetch artworks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const res = await fetch('/api/artists');
      const data = await res.json();
      if (data.success) setArtists(data.artists || []);
    } catch (err) {
      console.error('Failed to fetch artists:', err);
    }
  };

  useEffect(() => {
    fetchArtworks();
    fetchArtists();
  }, []);

  // Helper to parse image JSON string or fallback to array
  const parseImageList = (rawImages: string | null | undefined): string[] => {
    if (!rawImages) return [];
    try {
      if (typeof rawImages === 'string' && rawImages.trim().startsWith('[')) {
        const parsed = JSON.parse(rawImages);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      }
    } catch (e) {}
    return typeof rawImages === 'string' ? [rawImages].filter(Boolean) : [];
  };

  // Multiple File Upload Handler
  const handleMultipleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        if (isEdit) {
          const existing = parseImageList(editFormData.images);
          const updated = [...existing, ...uploadedUrls];
          setEditFormData((prev) => ({ ...prev, images: JSON.stringify(updated) }));
        } else {
          const existing = parseImageList(formData.images);
          const updated = [...existing, ...uploadedUrls];
          setFormData((prev) => ({ ...prev, images: JSON.stringify(updated) }));
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  // Remove individual file from list
  const removeFileFromList = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      const existing = parseImageList(editFormData.images);
      const updated = existing.filter((_, i) => i !== index);
      setEditFormData((prev) => ({ ...prev, images: JSON.stringify(updated) }));
    } else {
      const existing = parseImageList(formData.images);
      const updated = existing.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, images: JSON.stringify(updated) }));
    }
  };

  // Submit New Artwork
  const handleCreateArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.artworkName.trim() || !formData.artistId) {
      alert('Please fill in Artwork Title and select an Artist');
      return;
    }

    setSubmitting(true);
    try {
      let eventId = null;
      try {
        const eventsRes = await fetch('/api/events');
        const eventsData = await eventsRes.json();
        const activeEvent =
          eventsData.events?.find((ev: any) => ev.status === 'Active') || eventsData.events?.[0];
        eventId = activeEvent?.id;
      } catch (e) {
        console.error('Failed to fetch active event:', e);
      }

      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewModalOpen(false);
        setFormData({
          artistId: '',
          artworkName: '',
          installationType: 'Projection',
          medium: '',
          dimensions: '',
          weight: '',
          images: '',
          description: '',
          notes: '',
        });
        fetchArtworks();
      } else {
        alert(data.error || 'Failed to create artwork');
      }
    } catch (err) {
      console.error('Error creating artwork:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (artwork: any) => {
    setEditModal(artwork);
    setEditFormData({
      artistId: artwork.artistId || '',
      artworkName: artwork.artworkName || '',
      installationType: artwork.installationType || 'Projection',
      medium: artwork.medium || '',
      dimensions: artwork.dimensions || '',
      weight: artwork.weight || '',
      images: artwork.images || '',
      description: artwork.description || '',
      notes: artwork.notes || '',
    });
  };

  // Submit Edit Artwork
  const handleUpdateArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/artworks/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (data.success) {
        setEditModal(null);
        fetchArtworks();
      } else {
        alert(data.error || 'Failed to update artwork');
      }
    } catch (err) {
      console.error('Error updating artwork:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Artwork
  const handleDeleteArtwork = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/artworks/${deleteModal.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModal(null);
        fetchArtworks();
      } else {
        alert(data.error || 'Failed to delete artwork');
      }
    } catch (err) {
      console.error('Error deleting artwork:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Artworks Computation
  const filteredArtworks = artworks.filter((art) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesArtist = selectedArtistFilter === 'ALL' || art.artistId === selectedArtistFilter;
    const matchesType = selectedTypeFilter === 'ALL' || art.installationType === selectedTypeFilter;

    if (!query) return matchesArtist && matchesType;

    const matchesTitle = (art.artworkName || '').toLowerCase().includes(query);
    const matchesArtistName = (art.artist?.artistName || '').toLowerCase().includes(query);
    const matchesMedium = (art.medium || '').toLowerCase().includes(query);
    const matchesDescription = (art.description || '').toLowerCase().includes(query);

    return matchesArtist && matchesType && (matchesTitle || matchesArtistName || matchesMedium || matchesDescription);
  });

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <Palette className="w-7 h-7 text-sky-400" /> Artworks Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Exhibition artworks, mediums, dimensions, spatial installation specs, and multi-file documentation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canManage ? (
            <button
              onClick={() => setNewModalOpen(true)}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add New Artwork
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3.5 py-2 rounded-xl">
              <Lock className="w-3.5 h-3.5" />
              <span>Read-Only Mode ({userRole})</span>
            </div>
          )}
        </div>
      </div>

      {/* READ-ONLY NOTICE FOR OTHER ROLES */}
      {!canManage && (
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <strong>Permission Notice:</strong> Creating, editing, or deleting artworks is restricted to{' '}
            <span className="font-bold underline text-amber-300">SUPER ADMIN</span> &{' '}
            <span className="font-bold underline text-amber-300">PROGRAMMING</span> roles.
          </div>
        </div>
      )}

      {/* SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#1c1c2a] p-3.5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* SEARCH INPUT */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Artwork Title, Artist, Medium, or Description..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ARTIST FILTER DROPDOWN */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <User className="w-3.5 h-3.5 text-sky-400" /> Artist:
            </label>
            <select
              value={selectedArtistFilter}
              onChange={(e) => setSelectedArtistFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ALL">🎨 All Artists ({artists.length})</option>
              {artists.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.artistName}
                </option>
              ))}
            </select>
          </div>

          {/* INSTALLATION TYPE FILTER */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-sky-400" /> Category:
            </label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ALL">📦 All Types</option>
              <option value="Projection">🎥 Projection</option>
              <option value="Hanging">🖼️ Hanging</option>
              <option value="Floor">🧱 Floor / Sculptural</option>
              <option value="Interactive">⚡ Interactive</option>
              <option value="Outdoor">🏛️ Outdoor / Pavilion</option>
              <option value="Sound / Video">🔊 Sound / Video</option>
            </select>
          </div>
        </div>

        {/* ARTWORK COUNTER */}
        <div className="text-xs text-slate-400 font-semibold px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0 text-center">
          Showing <strong className="text-sky-400">{filteredArtworks.length}</strong> of {artworks.length} Artworks
        </div>
      </div>

      {/* ARTWORKS LIST GRID */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
          Loading Artworks...
        </div>
      ) : filteredArtworks.length === 0 ? (
        <div className="p-12 text-center bg-[#1c1c2a] rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-2">
          <p>No artworks match your current search or filter query.</p>
          {canManage && (
            <button
              onClick={() => setNewModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-sky-400 hover:underline font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Artwork Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArtworks.map((art) => {
            const files = parseImageList(art.images);

            return (
              <div
                key={art.id}
                className="bg-[#1c1c2a] p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3.5 shadow-lg group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Installation Type & Action Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-sky-950 text-sky-300 border border-sky-800/80">
                      {art.installationType || 'Projection'}
                    </span>

                    {canManage && (
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
                        <button
                          onClick={() => openEditModal(art)}
                          title="Edit Artwork"
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(art)}
                          title="Delete Artwork"
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Multiple Images / PDF Documents Preview Grid */}
                  {files.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-sky-400" /> Attachments ({files.length})
                        </span>
                        <span className="text-[9px] text-slate-500">Click to preview</span>
                      </div>

                      <div
                        className={`grid gap-1.5 ${
                          files.length === 1
                            ? 'grid-cols-1'
                            : files.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                        }`}
                      >
                        {files.map((fileUrl, idx) => {
                          const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                          const fileName = fileUrl.split('/').pop() || `File ${idx + 1}`;

                          return (
                            <div
                              key={idx}
                              onClick={() =>
                                setPreviewModal({
                                  title: `${art.artworkName} - Attachment #${idx + 1}`,
                                  url: fileUrl,
                                  type: isPdf ? 'PDF' : 'IMAGE',
                                })
                              }
                              className="relative h-28 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 hover:border-sky-500/60 transition-colors cursor-pointer group/thumb flex items-center justify-center p-1"
                              title={fileName}
                            >
                              {isPdf ? (
                                <div className="flex flex-col items-center justify-center text-center p-1 text-slate-400">
                                  <FileText className="w-7 h-7 text-emerald-400 mb-1" />
                                  <span className="text-[9px] font-bold text-slate-300 truncate max-w-[90px]">
                                    {fileName}
                                  </span>
                                </div>
                              ) : (
                                <img
                                  src={fileUrl}
                                  alt={`${art.artworkName} #${idx + 1}`}
                                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 rounded-lg"
                                />
                              )}
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye className="w-4 h-4 text-sky-300" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                      <Palette className="w-8 h-8 opacity-30" />
                    </div>
                  )}

                  {/* Artwork Title & Artist */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-50 line-clamp-1">
                      {art.artworkName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      Artist: <strong className="text-slate-200 font-bold">{art.artist?.artistName || 'Unassigned'}</strong>
                    </p>
                  </div>

                  {/* Specs Summary Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Medium</span>
                      <strong className="truncate block font-semibold">{art.medium || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Dimensions</span>
                      <strong className="text-sky-400 truncate block font-semibold">{art.dimensions || 'N/A'}</strong>
                    </div>
                    {art.weight && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 block">Weight / Load</span>
                        <strong className="truncate block font-semibold">{art.weight}</strong>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {art.description && (
                    <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 line-clamp-3 leading-relaxed">
                      {art.description}
                    </p>
                  )}
                </div>

                {/* Spatial Allocations Badge */}
                {art.installations && art.installations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Allocated to:{' '}
                      <strong className="text-emerald-300">
                        {art.installations[0]?.room?.roomName ||
                          art.installations[0]?.venue?.venueName ||
                          'Assigned Room'}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW ARTWORK MODAL */}
      {newModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Palette className="w-5 h-5 text-sky-400" /> Register New Artwork
              </h3>
              <button
                onClick={() => setNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArtwork} className="space-y-4 text-xs">
              {/* SELECT ARTIST */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Select Artist <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.artistId}
                  onChange={(e) => setFormData({ ...formData, artistId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="">-- Choose Artist --</option>
                  {artists.map((art) => (
                    <option key={art.id} value={art.id}>
                      🎨 {art.artistName} {art.country ? `(${art.country})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ARTWORK TITLE & INSTALLATION CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold block">
                      Artwork Title <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => openSuggestModal(formData.artistId, formData.artworkName, false)}
                      className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-950/60 border border-sky-800/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" /> Auto-Suggest Images
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Whispers of the Cosmos"
                    value={formData.artworkName}
                    onChange={(e) => setFormData({ ...formData, artworkName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Installation Category</label>
                  <select
                    value={formData.installationType}
                    onChange={(e) => setFormData({ ...formData, installationType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Projection">🎥 Projection</option>
                    <option value="Hanging">🖼️ Hanging</option>
                    <option value="Floor">🧱 Floor / Sculptural</option>
                    <option value="Interactive">⚡ Interactive</option>
                    <option value="Outdoor">🏛️ Outdoor / Pavilion</option>
                    <option value="Sound / Video">🔊 Sound / Video</option>
                  </select>
                </div>
              </div>

              {/* MEDIUM, DIMENSIONS & WEIGHT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Medium</label>
                  <input
                    type="text"
                    placeholder="e.g. Video Installation"
                    value={formData.medium}
                    onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 3000 x 2000 mm"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Weight / Load</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 kg"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* MULTIPLE FILES UPLOAD FIELD */}
              <div className="space-y-2">
                <label className="text-sky-400 font-bold block">
                  🖼️ Upload Artwork Images & PDF Spec Sheets (Select Multiple Files)
                </label>

                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpeg,.jpg,.webp"
                    onChange={(e) => handleMultipleFileUpload(e, false)}
                    className="text-xs text-slate-300 file:bg-sky-500 file:text-slate-950 file:font-bold file:px-3 file:py-1 file:rounded-lg file:border-0 hover:file:bg-sky-400 cursor-pointer w-full"
                  />
                </div>

                {uploading && (
                  <p className="text-[11px] text-sky-400 font-semibold animate-pulse">
                    Uploading selected files...
                  </p>
                )}

                {/* UPLOADED FILES DRAFT LIST */}
                {parseImageList(formData.images).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-bold block">
                      Attached Files ({parseImageList(formData.images).length}):
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {parseImageList(formData.images).map((fileUrl, idx) => {
                        const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                        const name = fileUrl.split('/').pop() || `File #${idx + 1}`;

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-slate-200 text-xs"
                          >
                            <span className="flex items-center gap-2 truncate">
                              {isPdf ? (
                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                              )}
                              <span className="truncate max-w-[320px] font-mono text-[11px]">
                                {name}
                              </span>
                            </span>

                            <button
                              type="button"
                              onClick={() => removeFileFromList(idx, false)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded hover:bg-rose-500/10 transition-colors shrink-0"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Artwork Concept / Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed description or curatorial concept..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* TECHNICAL NOTES */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Technical & Spatial Installation Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Power requirements, rigging points, blackout requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save & Register Artwork'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ARTWORK MODAL */}
      {editModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" /> Edit Artwork: {editModal.artworkName}
              </h3>
              <button
                onClick={() => setEditModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateArtwork} className="space-y-4 text-xs">
              {/* SELECT ARTIST */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Artist</label>
                <select
                  required
                  value={editFormData.artistId}
                  onChange={(e) => setEditFormData({ ...editFormData, artistId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  {artists.map((art) => (
                    <option key={art.id} value={art.id}>
                      🎨 {art.artistName}
                    </option>
                  ))}
                </select>
              </div>

              {/* ARTWORK TITLE & INSTALLATION CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Artwork Title</label>
                  <input
                    type="text"
                    required
                    value={editFormData.artworkName}
                    onChange={(e) => setEditFormData({ ...editFormData, artworkName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Installation Category</label>
                  <select
                    value={editFormData.installationType}
                    onChange={(e) => setEditFormData({ ...editFormData, installationType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Projection">🎥 Projection</option>
                    <option value="Hanging">🖼️ Hanging</option>
                    <option value="Floor">🧱 Floor / Sculptural</option>
                    <option value="Interactive">⚡ Interactive</option>
                    <option value="Outdoor">🏛️ Outdoor / Pavilion</option>
                    <option value="Sound / Video">🔊 Sound / Video</option>
                  </select>
                </div>
              </div>

              {/* MEDIUM, DIMENSIONS & WEIGHT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Medium</label>
                  <input
                    type="text"
                    value={editFormData.medium}
                    onChange={(e) => setEditFormData({ ...editFormData, medium: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={editFormData.dimensions}
                    onChange={(e) => setEditFormData({ ...editFormData, dimensions: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Weight / Load</label>
                  <input
                    type="text"
                    value={editFormData.weight}
                    onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* EDIT MULTIPLE FILES UPLOAD FIELD */}
              <div className="space-y-2">
                <label className="text-sky-400 font-bold block">
                  🖼️ Add More Images or PDF Spec Sheets (Select Multiple)
                </label>

                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpeg,.jpg,.webp"
                    onChange={(e) => handleMultipleFileUpload(e, true)}
                    className="text-xs text-slate-300 file:bg-sky-500 file:text-slate-950 file:font-bold file:px-3 file:py-1 file:rounded-lg file:border-0 hover:file:bg-sky-400 cursor-pointer w-full"
                  />
                </div>

                {uploading && (
                  <p className="text-[11px] text-sky-400 font-semibold animate-pulse">
                    Uploading selected files...
                  </p>
                )}

                {/* UPLOADED FILES EDIT LIST */}
                {parseImageList(editFormData.images).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-bold block">
                      Current Attachments ({parseImageList(editFormData.images).length}):
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {parseImageList(editFormData.images).map((fileUrl, idx) => {
                        const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                        const name = fileUrl.split('/').pop() || `File #${idx + 1}`;

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-slate-200 text-xs"
                          >
                            <span className="flex items-center gap-2 truncate">
                              {isPdf ? (
                                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                              )}
                              <span className="truncate max-w-[320px] font-mono text-[11px]">
                                {name}
                              </span>
                            </span>

                            <button
                              type="button"
                              onClick={() => removeFileFromList(idx, true)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded hover:bg-rose-500/10 transition-colors shrink-0"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Artwork Concept / Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* TECHNICAL NOTES */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Technical Installation Notes</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20"
                >
                  {submitting ? 'Updating...' : 'Update Artwork'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Delete Artwork</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-bold text-slate-200">"{deleteModal.artworkName}"</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteArtwork}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-rose-600/20"
              >
                {deleting ? 'Deleting...' : 'Delete Artwork'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {previewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Palette className="w-5 h-5 text-sky-400" /> {previewModal.title}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-sky-400"
                >
                  Open Original <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 rounded-xl p-2 flex items-center justify-center border border-slate-800">
              {previewModal.type === 'PDF' ? (
                <iframe
                  src={previewModal.url}
                  className="w-full h-[70vh] rounded-lg border-0"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={previewModal.url}
                  alt={previewModal.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* AUTO-SUGGEST PROFILE & ARTWORK IMAGES MODAL */}
      <SuggestImagesModal
        isOpen={suggestModalOpen}
        onClose={() => setSuggestModalOpen(false)}
        initialArtistName={suggestArtistName}
        initialArtworkTitle={suggestArtworkTitle}
        onSelectArtworkImage={(url) => {
          if (suggestIsEdit) {
            setEditFormData((prev: any) => {
              const currentList = parseImageList(prev.images);
              const updatedList = Array.from(new Set([url, ...currentList]));
              return { ...prev, images: JSON.stringify(updatedList) };
            });
          } else {
            setFormData((prev: any) => {
              const currentList = parseImageList(prev.images);
              const updatedList = Array.from(new Set([url, ...currentList]));
              return { ...prev, images: JSON.stringify(updatedList) };
            });
          }
        }}
      />
    </div>
  );
}
