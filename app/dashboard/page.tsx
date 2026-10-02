'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Palette,
  Package,
  Wrench,
  Camera,
  Activity,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldCheck,
  Volume2,
  Tv,
  Film,
} from 'lucide-react';
import AnimatedNumber from '@/components/AnimatedNumber';


export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // User & Role State
  const [activeRole, setActiveRole] = useState<string>('SUPER ADMIN');
  const [userBaseRole, setUserBaseRole] = useState<string>('SUPER ADMIN');

  // Core Data States
  const [artists, setArtists] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);

  // Calculated Top-level Stats directly from database
  const [stats, setStats] = useState({
    totalArtists: 0,
    confirmedArtists: 0,
    totalArtworks: 0,
    assignedArtworks: 0,
    totalTechnicalInventory: 0,
    allocatedTechnicalInventory: 0,
    availableTechnicalInventory: 0,
    totalProjectors: 0,
    allocatedProjectors: 0,
    balanceProjectors: 0,
    totalHSSpeakers: 0,
    allocatedHSSpeakers: 0,
    balanceHSSpeakers: 0,
    totalMediaPlayers: 0,
    allocatedMediaPlayers: 0,
    balanceMediaPlayers: 0,
  });

  // Detailed Projectors Breakdown (Brand, Model, Total, Allocated, Balance)
  const [projectorsList, setProjectorsList] = useState<
    { brand: string; model: string; element: string; total: number; allocated: number; balance: number }[]
  >([]);

  // Detailed Yamaha Speakers Breakdown (HS5, HS8, HS8S)
  const [speakersBreakdown, setSpeakersBreakdown] = useState({
    hs5: { model: 'Yamaha HS5 (5" Active Monitor)', total: 0, allocated: 0, balance: 0 },
    hs8: { model: 'Yamaha HS8 (8" Studio Monitor)', total: 0, allocated: 0, balance: 0 },
    hs8s: { model: 'Yamaha HS8S (150W Subwoofer)', total: 0, allocated: 0, balance: 0 },
  });

  // Detailed Media Players Breakdown (Dynamic Brand, Model, Element, Total, Allocated, Balance from DB)
  const [mediaPlayersList, setMediaPlayersList] = useState<
    { brand: string; model: string; element: string; badge: string; total: number; allocated: number; balance: number }[]
  >([]);

  // Venue & Artwork Distribution Stats for Graph
  const [venueDistribution, setVenueDistribution] = useState<{ name: string; artworkCount: number }[]>([]);

  // Sync user role from local storage / header events
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

      // 2. Fetch Artworks
      const artworkRes = await fetch('/api/artworks');
      const artworkData = await artworkRes.json();
      const artworkList = artworkData.artworks || [];
      setArtworks(artworkList);
      const assignedArtworksCount = artworkList.filter(
        (aw: any) => (aw.installations && aw.installations.length > 0) || aw.venueId
      ).length;

      // 3. Fetch Inventory
      const invRes = await fetch('/api/inventory');
      const invData = await invRes.json();
      const items = invData.items || [];
      setInventoryItems(items);

      // Filter Technical Inventory Items
      const techItems = items.filter(
        (i: any) =>
          (i.inventoryUsageType && i.inventoryUsageType.toUpperCase() === 'TECHNICAL') ||
          (i.inventoryCategory && i.inventoryCategory.toLowerCase().includes('tech'))
      );

      let totalTechQty = 0;
      let allocTechQty = 0;
      let availTechQty = 0;

      techItems.forEach((item: any) => {
        totalTechQty += item.totalQuantity || 0;
        allocTechQty += item.allocatedQuantity || 0;
        availTechQty += item.availableQuantity || 0;
      });

      // 4. Calculate Projectors Count, Brands, Models & Balance
      const projectorItems = items.filter((i: any) => {
        const text = `${i.element || ''} ${i.inventoryCategory || ''} ${i.subCategory || ''} ${i.brandProject || ''} ${i.model || ''}`.toLowerCase();
        return text.includes('projector') || text.includes('projection');
      });

      const projGroupMap: { [key: string]: { brand: string; model: string; element: string; total: number; allocated: number; balance: number } } = {};

      let totalProj = 0;
      let allocProj = 0;
      let balProj = 0;

      projectorItems.forEach((item: any) => {
        const brand = item.brandProject && item.brandProject !== 'Na' ? item.brandProject : 'Epson';
        const model = item.model && item.model !== 'Na' ? item.model : 'EB-PU2010W 10K';
        const element = item.element || 'Laser Projector';
        const key = `${brand}-${model}`;

        const tot = item.totalQuantity || 0;
        const alc = item.allocatedQuantity || 0;
        const bal = item.availableQuantity || 0;

        totalProj += tot;
        allocProj += alc;
        balProj += bal;

        if (!projGroupMap[key]) {
          projGroupMap[key] = { brand, model, element, total: 0, allocated: 0, balance: 0 };
        }
        projGroupMap[key].total += tot;
        projGroupMap[key].allocated += alc;
        projGroupMap[key].balance += bal;
      });

      const projList = Object.values(projGroupMap);
      setProjectorsList(projList);

      // 5. Calculate Yamaha Speakers (HS5, HS8, HS8S) Count & Balance
      const hsMap = {
        hs5: { model: 'Yamaha HS5 (5" Active Monitor)', total: 0, allocated: 0, balance: 0 },
        hs8: { model: 'Yamaha HS8 (8" Studio Monitor)', total: 0, allocated: 0, balance: 0 },
        hs8s: { model: 'Yamaha HS8S (150W Subwoofer)', total: 0, allocated: 0, balance: 0 },
      };

      items.forEach((item: any) => {
        const text = `${item.element || ''} ${item.model || ''} ${item.brandProject || ''} ${item.subCategory || ''}`.toUpperCase();
        const tot = item.totalQuantity || 0;
        const alc = item.allocatedQuantity || 0;
        const bal = item.availableQuantity || 0;

        if (text.includes('HS5') || text.includes('HS-5')) {
          hsMap.hs5.total += tot;
          hsMap.hs5.allocated += alc;
          hsMap.hs5.balance += bal;
        } else if (text.includes('HS8S') || text.includes('HS-8S') || text.includes('HS8 SUB')) {
          hsMap.hs8s.total += tot;
          hsMap.hs8s.allocated += alc;
          hsMap.hs8s.balance += bal;
        } else if (text.includes('HS8') || text.includes('HS-8')) {
          hsMap.hs8.total += tot;
          hsMap.hs8.allocated += alc;
          hsMap.hs8.balance += bal;
        }
      });

      setSpeakersBreakdown(hsMap);

      const totalHSSpeakersCount = hsMap.hs5.total + hsMap.hs8.total + hsMap.hs8s.total;
      const allocHSSpeakersCount = hsMap.hs5.allocated + hsMap.hs8.allocated + hsMap.hs8s.allocated;
      const balHSSpeakersCount = hsMap.hs5.balance + hsMap.hs8.balance + hsMap.hs8s.balance;

      // 6. Calculate Media Players (BrightSign & Cubetech) Count & Balance dynamically from DB
      const mediaPlayerItems = items.filter((i: any) => {
        const text = `${i.element || ''} ${i.inventoryCategory || ''} ${i.subCategory || ''} ${i.brandProject || ''} ${i.model || ''}`.toLowerCase();
        return text.includes('brightsign') || text.includes('cubetech');
      });

      const mpGroupMap: { [key: string]: { brand: string; model: string; element: string; badge: string; total: number; allocated: number; balance: number } } = {};

      let totalMediaPlayersCount = 0;
      let allocMediaPlayersCount = 0;
      let balMediaPlayersCount = 0;

      mediaPlayerItems.forEach((item: any) => {
        let brand = item.brandProject && item.brandProject !== 'Na' ? item.brandProject : '';
        if (!brand) {
          const text = `${item.element || ''}`.toLowerCase();
          if (text.includes('brightsign')) brand = 'BrightSign';
          else if (text.includes('cubetech')) brand = 'Cubetech';
          else brand = item.element || 'Media Player';
        }

        if (brand.toLowerCase() === 'brightsign') brand = 'BrightSign';
        if (brand.toLowerCase() === 'cubetech' || brand.toLowerCase() === 'cube tech') brand = 'Cubetech';

        let model = item.model && item.model !== 'Na' ? item.model : '';
        if (!model) {
          model = item.element || 'Standard';
        }

        let element = item.element && item.element !== 'Na' && item.element.toLowerCase() !== brand.toLowerCase() && !item.element.toLowerCase().includes(model.toLowerCase())
          ? item.element
          : `${brand} ${model} Media Player`;

        // Badge is strictly model name without BS- prefix (e.g. HD5, XD5, LS3, LS5)
        let badge = model.toUpperCase();

        const key = `${brand}-${model}`;

        const tot = item.totalQuantity || 0;
        const alc = item.allocatedQuantity || 0;
        const bal = item.availableQuantity || 0;

        totalMediaPlayersCount += tot;
        allocMediaPlayersCount += alc;
        balMediaPlayersCount += bal;

        if (!mpGroupMap[key]) {
          mpGroupMap[key] = { brand, model, element, badge, total: 0, allocated: 0, balance: 0 };
        }
        mpGroupMap[key].total += tot;
        mpGroupMap[key].allocated += alc;
        mpGroupMap[key].balance += bal;
      });

      const mpList = Object.values(mpGroupMap);
      setMediaPlayersList(mpList);

      // 7. Fetch Venues
      const venueRes = await fetch('/api/venues');
      const venueData = await venueRes.json();
      const venueList = venueData.venues || [];
      setVenues(venueList);

      const vDist = venueList.map((v: any) => {
        let count = v.installations?.length || 0;
        if (v.rooms) {
          v.rooms.forEach((r: any) => {
            count += r.installations?.length || 0;
          });
        }
        return { name: v.venueName || 'Venue', artworkCount: count };
      });
      setVenueDistribution(vDist);

      // Set Master Stats accurately reflecting actual database counts (0 when empty)
      setStats({
        totalArtists: artistList.length,
        confirmedArtists: confirmedCount,
        totalArtworks: artworkList.length,
        assignedArtworks: assignedArtworksCount,
        totalTechnicalInventory: totalTechQty,
        allocatedTechnicalInventory: allocTechQty,
        availableTechnicalInventory: availTechQty,
        totalProjectors: totalProj,
        allocatedProjectors: allocProj,
        balanceProjectors: balProj,
        totalHSSpeakers: totalHSSpeakersCount,
        allocatedHSSpeakers: allocHSSpeakersCount,
        balanceHSSpeakers: balHSSpeakersCount,
        totalMediaPlayers: totalMediaPlayersCount,
        allocatedMediaPlayers: allocMediaPlayersCount,
        balanceMediaPlayers: balMediaPlayersCount,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* DASHBOARD HEADER TITLE & REFRESH */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#8b5cf6]" /> Super Admin Dashboard
          </h1>
          <p className="text-xs text-[#8a8d9b] mt-0.5">
            Master operations monitoring center — Artists, Artworks, Tech Inventory, Projectors, Yamaha Speakers & Media Players.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="bg-[#232334] hover:bg-[#2c2c40] text-[#38bdf8] border border-white/10 text-xs font-extrabold px-4 py-2 rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Metrics
        </button>
      </div>

      {/* SECTION 1: STAT CARDS & TILES (DIRECTLY FROM DATABASE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        
        {/* TILE 1: TOTAL ARTIST COUNT */}
        <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#8b5cf6]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#8a8d9b] uppercase tracking-wider">Total Artist Count</span>
            <div className="w-9 h-9 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6]">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="my-4">
            <AnimatedNumber value={stats.totalArtists} className="text-4xl font-black text-white" />
            <p className="text-xs font-extrabold text-[#8b5cf6] tracking-tight mt-0.5">Registered Artists</p>
          </div>

          <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
            <span>Confirmed:</span>
            <span className="font-extrabold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-md border border-[#10b981]/20">
              <AnimatedNumber value={stats.confirmedArtists} suffix=" Active" />
            </span>
          </div>
        </div>

        {/* TILE 2: TOTAL ARTWORK COUNT */}
        <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#a855f7]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#8a8d9b] uppercase tracking-wider">Total Artwork</span>
            <div className="w-9 h-9 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7]">
              <Palette className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="my-4">
            <AnimatedNumber value={stats.totalArtworks} className="text-4xl font-black text-white" />
            <p className="text-xs font-extrabold text-[#a855f7] tracking-tight mt-0.5">Cataloged Artworks</p>
          </div>

          <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
            <span>Venue Assigned:</span>
            <span className="font-extrabold text-white">
              <AnimatedNumber value={stats.assignedArtworks} suffix=" Space Allocated" />
            </span>
          </div>
        </div>

        {/* TILE 3: TOTAL TECHNICAL INVENTORY COUNT */}
        <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#38bdf8]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#8a8d9b] uppercase tracking-wider">Total Tech Inventory</span>
            <div className="w-9 h-9 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8]">
              <Wrench className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="my-4">
            <AnimatedNumber value={stats.totalTechnicalInventory} className="text-4xl font-black text-[#38bdf8]" />
            <p className="text-xs font-extrabold text-[#8a8d9b] tracking-tight mt-0.5">Total Technical Units</p>
          </div>

          <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
            <span>Allocated: <strong className="text-white"><AnimatedNumber value={stats.allocatedTechnicalInventory} /></strong></span>
            <span>Balance: <strong className="text-[#10b981]"><AnimatedNumber value={stats.availableTechnicalInventory} /></strong></span>
          </div>
        </div>

        {/* TILE 4: PROJECTOR COUNT & BALANCE */}
        <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#f97316]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#8a8d9b] uppercase tracking-wider">Projector Pool</span>
            <div className="w-9 h-9 rounded-2xl bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center text-[#f97316]">
              <Camera className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <AnimatedNumber value={stats.totalProjectors} className="text-4xl font-black text-white" />
              <span className="text-xs font-extrabold text-[#f97316] uppercase">Units</span>
            </div>
            <p className="text-xs font-extrabold text-[#8a8d9b] tracking-tight mt-0.5">Total Projectors</p>
          </div>

          <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
            <span>Allocated: <strong className="text-white"><AnimatedNumber value={stats.allocatedProjectors} /></strong></span>
            <span>Balance: <strong className="text-[#10b981] font-extrabold"><AnimatedNumber value={stats.balanceProjectors} /></strong></span>
          </div>
        </div>

        {/* TILE 5: YAMAHA HS SPEAKERS COUNT & BALANCE */}
        <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#10b981]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#8a8d9b] uppercase tracking-wider">Yamaha HS Speakers</span>
            <div className="w-9 h-9 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981]">
              <Volume2 className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <AnimatedNumber value={stats.totalHSSpeakers} className="text-4xl font-black text-[#10b981]" />
              <span className="text-xs font-extrabold text-[#10b981] uppercase">Units</span>
            </div>
            <p className="text-xs font-extrabold text-[#8a8d9b] tracking-tight mt-0.5">HS5, HS8, HS8S Speakers</p>
          </div>

          <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
            <span>Allocated: <strong className="text-white"><AnimatedNumber value={stats.allocatedHSSpeakers} /></strong></span>
            <span>Balance: <strong className="text-[#10b981] font-extrabold"><AnimatedNumber value={stats.balanceHSSpeakers} /></strong></span>
          </div>
        </div>

        {/* TILE 6: MEDIA PLAYERS COUNT & BALANCE (BRIGHTSIGN & CUBETECH) */}
        <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl hover:border-[#38bdf8]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#8a8d9b] uppercase tracking-wider">Media Players</span>
            <div className="w-9 h-9 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8]">
              <Tv className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <AnimatedNumber value={stats.totalMediaPlayers} className="text-4xl font-black text-[#38bdf8]" />
              <span className="text-xs font-extrabold text-[#38bdf8] uppercase">Units</span>
            </div>
            <p className="text-xs font-extrabold text-[#8a8d9b] tracking-tight mt-0.5">BrightSign & Cubetech</p>
          </div>

          <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
            <span>Allocated: <strong className="text-white"><AnimatedNumber value={stats.allocatedMediaPlayers} /></strong></span>
            <span>Balance: <strong className="text-[#10b981] font-extrabold"><AnimatedNumber value={stats.balanceMediaPlayers} /></strong></span>
          </div>
        </div>

      </div>

      {/* SECTION 2: DETAILED BREAKDOWN TILES (PROJECTORS, YAMAHA HS SPEAKERS & MEDIA PLAYERS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CARD 1: PROJECTORS: BRAND, MODELS & BALANCE */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <Camera className="w-5 h-5 text-[#f97316]" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight">
                      Projectors: Brand & Models
                    </h3>
                    <p className="text-[10px] text-[#8a8d9b]">Inventory breakdown by brand & model</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-extrabold text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-xl border border-[#10b981]/20">
                  <AnimatedNumber value={stats.balanceProjectors} suffix=" Balance" />
                </span>
              </div>

              <div className="space-y-3">
                {projectorsList.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#1c1c2a] border border-white/5 text-center text-[#8a8d9b] text-xs space-y-1">
                    <p className="font-semibold text-white">No projectors in database</p>
                    <p className="text-[11px]">Database is empty. Import projector items to view breakdown.</p>
                  </div>
                ) : (
                  projectorsList.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#1c1c2a] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#f97316]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center text-[#f97316] font-bold text-xs shrink-0">
                          {p.brand.slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                            {p.brand} {p.model}
                          </h4>
                          <p className="text-[10px] text-[#8a8d9b] mt-0.5">{p.element}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="text-center">
                          <span className="text-[9px] text-[#8a8d9b] block uppercase">Total</span>
                          <span className="font-extrabold text-white"><AnimatedNumber value={p.total} /></span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-[#8a8d9b] block uppercase">Allocated</span>
                          <span className="font-extrabold text-[#38bdf8]"><AnimatedNumber value={p.allocated} /></span>
                        </div>
                        <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-2.5 py-1 rounded-xl">
                          <span className="text-[9px] text-[#10b981] block uppercase font-bold">Balance</span>
                          <span className="font-extrabold text-[#10b981]"><AnimatedNumber value={p.balance} /></span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: COMBINED AUDIO SPEAKERS & MEDIA PLAYERS (2 SECTIONS TOP-TO-BOTTOM WITH SCROLL) */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center -space-x-1">
                    <Volume2 className="w-5 h-5 text-[#10b981]" />
                    <Tv className="w-5 h-5 text-[#38bdf8]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight">
                      Audio Speakers & Media Players
                    </h3>
                    <p className="text-[10px] text-[#8a8d9b]">Yamaha monitors, BrightSign & Cubetech</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-extrabold text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-xl border border-[#10b981]/20">
                  <AnimatedNumber value={stats.balanceHSSpeakers + stats.balanceMediaPlayers} suffix=" Total Balance" />
                </span>
              </div>

              {/* Container for Audio Speakers & Media Players without scroll */}
              <div className="space-y-5">
                
                {/* SECTION 1: YAMAHA HS SPEAKERS */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-[#10b981] tracking-wider flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5" /> Yamaha HS Speakers
                    </span>
                    <span className="text-[10px] font-extrabold text-[#8a8d9b]">
                      <AnimatedNumber value={stats.balanceHSSpeakers} suffix=" Balance" />
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* HS5 Card */}
                    <div className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between gap-3 hover:border-[#10b981]/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981] font-bold text-[11px] shrink-0">
                          HS5
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-white">Yamaha HS5</h4>
                          <p className="text-[9px] text-[#8a8d9b]">5" 70W Active Monitor</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs shrink-0">
                        <div className="text-center">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase">Total</span>
                          <span className="font-extrabold text-white text-xs"><AnimatedNumber value={speakersBreakdown.hs5.total} /></span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase">Allocated</span>
                          <span className="font-extrabold text-[#38bdf8] text-xs"><AnimatedNumber value={speakersBreakdown.hs5.allocated} /></span>
                        </div>
                        <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded-lg">
                          <span className="text-[8px] text-[#10b981] block uppercase font-bold">Balance</span>
                          <span className="font-extrabold text-[#10b981] text-xs"><AnimatedNumber value={speakersBreakdown.hs5.balance} /></span>
                        </div>
                      </div>
                    </div>

                    {/* HS8 Card */}
                    <div className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between gap-3 hover:border-[#10b981]/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] font-bold text-[11px] shrink-0">
                          HS8
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-white">Yamaha HS8</h4>
                          <p className="text-[9px] text-[#8a8d9b]">8" 120W Studio Monitor</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs shrink-0">
                        <div className="text-center">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase">Total</span>
                          <span className="font-extrabold text-white text-xs"><AnimatedNumber value={speakersBreakdown.hs8.total} /></span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase">Allocated</span>
                          <span className="font-extrabold text-[#38bdf8] text-xs"><AnimatedNumber value={speakersBreakdown.hs8.allocated} /></span>
                        </div>
                        <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded-lg">
                          <span className="text-[8px] text-[#10b981] block uppercase font-bold">Balance</span>
                          <span className="font-extrabold text-[#10b981] text-xs"><AnimatedNumber value={speakersBreakdown.hs8.balance} /></span>
                        </div>
                      </div>
                    </div>

                    {/* HS8S Card */}
                    <div className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between gap-3 hover:border-[#a855f7]/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7] font-bold text-[11px] shrink-0">
                          HS8S
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-white">Yamaha HS8S Subwoofer</h4>
                          <p className="text-[9px] text-[#8a8d9b]">8" 150W Powered Sub</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs shrink-0">
                        <div className="text-center">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase">Total</span>
                          <span className="font-extrabold text-white text-xs"><AnimatedNumber value={speakersBreakdown.hs8s.total} /></span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase">Allocated</span>
                          <span className="font-extrabold text-[#38bdf8] text-xs"><AnimatedNumber value={speakersBreakdown.hs8s.allocated} /></span>
                        </div>
                        <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded-lg">
                          <span className="text-[8px] text-[#10b981] block uppercase font-bold">Balance</span>
                          <span className="font-extrabold text-[#10b981] text-xs"><AnimatedNumber value={speakersBreakdown.hs8s.balance} /></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: MEDIA PLAYERS */}
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-[#38bdf8] tracking-wider flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5" /> Media Players (BrightSign & Cubetech)
                    </span>
                    <span className="text-[10px] font-extrabold text-[#8a8d9b]">
                      <AnimatedNumber value={stats.balanceMediaPlayers} suffix=" Balance" />
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {mediaPlayersList.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-[#1c1c2a] border border-white/5 text-center text-[#8a8d9b] text-xs">
                        No media players recorded in database
                      </div>
                    ) : (
                      mediaPlayersList.map((mp, idx) => {
                        const isCubetech = mp.brand.toLowerCase().includes('cubetech');
                        const badgeClass = isCubetech
                          ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/20 text-[#8b5cf6]'
                          : 'bg-[#38bdf8]/10 border-[#38bdf8]/20 text-[#38bdf8]';
                        const hoverClass = isCubetech
                          ? 'hover:border-[#8b5cf6]/40'
                          : 'hover:border-[#38bdf8]/40';

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between gap-3 ${hoverClass} transition-colors`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-[11px] shrink-0 ${badgeClass}`}>
                                {mp.badge}
                              </div>
                              <div>
                                <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                                  {mp.brand} {mp.model}
                                </h4>
                                <p className="text-[9px] text-[#8a8d9b]">{mp.element}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 text-xs shrink-0">
                              <div className="text-center">
                                <span className="text-[8px] text-[#8a8d9b] block uppercase">Total</span>
                                <span className="font-extrabold text-white text-xs"><AnimatedNumber value={mp.total} /></span>
                              </div>
                              <div className="text-center">
                                <span className="text-[8px] text-[#8a8d9b] block uppercase">Allocated</span>
                                <span className="font-extrabold text-[#38bdf8] text-xs"><AnimatedNumber value={mp.allocated} /></span>
                              </div>
                              <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-2 py-0.5 rounded-lg">
                                <span className="text-[8px] text-[#10b981] block uppercase font-bold">Balance</span>
                                <span className="font-extrabold text-[#10b981] text-xs"><AnimatedNumber value={mp.balance} /></span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: EQUIPMENT ALLOTMENT BY MAJOR COMPONENTS (HORIZONTAL ANIMATED BAR GRAPH) */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-[#8b5cf6]" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight">
                      Equipment Allotment Graph
                    </h3>
                    <p className="text-[10px] text-[#8a8d9b]">Component breakdown & allocation percentages</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-extrabold text-[#8b5cf6] bg-[#8b5cf6]/10 px-2.5 py-1 rounded-xl border border-[#8b5cf6]/20">
                  <AnimatedNumber value={stats.totalTechnicalInventory} suffix=" Total Items" />
                </span>
              </div>

              <div className="space-y-4">
                {/* COMPONENT 1: PROJECTORS */}
                {(() => {
                  const tot = stats.totalProjectors;
                  const alc = stats.allocatedProjectors;
                  const pct = tot > 0 ? Math.round((alc / tot) * 100) : 0;
                  return (
                    <div className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-2 hover:border-[#f97316]/40 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white flex items-center gap-2">
                          <Camera className="w-4 h-4 text-[#f97316]" /> Projectors
                        </span>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-[#8a8d9b] text-[10px]">
                            <strong className="text-white"><AnimatedNumber value={alc} /></strong> / <AnimatedNumber value={tot} />
                          </span>
                          <span className="font-bold text-[#f97316] bg-[#f97316]/10 px-2 py-0.5 rounded-md border border-[#f97316]/20">
                            <AnimatedNumber value={pct} suffix="%" />
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#141421] h-3 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                        <div
                          className="bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#fb923c] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* COMPONENT 2: YAMAHA HS SPEAKERS */}
                {(() => {
                  const tot = stats.totalHSSpeakers;
                  const alc = stats.allocatedHSSpeakers;
                  const pct = tot > 0 ? Math.round((alc / tot) * 100) : 0;
                  return (
                    <div className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-2 hover:border-[#10b981]/40 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-[#10b981]" /> Yamaha HS Speakers
                        </span>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-[#8a8d9b] text-[10px]">
                            <strong className="text-white"><AnimatedNumber value={alc} /></strong> / <AnimatedNumber value={tot} />
                          </span>
                          <span className="font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-md border border-[#10b981]/20">
                            <AnimatedNumber value={pct} suffix="%" />
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#141421] h-3 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                        <div
                          className="bg-gradient-to-r from-[#059669] via-[#10b981] to-[#34d399] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* COMPONENT 3: MEDIA PLAYERS */}
                {(() => {
                  const tot = stats.totalMediaPlayers;
                  const alc = stats.allocatedMediaPlayers;
                  const pct = tot > 0 ? Math.round((alc / tot) * 100) : 0;
                  return (
                    <div className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-2 hover:border-[#38bdf8]/40 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white flex items-center gap-2">
                          <Tv className="w-4 h-4 text-[#38bdf8]" /> Media Players
                        </span>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-[#8a8d9b] text-[10px]">
                            <strong className="text-white"><AnimatedNumber value={alc} /></strong> / <AnimatedNumber value={tot} />
                          </span>
                          <span className="font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded-md border border-[#38bdf8]/20">
                            <AnimatedNumber value={pct} suffix="%" />
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#141421] h-3 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                        <div
                          className="bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-[#7dd3fc] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* COMPONENT 4: OVERALL TECH INVENTORY ALLOCATION */}
                {(() => {
                  const tot = stats.totalTechnicalInventory;
                  const alc = stats.allocatedTechnicalInventory;
                  const pct = tot > 0 ? Math.round((alc / tot) * 100) : 0;
                  return (
                    <div className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-2 hover:border-[#8b5cf6]/40 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-[#8b5cf6]" /> Overall Tech Inventory
                        </span>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-[#8a8d9b] text-[10px]">
                            <strong className="text-white"><AnimatedNumber value={alc} /></strong> / <AnimatedNumber value={tot} />
                          </span>
                          <span className="font-bold text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-0.5 rounded-md border border-[#8b5cf6]/20">
                            <AnimatedNumber value={pct} suffix="%" />
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#141421] h-3 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                        <div
                          className="bg-gradient-to-r from-[#6d28d9] via-[#8b5cf6] to-[#c084fc] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 3: CHARTS AND GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* GRAPH 1: TECHNICAL INVENTORY & ALLOCATION BREAKDOWN CHART */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                <PieChart className="w-4.5 h-4.5 text-[#38bdf8]" /> Technical Equipment Allocation Graph
              </h3>
              <p className="text-[10px] text-[#8a8d9b]">Proportional allocation & available balance across inventory categories</p>
            </div>

            <span className="text-xs font-mono font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2.5 py-1 rounded-lg border border-[#38bdf8]/20">
              <AnimatedNumber value={stats.totalTechnicalInventory} suffix=" Technical Pool Items" />
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* Concentric SVG Rings Chart */}
            <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-xl">
                {/* Background Track Rings */}
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1c1c2a" strokeWidth="5" />
                <circle cx="50" cy="50" r="33" fill="none" stroke="#1c1c2a" strokeWidth="5" />
                <circle cx="50" cy="50" r="24" fill="none" stroke="#1c1c2a" strokeWidth="5" />
                <circle cx="50" cy="50" r="15" fill="none" stroke="#1c1c2a" strokeWidth="5" />

                {stats.totalTechnicalInventory > 0 && (
                  <>
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="5"
                      strokeDasharray="263.89"
                      strokeDashoffset={263.89 * (1 - (stats.totalProjectors / Math.max(stats.totalTechnicalInventory, 1)))}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="33"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="5"
                      strokeDasharray="207.34"
                      strokeDashoffset={207.34 * (1 - (stats.totalHSSpeakers / Math.max(stats.totalTechnicalInventory, 1)))}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="24"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="5"
                      strokeDasharray="150.79"
                      strokeDashoffset={150.79 * (1 - (stats.totalMediaPlayers / Math.max(stats.totalTechnicalInventory, 1)))}
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <AnimatedNumber
                  value={
                    stats.totalTechnicalInventory > 0
                      ? Math.round((stats.allocatedTechnicalInventory / stats.totalTechnicalInventory) * 100)
                      : 0
                  }
                  suffix="%"
                  className="text-2xl font-black text-white leading-none"
                />
                <span className="text-[9px] text-[#8a8d9b] font-bold uppercase tracking-wider mt-0.5">Allocated</span>
              </div>
            </div>

            {/* Legends */}
            <div className="space-y-2.5 text-xs text-[#8a8d9b] w-full sm:w-auto">
              <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-[#1c1c2a] border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f97316] shrink-0" />
                  <span className="font-semibold text-white">Projectors</span>
                </div>
                <span className="font-bold text-[#f97316]"><AnimatedNumber value={stats.totalProjectors} suffix=" units" /></span>
              </div>

              <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-[#1c1c2a] border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10b981] shrink-0" />
                  <span className="font-semibold text-white">Yamaha HS Speakers</span>
                </div>
                <span className="font-bold text-[#10b981]"><AnimatedNumber value={stats.totalHSSpeakers} suffix=" units" /></span>
              </div>

              <div className="flex items-center justify-between gap-4 p-2 rounded-xl bg-[#1c1c2a] border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#38bdf8] shrink-0" />
                  <span className="font-semibold text-white">Media Players</span>
                </div>
                <span className="font-bold text-[#38bdf8]"><AnimatedNumber value={stats.totalMediaPlayers} suffix=" units" /></span>
              </div>
            </div>
          </div>
        </div>

        {/* GRAPH 2: ARTWORK & VENUE ALLOCATION DISTRIBUTION CHART */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-[#a855f7]" /> Artwork Spatial Distribution Graph
              </h3>
              <p className="text-[10px] text-[#8a8d9b]">Artwork assignments per exhibition venue</p>
            </div>

            <Link href="/artworks" className="text-xs text-[#38bdf8] hover:underline font-semibold flex items-center gap-1">
              View Artworks <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4 py-1">
            {venueDistribution.length === 0 ? (
              <div className="p-6 text-center text-[#8a8d9b] text-xs bg-[#1c1c2a] rounded-2xl border border-white/5 space-y-1">
                <p className="font-semibold text-white">No venues in database</p>
                <p className="text-[11px]">Database is empty. Add venues to view spatial artwork distribution.</p>
              </div>
            ) : (
              venueDistribution.slice(0, 4).map((v, idx) => {
                const maxVal = Math.max(...venueDistribution.map((vd) => vd.artworkCount), 1);
                const pct = Math.round((v.artworkCount / maxVal) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-white flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#a855f7]" /> {v.name}
                      </span>
                      <AnimatedNumber value={v.artworkCount} suffix=" Artworks" className="font-mono font-bold text-[#a855f7]" />
                    </div>

                    <div className="w-full bg-[#1c1c2a] h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div
                        className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#38bdf8] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(pct, 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
