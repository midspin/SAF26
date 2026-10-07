'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ArtistDocketModal from '@/components/ArtistDocketModal';
import {
  FileText,
  Search,
  Building2,
  DoorOpen,
  Users,
  Palette,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Printer,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  Layers,
  Wrench,
  Download,
} from 'lucide-react';

export default function ArtistDocketPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('ALL');
  const [selectedLayoutFilter, setSelectedLayoutFilter] = useState('ALL'); // ALL, WITH_LAYOUT, WITHOUT_LAYOUT

  // Selected Artist for Docket Modal
  const [selectedArtistForDocket, setSelectedArtistForDocket] = useState<any | null>(null);
  const [docketModalOpen, setDocketModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [artistsRes, venuesRes] = await Promise.all([
        fetch('/api/artists'),
        fetch('/api/venues'),
      ]);

      const artistsData = await artistsRes.json();
      const venuesData = await venuesRes.json();

      if (artistsData.success && artistsData.artists) {
        setArtists(artistsData.artists);
      }
      if (venuesData.success && venuesData.venues) {
        setVenues(venuesData.venues);
      }
    } catch (err) {
      console.error('Failed to load artist docket data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDocketForArtist = (artist: any) => {
    setSelectedArtistForDocket(artist);
    setDocketModalOpen(true);
  };

  // Filter Artists
  const filteredArtists = artists.filter((art) => {
    const primaryArtwork = art.artworks?.[0];
    const primaryInst = art.installations?.[0];
    const venueName = primaryInst?.venue?.venueName || primaryArtwork?.venue?.venueName || '';
    const roomName = primaryInst?.room?.roomName || primaryArtwork?.room?.roomName || '';
    const roomNumber = primaryInst?.room?.roomNumber || primaryArtwork?.room?.roomNumber || '';
    const curatorName = art.curatorAssignments?.[0]?.curator?.name || '';
    const hasLayout = Boolean(primaryInst?.room?.techProdLayout || primaryArtwork?.techProdLayout);

    // Venue filter
    if (selectedVenue !== 'ALL') {
      const vId = primaryInst?.venueId || primaryArtwork?.venueId;
      if (vId !== selectedVenue) return false;
    }

    // Layout filter
    if (selectedLayoutFilter === 'WITH_LAYOUT' && !hasLayout) return false;
    if (selectedLayoutFilter === 'WITHOUT_LAYOUT' && hasLayout) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchArtist = (art.artistName || '').toLowerCase().includes(q);
      const matchArtwork = (primaryArtwork?.artworkName || '').toLowerCase().includes(q);
      const matchVenue = venueName.toLowerCase().includes(q);
      const matchRoom = roomName.toLowerCase().includes(q) || roomNumber.toLowerCase().includes(q);
      const matchCurator = curatorName.toLowerCase().includes(q);
      const matchCountry = (art.country || '').toLowerCase().includes(q);

      return matchArtist || matchArtwork || matchVenue || matchRoom || matchCurator || matchCountry;
    }

    return true;
  });

  // Calculate Metrics
  const totalArtists = artists.length;
  const artistsWithRoom = artists.filter(
    (a) => a.installations?.length > 0 && a.installations[0]?.room
  ).length;
  const artistsWithLayout = artists.filter((a) => {
    const inst = a.installations?.[0];
    const art = a.artworks?.[0];
    return Boolean(inst?.room?.techProdLayout || art?.techProdLayout);
  }).length;

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Spaces & Production • Documentation
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-emerald-400" /> Artist Docket Generator
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8d9b] mt-1 max-w-2xl">
            Generate, preview, and print official 3-page production dockets with venue allocations, curatorial concepts, itemized inventory tables, and uploaded final spatial layout drawings.
          </p>
        </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-[#1c1c2a] hover:bg-[#28283c] text-[#8a8d9b] hover:text-white border border-white/10 transition-all cursor-pointer shadow-sm"
              title="Refresh Artist Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-3xl bg-[#1c1c2a] border border-white/5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#8a8d9b] uppercase tracking-wider block">
                Total Artists
              </span>
              <span className="text-2xl font-black text-white mt-1 block">{totalArtists}</span>
              <span className="text-[10px] text-slate-400">Registered in festival</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-[#1c1c2a] border border-white/5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#8a8d9b] uppercase tracking-wider block">
                Spatial Allocated
              </span>
              <span className="text-2xl font-black text-[#38bdf8] mt-1 block">{artistsWithRoom}</span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {totalArtists > 0 ? Math.round((artistsWithRoom / totalArtists) * 100) : 0}% Assigned to Rooms
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-[#38bdf8] flex items-center justify-center">
              <DoorOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-[#1c1c2a] border border-white/5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#8a8d9b] uppercase tracking-wider block">
                Final Layouts Uploaded
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">{artistsWithLayout}</span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {artistsWithRoom > 0 ? Math.round((artistsWithLayout / artistsWithRoom) * 100) : 0}% Ready for Final Docket
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-4 rounded-3xl bg-[#1c1c2a] border border-white/5 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8a8d9b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artist, artwork, venue, room number, or curator..."
              className="w-full bg-[#141420] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[#8a8d9b] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Venue Filter Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="bg-[#141420] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Venues ({venues.length})</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.venueName}
                </option>
              ))}
            </select>

            {/* Layout Filter Dropdown */}
            <select
              value={selectedLayoutFilter}
              onChange={(e) => setSelectedLayoutFilter(e.target.value)}
              className="bg-[#141420] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Layout Statuses</option>
              <option value="WITH_LAYOUT">✓ With Final Layout</option>
              <option value="WITHOUT_LAYOUT">⚠ Missing Final Layout</option>
            </select>
          </div>
        </div>

        {/* ARTIST DOCKET TABLE */}
        <div className="bg-[#1c1c2a] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Artist Docket Directory ({filteredArtists.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141420] text-[#8a8d9b] uppercase text-[10px] font-black tracking-wider border-b border-white/5">
                  <th className="py-3.5 px-4">Artist & Artwork</th>
                  <th className="py-3.5 px-4">Allocated Venue & Room</th>
                  <th className="py-3.5 px-4">Curator & Discipline</th>
                  <th className="py-3.5 px-4">Production Team</th>
                  <th className="py-3.5 px-4 text-center">Final Layout</th>
                  <th className="py-3.5 px-4 text-right">Generate Docket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8a8d9b]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                        <span>Loading artist & spatial allocation records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredArtists.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#8a8d9b]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText className="w-8 h-8 text-[#8a8d9b]/50" />
                        <span>No artist records found matching your filters.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredArtists.map((art) => {
                    const primaryArtwork = art.artworks?.[0];
                    const primaryInst = art.installations?.[0];
                    const venueName =
                      primaryInst?.venue?.venueName || primaryArtwork?.venue?.venueName || 'Unassigned Venue';
                    const roomNumber = primaryInst?.room?.roomNumber || primaryArtwork?.room?.roomNumber;
                    const roomName = primaryInst?.room?.roomName || primaryArtwork?.room?.roomName || 'Unassigned Room';
                    const curatorName =
                      art.curatorAssignments?.[0]?.curator?.name || art.curatorName || 'General Curatorial';
                    const discipline =
                      primaryArtwork?.installationType || primaryArtwork?.medium || 'Spatial Installation';

                    const productionTeam = (art.productionAssignments || [])
                      .map((p: any) => p.productionPerson?.name || p.name)
                      .filter(Boolean);

                    const finalLayoutUrl =
                      primaryInst?.room?.techProdLayout ||
                      primaryArtwork?.techProdLayout ||
                      primaryInst?.room?.roomImage;

                    const hasFinalLayout = Boolean(finalLayoutUrl);

                    return (
                      <tr
                        key={art.id}
                        className="hover:bg-[#232334] transition-colors group"
                      >
                        {/* Artist & Artwork */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center font-black text-sm text-slate-400">
                              {art.artistPhoto ? (
                                <img
                                  src={art.artistPhoto}
                                  alt={art.artistName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                art.artistName?.charAt(0) || 'A'
                              )}
                            </div>
                            <div className="truncate max-w-[220px]">
                              <Link
                                href={`/artists/${art.id}`}
                                className="font-extrabold text-white hover:text-emerald-400 transition-colors block truncate"
                              >
                                {art.artistName}
                              </Link>
                              <span className="text-[11px] text-[#8a8d9b] block truncate">
                                {primaryArtwork?.artworkName || 'Artwork Pending'}
                              </span>
                              {art.country && (
                                <span className="text-[9px] text-[#8a8d9b]/80 block truncate">
                                  📍 {art.city ? `${art.city}, ` : ''}{art.country}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Venue & Room */}
                        <td className="py-4 px-4">
                          <div className="space-y-1 truncate max-w-[200px]">
                            <span className="font-bold text-[#38bdf8] flex items-center gap-1 truncate">
                              <Building2 className="w-3.5 h-3.5 shrink-0" /> {venueName}
                            </span>
                            <span className="text-[11px] text-slate-300 flex items-center gap-1 truncate">
                              <DoorOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />{' '}
                              {roomNumber ? `Room ${roomNumber} (${roomName})` : roomName}
                            </span>
                          </div>
                        </td>

                        {/* Curator & Discipline */}
                        <td className="py-4 px-4">
                          <div className="space-y-1 truncate max-w-[180px]">
                            <span className="font-bold text-white block truncate">{curatorName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 text-[#c4b5fd] border border-[#8b5cf6]/30 inline-block truncate max-w-[160px]">
                              {discipline}
                            </span>
                          </div>
                        </td>

                        {/* Production Team */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5 truncate max-w-[160px]">
                            {productionTeam.length > 0 ? (
                              productionTeam.map((p: string, idx: number) => (
                                <span key={idx} className="text-[11px] text-slate-300 block truncate">
                                  • {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-[#8a8d9b] italic">Production Lead</span>
                            )}
                          </div>
                        </td>

                        {/* Final Layout Status */}
                        <td className="py-4 px-4 text-center">
                          {hasFinalLayout ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertCircle className="w-3 h-3" /> No Layout
                            </span>
                          )}
                        </td>

                        {/* Action: Generate Docket */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openDocketForArtist(art)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" /> Generate Docket
                            </button>
                            <Link
                              href={`/artists/${art.id}`}
                              className="p-1.5 rounded-xl bg-[#141420] hover:bg-[#28283c] text-[#8a8d9b] hover:text-white border border-white/5 transition-colors"
                              title="Open Artist 360 View"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DOCKET POPUP MODAL */}
        {docketModalOpen && selectedArtistForDocket && (
          <ArtistDocketModal
            artistId={selectedArtistForDocket.id}
            isOpen={docketModalOpen}
            onClose={() => {
              setDocketModalOpen(false);
              setSelectedArtistForDocket(null);
            }}
            initialArtistData={selectedArtistForDocket}
          />
        )}
      </div>
    );
}
