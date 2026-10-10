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
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Move,
  LayoutGrid,
} from 'lucide-react';
import AnimatedNumber from '@/components/AnimatedNumber';
import ProgressTrackerGraph from '@/components/ProgressTrackerGraph';

// Default Layout Order Keys
const DEFAULT_STAT_TILES = [
  'total_artists',
  'total_artworks',
  'tech_inventory',
  'prod_inventory',
  'projector_pool',
  'yamaha_speakers',
];

const DEFAULT_CARDS = [
  'card_progress_tracker',
  'card_equipment_allotment',
  'card_artwork_distribution',
  'card_project_status_by_venue',
  'card_active_production_projects',
  'card_projectors',
  'card_audio_media',
  'card_allocation_graph',
];

// Card column spans in 12-column grid
const CARD_COL_SPANS: Record<string, string> = {
  card_progress_tracker: 'lg:col-span-5',
  card_equipment_allotment: 'lg:col-span-4',
  card_artwork_distribution: 'lg:col-span-3',
  card_project_status_by_venue: 'lg:col-span-4',
  card_active_production_projects: 'lg:col-span-4',
  card_projectors: 'lg:col-span-4',
  card_audio_media: 'lg:col-span-4',
  card_allocation_graph: 'lg:col-span-3',
};

// Card Human Readable Labels for Layout Manager
const CARD_NAMES: Record<string, string> = {
  total_artists: 'Total Artist Count Tile',
  total_artworks: 'Total Artwork Tile',
  tech_inventory: 'Total Tech Inventory Tile',
  prod_inventory: 'Total Production Inventory Tile',
  projector_pool: 'Projector Pool Tile',
  yamaha_speakers: 'Yamaha Speakers Tile',
  media_players: 'Media Players Tile',
  card_progress_tracker: 'Progress Tracking Graph (Total Projects)',
  card_project_status_by_venue: 'Project Status by Venue',
  card_active_production_projects: 'Active Production Projects (In Progress)',
  card_projectors: 'Projectors: Brand & Models Breakdown',
  card_audio_media: 'Audio Speakers & Media Players Breakdown',
  card_equipment_allotment: 'Equipment Allotment Graph',
  card_allocation_graph: 'Technical Equipment Allocation Donut Graph',
  card_artwork_distribution: 'Artwork Spatial Distribution Graph',
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // User & Role State
  const [activeRole, setActiveRole] = useState<string>('SUPER ADMIN');
  const [userBaseRole, setUserBaseRole] = useState<string>('SUPER ADMIN');

  // Customizable Layout State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [statOrder, setStatOrder] = useState<string[]>(DEFAULT_STAT_TILES);
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_CARDS);
  const [hiddenCards, setHiddenCards] = useState<string[]>([]);

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<{ type: 'stat' | 'card'; key: string; index: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ type: 'stat' | 'card'; key: string; index: number } | null>(null);

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
    totalProductionInventory: 0,
    allocatedProductionInventory: 0,
    availableProductionInventory: 0,
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

  // Detailed Projectors Breakdown
  const [projectorsList, setProjectorsList] = useState<
    { brand: string; model: string; element: string; total: number; allocated: number; balance: number }[]
  >([]);

  // Detailed Yamaha Speakers Breakdown
  const [speakersBreakdown, setSpeakersBreakdown] = useState({
    hs5: { model: 'Yamaha HS5 (5" Active Monitor)', total: 0, allocated: 0, balance: 0 },
    hs8: { model: 'Yamaha HS8 (8" Studio Monitor)', total: 0, allocated: 0, balance: 0 },
    hs8s: { model: 'Yamaha HS8S (150W Subwoofer)', total: 0, allocated: 0, balance: 0 },
  });

  // Detailed Media Players Breakdown
  const [mediaPlayersList, setMediaPlayersList] = useState<
    { brand: string; model: string; element: string; badge: string; total: number; allocated: number; balance: number }[]
  >([]);

  // Venue & Artwork Distribution Stats for Graph
  const [venueDistribution, setVenueDistribution] = useState<{ name: string; artworkCount: number }[]>([]);

  // New Cards Data States
  const [projectStatusByVenue, setProjectStatusByVenue] = useState<any[]>([]);
  const [activeProductionProjects, setActiveProductionProjects] = useState<any[]>([]);

  // Progress Tracker Stages Data
  const [progressTrackerData, setProgressTrackerData] = useState<any>({
    totalTrackedArtworks: 0,
    milestones: { onboarded: 0, techAllocated: 0, prodAllocated: 0, layoutUploaded: 0, fullyCompleted: 0 },
    installationStages: { Planned: 0, Ready: 0, 'Installation In Progress': 0, Installed: 0, Completed: 0 },
  });

  // 1. Sync Layout Preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStatOrder = localStorage.getItem('saf_dashboard_stat_order');
        if (savedStatOrder) {
          const parsed = JSON.parse(savedStatOrder);
          if (Array.isArray(parsed) && parsed.length > 0) setStatOrder(parsed);
        }
        const savedCardOrder = localStorage.getItem('saf_dashboard_card_order_v3');
        if (savedCardOrder) {
          const parsed = JSON.parse(savedCardOrder);
          if (Array.isArray(parsed) && parsed.length > 0) setCardOrder(parsed);
        }
        const savedHiddenCards = localStorage.getItem('saf_dashboard_hidden_cards');
        if (savedHiddenCards) {
          const parsed = JSON.parse(savedHiddenCards);
          if (Array.isArray(parsed)) setHiddenCards(parsed);
        }
      } catch (e) {
        console.error('Failed to load saved dashboard layout', e);
      }
    }
  }, []);

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

  // Save Layout Handlers
  const saveStatOrder = (newOrder: string[]) => {
    setStatOrder(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saf_dashboard_stat_order', JSON.stringify(newOrder));
    }
  };

  const saveCardOrder = (newOrder: string[]) => {
    setCardOrder(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saf_dashboard_card_order_v3', JSON.stringify(newOrder));
    }
  };

  const saveHiddenCards = (newHidden: string[]) => {
    setHiddenCards(newHidden);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saf_dashboard_hidden_cards', JSON.stringify(newHidden));
    }
  };

  const resetDashboardLayout = () => {
    saveStatOrder(DEFAULT_STAT_TILES);
    saveCardOrder(DEFAULT_CARDS);
    saveHiddenCards([]);
  };

  // Reorder Stat Tiles by Move Controls
  const moveStatTile = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= statOrder.length) return;
    const newOrder = [...statOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    saveStatOrder(newOrder);
  };

  // Reorder Main Cards by Move Controls
  const moveMainCard = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cardOrder.length) return;
    const newOrder = [...cardOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    saveCardOrder(newOrder);
  };

  // Toggle Visibility
  const toggleCardVisibility = (key: string) => {
    if (hiddenCards.includes(key)) {
      saveHiddenCards(hiddenCards.filter((k) => k !== key));
    } else {
      saveHiddenCards([...hiddenCards, key]);
    }
  };

  // HTML5 Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, type: 'stat' | 'card', key: string, index: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, key, index }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ type, key, index });
  };

  const handleDragOver = (e: React.DragEvent, type: 'stat' | 'card', key: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && draggedItem.type === type && draggedItem.index !== index) {
      setDragOverItem({ type, key, index });
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetType: 'stat' | 'card', targetKey: string, targetIndex: number) => {
    e.preventDefault();
    setDragOverItem(null);
    setDraggedItem(null);

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);
      if (data.type !== targetType) return;

      if (targetType === 'stat') {
        const newOrder = [...statOrder];
        const [moved] = newOrder.splice(data.index, 1);
        newOrder.splice(targetIndex, 0, moved);
        saveStatOrder(newOrder);
      } else {
        const newOrder = [...cardOrder];
        const [moved] = newOrder.splice(data.index, 1);
        newOrder.splice(targetIndex, 0, moved);
        saveCardOrder(newOrder);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      if (data.success) {
        if (data.stats) setStats(data.stats);
        if (data.projectorsList) setProjectorsList(data.projectorsList);
        if (data.speakersBreakdown) setSpeakersBreakdown(data.speakersBreakdown);
        if (data.mediaPlayersList) setMediaPlayersList(data.mediaPlayersList);
        if (data.venueDistribution) setVenueDistribution(data.venueDistribution);
        if (data.projectStatusByVenue) setProjectStatusByVenue(data.projectStatusByVenue);
        if (data.activeProductionProjects) setActiveProductionProjects(data.activeProductionProjects);
        if (data.progressTrackerData) setProgressTrackerData(data.progressTrackerData);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render Functions for Stat Tiles
  const renderStatTileContent = (key: string) => {
    switch (key) {
      case 'total_artists':
        return (
          <>
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
          </>
        );

      case 'total_artworks':
        return (
          <>
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
          </>
        );

      case 'tech_inventory':
        return (
          <>
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
          </>
        );

      case 'prod_inventory':
        return (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#8a8d9b] uppercase tracking-wider">Total Production Inventory</span>
              <div className="w-9 h-9 rounded-2xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7]">
                <Layers className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="my-4">
              <AnimatedNumber value={stats.totalProductionInventory} className="text-4xl font-black text-[#a855f7]" />
              <p className="text-xs font-extrabold text-[#8a8d9b] tracking-tight mt-0.5">Total Production Units</p>
            </div>
            <div className="text-xs text-[#8a8d9b] flex items-center justify-between border-t border-white/5 pt-2.5">
              <span>Allocated: <strong className="text-white"><AnimatedNumber value={stats.allocatedProductionInventory} /></strong></span>
              <span>Balance: <strong className="text-[#10b981]"><AnimatedNumber value={stats.availableProductionInventory} /></strong></span>
            </div>
          </>
        );

      case 'projector_pool':
        return (
          <>
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
          </>
        );

      case 'yamaha_speakers':
        return (
          <>
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
          </>
        );

      case 'media_players':
        return (
          <>
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
          </>
        );

      default:
        return null;
    }
  };

  // Render Functions for Main Cards
  const renderMainCardContent = (key: string) => {
    switch (key) {
      case 'card_progress_tracker':
        return (
          <ProgressTrackerGraph
            totalTrackedArtworks={progressTrackerData.totalTrackedArtworks}
            milestones={progressTrackerData.milestones}
            installationStages={progressTrackerData.installationStages}
            monthlyTrend={progressTrackerData.monthlyTrend}
          />
        );

      case 'card_project_status_by_venue':
        return (
          <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-3.5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4.5 h-4.5 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-extrabold text-white tracking-tight">
                      Project Status by Venue
                    </h3>
                    <p className="text-[9px] text-[#8a8d9b]">Installation & space status</p>
                  </div>
                </div>
                <Link
                  href="/venues"
                  className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                >
                  Venues <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {projectStatusByVenue.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#1c1c2a] border border-white/5 text-center text-[#8a8d9b] text-xs">
                    No venue projects loaded
                  </div>
                ) : (
                  projectStatusByVenue.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-2 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white flex items-center gap-1.5 text-[11px] truncate">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> <span className="truncate">{v.venueName}</span>
                        </span>
                        <span className="font-mono text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
                          {v.totalProjects} Projects
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1 text-[9px] pt-1">
                        <div className="text-center p-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
                          <span className="text-slate-400 block text-[8px] font-bold">Plan</span>
                          <span className="font-extrabold text-white">{v.planned}</span>
                        </div>
                        <div className="text-center p-1 rounded-lg bg-sky-950/60 border border-sky-800/50">
                          <span className="text-sky-300 block text-[8px] font-bold">Rdy</span>
                          <span className="font-extrabold text-sky-300">{v.ready}</span>
                        </div>
                        <div className="text-center p-1 rounded-lg bg-amber-950/60 border border-amber-800/50">
                          <span className="text-amber-300 block text-[8px] font-bold">Prog</span>
                          <span className="font-extrabold text-amber-300">{v.inProgress}</span>
                        </div>
                        <div className="text-center p-1 rounded-lg bg-indigo-950/60 border border-indigo-800/50">
                          <span className="text-indigo-300 block text-[8px] font-bold">Inst</span>
                          <span className="font-extrabold text-indigo-300">{v.installed}</span>
                        </div>
                        <div className="text-center p-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50">
                          <span className="text-emerald-300 block text-[8px] font-bold">Done</span>
                          <span className="font-extrabold text-emerald-300">{v.completed}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'card_active_production_projects':
        return (
          <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-3.5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-extrabold text-white tracking-tight">
                      Active Production Projects
                    </h3>
                    <p className="text-[9px] text-[#8a8d9b]">Ongoing installations</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-xl border border-amber-500/20">
                  {activeProductionProjects.length} Active
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {activeProductionProjects.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#1c1c2a] border border-white/5 text-center text-[#8a8d9b] text-xs">
                    No active production projects
                  </div>
                ) : (
                  activeProductionProjects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 px-3 rounded-2xl bg-[#1c1c2a] border border-white/5 flex items-center justify-between gap-2 hover:border-amber-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center font-black text-xs text-slate-400">
                          {proj.artistPhoto ? (
                            <img src={proj.artistPhoto} alt={proj.artistName} className="w-full h-full object-cover" />
                          ) : (
                            proj.artistName?.charAt(0) || 'A'
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/artists/${proj.artistId}`} className="text-xs font-extrabold text-white hover:text-amber-400 transition-colors block truncate">
                            {proj.artistName}
                          </Link>
                          <p className="text-[10px] text-[#8a8d9b] truncate">{proj.artworkName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          ⚡ {proj.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'card_projectors':
        return (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projectorsList.length === 0 ? (
                  <div className="col-span-full p-6 rounded-2xl bg-[#1c1c2a] border border-white/5 text-center text-[#8a8d9b] text-xs space-y-1">
                    <p className="font-semibold text-white">No projectors in database</p>
                    <p className="text-[11px]">Database is empty. Import projector items to view breakdown.</p>
                  </div>
                ) : (
                  projectorsList.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 flex flex-col justify-between overflow-hidden min-w-0 hover:border-[#f97316]/40 transition-colors"
                    >
                      <div className="min-w-0 mb-2">
                        <h4 className="text-xs font-extrabold text-white truncate" title={p.element}>
                          {p.element}
                        </h4>
                        <p className="text-[10px] text-[#8a8d9b] truncate mt-0.5">
                          {p.brand && p.brand !== 'Item' ? `${p.brand} ${p.model}`.trim() : 'Projector'}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-xs pt-2 border-t border-white/5 min-w-0">
                        <div className="text-center min-w-0">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Total</span>
                          <span className="font-extrabold text-white text-xs block truncate"><AnimatedNumber value={p.total} /></span>
                        </div>
                        <div className="text-center min-w-0">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Allocated</span>
                          <span className="font-extrabold text-[#38bdf8] text-xs block truncate"><AnimatedNumber value={p.allocated} /></span>
                        </div>
                        <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-1 py-0.5 rounded-lg min-w-0">
                          <span className="text-[8px] text-[#10b981] block uppercase font-bold truncate">Balance</span>
                          <span className="font-extrabold text-[#10b981] text-xs block truncate"><AnimatedNumber value={p.balance} /></span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'card_audio_media':
        return (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <div className="p-3 rounded-2xl bg-[#1c1c2a] border border-white/5 flex flex-col justify-between overflow-hidden min-w-0 hover:border-[#10b981]/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981] font-bold text-[10px] shrink-0">
                          HS5
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-white truncate">Yamaha HS5</h4>
                          <p className="text-[9px] text-[#8a8d9b] truncate">5" 70W Active Monitor</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-xs pt-2 border-t border-white/5 min-w-0">
                        <div className="text-center min-w-0">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Total</span>
                          <span className="font-extrabold text-white text-xs block truncate"><AnimatedNumber value={speakersBreakdown.hs5.total} /></span>
                        </div>
                        <div className="text-center min-w-0">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Allocated</span>
                          <span className="font-extrabold text-[#38bdf8] text-xs block truncate"><AnimatedNumber value={speakersBreakdown.hs5.allocated} /></span>
                        </div>
                        <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-1 py-0.5 rounded-lg min-w-0">
                          <span className="text-[8px] text-[#10b981] block uppercase font-bold truncate">Balance</span>
                          <span className="font-extrabold text-[#10b981] text-xs block truncate"><AnimatedNumber value={speakersBreakdown.hs5.balance} /></span>
                        </div>
                      </div>
                    </div>

                    {/* HS8 Card */}
                    <div className="p-3 rounded-2xl bg-[#1c1c2a] border border-white/5 flex flex-col justify-between overflow-hidden min-w-0 hover:border-[#10b981]/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-[#38bdf8]/10 border border-[#38bdf8]/20 flex items-center justify-center text-[#38bdf8] font-bold text-[10px] shrink-0">
                          HS8
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-white truncate">Yamaha HS8</h4>
                          <p className="text-[9px] text-[#8a8d9b] truncate">8" 120W Studio Monitor</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-xs pt-2 border-t border-white/5 min-w-0">
                        <div className="text-center min-w-0">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Total</span>
                          <span className="font-extrabold text-white text-xs block truncate"><AnimatedNumber value={speakersBreakdown.hs8.total} /></span>
                        </div>
                        <div className="text-center min-w-0">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Allocated</span>
                          <span className="font-extrabold text-[#38bdf8] text-xs block truncate"><AnimatedNumber value={speakersBreakdown.hs8.allocated} /></span>
                        </div>
                        <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-1 py-0.5 rounded-lg min-w-0">
                          <span className="text-[8px] text-[#10b981] block uppercase font-bold truncate">Balance</span>
                          <span className="font-extrabold text-[#10b981] text-xs block truncate"><AnimatedNumber value={speakersBreakdown.hs8.balance} /></span>
                        </div>
                      </div>
                    </div>

                    {/* HS8S Card */}
                    <div className="p-3 rounded-2xl bg-[#1c1c2a] border border-white/5 flex flex-col justify-between overflow-hidden min-w-0 hover:border-[#a855f7]/40 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center text-[#a855f7] font-bold text-[10px] shrink-0">
                          HS8S
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-white truncate">Yamaha HS8S Subwoofer</h4>
                          <p className="text-[9px] text-[#8a8d9b] truncate">8" 150W Powered Sub</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-xs pt-2 border-t border-white/5 min-w-0">
                        <div className="text-center min-w-0">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Total</span>
                          <span className="font-extrabold text-white text-xs block truncate"><AnimatedNumber value={speakersBreakdown.hs8s.total} /></span>
                        </div>
                        <div className="text-center min-w-0">
                          <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Allocated</span>
                          <span className="font-extrabold text-[#38bdf8] text-xs block truncate"><AnimatedNumber value={speakersBreakdown.hs8s.allocated} /></span>
                        </div>
                        <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-1 py-0.5 rounded-lg min-w-0">
                          <span className="text-[8px] text-[#10b981] block uppercase font-bold truncate">Balance</span>
                          <span className="font-extrabold text-[#10b981] text-xs block truncate"><AnimatedNumber value={speakersBreakdown.hs8s.balance} /></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: MEDIA PLAYERS */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-[#38bdf8] tracking-wider flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5" /> Media Players
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
                            className={`p-3 rounded-2xl bg-[#1c1c2a] border border-white/5 flex flex-col justify-between overflow-hidden min-w-0 ${hoverClass} transition-colors`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 mb-2">
                              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-[10px] shrink-0 ${badgeClass}`}>
                                {mp.badge}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-extrabold text-white truncate">
                                  {mp.brand} {mp.model}
                                </h4>
                                <p className="text-[9px] text-[#8a8d9b] truncate">{mp.element}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 text-xs pt-2 border-t border-white/5 min-w-0">
                              <div className="text-center min-w-0">
                                <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Total</span>
                                <span className="font-extrabold text-white text-xs block truncate"><AnimatedNumber value={mp.total} /></span>
                              </div>
                              <div className="text-center min-w-0">
                                <span className="text-[8px] text-[#8a8d9b] block uppercase font-bold truncate">Allocated</span>
                                <span className="font-extrabold text-[#38bdf8] text-xs block truncate"><AnimatedNumber value={mp.allocated} /></span>
                              </div>
                              <div className="text-center bg-[#10b981]/10 border border-[#10b981]/20 px-1 py-0.5 rounded-lg min-w-0">
                                <span className="text-[8px] text-[#10b981] block uppercase font-bold truncate">Balance</span>
                                <span className="font-extrabold text-[#10b981] text-xs block truncate"><AnimatedNumber value={mp.balance} /></span>
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
        );

      case 'card_equipment_allotment':
        return (
          <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-3.5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-[#8b5cf6]" />
                  <div>
                    <h3 className="text-xs font-extrabold text-white tracking-tight">
                      Equipment Allotment Graph
                    </h3>
                    <p className="text-[9px] text-[#8a8d9b]">Component breakdown & allocation percentages</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-extrabold text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-0.5 rounded-xl border border-[#8b5cf6]/20">
                  <AnimatedNumber value={stats.totalTechnicalInventory} suffix=" Total Items" />
                </span>
              </div>

              <div className="space-y-2.5">
                {/* COMPONENT 1: PROJECTORS */}
                {(() => {
                  const tot = stats.totalProjectors;
                  const alc = stats.allocatedProjectors;
                  const pct = tot > 0 ? Math.round((alc / tot) * 100) : 0;
                  return (
                    <div className="p-2.5 px-3 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-1.5 hover:border-[#f97316]/40 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white flex items-center gap-1.5 text-[11px]">
                          <Camera className="w-3.5 h-3.5 text-[#f97316]" /> Projectors
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-[#8a8d9b] text-[9px]">
                            <strong className="text-white"><AnimatedNumber value={alc} /></strong> / <AnimatedNumber value={tot} />
                          </span>
                          <span className="font-bold text-[#f97316] bg-[#f97316]/10 px-1.5 py-0.5 rounded border border-[#f97316]/20 text-[10px]">
                            <AnimatedNumber value={pct} suffix="%" />
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#141421] h-2 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
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
                    <div className="p-2.5 px-3 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-1.5 hover:border-[#10b981]/40 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white flex items-center gap-1.5 text-[11px]">
                          <Volume2 className="w-3.5 h-3.5 text-[#10b981]" /> Yamaha HS Speakers
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-[#8a8d9b] text-[9px]">
                            <strong className="text-white"><AnimatedNumber value={alc} /></strong> / <AnimatedNumber value={tot} />
                          </span>
                          <span className="font-bold text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-[#10b981]/20 text-[10px]">
                            <AnimatedNumber value={pct} suffix="%" />
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#141421] h-2 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
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
                    <div className="p-2.5 px-3 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-1.5 hover:border-[#38bdf8]/40 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white flex items-center gap-1.5 text-[11px]">
                          <Tv className="w-3.5 h-3.5 text-[#38bdf8]" /> Media Players
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-[#8a8d9b] text-[9px]">
                            <strong className="text-white"><AnimatedNumber value={alc} /></strong> / <AnimatedNumber value={tot} />
                          </span>
                          <span className="font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-1.5 py-0.5 rounded border border-[#38bdf8]/20 text-[10px]">
                            <AnimatedNumber value={pct} suffix="%" />
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#141421] h-2 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
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
                    <div className="p-2.5 px-3 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-1.5 hover:border-[#8b5cf6]/40 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white flex items-center gap-1.5 text-[11px]">
                          <Wrench className="w-3.5 h-3.5 text-[#8b5cf6]" /> Overall Tech Inventory
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-[#8a8d9b] text-[9px]">
                            <strong className="text-white"><AnimatedNumber value={alc} /></strong> / <AnimatedNumber value={tot} />
                          </span>
                          <span className="font-bold text-[#8b5cf6] bg-[#8b5cf6]/10 px-1.5 py-0.5 rounded border border-[#8b5cf6]/20 text-[10px]">
                            <AnimatedNumber value={pct} suffix="%" />
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-[#141421] h-2 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
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
        );

      case 'card_allocation_graph':
        return (
          <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-3.5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4.5 h-4.5 text-[#38bdf8]" />
                  <div>
                    <h3 className="text-xs font-extrabold text-white tracking-tight">
                      Technical Allocation Graph
                    </h3>
                    <p className="text-[9px] text-[#8a8d9b]">Proportional allocation & balance</p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded-lg border border-[#38bdf8]/20">
                  <AnimatedNumber value={stats.totalTechnicalInventory} suffix=" Pool Items" />
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 py-1">
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-xl">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1c1c2a" strokeWidth="5" />
                    <circle cx="50" cy="50" r="33" fill="none" stroke="#1c1c2a" strokeWidth="5" />
                    <circle cx="50" cy="50" r="24" fill="none" stroke="#1c1c2a" strokeWidth="5" />

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
                      className="text-xl font-black text-white leading-none"
                    />
                    <span className="text-[8px] text-[#8a8d9b] font-bold uppercase tracking-wider mt-0.5">Allocated</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-[#8a8d9b] w-full">
                  <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl bg-[#1c1c2a] border border-white/5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#f97316] shrink-0" />
                      <span className="font-semibold text-white truncate text-[10px]">Projectors</span>
                    </div>
                    <span className="font-bold text-[#f97316] text-[10px] shrink-0"><AnimatedNumber value={stats.totalProjectors} suffix=" u" /></span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl bg-[#1c1c2a] border border-white/5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
                      <span className="font-semibold text-white truncate text-[10px]">Yamaha Speakers</span>
                    </div>
                    <span className="font-bold text-[#10b981] text-[10px] shrink-0"><AnimatedNumber value={stats.totalHSSpeakers} suffix=" u" /></span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-1.5 px-2.5 rounded-xl bg-[#1c1c2a] border border-white/5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shrink-0" />
                      <span className="font-semibold text-white truncate text-[10px]">Media Players</span>
                    </div>
                    <span className="font-bold text-[#38bdf8] text-[10px] shrink-0"><AnimatedNumber value={stats.totalMediaPlayers} suffix=" u" /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'card_artwork_distribution':
        return (
          <div className="p-5 rounded-3xl bg-[#232334] border border-white/5 shadow-xl space-y-3.5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4.5 h-4.5 text-[#a855f7]" />
                  <div>
                    <h3 className="text-xs font-extrabold text-white tracking-tight">
                      Artwork Spatial Distribution Graph
                    </h3>
                    <p className="text-[9px] text-[#8a8d9b]">Artwork assignments per exhibition venue</p>
                  </div>
                </div>

                <Link href="/artworks" className="text-xs text-[#38bdf8] hover:underline font-semibold flex items-center gap-1">
                  View Artworks <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {venueDistribution.length === 0 ? (
                  <div className="p-6 text-center text-[#8a8d9b] text-xs bg-[#1c1c2a] rounded-2xl border border-white/5 space-y-1">
                    <p className="font-semibold text-white">No venues in database</p>
                    <p className="text-[11px]">Database is empty. Add venues to view spatial artwork distribution.</p>
                  </div>
                ) : (
                  venueDistribution.slice(0, 5).map((v, idx) => {
                    const maxVal = Math.max(...venueDistribution.map((vd) => vd.artworkCount), 1);
                    const pct = Math.round((v.artworkCount / maxVal) * 100);
                    return (
                      <div key={idx} className="p-2.5 px-3 rounded-2xl bg-[#1c1c2a] border border-white/5 space-y-1.5 hover:border-[#a855f7]/40 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-white flex items-center gap-1.5 text-[11px]">
                            <Building2 className="w-3.5 h-3.5 text-[#a855f7]" /> {v.name}
                          </span>
                          <AnimatedNumber value={v.artworkCount} suffix=" Artworks" className="font-mono font-extrabold text-[#a855f7] text-[11px]" />
                        </div>

                        <div className="w-full bg-[#141421] h-2 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                          <div
                            className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#38bdf8] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* DASHBOARD HEADER TITLE & REFRESH & CUSTOMIZE LAYOUT BUTTON */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#8b5cf6]" /> {activeRole || 'Super Admin'} Dashboard
          </h1>
          <p className="text-xs text-[#8a8d9b] mt-0.5">
            Master operations monitoring center — Drag & arrange cards in whatever layout you prefer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* CUSTOMIZE DASHBOARD LAYOUT TOGGLE BUTTON */}
          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              isCustomizing
                ? 'bg-gradient-to-r from-[#38bdf8] to-[#8b5cf6] text-white border-transparent ring-2 ring-[#38bdf8]/50 shadow-[#38bdf8]/20'
                : 'bg-[#232334] hover:bg-[#2c2c40] text-white border-white/10 hover:border-[#38bdf8]/40'
            }`}
          >
            {isCustomizing ? (
              <>
                <Check className="w-3.5 h-3.5" /> Done Editing Layout
              </>
            ) : (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#38bdf8]" /> Customize Dashboard Layout
              </>
            )}
          </button>

          {/* REFRESH LIVE METRICS */}
          <button
            onClick={fetchDashboardData}
            className="bg-[#232334] hover:bg-[#2c2c40] text-[#38bdf8] border border-white/10 hover:border-white/20 text-xs font-extrabold px-4 py-2 rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Metrics
          </button>
        </div>
      </div>

      {/* CUSTOMIZATION MODE INSTRUCTION BAR */}
      {isCustomizing && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#1c1c2c] via-[#24243a] to-[#1c1c2c] border-2 border-[#38bdf8]/40 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#38bdf8]/10 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
              <Move className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                Dashboard Card Rearrangement Active
              </h4>
              <p className="text-[11px] text-[#8a8d9b] mt-0.5">
                Drag cards by their handles or use the Move controls to arrange tiles & graphs in your preferred order.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetDashboardLayout}
              className="px-3.5 py-1.5 rounded-xl bg-[#1c1c2a] hover:bg-[#28283d] text-xs font-bold text-[#8a8d9b] hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Default Layout
            </button>
            <button
              onClick={() => setIsCustomizing(false)}
              className="px-4 py-1.5 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-xs font-extrabold text-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check className="w-3.5 h-3.5" /> Save Layout
            </button>
          </div>
        </div>
      )}

      {/* HIDDEN CARDS RESTORE BAR */}
      {hiddenCards.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#232334] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8a8d9b]">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-[#f97316]" />
            <span>Hidden Cards ({hiddenCards.length}):</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {hiddenCards.map((key) => (
                <span
                  key={key}
                  className="px-2.5 py-1 rounded-xl bg-[#1c1c2a] text-white font-bold border border-white/5 flex items-center gap-1.5"
                >
                  {CARD_NAMES[key] || key}
                  <button
                    onClick={() => toggleCardVisibility(key)}
                    className="text-[#38bdf8] hover:text-white cursor-pointer ml-1"
                    title="Unhide"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => saveHiddenCards([])}
            className="text-[#38bdf8] hover:underline font-bold text-xs cursor-pointer"
          >
            Unhide All Cards
          </button>
        </div>
      )}

      {/* SECTION 1: DYNAMIC REORDERABLE STAT TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-5">
        {statOrder
          .filter((key) => !hiddenCards.includes(key))
          .map((tileKey, index) => (
            <div
              key={tileKey}
              draggable={isCustomizing}
              onDragStart={(e) => handleDragStart(e, 'stat', tileKey, index)}
              onDragOver={(e) => handleDragOver(e, 'stat', tileKey, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'stat', tileKey, index)}
              onDragEnd={handleDragEnd}
              className={`relative group p-3.5 sm:p-5 rounded-3xl bg-[#232334] border transition-all flex flex-col justify-between ${
                isCustomizing
                  ? 'border-[#38bdf8]/40 ring-2 ring-[#38bdf8]/20 cursor-grab active:cursor-grabbing shadow-lg'
                  : 'border-white/5 hover:border-[#8b5cf6]/40 shadow-xl'
              } ${
                dragOverItem?.type === 'stat' && dragOverItem?.key === tileKey
                  ? 'scale-[1.03] border-[#38bdf8] ring-4 ring-[#38bdf8]/40 shadow-2xl bg-[#2a2a3f]'
                  : ''
              } ${draggedItem?.key === tileKey ? 'opacity-40' : 'opacity-100'}`}
            >
              {/* Stat Tile Customization Overlay Bar */}
              {isCustomizing && (
                <div className="mb-3 flex items-center justify-between bg-[#181825]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 shadow-sm text-xs">
                  <div className="flex items-center gap-1 text-[#38bdf8] font-bold text-[10px]">
                    <GripVertical className="w-3.5 h-3.5 cursor-grab" /> Move
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveStatTile(index, 'left')}
                      className="p-1 hover:bg-[#28283d] rounded text-[#8a8d9b] hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move Left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === statOrder.length - 1}
                      onClick={() => moveStatTile(index, 'right')}
                      className="p-1 hover:bg-[#28283d] rounded text-[#8a8d9b] hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move Right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCardVisibility(tileKey)}
                      className="p-1 hover:bg-[#ef4444]/20 rounded text-[#8a8d9b] hover:text-[#ef4444] cursor-pointer"
                      title="Hide Tile"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Render Tile Content */}
              {renderStatTileContent(tileKey)}
            </div>
          ))}
      </div>

      {/* SECTION 2: DYNAMIC REORDERABLE MAIN CARDS & GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {cardOrder
          .filter((key) => !hiddenCards.includes(key))
          .filter((key) => {
            if ((activeRole || '').trim().toUpperCase() === 'PROGRAMMING TEAM') {
              // [NV] Live Equipment Stock Allocation Gauges & Progress Bars (card_equipment_allotment, card_allocation_graph)
              // [NV] Venue-wise Spatial Allocation Distribution Charts (card_artwork_distribution)
              return !['card_equipment_allotment', 'card_allocation_graph', 'card_artwork_distribution'].includes(key);
            }
            return true;
          })
          .map((cardKey, index) => (
            <div
              key={cardKey}
              draggable={isCustomizing}
              onDragStart={(e) => handleDragStart(e, 'card', cardKey, index)}
              onDragOver={(e) => handleDragOver(e, 'card', cardKey, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'card', cardKey, index)}
              onDragEnd={handleDragEnd}
              className={`relative group transition-all ${CARD_COL_SPANS[cardKey] || 'lg:col-span-6'} ${
                isCustomizing
                  ? 'ring-2 ring-[#38bdf8]/40 border-2 border-dashed border-[#38bdf8]/60 rounded-3xl p-1 bg-[#1e1e2d]/60 cursor-grab active:cursor-grabbing'
                  : ''
              } ${
                dragOverItem?.type === 'card' && dragOverItem?.key === cardKey
                  ? 'scale-[1.01] ring-4 ring-[#38bdf8] shadow-2xl z-30'
                  : ''
              } ${draggedItem?.key === cardKey ? 'opacity-40' : 'opacity-100'}`}
            >
              {/* Card Customization Header Bar */}
              {isCustomizing && (
                <div className="mb-2 flex items-center justify-between bg-[#181825] px-4 py-2 rounded-2xl border border-[#38bdf8]/30 shadow-md text-xs text-[#8a8d9b]">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <GripVertical className="w-4 h-4 text-[#38bdf8] cursor-grab" />
                    <span className="uppercase tracking-wider text-[10px] text-[#38bdf8]">
                      {CARD_NAMES[cardKey] || cardKey}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveMainCard(index, 'up')}
                      className="p-1 px-2 hover:bg-[#28283d] rounded-lg text-white disabled:opacity-30 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Move Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" /> Move Up
                    </button>
                    <button
                      type="button"
                      disabled={index === cardOrder.length - 1}
                      onClick={() => moveMainCard(index, 'down')}
                      className="p-1 px-2 hover:bg-[#28283d] rounded-lg text-white disabled:opacity-30 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Move Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" /> Move Down
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCardVisibility(cardKey)}
                      className="p-1 px-2 hover:bg-[#ef4444]/20 rounded-lg text-[#ef4444] cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Hide Card"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </button>
                  </div>
                </div>
              )}

              {/* Render Main Card Content */}
              {renderMainCardContent(cardKey)}
            </div>
          ))}
      </div>
    </div>
  );
}
