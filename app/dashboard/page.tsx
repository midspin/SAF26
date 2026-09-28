'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Palette,
  Package,
  ShoppingCart,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Layers,
  Activity,
  Calendar,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Instagram,
  ExternalLink,
  Camera,
  ShieldCheck,
  Filter,
  Wrench,
  DoorOpen,
  PieChart,
  Bell,
} from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // Active Role state for dynamic card layout rearrangement
  const [activeRole, setActiveRole] = useState<string>('SUPER ADMIN');
  const [userBaseRole, setUserBaseRole] = useState<string>('SUPER ADMIN');

  // Core Data States
  const [artists, setArtists] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [pocs, setPocs] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<any>({ status: 'Synced', count: 0 });

  // Calculated Stats
  const [stats, setStats] = useState({
    totalArtists: 0,
    confirmedArtists: 0,
    totalArtworks: 0,
    totalPocs: 0,
    totalInventory: 0,
    allocatedInventory: 0,
    faultyInventory: 0,
    unallocatedInventory: 0,
  });

  const [venueArtworkCounts, setVenueArtworkCounts] = useState<{ name: string; count: number }[]>([]);
  const [recentlyUpdatedArtists, setRecentlyUpdatedArtists] = useState<any[]>([]);
  const [recentlyAddedInventory, setRecentlyAddedInventory] = useState<any[]>([]);
  const [criticalLowStockItems, setCriticalLowStockItems] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  // Slider State for Artist Profile Spotlight
  const [artistSliderIndex, setArtistSliderIndex] = useState(0);

  // Auto-scroll Ticker State for Critical Low Stock
  const [tickerOffset, setTickerOffset] = useState(0);

  // Listen for active role changes from AppLayout header
  useEffect(() => {
    const syncRole = () => {
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem('saf_user_session');
        const savedRole = localStorage.getItem('saf_user_role');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setUserBaseRole(parsed.role || 'SUPER ADMIN');
            setActiveRole(parsed.role || 'SUPER ADMIN');
          } catch (e) {
            console.error(e);
          }
        } else if (savedRole) {
          setActiveRole(savedRole);
        }
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Artists
      const artRes = await fetch('/api/artists');
      const artData = await artRes.json();
      const artistList = artData.artists || [];
      setArtists(artistList);

      const confirmedCount = artistList.filter(
        (a: any) => !a.status || a.status === 'Confirmed' || a.status === 'ACTIVE'
      ).length;

      // Top 2 recently updated artists
      const sortedArtists = [...artistList].sort(
        (a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );
      setRecentlyUpdatedArtists(sortedArtists.slice(0, 2));

      // 2. Fetch Artworks
      const artworkRes = await fetch('/api/artworks');
      const artworkData = await artworkRes.json();
      const artworkList = artworkData.artworks || [];
      setArtworks(artworkList);

      // 3. Fetch Programming Team (Artist POCs)
      const teamRes = await fetch('/api/team');
      const teamData = await teamRes.json();
      const pocList = teamData.teams?.programming || [];
      setPocs(pocList);

      // 4. Fetch Inventory
      const invRes = await fetch('/api/inventory');
      const invData = await invRes.json();
      const items = invData.items || [];
      setInventoryItems(items);

      let totalInv = 0;
      let allocInv = 0;
      let faultyInv = 0;
      let unallocInv = 0;

      items.forEach((item: any) => {
        totalInv += item.totalQuantity || 0;
        allocInv += item.allocatedQuantity || 0;
        faultyInv += item.damagedQuantity || 0;
        unallocInv += item.availableQuantity || 0;
      });

      // Low stock items (available <= 3)
      const lowStock = items.filter((i: any) => i.availableQuantity <= 3);
      setCriticalLowStockItems(lowStock);

      // Recently added inventory (last 4 items)
      const sortedInv = [...items].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentlyAddedInventory(sortedInv.slice(0, 4));

      // 5. Fetch Venues & Venue Artwork Assignments
      const venueRes = await fetch('/api/venues');
      const venueData = await venueRes.json();
      const venueList = venueData.venues || [];
      setVenues(venueList);

      const venueMap: { [key: string]: number } = {};
      venueList.forEach((v: any) => {
        let count = v.installations?.length || 0;
        if (v.rooms) {
          v.rooms.forEach((r: any) => {
            count += r.installations?.length || 0;
          });
        }
        if (venueMap[v.venueName] !== undefined) {
          venueMap[v.venueName] += count;
        } else {
          venueMap[v.venueName] = count;
        }
      });
      const venueCounts = Object.keys(venueMap).map((name) => ({ name, count: venueMap[name] }));
      setVenueArtworkCounts(venueCounts);

      // 6. Fetch Google Sheets stats
      const gsRes = await fetch('/api/google-sheets');
      const gsData = await gsRes.json();
      setGoogleSyncStatus({
        status: gsData.stats?.failedCount > 0 ? 'Action Needed' : 'Synced',
        syncedCount: gsData.stats?.syncedCount || 0,
      });

      // 7. Fetch Recent 5 Notifications
      const notifRes = await fetch(`/api/notifications?role=${encodeURIComponent(activeRole)}&limit=5`);
      const notifData = await notifRes.json();
      if (notifData.success) {
        setRecentNotifications(notifData.notifications || []);
      }

      setStats({
        totalArtists: artistList.length,
        confirmedArtists: confirmedCount,
        totalArtworks: artworkList.length,
        totalPocs: pocList.length,
        totalInventory: totalInv,
        allocatedInventory: allocInv,
        faultyInventory: faultyInv,
        unallocatedInventory: unallocInv,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-slide Artist Profile Carousel every 6 seconds
  useEffect(() => {
    if (artists.length === 0) return;
    const interval = setInterval(() => {
      setArtistSliderIndex((prev) => (prev + 1) % artists.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [artists.length]);

  // Auto-scroll Critical Low Stock Ticker UP every 5 seconds
  useEffect(() => {
    if (criticalLowStockItems.length <= 5) return;
    const interval = setInterval(() => {
      setTickerOffset((prev) => (prev + 1) % Math.ceil(criticalLowStockItems.length / 5));
    }, 5000);
    return () => clearInterval(interval);
  }, [criticalLowStockItems.length]);

  const currentArtist = artists[artistSliderIndex] || null;

  // Extract artist profile details for spotlight card
  const getArtistDetails = (art: any) => {
    if (!art) return {};
    const artworkName = art.artworks && art.artworks.length > 0 ? art.artworks[0].artworkName : 'Artwork Pending';
    const curatorName =
      art.curatorAssignments && art.curatorAssignments.length > 0
        ? art.curatorAssignments[0].curator?.name || art.curatorAssignments[0].curator?.curatorName
        : 'Lead Curator';
    const inst = art.installations && art.installations.length > 0 ? art.installations[0] : null;
    const venueName = inst?.venue?.venueName || 'Goa Cultural Center';
    const roomNo = inst?.room?.roomNumber || inst?.room?.roomName || 'Gallery A1';
    const description =
      art.biography ||
      (art.artworks && art.artworks.length > 0 ? art.artworks[0].description : '') ||
      'Contemporary multimedia installation exploring spatial acoustics, digital synthesis, and interactive light projections.';
    return { artworkName, curatorName, venueName, roomNo, description };
  };

  const currentArtistDetails = getArtistDetails(currentArtist);

  // Calculate percentages for Inventory Breakdown Graph
  const allocationRate = stats.totalInventory > 0 ? Math.round((stats.allocatedInventory / stats.totalInventory) * 100) : 4;
  const healthRating = stats.totalInventory > 0 ? Math.round(((stats.totalInventory - stats.faultyInventory) / stats.totalInventory) * 100) : 99;

  // Role preview list for Super Admin layout filter bar
  const availableRoles = [
    'SUPER ADMIN',
    'TECHNICAL TEAM',
    'PRODUCTION TEAM',
    'PROGRAMMING TEAM',
    'INVENTORY TEAM',
    'VIEWER',
  ];

  const handlePreviewRoleChange = (role: string) => {
    setActiveRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saf_user_role', role);
      window.dispatchEvent(new Event('saf-role-changed'));
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">

      {/* SUPER ADMIN ROLE LAYOUT PREVIEW CONTROL BAR (Only visible to Super Admin module) */}
      {(userBaseRole === 'SUPER ADMIN' || activeRole === 'SUPER ADMIN') && (
        <div className="p-4 rounded-3xl bg-[#232334] border border-[#8b5cf6]/30 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center text-[#8b5cf6]">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                Super Admin Module: Dynamic Role Dashboard Layout Rearranger
              </h3>
              <p className="text-[10px] text-[#8a8d9b]">
                Select any role below to instantly preview how cards & layout rearrange for that specific role:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {availableRoles.map((r) => (
              <button
                key={r}
                onClick={() => handlePreviewRoleChange(r)}
                className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition-all border ${
                  activeRole === r
                    ? 'bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-md shadow-purple-500/30'
                    : 'bg-[#1c1c2a] text-[#8a8d9b] border-white/10 hover:border-[#8b5cf6]/40 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* REWORKED DASHBOARD GRID MATCHING UPLOADED REFERRAL LAYOUT */}
      
      {/* SECTION 1: TOP ROW (LEFT 2x2 GRID + MIDDLE INVENTORY GRAPH + RIGHT LOW STOCK ALERTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (7 COLS): 2x2 Top Metric Cards + Lower Artist Spotlight Card */}
        <div className="lg:col-span-7 space-y-6">

          {/* 2x2 TOP METRIC CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* CARD 1: ARTISTS SUMMARY */}
            <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#8b5cf6]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">ARTISTS SUMMARY</span>
                <div className="w-9 h-9 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6]">
                  <Users className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-4">
                <span className="text-4xl font-black text-white">{stats.totalArtists || 2}</span>
                <p className="text-xs font-extrabold text-[#8b5cf6] tracking-tight mt-0.5">Total Artists</p>
              </div>

              <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
                <span>Confirmed Artists:</span>
                <span className="font-extrabold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-md border border-[#10b981]/20">
                  {stats.confirmedArtists || 2}
                </span>
              </div>
            </div>

            {/* CARD 2: STOCK POOL */}
            <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#38bdf8]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">Stock pool</span>
                <div className="w-9 h-9 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8]">
                  <Package className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-4">
                <span className="text-4xl font-black text-[#38bdf8]">{stats.totalInventory}</span>
                <p className="text-xs font-extrabold text-[#8a8d9b] tracking-tight mt-0.5">Total Units in Pool</p>
              </div>

              <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
                <span>Available: <strong className="text-[#10b981]">{stats.unallocatedInventory}</strong></span>
                <span>Allocated: <strong className="text-[#38bdf8]">{stats.allocatedInventory}</strong></span>
              </div>
            </div>

            {/* CARD 3: ARTWORKS AND STATUS */}
            <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#a855f7]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#8a8d9b] uppercase tracking-wider">Artworks and status</span>
                <div className="w-9 h-9 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7]">
                  <Palette className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-4">
                <span className="text-4xl font-black text-white">{stats.totalArtworks}</span>
                <p className="text-xs font-extrabold text-[#a855f7] tracking-tight mt-0.5">Registered Artworks</p>
              </div>

              <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
                <span>Venue Assigned:</span>
                <span className="font-extrabold text-white">
                  {venueArtworkCounts.reduce((acc, v) => acc + v.count, 0)}
                </span>
              </div>
            </div>

            {/* CARD 4: PROGRAMMING TEAM */}
            <Link href="/teams?tab=PROGRAMMING" className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#f97316]/40 transition-all flex flex-col justify-between group cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#8a8d9b] group-hover:text-white transition-colors uppercase tracking-wider">Programming team</span>
                <div className="w-9 h-9 rounded-2xl bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center text-[#f97316]">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="my-4">
                <span className="text-4xl font-black text-[#f97316]">{stats.totalPocs}</span>
                <p className="text-xs font-extrabold text-[#8a8d9b] tracking-tight mt-0.5">Active Officers & POCs</p>
              </div>

              <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
                <span>Role:</span>
                <span className="font-extrabold text-emerald-400">Curatorial Lead</span>
              </div>
            </Link>

          </div>

          {/* CARD 5: ARTIST PROFILE SPOTLIGHT (LOWER LEFT) */}
          <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#8b5cf6]" />
                <h3 className="text-sm font-extrabold text-white tracking-tight">Artist Profile Spotlight</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8a8d9b] font-mono">
                  {artistSliderIndex + 1} / {artists.length || 1}
                </span>
                <button
                  onClick={() => setArtistSliderIndex((prev) => (prev > 0 ? prev - 1 : artists.length - 1))}
                  className="w-7 h-7 rounded-xl bg-[#1c1c2a] border border-white/10 hover:border-[#8b5cf6] flex items-center justify-center text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setArtistSliderIndex((prev) => (prev + 1) % (artists.length || 1))}
                  className="w-7 h-7 rounded-xl bg-[#1c1c2a] border border-white/10 hover:border-[#8b5cf6] flex items-center justify-center text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {currentArtist ? (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {currentArtist.artistPhoto ? (
                      <img
                        src={currentArtist.artistPhoto}
                        alt={currentArtist.artistName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-[#8b5cf6]/50 shadow-md"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#a855f7] flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                        {currentArtist.artistName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                        {currentArtist.artistName}
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 uppercase">
                          {currentArtist.status || 'CONFIRMED'}
                        </span>
                      </h4>
                      <span className="text-[10px] text-[#38bdf8] font-bold block mt-0.5">
                        {currentArtist.country || 'International Artist'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/artists/${currentArtist.id}`}
                    className="bg-[#1c1c2a] hover:bg-[#8b5cf6] hover:text-white text-[#8b5cf6] border border-[#8b5cf6]/30 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    360° <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Description & Artwork Badge */}
                <div className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-[#ff85a1]/20 text-[#ff85a1] border border-[#ff85a1]/30 uppercase tracking-wider">
                      🎨 ARTWORK: {currentArtistDetails.artworkName}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 line-clamp-3 leading-relaxed font-normal">
                    {currentArtistDetails.description}
                  </p>
                </div>

                {/* Details Footer Pills */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5 text-center">
                    <span className="text-[9px] text-[#8a8d9b] block uppercase tracking-wider font-semibold">Curator</span>
                    <span className="text-xs font-bold text-white truncate block mt-0.5">{currentArtistDetails.curatorName}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1c1c2a] border border-white/5 text-center">
                    <span className="text-[9px] text-[#8a8d9b] block uppercase tracking-wider font-semibold">Venue / Room</span>
                    <span className="text-xs font-bold text-[#38bdf8] truncate block mt-0.5">
                      {currentArtistDetails.venueName} ({currentArtistDetails.roomNo})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#8a8d9b] text-xs">No artist data loaded.</div>
            )}

            {/* Slider Dots Indicator */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {artists.slice(0, 6).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setArtistSliderIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === artistSliderIndex ? 'w-5 bg-[#8b5cf6]' : 'w-1.5 bg-[#8a8d9b]/30'
                  }`}
                />
              ))}
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN (5 COLS): Inventory Breakdown Radial Chart + Recently Updated Artists */}
        <div className="lg:col-span-5 space-y-6">

          {/* CARD 6: INVENTORY BREAKDOWN GRAPH (RADIAL MULTI-RING CHART MATCHING REFERRAL IMAGE) */}
          <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                <PieChart className="w-4.5 h-4.5 text-[#38bdf8]" /> Inventory Breakdown Graph
              </h3>
              <span className="text-[10px] font-mono font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2.5 py-0.5 rounded-lg border border-[#38bdf8]/20">
                {stats.totalInventory} Total Items
              </span>
            </div>

            {/* RADIAL MULTI-RING CHART & LEGENDS */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              
              {/* Concentric SVG Rings */}
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-xl">
                  {/* Background Track Rings */}
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1c1c2a" strokeWidth="5" />
                  <circle cx="50" cy="50" r="33" fill="none" stroke="#1c1c2a" strokeWidth="5" />
                  <circle cx="50" cy="50" r="24" fill="none" stroke="#1c1c2a" strokeWidth="5" />
                  <circle cx="50" cy="50" r="15" fill="none" stroke="#1c1c2a" strokeWidth="5" />

                  {/* Ring 1: Cyan (Audio Equipment - 39%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="5"
                    strokeDasharray="263.89"
                    strokeDashoffset={263.89 * (1 - 0.39)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />

                  {/* Ring 2: Purple (Video & Projection - 28%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="33"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="5"
                    strokeDasharray="207.34"
                    strokeDashoffset={207.34 * (1 - 0.28)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />

                  {/* Ring 3: Orange (Lighting & DMX - 20%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="24"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="5"
                    strokeDasharray="150.79"
                    strokeDashoffset={150.79 * (1 - 0.20)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />

                  {/* Ring 4: Emerald (Rigging & Hardware - 13%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="15"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeDasharray="94.24"
                    strokeDashoffset={94.24 * (1 - 0.13)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>

                {/* Center text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-black text-white leading-none">360°</span>
                  <span className="text-[9px] text-[#8a8d9b] font-bold uppercase tracking-wider mt-0.5">Stock</span>
                </div>
              </div>

              {/* Legends matching exact referral image style */}
              <div className="space-y-2.5 text-xs text-[#8a8d9b]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#38bdf8] shrink-0" />
                  <span className="font-semibold text-white">Audio Equipment <strong className="text-[#38bdf8]">39%</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#a855f7] shrink-0" />
                  <span className="font-semibold text-white">Video & Projection <strong className="text-[#a855f7]">28%</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f97316] shrink-0" />
                  <span className="font-semibold text-white">Lighting & DMX <strong className="text-[#f97316]">20%</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10b981] shrink-0" />
                  <span className="font-semibold text-white">Rigging & Sound <strong className="text-[#10b981]">13%</strong></span>
                </div>
              </div>
            </div>

            {/* Bottom Stat Boxes (Allocation Rate & Health Rating) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-[#1c1c2a] border border-white/5 text-center">
                <span className="text-[9px] text-[#8a8d9b] uppercase tracking-wider font-extrabold block">ALLOCATION RATE</span>
                <span className="text-lg font-black text-[#38bdf8] mt-0.5 block">{allocationRate}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#1c1c2a] border border-white/5 text-center">
                <span className="text-[9px] text-[#8a8d9b] uppercase tracking-wider font-extrabold block">HEALTH RATING</span>
                <span className="text-lg font-black text-[#10b981] mt-0.5 block">{healthRating}%</span>
              </div>
            </div>
          </div>

          {/* CARD 7: RECENTLY UPDATED ARTISTS */}
          <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8b5cf6]" /> Recently Updated Artists ({recentlyUpdatedArtists.length})
              </h3>
              <Link href="/artists" className="text-xs text-[#38bdf8] hover:underline font-semibold">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {recentlyUpdatedArtists.map((art) => (
                <div
                  key={art.id}
                  className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between hover:border-[#8b5cf6]/40 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {art.artistPhoto ? (
                      <img
                        src={art.artistPhoto}
                        alt={art.artistName}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                        {art.artistName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{art.artistName}</h4>
                      <p className="text-[10px] text-[#38bdf8] font-semibold">{art.country || 'International'}</p>
                    </div>
                  </div>

                  <Link
                    href={`/artists/${art.id}`}
                    className="bg-[#232334] hover:bg-[#2c2c40] text-[#8b5cf6] border border-white/10 text-[11px] font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1"
                  >
                    View <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 8: RECENT 5 NOTIFICATIONS CARD */}
          <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                    Recent Notifications
                    <span className="text-[9px] bg-sky-950 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-800">
                      Top 5
                    </span>
                  </h3>
                  <p className="text-[10px] text-[#8a8d9b]">Real-time role creation & allocation alerts</p>
                </div>
              </div>

              <button
                onClick={fetchDashboardData}
                className="text-xs text-[#38bdf8] hover:underline font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="space-y-2.5">
              {recentNotifications.length === 0 ? (
                <div className="p-4 text-center text-[#8a8d9b] text-xs bg-[#1c1c2a] rounded-2xl border border-white/5">
                  No notifications recorded yet.
                </div>
              ) : (
                recentNotifications.slice(0, 5).map((n: any) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-2xl bg-[#1c1c2a] border border-white/5 hover:border-sky-500/40 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-extrabold text-white">{n.title}</h4>
                          {n.targetRoles && (
                            <span className="text-[8px] bg-slate-800 text-sky-300 px-1.5 py-0.2 rounded border border-slate-700 font-bold">
                              {n.targetRoles.split(',')[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8a8d9b] mt-0.5 leading-snug">{n.message}</p>
                        <span className="text-[9px] text-[#8a8d9b]/70 block mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {n.link && (
                      <Link
                        href={n.link}
                        className="bg-[#232334] hover:bg-[#8b5cf6] text-sky-400 hover:text-white border border-white/10 text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 shrink-0 mt-0.5"
                      >
                        Open <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 2: CRITICAL LOW STOCK ALERT (FULL WIDTH / RIGHT COLUMN IN REFERRAL LAYOUT) */}
      <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#f97316] animate-pulse" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              CRITICAL LOW STOCK ALERT
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#f97316] bg-[#f97316]/10 px-2.5 py-0.5 rounded-full border border-[#f97316]/30">
              Active Stock Monitoring
            </span>
            <Link href="/inventory" className="text-xs text-[#38bdf8] hover:underline font-semibold flex items-center gap-1">
              Open Inventory Pool <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {criticalLowStockItems.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            <span>All inventory equipment pool items have healthy stock levels above safety thresholds.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {criticalLowStockItems.slice(0, 6).map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-2xl bg-[#1c1c2a] border border-white/5 flex flex-col justify-between hover:border-[#f97316]/40 transition-colors space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-[#8b5cf6] bg-[#232334] px-2 py-0.5 rounded-lg border border-white/10">
                      {item.safCode || 'IN-2026'}
                    </span>
                    <span className="text-xs font-black text-[#f97316] bg-[#f97316]/10 px-2 py-0.5 rounded-md border border-[#f97316]/20">
                      {item.availableQuantity} Left
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white mt-2">{item.element}</h4>
                  <p className="text-[10px] text-[#8a8d9b] mt-0.5">
                    Category: {item.inventoryCategory} | Location: {item.location || 'Warehouse A'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                  <span className="text-[#8a8d9b]">Total Pool: {item.totalQuantity}</span>
                  <Link
                    href={`/procurement?item=${encodeURIComponent(item.element)}`}
                    className="bg-[#f97316]/20 hover:bg-[#f97316]/30 text-[#f97316] border border-[#f97316]/30 font-bold text-[11px] px-3 py-1 rounded-xl transition-all"
                  >
                    Reallocate / Rental
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: ADDITIONAL COMPREHENSIVE ROLE CARDS (VENUES & SPATIAL READINESS + RECENT INVENTORY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT 6 COLS: Venues & Spatial Readiness */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#a855f7]" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Venues & Spatial Readiness
                </h3>
              </div>
              <Link href="/venues" className="text-xs text-[#38bdf8] hover:underline font-semibold">
                Manage Venues →
              </Link>
            </div>

            <div className="space-y-3">
              {venueArtworkCounts.slice(0, 4).map((v, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between hover:border-[#a855f7]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7]">
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{v.name}</h4>
                      <p className="text-[10px] text-[#8a8d9b]">Rooms & Galleries Allocated</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-[#a855f7] bg-[#a855f7]/10 px-2.5 py-1 rounded-lg border border-[#a855f7]/20">
                    {v.count} Artworks
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 6 COLS: Recently Added Inventory Pool */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-[#10b981]" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Recently Added Inventory Pool
                </h3>
              </div>
              <Link href="/inventory" className="text-xs text-[#38bdf8] hover:underline font-semibold">
                View Pool →
              </Link>
            </div>

            <div className="space-y-3">
              {recentlyAddedInventory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between hover:border-[#10b981]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#10b981] bg-[#232334] px-2 py-0.5 rounded-lg border border-white/10">
                        {item.safCode}
                      </span>
                      <span className="text-xs font-bold text-white">{item.element}</span>
                    </div>
                    <p className="text-[10px] text-[#8a8d9b] mt-0.5">
                      Category: {item.inventoryCategory} | Model: {item.model || 'Standard'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-white">{item.totalQuantity} Total</span>
                    <span className="text-[10px] block text-[#10b981] font-semibold">
                      {item.availableQuantity} Available
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
