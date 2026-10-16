'use client';

import dynamic from 'next/dynamic';
import ImageUploadInput from '@/components/ImageUploadInput';

const ArtistPdfExportModal = dynamic(() => import('@/components/ArtistPdfExportModal'), { ssr: false });
const SuggestImagesModal = dynamic(() => import('@/components/SuggestImagesModal'), { ssr: false });

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
  ChevronDown,
  ChevronRight,
  Upload,
  Lock,
  ExternalLink,
  Image as ImageIcon,
  Briefcase,
} from 'lucide-react';

const ARTIST_CATEGORIES = [
  'CULINARY ARTS',
  'MUSIC',
  'THEATRE',
  'DANCE',
  'CRAFT',
  'VISUAL ARTS',
  'SPECIAL PROJECT',
  'ACCESSIBILITY',
] as const;

interface ArtworkFormItem {
  id?: string;
  artworkName: string;
  medium: string;
  dimensions: string;
  installationType: string;
  venueId: string;
  roomId: string;
  roomIds: string[];
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
  roomIds: [],
  notes: '',
  images: '',
});

interface MultiSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

function MultiSelectDropdown({
  label,
  required,
  options,
  selectedIds,
  onChange,
  placeholder = 'Select items...',
  disabled = false,
  emptyMessage = 'No options available',
}: {
  label: string;
  required?: boolean;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase().trim()) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase().trim()))
  );

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onChange(options.map((o) => o.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectedOptions = options.filter((o) => selectedIds.includes(o.id));

  return (
    <div className="space-y-1 relative text-xs" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-slate-400 font-medium block">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {selectedIds.length > 0 && (
          <span className="text-[10px] text-sky-400 font-bold">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-left flex items-center justify-between transition-all focus:outline-none min-h-[40px] ${
          open ? 'border-sky-500 ring-1 ring-sky-500/50' : 'border-slate-800 hover:border-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-950/40' : 'cursor-pointer'}`}
      >
        <div className="flex-1 truncate">
          {selectedIds.length === 0 ? (
            <span className="text-slate-500">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
              {selectedOptions.map((opt) => (
                <span
                  key={opt.id}
                  className="inline-flex items-center gap-1 bg-slate-850 bg-slate-800 text-slate-200 text-[11px] px-2 py-0.5 rounded-lg border border-slate-700 font-medium"
                >
                  <span className="truncate max-w-[120px]">{opt.label}</span>
                  {!disabled && (
                    <X
                      className="w-3 h-3 hover:text-red-400 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(opt.id);
                      }}
                    />
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 space-y-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search / filter..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              autoFocus
            />
            {options.length > 0 && (
              <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg cursor-pointer ml-1"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-slate-500 text-xs">{emptyMessage}</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = selectedIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? 'bg-sky-950/60 text-sky-200 border border-sky-800/80 font-medium'
                        : 'text-slate-300 hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex-1 truncate pr-2">
                      <span className="block truncate font-medium">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="block text-[10px] text-slate-400 truncate">{opt.sublabel}</span>
                      )}
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-sky-500 border-sky-500 text-slate-950' : 'border-slate-600 bg-slate-950'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FileUploadBox({
  label,
  fileUrl,
  onUploadComplete,
  onRemove,
  disabled = false,
  accept = '.pdf,.jpeg,.jpg,.png,application/pdf,image/jpeg,image/png',
}: {
  label: string;
  fileUrl: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpeg', 'jpg', 'png'].includes(ext || '')) {
      setError('Only PDF, JPEG, and JPG files are supported.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        onUploadComplete(data.url);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error uploading file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5 text-xs">
      <span className="text-slate-400 font-medium block">{label}</span>
      {fileUrl ? (
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            {fileUrl.toLowerCase().endsWith('.pdf') ? (
              <FileText className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <ImageIcon className="w-5 h-5 text-sky-400 shrink-0" />
            )}
            <span className="truncate text-slate-200 text-xs font-medium">
              {fileUrl.split('/').pop() || 'Attached Document'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" /> View
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 hover:bg-red-950 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer"
                title="Remove attachment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFile}
            accept={accept}
            className="hidden"
            disabled={disabled}
          />
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full p-2.5 border border-dashed rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-semibold ${
              disabled
                ? 'border-slate-800 text-slate-600 bg-slate-950/40 cursor-not-allowed'
                : 'border-slate-700 text-slate-300 bg-slate-950 hover:border-sky-500 hover:text-sky-400 cursor-pointer'
            }`}
          >
            {uploading ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>Uploading document...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload document (PDF, JPEG, JPG)</span>
              </>
            )}
          </button>
        </div>
      )}
      {error && <p className="text-[11px] text-red-400 font-medium">⚠️ {error}</p>}
    </div>
  );
}

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
  const [visibleCount, setVisibleCount] = useState<number>(24);

  const artworkContainerRef = useRef<HTMLDivElement>(null);

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [search, selectedArtist, selectedVenue, selectedRoom, selectedArtwork, artworkInput, sortBy]);

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

  // Strict restriction: Button only visible to Super Admin and Programming
  const isSuperAdminOrProgramming = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'ADMIN',
    'PROGRAMMING TEAM',
    'PROGRAMMING',
    'PROGRAMMER',
    'PROGRAMMERS',
    'PROGRAMMING HEAD',
  ].includes(normalizedRole);

  const canEditOrDelete = isSuperAdminOrProgramming;

  // Travel section can only be updated by Super admin, programming and TBL Team
  const canUpdateTravel = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'ADMIN',
    'PROGRAMMING TEAM',
    'PROGRAMMING',
    'PROGRAMMER',
    'PROGRAMMERS',
    'PROGRAMMING HEAD',
    'TBL',
    'TBL TEAM',
    'TRAVEL',
    'TRAVEL TEAM',
    'TRAVEL & LODGING',
    'TRAVEL & BOARDING & LODGING',
  ].includes(normalizedRole);

  // Export PDF permission: Super admin, Programming team, Technical team, Inventory team
  const canExportPDF = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'PROGRAMMING TEAM',
    'PROGRAMMING',
    'PROGRAMMING HEAD',
    'TECHNICAL TEAM',
    'TECHNICAL HEAD',
    'TECH HEAD',
    'INSTALLATION TEAM',
    'INVENTORY TEAM',
    'INVENTORY MANAGER',
    'INVENTORY HEAD',
    'INVENTORY',
  ].includes(normalizedRole);

  // PDF Export Modal State
  const [pdfExportModalOpen, setPdfExportModalOpen] = useState(false);
  const [pdfExportArtistId, setPdfExportArtistId] = useState<string | null>(null);
  const [pdfExportArtistData, setPdfExportArtistData] = useState<any | null>(null);

  // Registration & Edit Wizard Step State (1: Artist Profile, 2: Project & Travel)
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);

  // Add Project Title Popup Modal State
  const [projectPopupOpen, setProjectPopupOpen] = useState(false);
  const [projectPopupTargetIsEdit, setProjectPopupTargetIsEdit] = useState(false);
  const [editingProjectIdx, setEditingProjectIdx] = useState<number | null>(null);
  const [popupProjectData, setPopupProjectData] = useState<{
    artworkName: string;
    venueId: string;
    roomIds: string[];
    notes: string;
  }>({
    artworkName: '',
    venueId: '',
    roomIds: [],
    notes: '',
  });

  // Allowed Roles for Advanced Sorting & Filtering Controls
  const allowedFilterRoles = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'TECHNICAL TEAM',
    'PRODUCTION TEAM',
    'PROGRAMMING TEAM',
    'INSTALLATION TEAM',
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
    category: '',
    status: 'Confirmed',
    arrivalDate: '',
    departureDate: '',
    travelNotes: '',
    lodgingDetails: '',
    flightDoc: '',
    hotelDoc: '',
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
    category: '',
    status: 'Confirmed',
    arrivalDate: '',
    departureDate: '',
    travelNotes: '',
    lodgingDetails: '',
    flightDoc: '',
    hotelDoc: '',
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
      category: '',
      status: 'Confirmed',
      arrivalDate: '',
      departureDate: '',
      travelNotes: '',
      lodgingDetails: '',
      flightDoc: '',
      hotelDoc: '',
      curatorIds: [],
      programmingIds: [],
      productionIds: [],
      spatialDesignerIds: [],
      artworks: [emptyArtworkRow()],
    });
    setFormError(null);
    setRegisterStep(1);
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

  const fetchModalDependencies = async () => {
    if (curatorsList.length > 0 && Object.keys(teamsData).length > 0) return;
    try {
      const [curatorsRes, teamsRes] = await Promise.all([
        fetch('/api/curators'),
        fetch('/api/team'),
      ]);
      const curatorsData = await curatorsRes.json();
      const teamsDataRes = await teamsRes.json();
      if (curatorsData.success) setCuratorsList(curatorsData.curators || []);
      if (teamsDataRes.success) setTeamsData(teamsDataRes.teams || {});
    } catch (err) {
      console.error('Error fetching modal dependencies:', err);
    }
  };

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
        if (field === 'venueId') {
          updated[index].roomId = '';
          updated[index].roomIds = [];
        }
        return { ...prev, artworks: updated };
      });
    } else {
      setFormData((prev) => {
        const updated = [...prev.artworks];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'venueId') {
          updated[index].roomId = '';
          updated[index].roomIds = [];
        }
        return { ...prev, artworks: updated };
      });
    }
  };

  const updateArtworkRooms = (index: number, roomIds: string[], isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData((prev) => {
        const updated = [...prev.artworks];
        updated[index] = { ...updated[index], roomIds, roomId: roomIds[0] || '' };
        return { ...prev, artworks: updated };
      });
    } else {
      setFormData((prev) => {
        const updated = [...prev.artworks];
        updated[index] = { ...updated[index], roomIds, roomId: roomIds[0] || '' };
        return { ...prev, artworks: updated };
      });
    }
  };

  const updateArtworkVenue = (index: number, venueId: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData((prev) => {
        const updated = [...prev.artworks];
        updated[index] = { ...updated[index], venueId, roomId: '', roomIds: [] };
        return { ...prev, artworks: updated };
      });
    } else {
      setFormData((prev) => {
        const updated = [...prev.artworks];
        updated[index] = { ...updated[index], venueId, roomId: '', roomIds: [] };
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

  // Filter curators by selected category (case-insensitive & plural normalized)
  const filteredCuratorsForNew = React.useMemo(() => {
    if (!formData.category) return curatorsList;
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = norm(formData.category).replace(/s$/, '');
    const matches = curatorsList.filter((c) => {
      if (!c.category) return false;
      const cat = norm(c.category).replace(/s$/, '');
      return cat === target || cat.includes(target) || target.includes(cat);
    });
    return matches.length > 0 ? matches : curatorsList;
  }, [curatorsList, formData.category]);

  const filteredCuratorsForEdit = React.useMemo(() => {
    if (!editFormData.category) return curatorsList;
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = norm(editFormData.category).replace(/s$/, '');
    const matches = curatorsList.filter((c) => {
      if (!c.category) return false;
      const cat = norm(c.category).replace(/s$/, '');
      return cat === target || cat.includes(target) || target.includes(cat);
    });
    return matches.length > 0 ? matches : curatorsList;
  }, [curatorsList, editFormData.category]);

  // Biography Word Counters
  const newBioWordCount = (formData.biography || '').trim()
    ? (formData.biography.trim().match(/\S+/g) || []).length
    : 0;

  const editBioWordCount = (editFormData.biography || '').trim()
    ? (editFormData.biography.trim().match(/\S+/g) || []).length
    : 0;

  // Popup Project Modal Handlers
  const openAddProjectPopup = (isEdit: boolean = false) => {
    setProjectPopupTargetIsEdit(isEdit);
    setEditingProjectIdx(null);
    setPopupProjectData({
      artworkName: '',
      venueId: '',
      roomIds: [],
      notes: '',
    });
    setProjectPopupOpen(true);
  };

  const openEditProjectPopup = (idx: number, isEdit: boolean = false) => {
    setProjectPopupTargetIsEdit(isEdit);
    setEditingProjectIdx(idx);
    const targetArtworks = isEdit ? editFormData.artworks : formData.artworks;
    const item = targetArtworks[idx] || emptyArtworkRow();
    setPopupProjectData({
      artworkName: item.artworkName,
      venueId: item.venueId,
      roomIds: item.roomIds && item.roomIds.length > 0 ? item.roomIds : (item.roomId ? [item.roomId] : []),
      notes: item.notes,
    });
    setProjectPopupOpen(true);
  };

  const handleSavePopupProject = () => {
    if (!popupProjectData.artworkName.trim()) {
      alert('Project Title is required.');
      return;
    }
    if (!popupProjectData.venueId) {
      alert('Please assign an exhibition venue.');
      return;
    }

    const newProject: ArtworkFormItem = {
      artworkName: popupProjectData.artworkName.trim(),
      medium: '',
      dimensions: '',
      installationType: 'Projection',
      venueId: popupProjectData.venueId,
      roomId: popupProjectData.roomIds[0] || '',
      roomIds: popupProjectData.roomIds,
      notes: popupProjectData.notes,
      images: '',
    };

    if (projectPopupTargetIsEdit) {
      setEditFormData((prev) => {
        const updated = [...prev.artworks];
        if (editingProjectIdx !== null && editingProjectIdx >= 0 && editingProjectIdx < updated.length) {
          updated[editingProjectIdx] = { ...updated[editingProjectIdx], ...newProject };
        } else {
          updated.push(newProject);
        }
        return { ...prev, artworks: updated };
      });
    } else {
      setFormData((prev) => {
        const updated = [...prev.artworks];
        if (editingProjectIdx !== null && editingProjectIdx >= 0 && editingProjectIdx < updated.length) {
          updated[editingProjectIdx] = { ...updated[editingProjectIdx], ...newProject };
        } else if (updated.length === 1 && !updated[0].artworkName.trim() && !updated[0].venueId) {
          updated[0] = newProject;
        } else {
          updated.push(newProject);
        }
        return { ...prev, artworks: updated };
      });
    }

    setProjectPopupOpen(false);
  };

  const handleNextStep = () => {
    if (!formData.artistName.trim()) {
      setFormError('Artist Name is required.');
      return;
    }
    if (!formData.category) {
      setFormError('Please select a Category from the dropdown.');
      return;
    }
    if (formData.curatorIds.length === 0) {
      setFormError('Please select a Curator.');
      return;
    }
    if (formData.programmingIds.length === 0) {
      setFormError('Please select at least one Programming Team member.');
      return;
    }
    if (formData.productionIds.length === 0) {
      setFormError('Please select at least one Production Team member.');
      return;
    }
    if (newBioWordCount > 300) {
      setFormError(`Biography must be 300 words or less (currently ${newBioWordCount} words).`);
      return;
    }
    setFormError(null);
    setRegisterStep(2);
  };

  const handleNextEditStep = () => {
    if (!editFormData.artistName.trim()) {
      setFormError('Artist Name is required.');
      return;
    }
    if (!editFormData.category) {
      setFormError('Please select a Category from the dropdown.');
      return;
    }
    if (editFormData.curatorIds.length === 0) {
      setFormError('Please select a Curator.');
      return;
    }
    if (editFormData.programmingIds.length === 0) {
      setFormError('Please select at least one Programming Team member.');
      return;
    }
    if (editFormData.productionIds.length === 0) {
      setFormError('Please select at least one Production Team member.');
      return;
    }
    if (editBioWordCount > 300) {
      setFormError(`Biography must be 300 words or less (currently ${editBioWordCount} words).`);
      return;
    }
    setFormError(null);
    setRegisterStep(2);
  };

  const handleCreateArtist = async () => {
    if (!canEditOrDelete) {
      setFormError('Access Restricted: Only Super Admin and Programming Team can create artists.');
      return;
    }
    if (!formData.artistName.trim()) {
      setFormError('Artist Name is required.');
      setRegisterStep(1);
      return;
    }
    if (!formData.category) {
      setFormError('Category is required. Please select a category from the dropdown.');
      setRegisterStep(1);
      return;
    }
    if (formData.curatorIds.length === 0) {
      setFormError('Curator assignment is required. Please select a curator.');
      setRegisterStep(1);
      return;
    }
    if (formData.programmingIds.length === 0) {
      setFormError('Programming Team selection is required. Please select at least one member.');
      setRegisterStep(1);
      return;
    }
    if (formData.productionIds.length === 0) {
      setFormError('Production Team selection is required. Please select at least one member.');
      setRegisterStep(1);
      return;
    }
    if (!formData.artworks[0]?.artworkName.trim()) {
      setFormError('Project Title is required.');
      setRegisterStep(2);
      return;
    }
    if (!formData.artworks[0]?.venueId) {
      setFormError('Assigning an exhibition venue is required.');
      setRegisterStep(2);
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

      let userName = 'Programming Team';
      try {
        const session = localStorage.getItem('saf_user_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.name) userName = parsed.name;
        }
      } catch (e) {}

      const res = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userRole, userName, ...formData }),
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
    fetchModalDependencies();
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
      category: art.category || '',
      status: art.status || 'Confirmed',
      arrivalDate: art.arrivalDate || '',
      departureDate: art.departureDate || '',
      travelNotes: art.travelNotes || '',
      lodgingDetails: art.lodgingDetails || '',
      flightDoc: art.flightDoc || '',
      hotelDoc: art.hotelDoc || '',
      curatorIds: (art.curatorAssignments || []).map((ca: any) => ca.curatorId),
      programmingIds: (art.programmingAssignments || []).map((pa: any) => pa.programmingPersonId),
      productionIds: (art.productionAssignments || []).map((pa: any) => pa.productionPersonId),
      spatialDesignerIds: (art.spatialAssignments || []).map((sa: any) => sa.spatialDesignerId),
      artworks: (art.artworks || []).map((aw: any) => {
        let roomIds: string[] = [];
        if (aw.roomIdsJson) {
          try {
            const parsed = JSON.parse(aw.roomIdsJson);
            if (Array.isArray(parsed)) roomIds = parsed;
          } catch (e) {}
        }
        if (roomIds.length === 0 && aw.roomId) {
          roomIds = [aw.roomId];
        }
        return {
          id: aw.id,
          artworkName: aw.artworkName || '',
          medium: aw.medium || '',
          dimensions: aw.dimensions || '',
          installationType: aw.installationType || 'Projection',
          venueId: aw.venueId || '',
          roomId: aw.roomId || '',
          roomIds,
          notes: aw.notes || aw.description || '',
        };
      }),
    });
    if ((art.artworks || []).length === 0) {
      setEditFormData((prev) => ({ ...prev, artworks: [emptyArtworkRow()] }));
    }
    setFormError(null);
    setRegisterStep(1);
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

          {/* REGISTER NEW ARTIST BUTTON (Button only visible to - super admin, programming.) */}
          {isSuperAdminOrProgramming && (
            <button
              onClick={() => {
                resetForm();
                fetchModalDependencies();
                setNewModalOpen(true);
              }}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register New Artist
            </button>
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredArtists.slice(0, visibleCount).map((art) => {
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
                    <div className="flex items-center gap-1.5">
                      {art.category && (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 tracking-wide uppercase">
                          {art.category}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {art.status}
                      </span>
                    </div>
                  </div>

                  {/* Travel & Lodging Badge */}
                  {(art.arrivalDate || art.departureDate || art.flightDoc || art.hotelDoc) && (
                    <div className="mt-3 p-2 rounded-xl bg-[#1e1b4b]/50 border border-[#4338ca]/40 text-[11px] text-indigo-300 space-y-1.5">
                      {(art.arrivalDate || art.departureDate) && (
                        <div className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <div className="flex flex-wrap items-center gap-2">
                            {art.arrivalDate && <span>Arr: <strong className="text-white">{art.arrivalDate}</strong></span>}
                            {art.departureDate && <span>Dep: <strong className="text-white">{art.departureDate}</strong></span>}
                          </div>
                        </div>
                      )}
                      {(art.flightDoc || art.hotelDoc) && (
                        <div className="flex items-center gap-2 pt-1 border-t border-indigo-900/40 text-[10px]">
                          {art.flightDoc && (
                            <a
                              href={art.flightDoc}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60 font-semibold"
                            >
                              <FileText className="w-3 h-3" /> Flight Doc
                            </a>
                          )}
                          {art.hotelDoc && (
                            <a
                              href={art.hotelDoc}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60 font-semibold"
                            >
                              <Hotel className="w-3 h-3" /> Hotel Doc
                            </a>
                          )}
                        </div>
                      )}
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
                          {(aw.venue || aw.room || aw.roomIdsJson) && (
                            <span className="text-[9px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 shrink-0 flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" /> {aw.venue?.venueName || ''}
                              {(() => {
                                let roomsStr = '';
                                if (aw.roomIdsJson) {
                                  try {
                                    const parsed = JSON.parse(aw.roomIdsJson);
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                      const matchedRooms = (aw.venue?.rooms || []).filter((r: any) => parsed.includes(r.id));
                                      if (matchedRooms.length > 0) {
                                        roomsStr = ` (${matchedRooms.map((r: any) => r.roomNumber || r.roomName).join(', ')})`;
                                      }
                                    }
                                  } catch (e) {}
                                }
                                if (!roomsStr && aw.room) {
                                  roomsStr = ` (${aw.room.roomNumber || aw.room.roomName})`;
                                }
                                return roomsStr;
                              })()}
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

        {/* LOAD MORE / PAGINATION CONTROLS */}
        {filteredArtists.length > visibleCount && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-400">
              Showing <strong className="text-slate-100">{Math.min(visibleCount, filteredArtists.length)}</strong> of{' '}
              <strong className="text-slate-100">{filteredArtists.length}</strong> artists
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVisibleCount((prev) => prev + 24)}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                Load More Artists (+24)
              </button>
              <button
                onClick={() => setVisibleCount(filteredArtists.length)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Show All ({filteredArtists.length})
              </button>
            </div>
          </div>
        )}
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

      {/* MODAL: REGISTER NEW ARTIST (2-STEP CURATORIAL & PROGRAMMING REGISTRATION) */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl p-6 shadow-2xl my-auto">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/70 border border-sky-800/80 px-2.5 py-0.5 rounded-full">
                    CURATORIAL & PROGRAMMING
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Step {registerStep} of 2
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2 mt-1">
                  <User className="w-5 h-5 text-sky-400" /> Register New Artist
                </h3>
              </div>
              <button
                onClick={() => setNewModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP PROGRESS INDICATOR */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs shrink-0 mt-4 mb-2">
              <button
                type="button"
                onClick={() => setRegisterStep(1)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-left cursor-pointer ${
                  registerStep === 1
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                  registerStep === 1 ? 'bg-slate-950 text-sky-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  1
                </span>
                <span>Artist Profile</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-left cursor-pointer ${
                  registerStep === 2
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                  registerStep === 2 ? 'bg-slate-950 text-sky-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  2
                </span>
                <span>Project & Travel Details</span>
              </button>
            </div>

            {/* ERROR BANNER */}
            {formError && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: ARTIST PROFILE */}
            {registerStep === 1 && (
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 text-xs animate-in fade-in py-1">
                {/* 1. Artist Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold block">
                      Artist Name <span className="text-red-400">*</span>
                    </label>
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
                    autoFocus
                  />
                </div>

                {/* 2. Artist Image */}
                <div>
                  <ImageUploadInput
                    label="Artist Image (Upload image or enter URL)"
                    value={formData.artistPhoto}
                    onChange={(url) => setFormData({ ...formData, artistPhoto: url })}
                    onSuggestImages={() => openSuggestModal(formData.artistName, formData.artworks[0]?.artworkName || '', false, 0)}
                    placeholder="Upload image (JPEG/JPG/PNG) or enter public image URL..."
                  />
                </div>

                {/* 3. Country & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. India, United Kingdom, Japan"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. artist@studio.art"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 4. Biography (300 words) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold block">
                      Biography (300 words)
                    </label>
                    <span
                      className={`text-[11px] font-bold ${
                        newBioWordCount > 300 ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      {newBioWordCount} / 300 words
                    </span>
                  </div>
                  <textarea
                    value={formData.biography}
                    onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                    placeholder="Short biography, artistic background and practice (maximum 300 words)..."
                    className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-slate-100 h-24 focus:outline-none ${
                      newBioWordCount > 300 ? 'border-red-500' : 'border-slate-800 focus:border-sky-500'
                    }`}
                  />
                  {newBioWordCount > 300 && (
                    <p className="text-[11px] text-red-400 font-semibold mt-1">
                      ⚠️ Word count exceeds 300 words ({newBioWordCount} words entered). Please shorten biography.
                    </p>
                  )}
                </div>

                {/* 5. Category (drop down) */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        category: newCat,
                        curatorIds: [],
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none font-medium"
                  >
                    <option value="">Select Category...</option>
                    {ARTIST_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Curator (dropdown - filter using category) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold block">
                      Curator <span className="text-red-400">*</span>{' '}
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({formData.category ? `Filtered by ${formData.category}` : 'Select Category above'})
                      </span>
                    </label>
                    {formData.curatorIds.length > 0 && (
                      <span className="text-[11px] text-emerald-400 font-bold">✓ Selected</span>
                    )}
                  </div>
                  <select
                    value={formData.curatorIds[0] || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      setFormData((prev) => ({ ...prev, curatorIds: id ? [id] : [] }));
                    }}
                    disabled={!formData.category && curatorsList.length > 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {!formData.category
                        ? 'Select a category above to filter curators...'
                        : filteredCuratorsForNew.length === 0
                        ? 'No curators matching this category'
                        : 'Select Curator...'}
                    </option>
                    {filteredCuratorsForNew.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.category ? `(${c.category})` : ''}
                      </option>
                    ))}
                  </select>
                  {formData.category && filteredCuratorsForNew.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Showing {filteredCuratorsForNew.length} curators available for {formData.category}.
                    </p>
                  )}
                </div>

                {/* 7. Programming Team (multi selection) */}
                <div>
                  <MultiSelectDropdown
                    label="Programming Team"
                    required
                    options={(teamsData.programming || []).map((p) => ({
                      id: p.id,
                      label: p.name,
                      sublabel: p.role || 'Programming Member',
                    }))}
                    selectedIds={formData.programmingIds}
                    onChange={(ids) => setFormData((prev) => ({ ...prev, programmingIds: ids }))}
                    placeholder="Select programming team member(s)..."
                    emptyMessage="No programming team members found in database"
                  />
                </div>

                {/* 8. Production Team (multi selection) */}
                <div>
                  <MultiSelectDropdown
                    label="Production Team"
                    required
                    options={(teamsData.production || []).map((pr) => ({
                      id: pr.id,
                      label: pr.name,
                      sublabel: pr.role || 'Production Member',
                    }))}
                    selectedIds={formData.productionIds}
                    onChange={(ids) => setFormData((prev) => ({ ...prev, productionIds: ids }))}
                    placeholder="Select production team member(s)..."
                    emptyMessage="No production team members found in database"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: ARTWORK TO 'PROJECT' & TRAVEL LOGISTICS */}
            {registerStep === 2 && (
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-5 text-xs animate-in fade-in py-1">
                {/* SECTION 1: ARTWORK TO 'PROJECT' */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/50 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-950 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-purple-400" /> Artwork to &ldquo;Project&rdquo;
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Assign project title, exhibition venue, and multi-room locations.
                      </p>
                    </div>

                    {/* BUTTON TO ADD MORE PROJECT TITLE UNDER SAME ARTIST */}
                    <button
                      type="button"
                      onClick={() => openAddProjectPopup(false)}
                      className="bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/80 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-xs self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-400" /> Add More Project Title Under Same Artist
                    </button>
                  </div>

                  {/* Primary Project Row */}
                  <div className="space-y-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-200 text-xs">
                        Project #1 (Primary)
                      </span>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Project Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.artworks[0]?.artworkName || ''}
                        onChange={(e) => updateArtworkRow(0, 'artworkName', e.target.value, false)}
                        placeholder="e.g. Echoes of Light"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Assign Venue */}
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-amber-400" /> Assign Venue{' '}
                          <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={formData.artworks[0]?.venueId || ''}
                          onChange={(e) => updateArtworkVenue(0, e.target.value, false)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                        >
                          <option value="">Select Exhibition Venue...</option>
                          {venuesList.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.venueName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Assign Room (multi-room selection filtered under the venue) */}
                      <div>
                        {(() => {
                          const primaryVenue = venuesList.find((v) => v.id === formData.artworks[0]?.venueId);
                          const roomOpts = (primaryVenue?.rooms || []).map((r: any) => ({
                            id: r.id,
                            label: `Room ${r.roomNumber || ''} - ${r.roomName}`,
                            sublabel: r.floor ? `Floor: ${r.floor}` : undefined,
                          }));

                          return (
                            <MultiSelectDropdown
                              label="Assign Room (Multi-room Selection)"
                              options={roomOpts}
                              selectedIds={formData.artworks[0]?.roomIds || (formData.artworks[0]?.roomId ? [formData.artworks[0].roomId] : [])}
                              onChange={(ids) => updateArtworkRooms(0, ids, false)}
                              placeholder={formData.artworks[0]?.venueId ? 'Select one or more rooms...' : 'Select venue first...'}
                              disabled={!formData.artworks[0]?.venueId}
                              emptyMessage="No rooms found under selected venue"
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Additional Projects Added via Popup */}
                  {formData.artworks.length > 1 && (
                    <div className="space-y-2 pt-2 border-t border-purple-950/60">
                      <span className="font-bold text-[11px] text-purple-300 uppercase tracking-wider block">
                        Additional Projects Under This Artist ({formData.artworks.length - 1}):
                      </span>
                      {formData.artworks.slice(1).map((extraAw, extraIdx) => {
                        const actualIdx = extraIdx + 1;
                        const vObj = venuesList.find((v) => v.id === extraAw.venueId);
                        const assignedRooms = (vObj?.rooms || []).filter((r: any) =>
                          (extraAw.roomIds || []).includes(r.id) || r.id === extraAw.roomId
                        );

                        return (
                          <div
                            key={actualIdx}
                            className="p-3 rounded-xl bg-slate-900 border border-purple-900/40 flex items-center justify-between gap-3"
                          >
                            <div className="space-y-1 truncate">
                              <span className="font-bold text-slate-100 block truncate">
                                {extraAw.artworkName || 'Untitled Project'}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" /> {vObj?.venueName || 'Unassigned Venue'}
                                </span>
                                {assignedRooms.length > 0 ? (
                                  assignedRooms.map((r: any) => (
                                    <span
                                      key={r.id}
                                      className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1"
                                    >
                                      <DoorOpen className="w-3 h-3" /> Room {r.roomNumber || r.roomName}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400">No rooms assigned</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditProjectPopup(actualIdx, false)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold border border-slate-700 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeArtworkRow(actualIdx, false)}
                                className="p-1 rounded-lg text-red-400 hover:bg-red-950/80 cursor-pointer"
                                title="Remove Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION 2: ARTIST TRAVEL DATES */}
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 space-y-3">
                  <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" /> Artist Travel Dates
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
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
                      <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
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

                {/* SECTION 3: FLIGHT & HOTEL LOGISTICS (ROLE RESTRICTED) */}
                <div className={`p-4 rounded-2xl border space-y-4 ${
                  canUpdateTravel
                    ? 'bg-slate-950 border-indigo-900/60'
                    : 'bg-slate-950/60 border-slate-800 opacity-80'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                        <Plane className="w-4 h-4 text-sky-400" /> Flight & Hotel Logistics
                      </h4>
                      <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        Below section can only be updated by Super admin, programming and TBL Team
                      </p>
                    </div>

                    <div>
                      {canUpdateTravel ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Authorized to Edit
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Read-Only Mode
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Flight & Travel Details */}
                    <div className="space-y-2">
                      <label className="text-slate-300 font-semibold block flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5 text-sky-400" /> Flight & Travel Details
                      </label>
                      <textarea
                        value={formData.travelNotes}
                        onChange={(e) => setFormData({ ...formData, travelNotes: e.target.value })}
                        disabled={!canUpdateTravel}
                        placeholder="Extra notes: Flight number, airlines, terminal, airport transfer instructions..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-20 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                      />
                      <FileUploadBox
                        label="Upload Flight Ticket / Details (PDF, JPEG, JPG)"
                        fileUrl={formData.flightDoc}
                        onUploadComplete={(url) => setFormData((prev) => ({ ...prev, flightDoc: url }))}
                        onRemove={() => setFormData((prev) => ({ ...prev, flightDoc: '' }))}
                        disabled={!canUpdateTravel}
                      />
                    </div>

                    {/* Hotel & Lodging Details */}
                    <div className="space-y-2">
                      <label className="text-slate-300 font-semibold block flex items-center gap-1">
                        <Hotel className="w-3.5 h-3.5 text-purple-400" /> Hotel & Lodging Details
                      </label>
                      <textarea
                        value={formData.lodgingDetails}
                        onChange={(e) => setFormData({ ...formData, lodgingDetails: e.target.value })}
                        disabled={!canUpdateTravel}
                        placeholder="Extra notes: Hotel name, check-in instructions, confirmation number, room specs..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-20 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                      />
                      <FileUploadBox
                        label="Upload Hotel & Lodging Details (PDF, JPEG, JPG)"
                        fileUrl={formData.hotelDoc}
                        onUploadComplete={(url) => setFormData((prev) => ({ ...prev, hotelDoc: url }))}
                        onRemove={() => setFormData((prev) => ({ ...prev, hotelDoc: '' }))}
                        disabled={!canUpdateTravel}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0 mt-2">
              <div>
                {registerStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    ← Back to Artist Profile
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

                {registerStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateArtist}
                    disabled={submitting}
                    className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" /> Registering...
                      </>
                    ) : (
                      'Register Artist'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: ADD / EDIT PROJECT TITLE UNDER ARTIST */}
      {projectPopupOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                {editingProjectIdx !== null ? 'Edit Project Title Under Artist' : 'Add Project Title Under Artist'}
              </h3>
              <button
                type="button"
                onClick={() => setProjectPopupOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Project Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={popupProjectData.artworkName}
                  onChange={(e) => setPopupProjectData({ ...popupProjectData, artworkName: e.target.value })}
                  placeholder="e.g. Whispers in the Wind"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" /> Assign Venue{' '}
                  <span className="text-red-400">*</span>
                </label>
                <select
                  value={popupProjectData.venueId}
                  onChange={(e) =>
                    setPopupProjectData({ ...popupProjectData, venueId: e.target.value, roomIds: [] })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select Exhibition Venue...</option>
                  {venuesList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.venueName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                {(() => {
                  const selectedVenue = venuesList.find((v) => v.id === popupProjectData.venueId);
                  const roomOpts = (selectedVenue?.rooms || []).map((r: any) => ({
                    id: r.id,
                    label: `Room ${r.roomNumber || ''} - ${r.roomName}`,
                    sublabel: r.floor ? `Floor: ${r.floor}` : undefined,
                  }));

                  return (
                    <MultiSelectDropdown
                      label="Assign Room (Multi-room Selection under Venue)"
                      options={roomOpts}
                      selectedIds={popupProjectData.roomIds}
                      onChange={(ids) => setPopupProjectData({ ...popupProjectData, roomIds: ids })}
                      placeholder={popupProjectData.venueId ? 'Select one or more rooms...' : 'Select venue first...'}
                      disabled={!popupProjectData.venueId}
                      emptyMessage="No rooms found under selected venue"
                    />
                  );
                })()}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Extra Notes / Technical Specifications
                </label>
                <input
                  type="text"
                  value={popupProjectData.notes}
                  onChange={(e) => setPopupProjectData({ ...popupProjectData, notes: e.target.value })}
                  placeholder="Installation notes, equipment, or scale..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setProjectPopupOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePopupProject}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {editingProjectIdx !== null ? 'Save Changes' : 'Add Project Title'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ARTIST (2-STEP CURATORIAL & PROGRAMMING WIZARD) */}
      {editModalOpen && editingArtist && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl p-6 shadow-2xl my-auto">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/70 border border-sky-800/80 px-2.5 py-0.5 rounded-full">
                    CURATORIAL & PROGRAMMING
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Step {registerStep} of 2
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2 mt-1">
                  <Edit3 className="w-5 h-5 text-sky-400" /> Edit Artist: {editingArtist.artistName}
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP PROGRESS INDICATOR */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs shrink-0 mt-4 mb-2">
              <button
                type="button"
                onClick={() => setRegisterStep(1)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-left cursor-pointer ${
                  registerStep === 1
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                  registerStep === 1 ? 'bg-slate-950 text-sky-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  1
                </span>
                <span>Artist Profile</span>
              </button>

              <button
                type="button"
                onClick={handleNextEditStep}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-left cursor-pointer ${
                  registerStep === 2
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                  registerStep === 2 ? 'bg-slate-950 text-sky-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  2
                </span>
                <span>Project & Travel Details</span>
              </button>
            </div>

            {/* ERROR BANNER */}
            {formError && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs font-semibold flex items-center gap-2 shrink-0 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: ARTIST PROFILE */}
            {registerStep === 1 && (
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 text-xs animate-in fade-in py-1">
                {/* 1. Artist Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold block">
                      Artist Name <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => openSuggestModal(editFormData.artistName, editFormData.artworks[0]?.artworkName || '', true, 0)}
                      className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-950/60 border border-sky-800/80 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" /> Auto-Suggest Images
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editFormData.artistName}
                    onChange={(e) => setEditFormData({ ...editFormData, artistName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                {/* 2. Artist Image */}
                <div>
                  <ImageUploadInput
                    label="Artist Image (Upload image or enter URL)"
                    value={editFormData.artistPhoto}
                    onChange={(url) => setEditFormData({ ...editFormData, artistPhoto: url })}
                    onSuggestImages={() => openSuggestModal(editFormData.artistName, editFormData.artworks[0]?.artworkName || '', true, 0)}
                    placeholder="Upload image (JPEG/JPG/PNG) or enter public image URL..."
                  />
                </div>

                {/* 3. Country & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Country</label>
                    <input
                      type="text"
                      value={editFormData.country}
                      onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                      placeholder="e.g. India, United Kingdom, Japan"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="e.g. artist@studio.art"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 4. Biography (300 words) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold block">
                      Biography (300 words)
                    </label>
                    <span
                      className={`text-[11px] font-bold ${
                        editBioWordCount > 300 ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      {editBioWordCount} / 300 words
                    </span>
                  </div>
                  <textarea
                    value={editFormData.biography}
                    onChange={(e) => setEditFormData({ ...editFormData, biography: e.target.value })}
                    placeholder="Short biography, artistic background and practice (maximum 300 words)..."
                    className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-slate-100 h-24 focus:outline-none ${
                      editBioWordCount > 300 ? 'border-red-500' : 'border-slate-800 focus:border-sky-500'
                    }`}
                  />
                  {editBioWordCount > 300 && (
                    <p className="text-[11px] text-red-400 font-semibold mt-1">
                      ⚠️ Word count exceeds 300 words ({editBioWordCount} words entered). Please shorten biography.
                    </p>
                  )}
                </div>

                {/* 5. Category (drop down) */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setEditFormData((prev) => ({
                        ...prev,
                        category: newCat,
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none font-medium"
                  >
                    <option value="">Select Category...</option>
                    {ARTIST_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Curator (dropdown - filter using category) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold block">
                      Curator <span className="text-red-400">*</span>{' '}
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({editFormData.category ? `Filtered by ${editFormData.category}` : 'Select Category above'})
                      </span>
                    </label>
                    {editFormData.curatorIds.length > 0 && (
                      <span className="text-[11px] text-emerald-400 font-bold">✓ Selected</span>
                    )}
                  </div>
                  <select
                    value={editFormData.curatorIds[0] || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      setEditFormData((prev) => ({ ...prev, curatorIds: id ? [id] : [] }));
                    }}
                    disabled={!editFormData.category && curatorsList.length > 0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {!editFormData.category
                        ? 'Select a category above to filter curators...'
                        : filteredCuratorsForEdit.length === 0
                        ? 'No curators matching this category'
                        : 'Select Curator...'}
                    </option>
                    {filteredCuratorsForEdit.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.category ? `(${c.category})` : ''}
                      </option>
                    ))}
                  </select>
                  {editFormData.category && filteredCuratorsForEdit.length > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Showing {filteredCuratorsForEdit.length} curators available for {editFormData.category}.
                    </p>
                  )}
                </div>

                {/* 7. Programming Team (multi selection) */}
                <div>
                  <MultiSelectDropdown
                    label="Programming Team"
                    required
                    options={(teamsData.programming || []).map((p) => ({
                      id: p.id,
                      label: p.name,
                      sublabel: p.role || 'Programming Member',
                    }))}
                    selectedIds={editFormData.programmingIds}
                    onChange={(ids) => setEditFormData((prev) => ({ ...prev, programmingIds: ids }))}
                    placeholder="Select programming team member(s)..."
                    emptyMessage="No programming team members found in database"
                  />
                </div>

                {/* 8. Production Team (multi selection) */}
                <div>
                  <MultiSelectDropdown
                    label="Production Team"
                    required
                    options={(teamsData.production || []).map((pr) => ({
                      id: pr.id,
                      label: pr.name,
                      sublabel: pr.role || 'Production Member',
                    }))}
                    selectedIds={editFormData.productionIds}
                    onChange={(ids) => setEditFormData((prev) => ({ ...prev, productionIds: ids }))}
                    placeholder="Select production team member(s)..."
                    emptyMessage="No production team members found in database"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: ARTWORK TO 'PROJECT' & TRAVEL LOGISTICS */}
            {registerStep === 2 && (
              <div className="flex-1 overflow-y-auto pr-1.5 space-y-5 text-xs animate-in fade-in py-1">
                {/* SECTION 1: ARTWORK TO 'PROJECT' */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/50 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-950 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-purple-400" /> Artwork to &ldquo;Project&rdquo;
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Assign project title, exhibition venue, and multi-room locations.
                      </p>
                    </div>

                    {/* BUTTON TO ADD MORE PROJECT TITLE UNDER SAME ARTIST */}
                    <button
                      type="button"
                      onClick={() => openAddProjectPopup(true)}
                      className="bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/80 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm text-xs self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-400" /> Add More Project Title Under Same Artist
                    </button>
                  </div>

                  {/* Primary Project Row */}
                  <div className="space-y-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-200 text-xs">
                        Project #1 (Primary)
                      </span>
                    </div>

                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Project Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.artworks[0]?.artworkName || ''}
                        onChange={(e) => updateArtworkRow(0, 'artworkName', e.target.value, true)}
                        placeholder="e.g. Echoes of Light"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Assign Venue */}
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-amber-400" /> Assign Venue{' '}
                          <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={editFormData.artworks[0]?.venueId || ''}
                          onChange={(e) => updateArtworkVenue(0, e.target.value, true)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                        >
                          <option value="">Select Exhibition Venue...</option>
                          {venuesList.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.venueName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Assign Room (multi-room selection filtered under the venue) */}
                      <div>
                        {(() => {
                          const primaryVenue = venuesList.find((v) => v.id === editFormData.artworks[0]?.venueId);
                          const roomOpts = (primaryVenue?.rooms || []).map((r: any) => ({
                            id: r.id,
                            label: `Room ${r.roomNumber || ''} - ${r.roomName}`,
                            sublabel: r.floor ? `Floor: ${r.floor}` : undefined,
                          }));

                          return (
                            <MultiSelectDropdown
                              label="Assign Room (Multi-room Selection)"
                              options={roomOpts}
                              selectedIds={editFormData.artworks[0]?.roomIds || (editFormData.artworks[0]?.roomId ? [editFormData.artworks[0].roomId] : [])}
                              onChange={(ids) => updateArtworkRooms(0, ids, true)}
                              placeholder={editFormData.artworks[0]?.venueId ? 'Select one or more rooms...' : 'Select venue first...'}
                              disabled={!editFormData.artworks[0]?.venueId}
                              emptyMessage="No rooms found under selected venue"
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Additional Projects Added via Popup */}
                  {editFormData.artworks.length > 1 && (
                    <div className="space-y-2 pt-2 border-t border-purple-950/60">
                      <span className="font-bold text-[11px] text-purple-300 uppercase tracking-wider block">
                        Additional Projects Under This Artist ({editFormData.artworks.length - 1}):
                      </span>
                      {editFormData.artworks.slice(1).map((extraAw, extraIdx) => {
                        const actualIdx = extraIdx + 1;
                        const vObj = venuesList.find((v) => v.id === extraAw.venueId);
                        const assignedRooms = (vObj?.rooms || []).filter((r: any) =>
                          (extraAw.roomIds || []).includes(r.id) || r.id === extraAw.roomId
                        );

                        return (
                          <div
                            key={actualIdx}
                            className="p-3 rounded-xl bg-slate-900 border border-purple-900/40 flex items-center justify-between gap-3"
                          >
                            <div className="space-y-1 truncate">
                              <span className="font-bold text-slate-100 block truncate">
                                {extraAw.artworkName || 'Untitled Project'}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" /> {vObj?.venueName || 'Unassigned Venue'}
                                </span>
                                {assignedRooms.length > 0 ? (
                                  assignedRooms.map((r: any) => (
                                    <span
                                      key={r.id}
                                      className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1"
                                    >
                                      <DoorOpen className="w-3 h-3" /> Room {r.roomNumber || r.roomName}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400">No rooms assigned</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditProjectPopup(actualIdx, true)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold border border-slate-700 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeArtworkRow(actualIdx, true)}
                                className="p-1 rounded-lg text-red-400 hover:bg-red-950/80 cursor-pointer"
                                title="Remove Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION 2: ARTIST TRAVEL DATES */}
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 space-y-3">
                  <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" /> Artist Travel Dates
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
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
                      <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
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

                {/* SECTION 3: FLIGHT & HOTEL LOGISTICS (ROLE RESTRICTED) */}
                <div className={`p-4 rounded-2xl border space-y-4 ${
                  canUpdateTravel
                    ? 'bg-slate-950 border-indigo-900/60'
                    : 'bg-slate-950/60 border-slate-800 opacity-80'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                        <Plane className="w-4 h-4 text-sky-400" /> Flight & Hotel Logistics
                      </h4>
                      <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        Below section can only be updated by Super admin, programming and TBL Team
                      </p>
                    </div>

                    <div>
                      {canUpdateTravel ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Authorized to Edit
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Read-Only Mode
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Flight & Travel Details */}
                    <div className="space-y-2">
                      <label className="text-slate-300 font-semibold block flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5 text-sky-400" /> Flight & Travel Details
                      </label>
                      <textarea
                        value={editFormData.travelNotes}
                        onChange={(e) => setEditFormData({ ...editFormData, travelNotes: e.target.value })}
                        disabled={!canUpdateTravel}
                        placeholder="Extra notes: Flight number, airlines, terminal, airport transfer instructions..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-20 focus:border-sky-500 focus:outline-none disabled:opacity-50"
                      />
                      <FileUploadBox
                        label="Upload Flight Ticket / Details (PDF, JPEG, JPG)"
                        fileUrl={editFormData.flightDoc}
                        onUploadComplete={(url) => setEditFormData((prev) => ({ ...prev, flightDoc: url }))}
                        onRemove={() => setEditFormData((prev) => ({ ...prev, flightDoc: '' }))}
                        disabled={!canUpdateTravel}
                      />
                    </div>

                    {/* Hotel & Lodging Details */}
                    <div className="space-y-2">
                      <label className="text-slate-300 font-semibold block flex items-center gap-1">
                        <Hotel className="w-3.5 h-3.5 text-purple-400" /> Hotel & Lodging Details
                      </label>
                      <textarea
                        value={editFormData.lodgingDetails}
                        onChange={(e) => setEditFormData({ ...editFormData, lodgingDetails: e.target.value })}
                        disabled={!canUpdateTravel}
                        placeholder="Extra notes: Hotel name, check-in instructions, confirmation number, room specs..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-20 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                      />
                      <FileUploadBox
                        label="Upload Hotel & Lodging Details (PDF, JPEG, JPG)"
                        fileUrl={editFormData.hotelDoc}
                        onUploadComplete={(url) => setEditFormData((prev) => ({ ...prev, hotelDoc: url }))}
                        onRemove={() => setEditFormData((prev) => ({ ...prev, hotelDoc: '' }))}
                        disabled={!canUpdateTravel}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0 mt-2">
              <div>
                {registerStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    ← Back to Artist Profile
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

                {registerStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextEditStep}
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUpdateArtist}
                    disabled={submitting}
                    className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                )}
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
