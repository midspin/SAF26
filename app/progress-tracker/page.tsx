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
  Upload,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Layers,
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
                className="group relative bg-[#1c1c2b] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 overflow-hidden"
              >
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

                {/* Right Section: Status Pill Badge & Action Button (Matching Reference Image) */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenUpdate(proj)}
                    className="px-4 py-1.5 rounded-full bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/80 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                    title="Click to update installation status & notes"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>{proj.installationStatus}</span>
                  </button>

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
