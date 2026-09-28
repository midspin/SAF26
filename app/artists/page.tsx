'use client';

import ImageUploadInput from '@/components/ImageUploadInput';
import ArtistPdfExportModal from '@/components/ArtistPdfExportModal';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  X,
  CheckCircle2,
  Check,
  Edit3,
  Trash2,
  AlertTriangle,
  Building2,
  DoorOpen,
  Palette,
  User,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  FileText,
} from 'lucide-react';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [venuesList, setVenuesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newModalOpen, setNewModalOpen] = useState(false);

  // User Role State
  const [userRole, setUserRole] = useState<string>('SUPER ADMIN');

  // Advanced Filter & Sort States
  const [selectedVenue, setSelectedVenue] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [artworkInput, setArtworkInput] = useState<string>('');
  const [selectedArtwork, setSelectedArtwork] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('ARTIST_ASC');
  const [showArtworkSuggestions, setShowArtworkSuggestions] = useState<boolean>(false);

  const artworkContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        artworkContainerRef.current &&
        !artworkContainerRef.current.contains(event.target as Node)
      ) {
        setShowArtworkSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const normalizedRole = (userRole || '').trim().toUpperCase();

  const canEditOrDelete = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'PROGRAMMING TEAM',
    'PROGRAMMING',
    'PROGRAMMER',
    'PROGRAMMERS',
  ].includes(normalizedRole);

  // Export PDF permission: Super admin, Technical team, Inventory team
  const canExportPDF = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'TECHNICAL TEAM',
    'TECHNICAL HEAD',
    'TECH HEAD',
    'INVENTORY TEAM',
    'INVENTORY MANAGER',
    'INVENTORY HEAD',
    'INVENTORY',
  ].includes(normalizedRole);

  // PDF Export Modal State
  const [pdfExportModalOpen, setPdfExportModalOpen] = useState(false);
  const [pdfExportArtistId, setPdfExportArtistId] = useState<string | null>(null);
  const [pdfExportArtistData, setPdfExportArtistData] = useState<any | null>(null);

  // Allowed Roles for Advanced Sorting & Filtering Controls:
  const allowedFilterRoles = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'TECHNICAL TEAM',
    'PRODUCTION TEAM',
    'PROGRAMMING TEAM',
    'INVENTORY TEAM',
    'PROGRAMMING',
    'PROGRAMMER',
    'PROGRAMMERS',
    'TECHNICAL HEAD',
    'TECH HEAD',
    'PRODUCTION & LAYOUT',
    'PRODUCTION AND LAYOUT',
    'INVENTORY MANAGER',
    'INVENTORY HEAD',
    'INVENTORY',
    'VENUE MANAGER',
    'TECHNICAL INSTALLATION',
    'TECH INSTALLATION',
    'TECH INSTALL TEAM',
  ];

  const showAdvancedSorting = allowedFilterRoles.includes(normalizedRole);

  // Success Tick Animation State
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [addedArtistName, setAddedArtistName] = useState('');
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // New Artist Form State
  const [formData, setFormData] = useState({
    artistName: '',
    artistPhoto: '',
    country: '',
    city: '',
    email: '',
    phone: '',
    website: '',
    biography: '',
    status: 'Confirmed',
  });

  // Edit Artist Form State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    artistName: '',
    artistPhoto: '',
    country: '',
    city: '',
    email: '',
    phone: '',
    website: '',
    biography: '',
    status: 'Confirmed',
  });

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingArtist, setDeletingArtist] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      artistName: '',
      artistPhoto: '',
      country: '',
      city: '',
      email: '',
      phone: '',
      website: '',
      biography: '',
      status: 'Confirmed',
    });
    setFormError(null);
  };

  const clearAllFilters = () => {
    setSearch('');
    setSelectedArtist('ALL');
    setSelectedVenue('ALL');
    setSelectedRoom('ALL');
    setArtworkInput('');
    setSelectedArtwork('');
    setSortBy('ARTIST_ASC');
  };

  useEffect(() => {
    fetchArtistsAndVenues();
  }, []);

  const fetchArtistsAndVenues = async () => {
    setLoading(true);
    try {
      const [artistsRes, venuesRes] = await Promise.all([
        fetch('/api/artists'),
        fetch('/api/venues'),
      ]);

      const artistsData = await artistsRes.json();
      const venuesData = await venuesRes.json();

      if (artistsData.success) setArtists(artistsData.artists);
      if (venuesData.success) setVenuesList(venuesData.venues);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = fetchArtistsAndVenues;

  const handleCreateArtist = async () => {
    if (!formData.artistName.trim()) {
      setFormError('Artist Name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      let eventId = null;
      try {
        const eventsRes = await fetch('/api/events');
        const eventsData = await eventsRes.json();
        const activeEvent =
          eventsData.events?.find((e: any) => e.status === 'Active') || eventsData.events?.[0];
        eventId = activeEvent?.id;
      } catch (e) {
        console.error('Failed to fetch events:', e);
      }

      const res = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userRole, ...formData }),
      });
      const data = await res.json();
      if (data.success && data.artist) {
        const newArtist = data.artist;
        setNewModalOpen(false);
        resetForm();

        // Immediately insert new artist card into local list
        setArtists((prev) => {
          const exists = prev.some((a) => a.id === newArtist.id);
          return exists ? prev : [newArtist, ...prev];
        });

        // Trigger center screen tick success animation
        setAddedArtistName(newArtist.artistName);
        setNewlyAddedId(newArtist.id);
        setShowSuccessAnimation(true);

        setTimeout(() => {
          setShowSuccessAnimation(false);
        }, 2200);

        setTimeout(() => {
          setNewlyAddedId(null);
        }, 6000);

        fetchArtists();
      } else {
        setFormError(data.error || 'Failed to create artist.');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Network error occurred while creating artist.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (art: any) => {
    setEditingArtist(art);
    setEditFormData({
      artistName: art.artistName || '',
      artistPhoto: art.artistPhoto || '',
      country: art.country || '',
      city: art.city || '',
      email: art.email || '',
      phone: art.phone || '',
      website: art.website || '',
      biography: art.biography || '',
      status: art.status || 'Confirmed',
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleUpdateArtist = async () => {
    if (!editingArtist) return;
    if (!editFormData.artistName.trim()) {
      setFormError('Artist Name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/artists/${editingArtist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingArtist(null);
        fetchArtists();
      } else {
        setFormError(data.error || 'Failed to update artist.');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error updating artist.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (art: any) => {
    setDeletingArtist(art);
    setDeleteModalOpen(true);
  };

  const handleDeleteArtist = async () => {
    if (!deletingArtist) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/artists/${deletingArtist.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setDeletingArtist(null);
        setArtists((prev) => prev.filter((a) => a.id !== deletingArtist.id));
      } else {
        alert(data.error || 'Failed to delete artist.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error deleting artist.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Derive unique lists for dropdowns
  const availableArtistNames = Array.from(
    new Set(artists.map((a) => a.artistName).filter(Boolean))
  ).sort() as string[];

  const availableVenues = Array.from(
    new Set([
      ...venuesList.map((v) => v.venueName),
      ...artists.flatMap((a) => a.installations?.map((i: any) => i.venue?.venueName)).filter(Boolean),
    ])
  ).filter(Boolean).sort() as string[];

  const availableRooms = Array.from(
    new Set([
      ...venuesList
        .filter((v) => selectedVenue === 'ALL' || v.venueName === selectedVenue)
        .flatMap((v) => v.rooms?.map((r: any) => r.roomNumber || r.roomName))
        .filter(Boolean),
      ...artists
        .flatMap((a) =>
          a.installations
            ?.filter((i: any) => selectedVenue === 'ALL' || i.venue?.venueName === selectedVenue)
            .map((i: any) => i.room?.roomNumber || i.room?.roomName)
        )
        .filter(Boolean),
    ])
  ).filter(Boolean).sort((a: string, b: string) =>
    a.localeCompare(b, undefined, { numeric: true })
  ) as string[];

  const availableArtworks = Array.from(
    new Set(artists.flatMap((a) => a.artworks?.map((aw: any) => aw.artworkName)).filter(Boolean))
  ).sort() as string[];

  const matchingArtworkSuggestions =
    artworkInput.trim().length >= 3
      ? availableArtworks.filter((name) =>
          name.toLowerCase().includes(artworkInput.toLowerCase())
        )
      : [];

  const filteredArtists = artists
    .filter((a) => {
      // General Search Query Filter
      const matchesSearch =
        !search ||
        a.artistName.toLowerCase().includes(search.toLowerCase()) ||
        (a.country && a.country.toLowerCase().includes(search.toLowerCase())) ||
        (a.email && a.email.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (!showAdvancedSorting) return true;

      // 1. Artist Name Filter
      if (selectedArtist !== 'ALL' && a.artistName !== selectedArtist) {
        return false;
      }

      // 2. Venue Filter
      if (selectedVenue !== 'ALL') {
        const hasVenue = a.installations?.some(
          (inst: any) => inst.venue?.venueName === selectedVenue
        );
        if (!hasVenue) return false;
      }

      // 3. Room Number Filter
      if (selectedRoom !== 'ALL') {
        const hasRoom = a.installations?.some(
          (inst: any) =>
            inst.room?.roomNumber === selectedRoom || inst.room?.roomName === selectedRoom
        );
        if (!hasRoom) return false;
      }

      // 4. Artwork Name Filter (3-letter autofill / exact selection)
      const queryArtwork = (selectedArtwork || artworkInput).trim();
      if (queryArtwork.length >= 3) {
        const hasArtwork = a.artworks?.some((aw: any) =>
          aw.artworkName.toLowerCase().includes(queryArtwork.toLowerCase())
        );
        if (!hasArtwork) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (!showAdvancedSorting) return 0;

      if (sortBy === 'ARTIST_ASC') {
        return a.artistName.localeCompare(b.artistName);
      }
      if (sortBy === 'ARTIST_DESC') {
        return b.artistName.localeCompare(a.artistName);
      }
      if (sortBy === 'VENUE_ASC') {
        const vA = a.installations?.[0]?.venue?.venueName || 'ZZZ';
        const vB = b.installations?.[0]?.venue?.venueName || 'ZZZ';
        return vA.localeCompare(vB);
      }
      if (sortBy === 'ROOM_ASC') {
        const rA = a.installations?.[0]?.room?.roomNumber || a.installations?.[0]?.room?.roomName || 'ZZZ';
        const rB = b.installations?.[0]?.room?.roomNumber || b.installations?.[0]?.room?.roomName || 'ZZZ';
        return rA.localeCompare(rB, undefined, { numeric: true });
      }
      if (sortBy === 'ARTWORK_ASC') {
        const artA = a.artworks?.[0]?.artworkName || 'ZZZ';
        const artB = b.artworks?.[0]?.artworkName || 'ZZZ';
        return artA.localeCompare(artB);
      }
      return 0;
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-sky-400" /> Artists Directory & 360° Management
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Manage artists, artworks, curator links, technical & production requirements</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-sky-400 border border-slate-700">
              Role: {userRole}
            </span>
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setNewModalOpen(true);
          }}
          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Artist
        </button>
      </div>

      {/* Basic Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 flex-1 focus-within:border-sky-500">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by artist name, country, or email..."
            className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Advanced Filter & Sorting Toolbar (Role-Restricted) */}
      {showAdvancedSorting && (
        <div className="glass-card p-4 rounded-2xl border border-sky-500/30 space-y-3 bg-slate-900/60 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                Role Management Filters & Sorting
              </h3>
              <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800/60 font-semibold">
                Active Role Privileges Enabled
              </span>
            </div>
            {(selectedArtist !== 'ALL' ||
              selectedVenue !== 'ALL' ||
              selectedRoom !== 'ALL' ||
              artworkInput !== '' ||
              sortBy !== 'ARTIST_ASC') && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-slate-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-sky-400" /> Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Artist Name Dropdown */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-sky-400" /> Artist Name
              </label>
              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Artists ({availableArtistNames.length})</option>
                {availableArtistNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Venue Dropdown */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" /> Venue
              </label>
              <select
                value={selectedVenue}
                onChange={(e) => {
                  setSelectedVenue(e.target.value);
                  setSelectedRoom('ALL');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Venues ({availableVenues.length})</option>
                {availableVenues.map((vName) => (
                  <option key={vName} value={vName}>
                    {vName}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Room Number Dropdown */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> Room Number
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Rooms ({availableRooms.length})</option>
                {availableRooms.map((rName) => (
                  <option key={rName} value={rName}>
                    Room {rName}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Artwork Name (3-letter Auto-fill) */}
            <div className="relative" ref={artworkContainerRef}>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-purple-400" /> Artwork Name{' '}
                <span className="text-[9px] text-slate-400 font-normal">(3+ letters autofill)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={artworkInput}
                  onChange={(e) => {
                    setArtworkInput(e.target.value);
                    setSelectedArtwork(e.target.value);
                    setShowArtworkSuggestions(true);
                  }}
                  onFocus={() => setShowArtworkSuggestions(true)}
                  placeholder="Type 3+ letters..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                />
                {artworkInput && (
                  <button
                    onClick={() => {
                      setArtworkInput('');
                      setSelectedArtwork('');
                      setShowArtworkSuggestions(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 3-letter Auto-fill Suggestion Box */}
              {showArtworkSuggestions && artworkInput.trim().length >= 3 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800/80">
                  {matchingArtworkSuggestions.length > 0 ? (
                    matchingArtworkSuggestions.map((artName) => (
                      <button
                        key={artName}
                        type="button"
                        onClick={() => {
                          setArtworkInput(artName);
                          setSelectedArtwork(artName);
                          setShowArtworkSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-purple-950/80 hover:text-purple-300 transition-colors flex items-center justify-between"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <Palette className="w-3 h-3 text-purple-400 shrink-0" /> {artName}
                        </span>
                        <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-800 shrink-0">
                          Auto-fill
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2.5 text-[11px] text-slate-500 italic">
                      No matching artwork found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. Sort Order */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" /> Sort Order
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="ARTIST_ASC">Artist Name (A-Z)</option>
                <option value="ARTIST_DESC">Artist Name (Z-A)</option>
                <option value="VENUE_ASC">Venue Name</option>
                <option value="ROOM_ASC">Room Number</option>
                <option value="ARTWORK_ASC">Artwork Name</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Artists Directory Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading Artists Directory...</p>
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="p-12 text-center text-slate-500 glass-card rounded-2xl border border-slate-800">
          <p className="text-sm font-semibold">No artists found matching selected filters.</p>
          {showAdvancedSorting && (
            <button
              onClick={clearAllFilters}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-sky-400 bg-sky-950/60 px-3 py-1.5 rounded-xl border border-sky-800 hover:bg-sky-900 transition-all font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArtists.map((art) => {
            const isNewlyAdded = art.id === newlyAddedId;

            return (
              <div
                key={art.id}
                className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isNewlyAdded
                    ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-emerald-950/20 ring-2 ring-emerald-500/50 scale-[1.02]'
                    : 'border-slate-800 hover:border-sky-500/40'
                }`}
              >
                {isNewlyAdded && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[9px] px-3 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" /> Newly Added
                  </div>
                )}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      {art.artistPhoto ? (
                        <img
                          src={art.artistPhoto}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-sky-950 text-sky-300 font-bold flex items-center justify-center border border-sky-800">
                          {art.artistName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                          {art.artistName}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          📍 {art.city ? `${art.city}, ` : ''}
                          {art.country || 'International'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {art.status}
                    </span>
                  </div>

                  {/* Venue & Room Tags */}
                  {art.installations && art.installations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                      {art.installations.map((inst: any) => (
                        <span
                          key={inst.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/50 font-medium"
                        >
                          <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{inst.venue?.venueName || 'Venue'}</span>
                          {inst.room && (
                            <span className="flex items-center gap-0.5 text-amber-200">
                              • <DoorOpen className="w-3 h-3 text-emerald-400 shrink-0" /> Room{' '}
                              {inst.room.roomNumber || inst.room.roomName}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Artwork Tags */}
                  {art.artworks && art.artworks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                      {art.artworks.map((aw: any) => (
                        <span
                          key={aw.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-800/50"
                        >
                          <Palette className="w-3 h-3 text-purple-400 shrink-0" />{' '}
                          <span className="truncate max-w-[150px]">{aw.artworkName}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-300 line-clamp-2 mt-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    {art.biography || 'No bio recorded yet.'}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[11px] text-slate-400 text-center">
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <span className="block text-[9px] text-slate-500 uppercase">Artworks</span>
                      <strong className="text-slate-200">{art.artworks?.length || 0}</strong>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <span className="block text-[9px] text-slate-500 uppercase">Curator</span>
                      <strong className="text-slate-200">{art.curatorAssignments?.length || 0}</strong>
                    </div>
                    <div className="bg-slate-900/80 p-1.5 rounded">
                      <span className="block text-[9px] text-slate-500 uppercase">Allocated</span>
                      <strong className="text-sky-400">{art._count?.allocations || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Link
                    href={`/artists/${art.id}`}
                    className="w-full bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-400 font-bold text-xs py-2 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    Open Artist 360° View <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>

                  {/* EXPORT PDF BUTTON (Visible to Super admin, Technical Head, Inventory manager) */}
                  {canExportPDF && (
                    <button
                      onClick={() => {
                        setPdfExportArtistId(art.id);
                        setPdfExportArtistData(art);
                        setPdfExportModalOpen(true);
                      }}
                      className="w-full bg-[#1c1c2a] hover:bg-[#38bdf8] hover:text-slate-950 text-[#38bdf8] font-bold text-xs py-2 rounded-xl border border-[#38bdf8]/30 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Export technical docket
                    </button>
                  )}

                  {/* EDIT & DELETE BUTTONS */}
                  {canEditOrDelete && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => openEditModal(art)}
                        className="flex-1 bg-slate-800/90 hover:bg-sky-600 hover:text-white text-sky-400 text-xs font-semibold py-1.5 px-3 rounded-xl border border-sky-500/30 transition-all flex items-center justify-center gap-1.5"
                        title="Edit Artist Information"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(art)}
                        className="bg-red-950/80 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold py-1.5 px-3 rounded-xl border border-red-800/60 transition-all flex items-center justify-center gap-1.5"
                        title="Delete Artist"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN CENTER-SCREEN TICK SUCCESS ANIMATION OVERLAY */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl text-center space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.3)] transform scale-100 transition-all max-w-sm w-full flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-emerald-950/90 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.5)] animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 stroke-[2.5]" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-700/80 mb-1">
                <Check className="w-3 h-3" /> SUCCESS
              </span>
              <h3 className="text-lg font-black text-slate-50 tracking-wide">Artist Registered!</h3>
              <p className="text-xs text-emerald-300 font-semibold mt-1">
                &ldquo;{addedArtistName}&rdquo; added to directory
              </p>
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW ARTIST */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Register New Artist</h3>
              <button onClick={() => setNewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Artist Name *</label>
                <input
                  type="text"
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  placeholder="e.g. Marina Abramović"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <ImageUploadInput
                label="Artist Photo Image"
                value={formData.artistPhoto}
                onChange={(url) => setFormData({ ...formData, artistPhoto: url })}
                placeholder="https://... or upload local image file"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. Serbia"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Belgrade"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="artist@studio.art"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Biography</label>
                <textarea
                  value={formData.biography}
                  onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                  placeholder="Short bio and artistic focus..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-16 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setNewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateArtist}
                disabled={submitting}
                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" /> Registering...
                  </>
                ) : (
                  'Create Artist Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ARTIST */}
      {editModalOpen && editingArtist && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" /> Edit Artist: {editingArtist.artistName}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Artist Name *</label>
                <input
                  type="text"
                  value={editFormData.artistName}
                  onChange={(e) => setEditFormData({ ...editFormData, artistName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <ImageUploadInput
                label="Artist Photo Image"
                value={editFormData.artistPhoto}
                onChange={(url) => setEditFormData({ ...editFormData, artistPhoto: url })}
                placeholder="https://... or upload local image file"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Country</label>
                  <input
                    type="text"
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="In Discussion">In Discussion</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Biography</label>
                <textarea
                  value={editFormData.biography}
                  onChange={(e) => setEditFormData({ ...editFormData, biography: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-16 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateArtist}
                disabled={submitting}
                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                {submitting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteModalOpen && deletingArtist && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-800/80 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 border border-red-800/80 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-100">Delete Artist Profile?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete <strong className="text-white">&ldquo;{deletingArtist.artistName}&rdquo;</strong>?
                This action will remove their record and associated artwork assignments.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteArtist}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                {isDeleting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Delete Artist'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARTIST PDF EXPORT MODAL */}
      <ArtistPdfExportModal
        artistId={pdfExportArtistId}
        isOpen={pdfExportModalOpen}
        onClose={() => setPdfExportModalOpen(false)}
        initialArtistData={pdfExportArtistData}
      />
    </div>
  );
}
