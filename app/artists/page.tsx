'use client';

import ImageUploadInput from '@/components/ImageUploadInput';
import ArtistPdfExportModal from '@/components/ArtistPdfExportModal';
import SuggestImagesModal from '@/components/SuggestImagesModal';

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
  Plane,
  Hotel,
  Calendar,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

interface ArtworkFormItem {
  id?: string;
  artworkName: string;
  medium: string;
  dimensions: string;
  installationType: string;
  venueId: string;
  roomId: string;
  notes: string;
  images?: string;
}

const emptyArtworkRow = (): ArtworkFormItem => ({
  artworkName: '',
  medium: '',
  dimensions: '',
  installationType: 'Projection',
  venueId: '',
  roomId: '',
  notes: '',
  images: '',
});

export default function ArtistsPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [venuesList, setVenuesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newModalOpen, setNewModalOpen] = useState(false);

  const [userRole, setUserRole] = useState<string>('SUPER ADMIN');

  // Auto-Suggest Images Modal State
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [suggestArtistName, setSuggestArtistName] = useState('');
  const [suggestArtworkTitle, setSuggestArtworkTitle] = useState('');
  const [suggestTargetIsEdit, setSuggestTargetIsEdit] = useState(false);
  const [suggestArtworkIndex, setSuggestArtworkIndex] = useState<number | null>(0);

  const openSuggestModal = (
    artistName: string,
    artworkTitle: string,
    isEdit: boolean = false,
    artworkIdx: number | null = 0
  ) => {
    setSuggestArtistName(artistName);
    setSuggestArtworkTitle(artworkTitle);
    setSuggestTargetIsEdit(isEdit);
    setSuggestArtworkIndex(artworkIdx);
    setSuggestModalOpen(true);
  };

  // Modal active tab
  const [modalTab, setModalTab] = useState<'PROFILE' | 'ARTWORKS' | 'TRAVEL' | 'TEAM'>('PROFILE');
  const [curatorsList, setCuratorsList] = useState<any[]>([]);
  const [teamsData, setTeamsData] = useState<{ programming?: any[]; production?: any[]; spatial?: any[] }>({});

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

  // Strict restriction: Only Super Admin and Programming Team can Add, Edit, Delete artists & details
  const canEditOrDelete = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'ADMIN',
    'PROGRAMMING TEAM',
    'PROGRAMMING',
    'PROGRAMMER',
    'PROGRAMMERS',
    'PROGRAMMING HEAD',
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

  // Allowed Roles for Advanced Sorting & Filtering Controls
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
    arrivalDate: '',
    departureDate: '',
    travelNotes: '',
    lodgingDetails: '',
    curatorIds: [] as string[],
    programmingIds: [] as string[],
    productionIds: [] as string[],
    spatialDesignerIds: [] as string[],
    artworks: [emptyArtworkRow()] as ArtworkFormItem[],
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
    arrivalDate: '',
    departureDate: '',
    travelNotes: '',
    lodgingDetails: '',
    curatorIds: [] as string[],
    programmingIds: [] as string[],
    productionIds: [] as string[],
    spatialDesignerIds: [] as string[],
    artworks: [] as ArtworkFormItem[],
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
      arrivalDate: '',
      departureDate: '',
      travelNotes: '',
      lodgingDetails: '',
      curatorIds: [],
      programmingIds: [],
      productionIds: [],
      spatialDesignerIds: [],
      artworks: [emptyArtworkRow()],
    });
    setFormError(null);
    setModalTab('PROFILE');
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
      const [artistsRes, venuesRes, curatorsRes, teamsRes] = await Promise.all([
        fetch('/api/artists'),
        fetch('/api/venues'),
        fetch('/api/curators'),
        fetch('/api/team'),
      ]);

      const artistsData = await artistsRes.json();
      const venuesData = await venuesRes.json();
      const curatorsData = await curatorsRes.json();
      const teamsDataRes = await teamsRes.json();

      if (artistsData.success) setArtists(artistsData.artists);
      if (venuesData.success) setVenuesList(venuesData.venues);
      if (curatorsData.success) setCuratorsList(curatorsData.curators || []);
      if (teamsDataRes.success) setTeamsData(teamsDataRes.teams || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = fetchArtistsAndVenues;

  // Artwork Rows Helper Functions
  const addArtworkRow = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData((prev) => ({
        ...prev,
        artworks: [...prev.artworks, emptyArtworkRow()],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        artworks: [...prev.artworks, emptyArtworkRow()],
      }));
    }
  };

  const updateArtworkRow = (
    index: number,
    field: keyof ArtworkFormItem,
    value: string,
    isEdit: boolean = false
  ) => {
    if (isEdit) {
      setEditFormData((prev) => {
        const updated = [...prev.artworks];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'venueId') updated[index].roomId = '';
        return { ...prev, artworks: updated };
      });
    } else {
      setFormData((prev) => {
        const updated = [...prev.artworks];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'venueId') updated[index].roomId = '';
        return { ...prev, artworks: updated };
      });
    }
  };

  const removeArtworkRow = (index: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData((prev) => ({
        ...prev,
        artworks: prev.artworks.filter((_, i) => i !== index),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        artworks: prev.artworks.filter((_, i) => i !== index),
      }));
    }
  };

  const handleCreateArtist = async () => {
    if (!canEditOrDelete) {
      setFormError('Access Restricted: Only Super Admin and Programming Team can create artists.');
      return;
    }
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

        setArtists((prev) => {
          const exists = prev.some((a) => a.id === newArtist.id);
          return exists ? prev : [newArtist, ...prev];
        });

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
    if (!canEditOrDelete) {
      alert('Access Restricted: Only Super Admin and Programming Team can edit artists.');
      return;
    }
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
      arrivalDate: art.arrivalDate || '',
      departureDate: art.departureDate || '',
      travelNotes: art.travelNotes || '',
      lodgingDetails: art.lodgingDetails || '',
      curatorIds: (art.curatorAssignments || []).map((ca: any) => ca.curatorId),
      programmingIds: (art.programmingAssignments || []).map((pa: any) => pa.programmingPersonId),
      productionIds: (art.productionAssignments || []).map((pa: any) => pa.productionPersonId),
      spatialDesignerIds: (art.spatialAssignments || []).map((sa: any) => sa.spatialDesignerId),
      artworks: (art.artworks || []).map((aw: any) => ({
        id: aw.id,
        artworkName: aw.artworkName || '',
        medium: aw.medium || '',
        dimensions: aw.dimensions || '',
        installationType: aw.installationType || 'Projection',
        venueId: aw.venueId || '',
        roomId: aw.roomId || '',
        notes: aw.notes || aw.description || '',
      })),
    });
    if ((art.artworks || []).length === 0) {
      setEditFormData((prev) => ({ ...prev, artworks: [emptyArtworkRow()] }));
    }
    setFormError(null);
    setModalTab('PROFILE');
    setEditModalOpen(true);
  };

  const handleUpdateArtist = async () => {
    if (!editingArtist) return;
    if (!canEditOrDelete) {
      setFormError('Access Restricted: Only Super Admin and Programming Team can edit artists.');
      return;
    }
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
        body: JSON.stringify({ userRole, ...editFormData }),
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
    if (!canEditOrDelete) {
      alert('Access Restricted: Only Super Admin and Programming Team can delete artists.');
      return;
    }
    setDeletingArtist(art);
    setDeleteModalOpen(true);
  };

  const handleDeleteArtist = async () => {
    if (!deletingArtist) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/artists/${deletingArtist.id}?userRole=${encodeURIComponent(userRole)}`, {
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
    new Set([
      ...artists.flatMap((a) => a.artworks?.map((aw: any) => aw.artworkName)).filter(Boolean),
    ])
  ).filter(Boolean).sort() as string[];

  const filteredArtworkSuggestions = availableArtworks.filter((awName) =>
    awName.toLowerCase().includes(artworkInput.toLowerCase().trim())
  );

  // Filter & Sort Logic
  const filteredArtists = artists
    .filter((a) => {
      // Search Bar Filter
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.artistName?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q) ||
        a.country?.toLowerCase().includes(q) ||
        a.biography?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q);

      // Artist Filter
      const matchesArtist = selectedArtist === 'ALL' || a.artistName === selectedArtist;

      // Venue Filter
      const matchesVenue =
        selectedVenue === 'ALL' ||
        a.installations?.some((i: any) => i.venue?.venueName === selectedVenue) ||
        a.artworks?.some((aw: any) => aw.venue?.venueName === selectedVenue);

      // Room Filter
      const matchesRoom =
        selectedRoom === 'ALL' ||
        a.installations?.some(
          (i: any) => i.room?.roomNumber === selectedRoom || i.room?.roomName === selectedRoom
        ) ||
        a.artworks?.some(
          (aw: any) => aw.room?.roomNumber === selectedRoom || aw.room?.roomName === selectedRoom
        );

      // Artwork Filter
      const activeArtworkFilter = selectedArtwork || artworkInput.trim();
      const matchesArtwork =
        !activeArtworkFilter ||
        a.artworks?.some((aw: any) =>
          aw.artworkName?.toLowerCase().includes(activeArtworkFilter.toLowerCase())
        );

      return matchesSearch && matchesArtist && matchesVenue && matchesRoom && matchesArtwork;
    })
    .sort((a, b) => {
      if (sortBy === 'ARTIST_ASC') return a.artistName.localeCompare(b.artistName);
      if (sortBy === 'ARTIST_DESC') return b.artistName.localeCompare(a.artistName);
      if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER & TOP CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-400" /> Artists Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage festival artists, artworks with venue & room allocation, and travel & lodging details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH INPUT */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artists by name, city..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* REGISTER NEW ARTIST BUTTON (Restricted to Super Admin & Programming Team) */}
          {canEditOrDelete ? (
            <button
              onClick={() => {
                resetForm();
                setNewModalOpen(true);
              }}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register New Artist
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Add/Edit Restricted (Super Admin & Programming)</span>
            </div>
          )}
        </div>
      </div>

      {/* ADVANCED FILTERING & SORTING CONTROLS */}
      {showAdvancedSorting && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" /> Advanced Artist Directory Filters
            </span>
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-semibold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* 1. Artist Select */}
            <div>
              <label className="text-slate-400 block mb-1">Artist Name</label>
              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Artists ({availableArtistNames.length})</option>
                {availableArtistNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Venue Select */}
            <div>
              <label className="text-slate-400 block mb-1">Exhibition Venue</label>
              <select
                value={selectedVenue}
                onChange={(e) => {
                  setSelectedVenue(e.target.value);
                  setSelectedRoom('ALL');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Venues</option>
                {availableVenues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Room Select */}
            <div>
              <label className="text-slate-400 block mb-1">Room / Gallery</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Rooms</option>
                {availableRooms.map((r) => (
                  <option key={r} value={r}>
                    Room {r}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Artwork Title Filter */}
            <div className="relative" ref={artworkContainerRef}>
              <label className="text-slate-400 block mb-1">Artwork Title</label>
              <input
                type="text"
                value={artworkInput}
                onFocus={() => setShowArtworkSuggestions(true)}
                onChange={(e) => {
                  setArtworkInput(e.target.value);
                  setSelectedArtwork('');
                  setShowArtworkSuggestions(true);
                }}
                placeholder="Search artwork title..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 focus:border-sky-500 focus:outline-none"
              />
              {showArtworkSuggestions && filteredArtworkSuggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-40 overflow-y-auto py-1">
                  {filteredArtworkSuggestions.map((awName) => (
                    <div
                      key={awName}
                      onClick={() => {
                        setArtworkInput(awName);
                        setSelectedArtwork(awName);
                        setShowArtworkSuggestions(false);
                      }}
                      className="px-3 py-1.5 hover:bg-slate-800 text-slate-200 cursor-pointer text-xs flex items-center justify-between"
                    >
                      <span>{awName}</span>
                      <Palette className="w-3 h-3 text-purple-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Sort By */}
            <div>
              <label className="text-slate-400 block mb-1">Sort Alphabetically / Date</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 focus:border-sky-500 focus:outline-none font-semibold"
              >
                <option value="ARTIST_ASC">Artist Name (A → Z)</option>
                <option value="ARTIST_DESC">Artist Name (Z → A)</option>
                <option value="NEWEST">Recently Added First</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ARTIST CARDS DIRECTORY GRID */}
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
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-sky-400 bg-sky-950/60 px-3 py-1.5 rounded-xl border border-sky-800 hover:bg-sky-900 transition-all font-semibold cursor-pointer"
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

                  {/* Travel & Lodging Badge */}
                  {(art.arrivalDate || art.departureDate) && (
                    <div className="mt-3 p-2 rounded-xl bg-[#1e1b4b]/50 border border-[#4338ca]/40 text-[11px] text-indigo-300 flex items-center gap-2">
                      <Plane className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div className="flex flex-wrap items-center gap-2">
                        {art.arrivalDate && <span>Arr: <strong className="text-white">{art.arrivalDate}</strong></span>}
                        {art.departureDate && <span>Dep: <strong className="text-white">{art.departureDate}</strong></span>}
                      </div>
                    </div>
                  )}

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

                  {/* Artwork Tags with Assigned Venue */}
                  {art.artworks && art.artworks.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      {art.artworks.map((aw: any) => (
                        <div
                          key={aw.id}
                          className="p-1.5 rounded-lg bg-purple-950/30 border border-purple-800/40 text-[10px] text-purple-200 flex items-center justify-between gap-2"
                        >
                          <span className="font-bold flex items-center gap-1 truncate">
                            <Palette className="w-3 h-3 text-purple-400 shrink-0" /> {aw.artworkName}
                          </span>
                          {(aw.venue || aw.room) && (
                            <span className="text-[9px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 shrink-0 flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" /> {aw.venue?.venueName || ''} {aw.room ? `(${aw.room.roomNumber || aw.room.roomName})` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Team & Curatorial Assignment Badges */}
                  <div className="mt-2.5 flex flex-wrap gap-1 text-[10px]">
                    {art.curatorAssignments?.map((ca: any) => (
                      <span key={ca.id} className="px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800/60 font-semibold flex items-center gap-1">
                        👑 {ca.curator?.name}
                      </span>
                    ))}
                    {art.programmingAssignments?.map((pa: any) => (
                      <span key={pa.id} className="px-2 py-0.5 rounded-full bg-sky-950/70 text-sky-300 border border-sky-800/60 font-semibold flex items-center gap-1">
                        🎯 {pa.programmingPerson?.name}
                      </span>
                    ))}
                    {art.productionAssignments?.map((pa: any) => (
                      <span key={pa.id} className="px-2 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-800/60 font-semibold flex items-center gap-1">
                        🛠️ {pa.productionPerson?.name}
                      </span>
                    ))}
                    {art.spatialAssignments?.map((sa: any) => (
                      <span key={sa.id} className="px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-semibold flex items-center gap-1">
                        📐 {sa.spatialDesigner?.name}
                      </span>
                    ))}
                  </div>

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

                  {/* EXPORT PDF BUTTON */}
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

                  {/* EDIT & DELETE BUTTONS (Restricted to Super Admin & Programming Team) */}
                  {canEditOrDelete && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => openEditModal(art)}
                        className="flex-1 bg-slate-800/90 hover:bg-sky-600 hover:text-white text-sky-400 text-xs font-semibold py-1.5 px-3 rounded-xl border border-sky-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Edit Artist Information"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(art)}
                        className="bg-red-950/80 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold py-1.5 px-3 rounded-xl border border-red-800/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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

      {/* MODAL: ADD NEW ARTIST (TABBED / COMPREHENSIVE) */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <User className="w-5 h-5 text-sky-400" /> Register New Artist
                </h3>
                <p className="text-[11px] text-slate-400">Capture artist profile, artwork details with venue/room, and travel dates.</p>
              </div>
              <button onClick={() => setNewModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('PROFILE')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'PROFILE'
                    ? 'bg-sky-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" /> 1. Artist Profile
              </button>
              <button
                type="button"
                onClick={() => setModalTab('ARTWORKS')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'ARTWORKS'
                    ? 'bg-purple-500 text-white font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Palette className="w-3.5 h-3.5" /> 2. Artworks ({formData.artworks.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('TRAVEL')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'TRAVEL'
                    ? 'bg-indigo-500 text-white font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Plane className="w-3.5 h-3.5" /> 3. Travel & Lodging
              </button>
              <button
                type="button"
                onClick={() => setModalTab('TEAM')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'TEAM'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> 4. Team & Curators
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            {/* TAB 1: ARTIST PROFILE */}
            {modalTab === 'PROFILE' && (
              <div className="space-y-3.5 text-xs animate-in fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 block">Artist Name *</label>
                    <button
                      type="button"
                      onClick={() => openSuggestModal(formData.artistName, formData.artworks[0]?.artworkName || '', false, 0)}
                      className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-950/60 border border-sky-800/80 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" /> Auto-Suggest Images
                    </button>
                  </div>
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
                  onSuggestImages={() => openSuggestModal(formData.artistName, formData.artworks[0]?.artworkName || '', false, 0)}
                  placeholder="https://... or upload local image file"
                />

                <div className="grid grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-slate-400 block mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+381 61 234 5678"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Biography</label>
                  <textarea
                    value={formData.biography}
                    onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                    placeholder="Short bio and artistic statement..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-20 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: ARTWORK DETAILS & VENUE/ROOM ASSIGNMENT */}
            {modalTab === 'ARTWORKS' && (
              <div className="space-y-4 text-xs max-h-[380px] overflow-y-auto pr-1 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-purple-400" /> Artworks by {formData.artistName || 'Artist'}
                  </span>
                  <button
                    type="button"
                    onClick={() => addArtworkRow(false)}
                    className="bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Artwork
                  </button>
                </div>

                {formData.artworks.map((aw, idx) => {
                  const selectedVenueObj = venuesList.find((v) => v.id === aw.venueId);
                  const roomOptions = selectedVenueObj?.rooms || [];

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-purple-900/40 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-extrabold text-purple-300 text-xs flex items-center gap-1.5">
                          Artwork #{idx + 1}
                        </span>
                        {formData.artworks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArtworkRow(idx, false)}
                            className="text-red-400 hover:text-red-300 cursor-pointer p-1"
                            title="Remove Artwork"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-400 block">Artwork Title *</label>
                            <button
                              type="button"
                              onClick={() => openSuggestModal(formData.artistName, aw.artworkName, false, idx)}
                              className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-950/60 border border-purple-800/80 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" /> Auto-Suggest
                            </button>
                          </div>
                          <input
                            type="text"
                            value={aw.artworkName}
                            onChange={(e) => updateArtworkRow(idx, 'artworkName', e.target.value, false)}
                            placeholder="e.g. Echoes of Light"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Medium / Material</label>
                          <input
                            type="text"
                            value={aw.medium}
                            onChange={(e) => updateArtworkRow(idx, 'medium', e.target.value, false)}
                            placeholder="e.g. 4K Projection, Kinetic Sound"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1">Dimensions / Scale</label>
                          <input
                            type="text"
                            value={aw.dimensions}
                            onChange={(e) => updateArtworkRow(idx, 'dimensions', e.target.value, false)}
                            placeholder="e.g. 5m x 3m x 2m"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Installation Type</label>
                          <select
                            value={aw.installationType}
                            onChange={(e) => updateArtworkRow(idx, 'installationType', e.target.value, false)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                          >
                            <option value="Projection">Projection</option>
                            <option value="Hanging">Hanging</option>
                            <option value="Floor">Floor / Sculpture</option>
                            <option value="Interactive">Interactive / Digital</option>
                            <option value="Sound">Sound Installation</option>
                            <option value="Outdoor Pavilion">Outdoor Pavilion</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* VENUE AND ROOM ASSIGNMENT */}
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
                        <div>
                          <label className="text-slate-400 block mb-1 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-amber-400" /> Assign Exhibition Venue
                          </label>
                          <select
                            value={aw.venueId}
                            onChange={(e) => updateArtworkRow(idx, 'venueId', e.target.value, false)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="">Unassigned Venue</option>
                            {venuesList.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.venueName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 flex items-center gap-1">
                            <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> Assign Room / Space
                          </label>
                          <select
                            value={aw.roomId}
                            disabled={!aw.venueId}
                            onChange={(e) => updateArtworkRow(idx, 'roomId', e.target.value, false)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
                          >
                            <option value="">Unassigned Room</option>
                            {roomOptions.map((r: any) => (
                              <option key={r.id} value={r.id}>
                                Room {r.roomNumber} ({r.roomName})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Description / Technical Notes</label>
                        <input
                          type="text"
                          value={aw.notes}
                          onChange={(e) => updateArtworkRow(idx, 'notes', e.target.value, false)}
                          placeholder="Special installation instructions..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: TRAVEL & LODGING DETAILS */}
            {modalTab === 'TRAVEL' && (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 space-y-3">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-indigo-400" /> Travel Dates
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date of Arrival
                      </label>
                      <input
                        type="date"
                        value={formData.arrivalDate}
                        onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date of Departure
                      </label>
                      <input
                        type="date"
                        value={formData.departureDate}
                        onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 flex items-center gap-1">
                    <Plane className="w-3.5 h-3.5 text-indigo-400" /> Flight & Travel Details
                  </label>
                  <textarea
                    value={formData.travelNotes}
                    onChange={(e) => setFormData({ ...formData, travelNotes: e.target.value })}
                    placeholder="Flight numbers, arrival terminal, airport transfer notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-16 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 flex items-center gap-1">
                    <Hotel className="w-3.5 h-3.5 text-indigo-400" /> Hotel & Lodging Details
                  </label>
                  <textarea
                    value={formData.lodgingDetails}
                    onChange={(e) => setFormData({ ...formData, lodgingDetails: e.target.value })}
                    placeholder="Hotel name, room booking confirmation, check-in instructions..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-16 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: TEAM & CURATORS (ADD) */}
            {modalTab === 'TEAM' && (
              <div className="space-y-4 text-xs animate-in fade-in max-h-[60vh] overflow-y-auto pr-1">
                {/* Curator Selection */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                      👑 Select Curator ({formData.curatorIds.length} selected)
                    </label>
                  </div>
                  {curatorsList.length === 0 ? (
                    <p className="text-[11px] text-slate-500">No curators found in database.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {curatorsList.map((c) => {
                        const isChecked = formData.curatorIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="truncate font-semibold">
                              <span>{c.name}</span>
                              {c.category && <span className="block text-[10px] text-slate-400 truncate">{c.category}</span>}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setFormData({ ...formData, curatorIds: [...formData.curatorIds, c.id] });
                                else setFormData({ ...formData, curatorIds: formData.curatorIds.filter((id) => id !== c.id) });
                              }}
                              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Programming Team Selection */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-sky-300 font-bold flex items-center gap-1.5 text-xs">
                    🎯 Programming Team (Multiple: {formData.programmingIds.length} selected)
                  </label>
                  {(!teamsData.programming || teamsData.programming.length === 0) ? (
                    <p className="text-[11px] text-slate-500">No Programming team members found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {teamsData.programming.map((p) => {
                        const isChecked = formData.programmingIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-sky-950/40 border-sky-500/60 text-sky-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="truncate font-semibold">
                              <span>{p.name}</span>
                              {p.role && <span className="block text-[10px] text-slate-400 truncate">{p.role}</span>}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setFormData({ ...formData, programmingIds: [...formData.programmingIds, p.id] });
                                else setFormData({ ...formData, programmingIds: formData.programmingIds.filter((id) => id !== p.id) });
                              }}
                              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Production Team Selection */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-purple-300 font-bold flex items-center gap-1.5 text-xs">
                    🛠️ Production Team (Multiple: {formData.productionIds.length} selected)
                  </label>
                  {(!teamsData.production || teamsData.production.length === 0) ? (
                    <p className="text-[11px] text-slate-500">No Production team members found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {teamsData.production.map((pr) => {
                        const isChecked = formData.productionIds.includes(pr.id);
                        return (
                          <label
                            key={pr.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-purple-950/40 border-purple-500/60 text-purple-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="truncate font-semibold">
                              <span>{pr.name}</span>
                              {pr.role && <span className="block text-[10px] text-slate-400 truncate">{pr.role}</span>}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setFormData({ ...formData, productionIds: [...formData.productionIds, pr.id] });
                                else setFormData({ ...formData, productionIds: formData.productionIds.filter((id) => id !== pr.id) });
                              }}
                              className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Spatial Designers Selection */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-emerald-300 font-bold flex items-center gap-1.5 text-xs">
                    📐 Spatial Designers (Multiple: {formData.spatialDesignerIds.length} selected)
                  </label>
                  {(!teamsData.spatial || teamsData.spatial.length === 0) ? (
                    <p className="text-[11px] text-slate-500">No Spatial Designers registered yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {teamsData.spatial.map((sd) => {
                        const isChecked = formData.spatialDesignerIds.includes(sd.id);
                        return (
                          <label
                            key={sd.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="truncate font-semibold">
                              <span>{sd.name}</span>
                              {sd.role && <span className="block text-[10px] text-slate-400 truncate">{sd.role}</span>}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setFormData({ ...formData, spatialDesignerIds: [...formData.spatialDesignerIds, sd.id] });
                                else setFormData({ ...formData, spatialDesignerIds: formData.spatialDesignerIds.filter((id) => id !== sd.id) });
                              }}
                              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {modalTab !== 'PROFILE' && (
                  <button
                    type="button"
                    onClick={() => setModalTab(modalTab === 'TRAVEL' ? 'ARTWORKS' : 'PROFILE')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Back
                  </button>
                )}
                {modalTab !== 'TRAVEL' && (
                  <button
                    type="button"
                    onClick={() => setModalTab(modalTab === 'PROFILE' ? 'ARTWORKS' : 'TRAVEL')}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-950 text-sky-400 hover:bg-sky-900 border border-sky-800 text-xs font-bold"
                  >
                    Next Step →
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateArtist}
                  disabled={submitting}
                  className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
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
        </div>
      )}

      {/* MODAL: EDIT ARTIST (TABBED / COMPREHENSIVE) */}
      {editModalOpen && editingArtist && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-sky-400" /> Edit Artist: {editingArtist.artistName}
                </h3>
                <p className="text-[11px] text-slate-400">Update artist profile, artwork venue & room assignments, and travel dates.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('PROFILE')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'PROFILE'
                    ? 'bg-sky-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" /> 1. Profile Details
              </button>
              <button
                type="button"
                onClick={() => setModalTab('ARTWORKS')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'ARTWORKS'
                    ? 'bg-purple-500 text-white font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Palette className="w-3.5 h-3.5" /> 2. Artworks ({editFormData.artworks.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('TRAVEL')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'TRAVEL'
                    ? 'bg-indigo-500 text-white font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Plane className="w-3.5 h-3.5" /> 3. Travel & Lodging
              </button>
              <button
                type="button"
                onClick={() => setModalTab('TEAM')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'TEAM'
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> 4. Team & Curators
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            {/* TAB 1: ARTIST PROFILE */}
            {modalTab === 'PROFILE' && (
              <div className="space-y-3.5 text-xs animate-in fade-in">
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

                <div className="grid grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Biography</label>
                  <textarea
                    value={editFormData.biography}
                    onChange={(e) => setEditFormData({ ...editFormData, biography: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-20 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: ARTWORK DETAILS & VENUE/ROOM ASSIGNMENT */}
            {modalTab === 'ARTWORKS' && (
              <div className="space-y-4 text-xs max-h-[380px] overflow-y-auto pr-1 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-purple-400" /> Artworks by {editFormData.artistName}
                  </span>
                  <button
                    type="button"
                    onClick={() => addArtworkRow(true)}
                    className="bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Artwork
                  </button>
                </div>

                {editFormData.artworks.map((aw, idx) => {
                  const selectedVenueObj = venuesList.find((v) => v.id === aw.venueId);
                  const roomOptions = selectedVenueObj?.rooms || [];

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-950 border border-purple-900/40 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-extrabold text-purple-300 text-xs flex items-center gap-1.5">
                          Artwork #{idx + 1}
                        </span>
                        {editFormData.artworks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArtworkRow(idx, true)}
                            className="text-red-400 hover:text-red-300 cursor-pointer p-1"
                            title="Remove Artwork"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1">Artwork Title *</label>
                          <input
                            type="text"
                            value={aw.artworkName}
                            onChange={(e) => updateArtworkRow(idx, 'artworkName', e.target.value, true)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Medium / Material</label>
                          <input
                            type="text"
                            value={aw.medium}
                            onChange={(e) => updateArtworkRow(idx, 'medium', e.target.value, true)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1">Dimensions / Scale</label>
                          <input
                            type="text"
                            value={aw.dimensions}
                            onChange={(e) => updateArtworkRow(idx, 'dimensions', e.target.value, true)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Installation Type</label>
                          <select
                            value={aw.installationType}
                            onChange={(e) => updateArtworkRow(idx, 'installationType', e.target.value, true)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                          >
                            <option value="Projection">Projection</option>
                            <option value="Hanging">Hanging</option>
                            <option value="Floor">Floor / Sculpture</option>
                            <option value="Interactive">Interactive / Digital</option>
                            <option value="Sound">Sound Installation</option>
                            <option value="Outdoor Pavilion">Outdoor Pavilion</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* VENUE AND ROOM ASSIGNMENT */}
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
                        <div>
                          <label className="text-slate-400 block mb-1 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-amber-400" /> Assign Exhibition Venue
                          </label>
                          <select
                            value={aw.venueId}
                            onChange={(e) => updateArtworkRow(idx, 'venueId', e.target.value, true)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="">Unassigned Venue</option>
                            {venuesList.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.venueName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 flex items-center gap-1">
                            <DoorOpen className="w-3.5 h-3.5 text-emerald-400" /> Assign Room / Space
                          </label>
                          <select
                            value={aw.roomId}
                            disabled={!aw.venueId}
                            onChange={(e) => updateArtworkRow(idx, 'roomId', e.target.value, true)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
                          >
                            <option value="">Unassigned Room</option>
                            {roomOptions.map((r: any) => (
                              <option key={r.id} value={r.id}>
                                Room {r.roomNumber} ({r.roomName})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Description / Technical Notes</label>
                        <input
                          type="text"
                          value={aw.notes}
                          onChange={(e) => updateArtworkRow(idx, 'notes', e.target.value, true)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: TRAVEL & LODGING DETAILS */}
            {modalTab === 'TRAVEL' && (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 space-y-3">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-indigo-400" /> Travel Dates
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date of Arrival
                      </label>
                      <input
                        type="date"
                        value={editFormData.arrivalDate}
                        onChange={(e) => setEditFormData({ ...editFormData, arrivalDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date of Departure
                      </label>
                      <input
                        type="date"
                        value={editFormData.departureDate}
                        onChange={(e) => setEditFormData({ ...editFormData, departureDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 flex items-center gap-1">
                    <Plane className="w-3.5 h-3.5 text-indigo-400" /> Flight & Travel Details
                  </label>
                  <textarea
                    value={editFormData.travelNotes}
                    onChange={(e) => setEditFormData({ ...editFormData, travelNotes: e.target.value })}
                    placeholder="Flight numbers, arrival terminal, airport transfer notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-16 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 flex items-center gap-1">
                    <Hotel className="w-3.5 h-3.5 text-indigo-400" /> Hotel & Lodging Details
                  </label>
                  <textarea
                    value={editFormData.lodgingDetails}
                    onChange={(e) => setEditFormData({ ...editFormData, lodgingDetails: e.target.value })}
                    placeholder="Hotel name, room booking confirmation, check-in instructions..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-16 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: TEAM & CURATORS (EDIT) */}
            {modalTab === 'TEAM' && (
              <div className="space-y-4 text-xs animate-in fade-in max-h-[60vh] overflow-y-auto pr-1">
                {/* Curator Selection */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                    👑 Select Curator ({editFormData.curatorIds.length} selected)
                  </label>
                  {curatorsList.length === 0 ? (
                    <p className="text-[11px] text-slate-500">No curators found in database.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {curatorsList.map((c) => {
                        const isChecked = editFormData.curatorIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="truncate font-semibold">
                              <span>{c.name}</span>
                              {c.category && <span className="block text-[10px] text-slate-400 truncate">{c.category}</span>}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setEditFormData({ ...editFormData, curatorIds: [...editFormData.curatorIds, c.id] });
                                else setEditFormData({ ...editFormData, curatorIds: editFormData.curatorIds.filter((id) => id !== c.id) });
                              }}
                              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Programming Team Selection */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-sky-300 font-bold flex items-center gap-1.5 text-xs">
                    🎯 Programming Team (Multiple: {editFormData.programmingIds.length} selected)
                  </label>
                  {(!teamsData.programming || teamsData.programming.length === 0) ? (
                    <p className="text-[11px] text-slate-500">No Programming team members found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {teamsData.programming.map((p) => {
                        const isChecked = editFormData.programmingIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-sky-950/40 border-sky-500/60 text-sky-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="truncate font-semibold">
                              <span>{p.name}</span>
                              {p.role && <span className="block text-[10px] text-slate-400 truncate">{p.role}</span>}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setEditFormData({ ...editFormData, programmingIds: [...editFormData.programmingIds, p.id] });
                                else setEditFormData({ ...editFormData, programmingIds: editFormData.programmingIds.filter((id) => id !== p.id) });
                              }}
                              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Production Team Selection */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-purple-300 font-bold flex items-center gap-1.5 text-xs">
                    🛠️ Production Team (Multiple: {editFormData.productionIds.length} selected)
                  </label>
                  {(!teamsData.production || teamsData.production.length === 0) ? (
                    <p className="text-[11px] text-slate-500">No Production team members found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {teamsData.production.map((pr) => {
                        const isChecked = editFormData.productionIds.includes(pr.id);
                        return (
                          <label
                            key={pr.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-purple-950/40 border-purple-500/60 text-purple-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="truncate font-semibold">
                              <span>{pr.name}</span>
                              {pr.role && <span className="block text-[10px] text-slate-400 truncate">{pr.role}</span>}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setEditFormData({ ...editFormData, productionIds: [...editFormData.productionIds, pr.id] });
                                else setEditFormData({ ...editFormData, productionIds: editFormData.productionIds.filter((id) => id !== pr.id) });
                              }}
                              className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Spatial Designers Selection */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="text-emerald-300 font-bold flex items-center gap-1.5 text-xs">
                    📐 Spatial Designers (Multiple: {editFormData.spatialDesignerIds.length} selected)
                  </label>
                  {(!teamsData.spatial || teamsData.spatial.length === 0) ? (
                    <p className="text-[11px] text-slate-500">No Spatial Designers registered yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {teamsData.spatial.map((sd) => {
                        const isChecked = editFormData.spatialDesignerIds.includes(sd.id);
                        return (
                          <label
                            key={sd.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="truncate font-semibold">
                              <span>{sd.name}</span>
                              {sd.role && <span className="block text-[10px] text-slate-400 truncate">{sd.role}</span>}
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setEditFormData({ ...editFormData, spatialDesignerIds: [...editFormData.spatialDesignerIds, sd.id] });
                                else setEditFormData({ ...editFormData, spatialDesignerIds: editFormData.spatialDesignerIds.filter((id) => id !== sd.id) });
                              }}
                              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {modalTab !== 'PROFILE' && (
                  <button
                    type="button"
                    onClick={() => setModalTab(modalTab === 'TRAVEL' ? 'ARTWORKS' : 'PROFILE')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Back
                  </button>
                )}
                {modalTab !== 'TRAVEL' && (
                  <button
                    type="button"
                    onClick={() => setModalTab(modalTab === 'PROFILE' ? 'ARTWORKS' : 'TRAVEL')}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-950 text-sky-400 hover:bg-sky-900 border border-sky-800 text-xs font-bold"
                  >
                    Next Step →
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateArtist}
                  disabled={submitting}
                  className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {submitting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
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
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteArtist}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
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

      {/* AUTO-SUGGEST PROFILE & ARTWORK IMAGES MODAL */}
      <SuggestImagesModal
        isOpen={suggestModalOpen}
        onClose={() => setSuggestModalOpen(false)}
        initialArtistName={suggestArtistName}
        initialArtworkTitle={suggestArtworkTitle}
        onSelectProfileImage={(url) => {
          if (suggestTargetIsEdit) {
            setEditFormData((prev) => ({ ...prev, artistPhoto: url }));
          } else {
            setFormData((prev) => ({ ...prev, artistPhoto: url }));
          }
        }}
        onSelectArtworkImage={(url) => {
          const targetIdx = suggestArtworkIndex ?? 0;
          if (suggestTargetIsEdit) {
            setEditFormData((prev) => {
              const updated = [...prev.artworks];
              if (updated[targetIdx]) {
                updated[targetIdx] = { ...updated[targetIdx], images: url };
              }
              return { ...prev, artworks: updated };
            });
          } else {
            setFormData((prev) => {
              const updated = [...prev.artworks];
              if (updated[targetIdx]) {
                updated[targetIdx] = { ...updated[targetIdx], images: url };
              }
              return { ...prev, artworks: updated };
            });
          }
        }}
      />
    </div>
  );
}
