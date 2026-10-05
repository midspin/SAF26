'use client';

import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Sparkles,
  Building2,
  DoorOpen,
  CheckCircle2,
  Clock,
  User,
  Wrench,
  Palette,
  FileText,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Upload,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Layers,
  UserCheck,
  PackageCheck,
  Cpu,
  History,
} from 'lucide-react';

export default function ProgressTrackerPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [search, setSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal / Drawer State for Status Updates
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Detailed View Workflow Expansion State
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [artistDetailsMap, setArtistDetailsMap] = useState<Record<string, { activityLogs: any[]; fullArtist?: any }>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [artistsRes, venuesRes, instRes] = await Promise.all([
        fetch('/api/artists'),
        fetch('/api/venues'),
        fetch('/api/installations'),
      ]);

      const artistsData = await artistsRes.json();
      const venuesData = await venuesRes.json();
      const instData = await instRes.json();

      const artistsList = artistsData.artists || [];
      const venuesList = venuesData.venues || [];
      const instList = instData.installations || [];

      setVenues(venuesList);

      // Build unified project rows per artist artwork
      const projectRows: any[] = [];

      artistsList.forEach((artist: any) => {
        const artworks = artist.artworks && artist.artworks.length > 0 ? artist.artworks : [null];

        artworks.forEach((art: any) => {
          // Find matching installation record
          const inst = instList.find(
            (i: any) =>
              i.artistId === artist.id && (art ? i.artworkId === art.id : true)
          ) || instList.find((i: any) => i.artistId === artist.id) || null;

          const venueObj = art?.venue || inst?.venue || null;
          const roomObj = art?.room || inst?.room || null;

          // Milestone 1: Onboard (Artist and artwork updated by programming team)
          const milestoneOnboard = Boolean(artist && artist.artistName && art && art.artworkName);

          // Installation Type Check for Tech Data Milestone
          const instType = (art?.installationType || '').toLowerCase();
          const showTechData =
            instType.includes('projection') ||
            instType.includes('interactive') ||
            instType.includes('digital') ||
            instType.includes('sound');

          // Inventory Allocations Check
          const allocationsList: any[] = artist.allocations || [];

          // Milestone 2 (Conditional): Tech Data (After allocating a technical inventory item)
          const milestoneTechData = allocationsList.some((alloc: any) => {
            const isMatchArtwork = !alloc.artworkId || alloc.artworkId === art?.id;
            const dept = (alloc.department || '').toUpperCase();
            const cat = (alloc.inventoryItem?.inventoryCategory || '').toUpperCase();
            const usage = (alloc.inventoryItem?.inventoryUsageType || '').toUpperCase();
            return isMatchArtwork && (dept === 'TECHNICAL' || cat === 'TECHNICAL' || usage === 'TECHNICAL');
          });

          // Milestone 3: Production Allocation (If any production item from inventory is allocated)
          const milestoneProdAllocation = allocationsList.some((alloc: any) => {
            const isMatchArtwork = !alloc.artworkId || alloc.artworkId === art?.id;
            const dept = (alloc.department || '').toUpperCase();
            const cat = (alloc.inventoryItem?.inventoryCategory || '').toUpperCase();
            const usage = (alloc.inventoryItem?.inventoryUsageType || '').toUpperCase();
            return isMatchArtwork && (dept === 'PRODUCTION' || cat === 'PRODUCTION' || usage === 'PRODUCTION');
          });

          // Milestone 4: Layout (Completed if final layout with tech & production diagram is uploaded)
          const layoutUrl = art?.techProdLayout || roomObj?.techProdLayout || roomObj?.floorplan || venueObj?.venueDocument || null;
          const milestoneRoomLayout = Boolean(layoutUrl);

          // Total active steps (4 if Projection/Interactive/Digital/Sound, else 3)
          const totalActiveSteps = showTechData ? 4 : 3;
          const completedCount =
            (milestoneOnboard ? 1 : 0) +
            (showTechData && milestoneTechData ? 1 : 0) +
            (milestoneProdAllocation ? 1 : 0) +
            (milestoneRoomLayout ? 1 : 0);

          const isFullyComplete = completedCount === totalActiveSteps;

          projectRows.push({
            id: art ? `${artist.id}-${art.id}` : artist.id,
            artistId: artist.id,
            artistName: artist.artistName,
            artistPhoto: artist.artistPhoto,
            artworkId: art?.id || null,
            artworkName: art?.artworkName || 'Primary Project',
            installationType: art?.installationType || 'Projection',
            medium: art?.medium || 'N/A',
            venueName: venueObj?.venueName || 'Unassigned Venue',
            venueId: venueObj?.id || null,
            roomNumber: roomObj?.roomNumber || '0',
            roomName: roomObj?.roomName || 'Unassigned Room',
            roomId: roomObj?.id || null,
            floorplanUrl: layoutUrl,
            installationId: inst?.id || null,
            installationStatus: inst?.installationStatus || 'Planned',
            startDate: inst?.startDate || artist.arrivalDate || 'TBD',
            endDate: inst?.endDate || artist.departureDate || 'TBD',
            installationNotes: inst?.installationNotes || '',
            artistObj: artist,
            artworkObj: art,
            allocationsList,
            milestones: {
              onboard: milestoneOnboard,
              showTechData,
              techData: milestoneTechData,
              prodAllocation: milestoneProdAllocation,
              roomLayout: milestoneRoomLayout,
              totalActiveSteps,
              completedCount,
              isFullyComplete,
            },
          });
        });
      });

      setProjects(projectRows);
    } catch (err) {
      console.error('Error fetching progress tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectDetails = async (proj: any) => {
    const next = new Set(expandedProjects);
    if (next.has(proj.id)) {
      next.delete(proj.id);
      setExpandedProjects(next);
      return;
    }

    next.add(proj.id);
    setExpandedProjects(next);

    if (!artistDetailsMap[proj.artistId] && proj.artistId) {
      setLoadingDetails((prev) => ({ ...prev, [proj.id]: true }));
      try {
        const res = await fetch(`/api/artists/${proj.artistId}`);
        const data = await res.json();
        if (data.success) {
          setArtistDetailsMap((prev) => ({
            ...prev,
            [proj.artistId]: {
              activityLogs: data.activityLogs || [],
              fullArtist: data.artist || null,
            },
          }));
        }
      } catch (err) {
        console.error('Failed to load artist detailed workflow:', err);
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [proj.id]: false }));
      }
    }
  };

  const handleOpenUpdate = (proj: any) => {
    setActiveProject(proj);
    setUpdateStatus(proj.installationStatus || 'Planned');
    setUpdateNotes(proj.installationNotes || '');
    setUpdateModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!activeProject) return;
    setSaving(true);

    try {
      if (activeProject.installationId) {
        await fetch('/api/installations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: activeProject.installationId,
            installationStatus: updateStatus,
            installationNotes: updateNotes,
          }),
        });
      } else {
        await fetch('/api/installations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artistId: activeProject.artistId,
            artworkId: activeProject.artworkId,
            venueId: activeProject.venueId,
            roomId: activeProject.roomId,
            installationStatus: updateStatus,
            installationNotes: updateNotes,
          }),
        });
      }

      await fetchData();
      setUpdateModalOpen(false);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSaving(false);
    }
  };

  // Filter projects based on search query, venue, and status
  const filteredProjects = projects.filter((proj) => {
    const q = search.toLowerCase();
    const matchesSearch =
      proj.artistName.toLowerCase().includes(q) ||
      proj.artworkName.toLowerCase().includes(q) ||
      proj.venueName.toLowerCase().includes(q) ||
      proj.roomName.toLowerCase().includes(q);

    const matchesVenue = selectedVenue === 'ALL' || proj.venueId === selectedVenue;
    const matchesStatus = selectedStatus === 'ALL' || proj.installationStatus === selectedStatus;

    return matchesSearch && matchesVenue && matchesStatus;
  });

  const statusesList = ['Planned', 'Ready', 'Installation Pending', 'Installation In Progress', 'Installed', 'Completed'];

  return (
    <div className="space-y-6 pb-16 text-slate-100 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-sky-950 border border-sky-800/80 text-sky-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </span>
            Progress Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Data of each artist project projected as a timeline. Real-time milestone updates across programming, technical, production allocations, and spatial layouts.
          </p>
        </div>

        {/* Global Progress Summary Card */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shrink-0 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-500 flex items-center justify-center font-black text-slate-950 text-sm shadow-md">
            {projects.length}
          </div>
          <div className="text-xs">
            <span className="font-bold text-white block">Active Artist Projects</span>
            <span className="text-[11px] text-sky-400 font-semibold">
              {projects.filter((p) => p.milestones.isFullyComplete).length} / {projects.length} Fully Completed
            </span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artist or artwork..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex-1 sm:flex-none">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Venues ({venues.length})</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  {v.venueName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex-1 sm:flex-none">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
              {statusesList.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Timeline List */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 space-y-3">
          <Sparkles className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading artist project timelines...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
          <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No project timelines found</p>
          <p className="text-xs text-slate-500">Try adjusting your search or venue filters above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((proj) => {
            const m = proj.milestones;
            const progressPct = Math.round((m.completedCount / m.totalActiveSteps) * 100);

            return (
              <div
                key={proj.id}
                className="group relative bg-[#1c1c2b] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-xl flex flex-col gap-4 overflow-hidden"
              >
                {/* Main Card Header Row */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 w-full">
                  {/* Left Section: Artist Name, Artwork Title, Venue & Room Subline */}
                  <div className="space-y-1.5 shrink-0 lg:max-w-[280px] w-full">
                    <div className="flex items-center gap-2">
                      {proj.artistPhoto && (
                        <img
                          src={proj.artistPhoto}
                          alt={proj.artistName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-700"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      )}
                      <h3 className="text-sm font-extrabold text-white tracking-wide group-hover:text-sky-300 transition-colors">
                        {proj.artistName}
                      </h3>
                    </div>

                    <p className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>Artwork: {proj.artworkName}</span>
                    </p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
                        {proj.venueName}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <DoorOpen className="w-3.5 h-3.5 text-emerald-400/90 shrink-0" />
                        Room {proj.roomNumber} ({proj.roomName})
                      </span>
                    </div>
                  </div>

                  {/* Center Section: Milestone Progress Timeline Stepper */}
                  <div className="flex-1 py-2 lg:py-0 px-1 border-y lg:border-y-0 lg:border-x border-slate-800/80 lg:px-6">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                      <span className="text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Milestone Status ({m.completedCount}/{m.totalActiveSteps})
                      </span>
                      <span className="text-sky-400 font-mono">{progressPct}% Complete</span>
                    </div>

                    {/* Connected Timeline Nodes */}
                    <div
                      className={`grid gap-2.5 ${
                        m.showTechData ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
                      }`}
                    >
                      {/* Step 1: Artist & Artwork Onboard */}
                      <div
                        className={`p-2 rounded-xl border transition-all flex flex-col justify-between space-y-1 ${
                          m.onboard
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-slate-950/50 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">1. Onboard</span>
                          {m.onboard ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-600" />
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-200 truncate">Artist & Artwork</span>
                        <span className="text-[9px] text-slate-400 block truncate">Updated by Prog Team</span>
                      </div>

                      {/* Step 2 (Conditional): Tech Data */}
                      {m.showTechData && (
                        <div
                          className={`p-2 rounded-xl border transition-all flex flex-col justify-between space-y-1 ${
                            m.techData
                              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                              : 'bg-slate-950/50 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-80">2. Tech Data</span>
                            {m.techData ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-amber-500/80 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-200 truncate">Tech Data</span>
                          <span className="text-[9px] text-slate-400 block truncate">Tech item allocated</span>
                        </div>
                      )}

                      {/* Step 3: Production Allocation */}
                      <div
                        className={`p-2 rounded-xl border transition-all flex flex-col justify-between space-y-1 ${
                          m.prodAllocation
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-slate-950/50 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                            {m.showTechData ? '3. Production' : '2. Production'}
                          </span>
                          {m.prodAllocation ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-500/80 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-200 truncate">Production Allocation</span>
                        <span className="text-[9px] text-slate-400 block truncate">Prod item allocated</span>
                      </div>

                      {/* Step 4: Final Layout */}
                      <div
                        className={`p-2 rounded-xl border transition-all flex flex-col justify-between space-y-1 ${
                          m.roomLayout
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-slate-950/50 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                            {m.showTechData ? '4. Layout' : '3. Layout'}
                          </span>
                          {m.roomLayout ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-600" />
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-200 truncate">Final Layout</span>
                        <span className="text-[9px] text-slate-400 block truncate">Tech & Prod diagram</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Status Pill Badge & Action Button */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleProjectDetails(proj)}
                        className={`px-3.5 py-1.5 rounded-full font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
                          expandedProjects.has(proj.id)
                            ? 'bg-purple-600 text-white border border-purple-400 shadow-purple-900/50'
                            : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/40'
                        }`}
                        title="Click to expand detailed workflow timeline chart & user entry logs"
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-300" />
                        <span>{expandedProjects.has(proj.id) ? 'Collapse View' : 'Detailed View'}</span>
                        {expandedProjects.has(proj.id) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenUpdate(proj)}
                        className="px-3.5 py-1.5 rounded-full bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/80 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                        title="Click to update installation status & notes"
                      >
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                        <span>{proj.installationStatus}</span>
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        Target: <strong className="text-slate-300">{proj.startDate}</strong>
                      </span>
                      {proj.floorplanUrl && (
                        <a
                          href={proj.floorplanUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 hover:underline flex items-center justify-end gap-1 mt-0.5"
                        >
                          <span>View Layout</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDED DETAILED WORKFLOW TIMELINE CHART (Matching Reference Image "Work Status Timeline Template") */}
                {expandedProjects.has(proj.id) && (
                  <div className="w-full mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-in slide-in-from-top-3 duration-300">
                    <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
                      {/* Header Sub-bar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-400 animate-pulse" /> Detailed Work Status Timeline — {proj.artistName}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Visual role-based workflow chart tracking inputs given by users with exact dates of entry.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                          <span className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-800/80 font-bold">
                            Artwork: {proj.artworkName} ({proj.medium})
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800/80 font-bold">
                            Venue: {proj.venueName} (Room {proj.roomNumber})
                          </span>
                        </div>
                      </div>

                      {/* Work Status Timeline Chart Swimlanes */}
                      <div className="space-y-3 overflow-x-auto pb-2">
                        {/* Top Milestones Header Row (Reference Image Alignment) */}
                        <div className="min-w-[720px] grid grid-cols-12 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
                          <div className="col-span-3 text-left pl-2 text-purple-300">Team / Contributor</div>
                          <div className="col-span-2 border-l border-slate-800">Milestone 01<br/><span className="text-[9px] text-slate-500 font-normal">Onboard</span></div>
                          <div className="col-span-2 border-l border-slate-800">Milestone 02<br/><span className="text-[9px] text-slate-500 font-normal">Tech Data</span></div>
                          <div className="col-span-2 border-l border-slate-800">Milestone 03<br/><span className="text-[9px] text-slate-500 font-normal">Prod Alloc</span></div>
                          <div className="col-span-2 border-l border-slate-800">Milestone 04<br/><span className="text-[9px] text-slate-500 font-normal">Spatial Layout</span></div>
                          <div className="col-span-1 border-l border-slate-800">Status</div>
                        </div>

                        {/* Row 1: PROGRAMMING TEAM (Purple Color Band) */}
                        {(() => {
                          const progAuthor = proj.artistObj?.createdBy || 'Programming Member';
                          const progDate = proj.artistObj?.createdAt ? new Date(proj.artistObj.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                          return (
                            <div className="min-w-[720px] bg-purple-950/20 border border-purple-800/40 rounded-xl p-3 grid grid-cols-12 items-center gap-2 text-xs">
                              <div className="col-span-3 space-y-0.5">
                                <span className="font-extrabold text-purple-300 block text-xs flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-purple-400" /> Programming Team
                                </span>
                                <span className="text-[10px] text-slate-400 block">Artist Onboarding & Registration</span>
                              </div>
                              <div className="col-span-8 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                                <div
                                  className="h-7 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold text-[11px] px-3 flex items-center justify-between shadow-md transition-all duration-500"
                                  style={{ width: proj.milestones.onboard ? '100%' : '15%' }}
                                >
                                  <span className="truncate">
                                    {proj.milestones.onboard ? `Artist "${proj.artistName}" Onboarded` : 'Pending Onboard'}
                                  </span>
                                  <span className="text-[10px] font-mono shrink-0 ml-2">
                                    {proj.milestones.onboard ? '100%' : '0%'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
                                  <span className="truncate max-w-[60%]">Input: Artwork "{proj.artworkName}" ({proj.medium})</span>
                                  <span className="font-semibold text-purple-300 shrink-0">
                                    Entered by: {progAuthor} | Date: {progDate}
                                  </span>
                                </div>
                              </div>
                              <div className="col-span-1 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[9px] font-black uppercase">
                                  {proj.milestones.onboard ? 'DONE' : 'WAIT'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Row 2: TECHNICAL TEAM (Yellow/Gold Color Band) */}
                        {(() => {
                          const techAllocations = (proj.allocationsList || []).filter((a: any) => {
                            const isMatchArtwork = !a.artworkId || a.artworkId === proj.artworkId;
                            const dept = (a.department || '').toUpperCase();
                            const cat = (a.inventoryItem?.inventoryCategory || '').toUpperCase();
                            const usage = (a.inventoryItem?.inventoryUsageType || '').toUpperCase();
                            return isMatchArtwork && (dept === 'TECHNICAL' || cat === 'TECHNICAL' || usage === 'TECHNICAL');
                          });
                          const techAuthor = techAllocations[0]?.approvedBy || techAllocations[0]?.requestedBy || 'Technical Head';
                          const techDate = techAllocations[0]?.allocationDate || (techAllocations[0]?.createdAt ? new Date(techAllocations[0].createdAt).toLocaleDateString('en-GB') : 'Pending');
                          const techItemsSummary = techAllocations.map((a: any) => `${a.issuedQuantity || a.requestedQuantity}x ${a.inventoryItem?.element || 'Item'}`).join(', ');

                          return (
                            <div className="min-w-[720px] bg-amber-950/20 border border-amber-800/40 rounded-xl p-3 grid grid-cols-12 items-center gap-2 text-xs">
                              <div className="col-span-3 space-y-0.5">
                                <span className="font-extrabold text-amber-300 block text-xs flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-amber-400" /> Technical Team
                                </span>
                                <span className="text-[10px] text-slate-400 block">Tech Equipment & AV Allocations</span>
                              </div>
                              <div className="col-span-8 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                                <div
                                  className={`h-7 rounded-lg text-slate-950 font-extrabold text-[11px] px-3 flex items-center justify-between shadow-md transition-all duration-500 ${
                                    proj.milestones.techData ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-slate-800 text-slate-400'
                                  }`}
                                  style={{ width: proj.milestones.techData ? '100%' : '20%' }}
                                >
                                  <span className="truncate">
                                    {techAllocations.length > 0 ? `${techAllocations.length} Tech Item(s) Allocated` : 'No Tech Items Allocated'}
                                  </span>
                                  <span className="text-[10px] font-mono shrink-0 ml-2">
                                    {proj.milestones.techData ? '100%' : '0%'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
                                  <span className="truncate max-w-[60%]">
                                    Input: {techItemsSummary || 'Awaiting technical inventory allocation'}
                                  </span>
                                  <span className="font-semibold text-amber-300 shrink-0">
                                    Entered by: {techAuthor} | Date: {techDate}
                                  </span>
                                </div>
                              </div>
                              <div className="col-span-1 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                  proj.milestones.techData ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-slate-900 text-slate-500 border-slate-800'
                                }`}>
                                  {proj.milestones.techData ? 'DONE' : 'PENDING'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Row 3: PRODUCTION TEAM (Orange/Coral Color Band) */}
                        {(() => {
                          const prodAllocations = (proj.allocationsList || []).filter((a: any) => {
                            const isMatchArtwork = !a.artworkId || a.artworkId === proj.artworkId;
                            const dept = (a.department || '').toUpperCase();
                            const cat = (a.inventoryItem?.inventoryCategory || '').toUpperCase();
                            const usage = (a.inventoryItem?.inventoryUsageType || '').toUpperCase();
                            return isMatchArtwork && (dept === 'PRODUCTION' || cat === 'PRODUCTION' || usage === 'PRODUCTION');
                          });
                          const prodAuthor = prodAllocations[0]?.approvedBy || prodAllocations[0]?.requestedBy || 'Production Manager';
                          const prodDate = prodAllocations[0]?.allocationDate || (prodAllocations[0]?.createdAt ? new Date(prodAllocations[0].createdAt).toLocaleDateString('en-GB') : 'Pending');
                          const prodItemsSummary = prodAllocations.map((a: any) => `${a.issuedQuantity || a.requestedQuantity}x ${a.inventoryItem?.element || 'Item'}`).join(', ');

                          return (
                            <div className="min-w-[720px] bg-rose-950/20 border border-rose-800/40 rounded-xl p-3 grid grid-cols-12 items-center gap-2 text-xs">
                              <div className="col-span-3 space-y-0.5">
                                <span className="font-extrabold text-rose-300 block text-xs flex items-center gap-1.5">
                                  <PackageCheck className="w-3.5 h-3.5 text-rose-400" /> Production Team
                                </span>
                                <span className="text-[10px] text-slate-400 block">Production Inventory & Fabrication</span>
                              </div>
                              <div className="col-span-8 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                                <div
                                  className={`h-7 rounded-lg text-white font-extrabold text-[11px] px-3 flex items-center justify-between shadow-md transition-all duration-500 ${
                                    proj.milestones.prodAllocation ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-slate-800 text-slate-400'
                                  }`}
                                  style={{ width: proj.milestones.prodAllocation ? '100%' : '20%' }}
                                >
                                  <span className="truncate">
                                    {prodAllocations.length > 0 ? `${prodAllocations.length} Production Item(s) Allocated` : 'No Prod Items Allocated'}
                                  </span>
                                  <span className="text-[10px] font-mono shrink-0 ml-2">
                                    {proj.milestones.prodAllocation ? '100%' : '0%'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
                                  <span className="truncate max-w-[60%]">
                                    Input: {prodItemsSummary || 'Awaiting production item allocation'}
                                  </span>
                                  <span className="font-semibold text-rose-300 shrink-0">
                                    Entered by: {prodAuthor} | Date: {prodDate}
                                  </span>
                                </div>
                              </div>
                              <div className="col-span-1 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                  proj.milestones.prodAllocation ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-slate-900 text-slate-500 border-slate-800'
                                }`}>
                                  {proj.milestones.prodAllocation ? 'DONE' : 'PENDING'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Row 4: SPATIAL DESIGNERS (Green Color Band) */}
                        {(() => {
                          const spatialAuthor = 'Spatial Designer';
                          const spatialDate = proj.floorplanUrl ? 'Verified' : 'Pending';

                          return (
                            <div className="min-w-[720px] bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 grid grid-cols-12 items-center gap-2 text-xs">
                              <div className="col-span-3 space-y-0.5">
                                <span className="font-extrabold text-emerald-300 block text-xs flex items-center gap-1.5">
                                  <Palette className="w-3.5 h-3.5 text-emerald-400" /> Spatial Designers
                                </span>
                                <span className="text-[10px] text-slate-400 block">Room Floorplan & Elevation Drawings</span>
                              </div>
                              <div className="col-span-8 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                                <div
                                  className={`h-7 rounded-lg text-slate-950 font-extrabold text-[11px] px-3 flex items-center justify-between shadow-md transition-all duration-500 ${
                                    proj.milestones.roomLayout ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-slate-800 text-slate-400'
                                  }`}
                                  style={{ width: proj.milestones.roomLayout ? '100%' : '20%' }}
                                >
                                  <span className="truncate">
                                    {proj.milestones.roomLayout ? 'Tech & Production Layout Diagram Uploaded' : 'Awaiting Layout Upload'}
                                  </span>
                                  <span className="text-[10px] font-mono shrink-0 ml-2">
                                    {proj.milestones.roomLayout ? '100%' : '0%'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
                                  <span className="truncate max-w-[60%]">
                                    Input: {proj.floorplanUrl ? `Layout URL: ${proj.floorplanUrl.split('/').pop()}` : 'No layout drawing uploaded'}
                                  </span>
                                  <span className="font-semibold text-emerald-300 shrink-0">
                                    Entered by: {spatialAuthor} | Date: {spatialDate}
                                  </span>
                                </div>
                              </div>
                              <div className="col-span-1 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                  proj.milestones.roomLayout ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'
                                }`}>
                                  {proj.milestones.roomLayout ? 'DONE' : 'PENDING'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Row 5: INSTALLATION TEAM (Blue Color Band) */}
                        {(() => {
                          const instPct = proj.installationStatus === 'Completed' || proj.installationStatus === 'Installed' ? 100 : proj.installationStatus === 'Installation In Progress' ? 65 : proj.installationStatus === 'Ready' ? 40 : 15;
                          const instAuthor = 'Installation Lead';
                          const instDate = proj.startDate || 'TBD';

                          return (
                            <div className="min-w-[720px] bg-sky-950/20 border border-sky-800/40 rounded-xl p-3 grid grid-cols-12 items-center gap-2 text-xs">
                              <div className="col-span-3 space-y-0.5">
                                <span className="font-extrabold text-sky-300 block text-xs flex items-center gap-1.5">
                                  <Wrench className="w-3.5 h-3.5 text-sky-400" /> Installation Team
                                </span>
                                <span className="text-[10px] text-slate-400 block">On-Site Setup & Readiness</span>
                              </div>
                              <div className="col-span-8 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                                <div
                                  className="h-7 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold text-[11px] px-3 flex items-center justify-between shadow-md transition-all duration-500"
                                  style={{ width: `${instPct}%` }}
                                >
                                  <span className="truncate">Status: {proj.installationStatus}</span>
                                  <span className="text-[10px] font-mono shrink-0 ml-2">{instPct}%</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
                                  <span className="truncate max-w-[60%]">
                                    Input Notes: "{proj.installationNotes || 'No notes provided'}"
                                  </span>
                                  <span className="font-semibold text-sky-300 shrink-0">
                                    Entered by: {instAuthor} | Date: {instDate}
                                  </span>
                                </div>
                              </div>
                              <div className="col-span-1 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 text-[9px] font-black uppercase">
                                  {proj.installationStatus}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* User Input Log & Audit History Table */}
                      {(() => {
                        const detailsData = artistDetailsMap[proj.artistId];
                        const logsList = detailsData?.activityLogs || [];

                        return (
                          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                <History className="w-3.5 h-3.5 text-purple-400" /> Detailed User Entry Log History
                              </h5>
                              {loadingDetails[proj.id] && (
                                <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 animate-spin" /> Loading audit history...
                                </span>
                              )}
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                                    <th className="p-2.5">Date of Entry</th>
                                    <th className="p-2.5">Team / Role</th>
                                    <th className="p-2.5">User Name</th>
                                    <th className="p-2.5">Input Action / Details</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                  {logsList.length > 0 ? (
                                    logsList.map((log: any) => (
                                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                          {new Date(log.createdAt).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-2.5">
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800">
                                            {log.userRole || 'TEAM'}
                                          </span>
                                        </td>
                                        <td className="p-2.5 font-semibold text-white">
                                          {log.userName || 'Admin'}
                                        </td>
                                        <td className="p-2.5 text-slate-300">
                                          {log.action} — {log.entityType} ({log.entityId})
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <>
                                      <tr className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                          {proj.artistObj?.createdAt ? new Date(proj.artistObj.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                                        </td>
                                        <td className="p-2.5">
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800">
                                            PROGRAMMING
                                          </span>
                                        </td>
                                        <td className="p-2.5 font-semibold text-white">
                                          {proj.artistObj?.createdBy || 'Programming Team'}
                                        </td>
                                        <td className="p-2.5 text-slate-300">
                                          Registered artist "{proj.artistName}" & artwork "{proj.artworkName}" ({proj.medium})
                                        </td>
                                      </tr>
                                      {proj.floorplanUrl && (
                                        <tr className="hover:bg-slate-800/40 transition-colors">
                                          <td className="p-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                            Layout Verified
                                          </td>
                                          <td className="p-2.5">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                              SPATIAL DESIGNER
                                            </span>
                                          </td>
                                          <td className="p-2.5 font-semibold text-white">
                                            Spatial Designer
                                          </td>
                                          <td className="p-2.5 text-slate-300">
                                            Uploaded final spatial layout & tech production diagram: {proj.floorplanUrl.split('/').pop()}
                                          </td>
                                        </tr>
                                      )}
                                    </>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {updateModalOpen && activeProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" /> Update Timeline Status
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeProject.artistName} - {activeProject.artworkName}
                </p>
              </div>
              <button
                onClick={() => setUpdateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Installation Status Stage</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold focus:border-sky-500 focus:outline-none cursor-pointer"
                >
                  {statusesList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Status Notes / Milestones Log</label>
                <textarea
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Record layout updates, technical readiness, or progress notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 h-24 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveStatus}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-50"
              >
                {saving ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                <span>Save Status Update</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
