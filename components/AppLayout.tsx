'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ImageUploadInput from '@/components/ImageUploadInput';
import OrbitaLogo from '@/components/OrbitaLogo';
import NotificationToast from '@/components/NotificationToast';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Palette,
  Briefcase,
  UserCheck,
  UserCog,
  Wrench,
  Package,
  FileSpreadsheet,
  ShoppingCart,
  Building2,
  DoorOpen,
  MapPin,
  FileText,
  FileDown,
  RefreshCw,
  Search,
  Bell,
  ShieldCheck,
  Settings,
  Layers,
  ChevronDown,
  X,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ArrowUpRight,
  LogOut,
  Sparkles,
  Rocket,
  CreditCard,
  PieChart,
  Clock,
  Lock,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Global Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({ artists: [], artworks: [], inventory: [], venues: [] });
  const [isSearching, setIsSearching] = useState(false);

  // User Session & Role State
  const [userSession, setUserSession] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<string>('SUPER ADMIN');
  const [authChecked, setAuthChecked] = useState(false);

  // New Event Modal State (Super Admin Only)
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    name: '',
    code: '',
    year: new Date().getFullYear().toString(),
    description: '',
    startDate: '',
    endDate: '',
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.name.trim() || !eventFormData.code.trim()) {
      setEventError('Event Name and Event Code are required.');
      return;
    }
    setEventSubmitting(true);
    setEventError(null);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventFormData),
      });
      const data = await res.json();
      if (data.success && data.event) {
        setCreateEventModalOpen(false);
        setEventFormData({
          name: '',
          code: '',
          year: new Date().getFullYear().toString(),
          description: '',
          startDate: '',
          endDate: '',
        });
        await fetchEvents();
        setSelectedEventId(data.event.id);
        setSelectedEvent(data.event);
      } else {
        setEventError(data.error || 'Failed to create event.');
      }
    } catch (err: any) {
      console.error(err);
      setEventError(err.message || 'Error creating event.');
    } finally {
      setEventSubmitting(false);
    }
  };

  // First-time Login Password & Profile Setup state
  const [profileFormData, setProfileFormData] = useState({
    username: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (userSession?.mustChangePassword) {
      setProfileFormData((prev) => ({
        ...prev,
        username: prev.username || userSession.username || userSession.name || '',
        email: prev.email || userSession.email || '',
        phone: prev.phone || userSession.phone || '',
        avatar: prev.avatar || userSession.avatar || '',
      }));
    }
  }, [userSession]);

  const handleUpdateFirstTimeProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!profileFormData.username.trim()) {
      setProfileError('Username is required.');
      return;
    }
    if (!profileFormData.newPassword) {
      setProfileError('New Password is required.');
      return;
    }
    if (profileFormData.newPassword.length < 4) {
      setProfileError('Password must be at least 4 characters long.');
      return;
    }
    if (profileFormData.newPassword !== profileFormData.confirmPassword) {
      setProfileError('Passwords do not match.');
      return;
    }

    setProfileSubmitting(true);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userSession.id,
          username: profileFormData.username.trim(),
          newUsername: profileFormData.username.trim(),
          password: profileFormData.newPassword.trim(),
          newPassword: profileFormData.newPassword.trim(),
          email: profileFormData.email.trim(),
          phone: profileFormData.phone.trim(),
          avatar: profileFormData.avatar,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        const updatedUser = {
          ...userSession,
          ...data.user,
          mustChangePassword: false,
        };
        setUserSession(updatedUser);
        localStorage.setItem('saf_user_session', JSON.stringify(updatedUser));
        if (data.user.role) {
          localStorage.setItem('saf_user_role', data.user.role);
          setActiveRole(data.user.role);
        }
        window.dispatchEvent(new Event('saf-auth-changed'));
      } else {
        setProfileError(data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      console.error(err);
      setProfileError(err.message || 'Error updating profile.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  useEffect(() => {
    const syncAuth = () => {
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem('saf_user_session');
        const savedRole = localStorage.getItem('saf_user_role');

        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setUserSession(parsed);
            if (parsed.role) {
              setActiveRole(parsed.role);
            }
          } catch (e) {
            console.error(e);
          }
        } else if (savedRole) {
          setActiveRole(savedRole);
        }

        setAuthChecked(true);

        // Protection Check: if not logged in and not on /login, redirect to /login
        if (!savedSession && pathname !== '/login') {
          router.push('/login');
        }
      }
    };

    syncAuth();

    window.addEventListener('saf-role-changed', syncAuth);
    window.addEventListener('saf-auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener('saf-role-changed', syncAuth);
      window.removeEventListener('saf-auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, [pathname, router]);

  const handleRoleChange = (newRole: string) => {
    setActiveRole(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saf_user_role', newRole);
      if (userSession) {
        const updated = { ...userSession, role: newRole };
        setUserSession(updated);
        localStorage.setItem('saf_user_session', JSON.stringify(updated));
      }
      window.dispatchEvent(new Event('saf-role-changed'));
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saf_user_session');
      localStorage.removeItem('saf_user_role');
      document.cookie = 'saf_auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setUserSession(null);
      router.push('/login');
    }
  };

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: '1', title: 'Inventory Allocation Approved', message: '4x Epson 10K Projectors allocated to Hiroshi Tanimoto', time: '10 mins ago', isRead: false },
    { id: '2', title: 'Purchase Request Raised', message: 'Marcus Chen raised request for Custom Water Basin', time: '1 hour ago', isRead: false },
    { id: '3', title: 'Google Sheet Auto-Synced', message: 'Technical Inventory Workbook synced successfully', time: '2 hours ago', isRead: true },
  ]);

  // Live Countdown Timer to 13 Dec 2026, 11:00 AM (Month, Week, Day, Hour, Min, Sec)
  const [countdown, setCountdown] = useState({
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date('2026-12-13T11:00:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        setCountdown({ months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      let remSec = Math.floor(diff / 1000);
      const months = Math.floor(remSec / (30 * 24 * 3600));
      remSec %= 30 * 24 * 3600;
      const weeks = Math.floor(remSec / (7 * 24 * 3600));
      remSec %= 7 * 24 * 3600;
      const days = Math.floor(remSec / (24 * 3600));
      remSec %= 24 * 3600;
      const hours = Math.floor(remSec / 3600);
      remSec %= 3600;
      const minutes = Math.floor(remSec / 60);
      const seconds = remSec % 60;

      setCountdown({ months, weeks, days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success && data.events.length > 0) {
        setEvents(data.events);
        const activeEvt = data.events.find((e: any) => e.code === 'SAF2026') || data.events[0];
        setSelectedEventId(activeEvt.id);
        setSelectedEvent(activeEvt);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleEventChange = (evtId: string) => {
    setSelectedEventId(evtId);
    const evt = events.find((e) => e.id === evtId);
    if (evt) setSelectedEvent(evt);
  };

  // Perform Global Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults({ artists: [], artworks: [], inventory: [], venues: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&eventId=${selectedEventId}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedEventId]);

  // Define All Available Navigation Sections
  const allNavSections = [
    {
      title: 'OVERVIEW',
      rolesAllowed: ['SUPER ADMIN', 'TECHNICAL TEAM', 'PRODUCTION TEAM', 'PROGRAMMING TEAM', 'INVENTORY TEAM', 'VIEWER'],
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Events', href: '/events', icon: Calendar },
      ],
    },
    {
      title: 'CURATORIAL & PROGRAMMING',
      rolesAllowed: ['SUPER ADMIN', 'PROGRAMMING TEAM', 'TECHNICAL TEAM', 'PRODUCTION TEAM', 'INVENTORY TEAM'],
      items: [
        { name: 'Artists', href: '/artists', icon: Users },
        { name: 'Artworks', href: '/artworks', icon: Palette, hideForRoles: ['TECHNICAL TEAM', 'INVENTORY TEAM'] },
        { name: 'Curators', href: '/curators', icon: Briefcase, hideForRoles: ['TECHNICAL TEAM', 'INVENTORY TEAM'] },
        { name: 'Teams & Staff', href: '/teams', icon: UserCog, hideForRoles: ['TECHNICAL TEAM', 'INVENTORY TEAM'] },
      ],
    },
    {
      title: 'SPACES & PRODUCTION',
      rolesAllowed: ['SUPER ADMIN', 'PRODUCTION TEAM', 'TECHNICAL TEAM'],
      items: [
        { name: 'Venues', href: '/venues', icon: Building2 },
        { name: 'Rooms', href: '/rooms', icon: DoorOpen },
        { name: 'Installations', href: '/installations', icon: MapPin },
        { name: 'Production Team Inventory', href: '/inventory?tab=PRODUCTION', icon: Layers, badge: 'New Table' },
        { name: 'Technical & Production', href: '/requirements', icon: Wrench },
      ],
    },
    {
      title: 'INVENTORY & PROCUREMENT',
      rolesAllowed: ['SUPER ADMIN', 'TECHNICAL TEAM', 'PRODUCTION TEAM', 'INVENTORY TEAM'],
      items: [
        { name: 'Master Inventory Pool', href: '/inventory', icon: Package },
        { name: 'Production Team Inventory', href: '/inventory?tab=PRODUCTION', icon: Layers, badge: 'Production' },
        { name: 'Technical Inventory', href: '/inventory?tab=TECHNICAL', icon: Wrench, badge: 'Tech' },
        { name: 'Excel Migration Wizard', href: '/inventory/import', icon: FileSpreadsheet, badge: 'Legacy 2026' },
        { name: 'Purchase & Rentals', href: '/procurement', icon: ShoppingCart },
        { name: 'Vendors Directory', href: '/vendors', icon: Building2 },
      ],
    },
    {
      title: 'INTEGRATIONS & GOVERNANCE',
      rolesAllowed: ['SUPER ADMIN'],
      items: [
        { name: 'Google Sheets 1-Way Sync', href: '/google-sheets', icon: RefreshCw, badge: 'Live Mirror' },
        { name: 'Reports & Analytics', href: '/reports', icon: FileText },
        { name: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
        { name: 'Settings & Users', href: '/settings', icon: Settings },
      ],
    },
  ];

  // Filter Navigation Sections for the Active User Role
  const filteredNavSections = allNavSections
    .filter((sec) => sec.rolesAllowed.includes((activeRole || '').trim().toUpperCase()))
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item: any) => !item.hideForRoles || !item.hideForRoles.includes((activeRole || '').trim().toUpperCase())),
    }));

  const rolesList = [
    'SUPER ADMIN',
    'TECHNICAL TEAM',
    'PRODUCTION TEAM',
    'PROGRAMMING TEAM',
    'INVENTORY TEAM',
    'VIEWER',
  ];

  // If on /login page, render children directly without the layout wrapper
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-[#161622] text-white selection:bg-[#8b5cf6] selection:text-white">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-[#161622] border-r border-[#2a2a3e] flex flex-col fixed inset-y-0 z-30 shadow-2xl">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#2a2a3e] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <OrbitaLogo size="md" showTagline={true} />
          </Link>
        </div>

        {/* User Profile Section (Below Logo SAF) */}
        <div className="px-4 py-3 border-b border-[#2a2a3e] bg-[#191927]">
          <div className="bg-[#222234] border border-[#2e2e46] rounded-2xl p-2.5 flex items-center justify-between shadow-lg group">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Avatar with gradient ring */}
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#38bdf8] via-[#ec4899] to-[#8b5cf6] shrink-0">
                {userSession?.avatar ? (
                  <img
                    src={userSession.avatar}
                    alt={userSession.name || 'User'}
                    className="w-9 h-9 rounded-full object-cover bg-[#161622]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#1c1c2b] text-white font-bold text-xs flex items-center justify-center">
                    {(userSession?.name || userSession?.username || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name & Handle / Role */}
              <div className="min-w-0">
                <h4 className="font-extrabold text-white text-xs truncate leading-tight group-hover:text-[#38bdf8] transition-colors">
                  {userSession?.name || userSession?.username || 'User'}
                </h4>
                <p className="text-[11px] font-medium text-[#38bdf8] truncate flex items-center gap-1 mt-0.5">
                  @{userSession?.username || 'user'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-[#8a8d9b] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 ml-1 border border-transparent hover:border-red-500/20"
              title="Logout from SAF Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Event Selector Context */}
        <div className="p-4 border-b border-[#2a2a3e] bg-[#1c1c2a]">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-[#8a8d9b] uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#8b5cf6]" /> Active Event Context
            </label>
            {(activeRole || '').trim().toUpperCase() === 'SUPER ADMIN' && (
              <button
                type="button"
                onClick={() => setCreateEventModalOpen(true)}
                className="text-[10px] font-bold text-[#38bdf8] hover:text-[#7dd3fc] hover:underline flex items-center gap-0.5 transition-colors"
                title="Create a new event (Super Admin Only)"
              >
                <Plus className="w-3 h-3" /> New Event
              </button>
            )}
          </div>

          {(activeRole || '').trim().toUpperCase() === 'SUPER ADMIN' ? (
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full bg-[#232334] text-white text-xs font-semibold rounded-xl px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] appearance-none cursor-pointer pr-8 shadow-inner"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id} className="bg-[#161622] text-white">
                    {evt.name} ({evt.year})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a8d9b] absolute right-2.5 top-3 pointer-events-none" />
            </div>
          ) : (
            <div className="w-full bg-[#232334] text-white text-xs font-semibold rounded-xl px-3 py-2.5 border border-white/10 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2 truncate">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">{selectedEvent?.name || 'SAF 2026'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                {selectedEvent?.year || 2026}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-none">
          {filteredNavSections.map((sec, idx) => (
            <div key={idx}>
              <h3 className="text-[10px] font-bold text-[#8a8d9b] uppercase tracking-widest px-3 mb-2">
                {sec.title}
              </h3>
              <ul className="space-y-1.5">
                {sec.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const IconComponent = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-indigo-500/30'
                            : 'text-[#8a8d9b] hover:text-white hover:bg-[#232334]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8a8d9b]'}`} />
                          <span>{item.name}</span>
                        </div>
                        {(item as any).badge && (
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              isActive
                                ? 'bg-white/20 text-white border-white/30'
                                : 'bg-[#232334] text-[#38bdf8] border-[#38bdf8]/30'
                            }`}
                          >
                            {(item as any).badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Bottom Sidebar Logout & Premium Banner */}
          <div className="pt-2">
            <div className="p-4 rounded-3xl bg-gradient-to-b from-[#232334] to-[#1c1c2a] border border-white/10 text-center relative overflow-hidden shadow-xl">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#8b5cf6]/20 rounded-full blur-xl pointer-events-none" />
              <div className="w-10 h-10 rounded-2xl bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-indigo-500/20">
                <Rocket className="w-5 h-5 text-[#38bdf8]" />
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">ORBITA Operations Engine</h4>
              <p className="text-[10px] text-[#8a8d9b] mt-0.5 mb-3">Active Profile: <strong className="text-white">{activeRole}</strong></p>
              <button
                onClick={handleLogout}
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold py-2 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col pl-72">
        {/* TOP HEADER UTILITY BAR */}
        <header className="h-16 bg-[#161622]/90 backdrop-blur-md border-b border-[#2a2a3e] px-8 flex items-center justify-between sticky top-0 z-20">
          {/* Left: Role Switcher & Context Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#232334] border border-white/10 rounded-2xl px-3 py-1.5 shadow-inner">
              <ShieldCheck className="w-4 h-4 text-[#8b5cf6]" />
              <span className="text-[11px] font-bold text-[#8a8d9b] uppercase tracking-wider">Role:</span>
              {userSession?.role === 'SUPER ADMIN' || activeRole === 'SUPER ADMIN' ? (
                <select
                  value={activeRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-[#38bdf8] focus:outline-none cursor-pointer pr-1"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r} className="bg-[#161622] text-white font-semibold">
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-extrabold text-[#38bdf8] px-1">{activeRole}</span>
              )}
            </div>
          </div>

          {/* Search Trigger Input Box */}
          <div className="flex-1 max-w-md mx-8">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full bg-[#232334] hover:bg-[#2c2c40] border border-white/10 text-[#8a8d9b] text-xs rounded-2xl px-4 py-2 flex items-center justify-between transition-all group shadow-inner cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-[#8a8d9b] group-hover:text-[#38bdf8] transition-colors" />
                <span>Search SAF Code (Ac-15), Artist, Model, Venue...</span>
              </div>
              <kbd className="hidden sm:inline-block bg-[#1c1c2a] border border-white/10 text-[10px] font-mono text-[#8b5cf6] px-2 py-0.5 rounded-lg">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Utilities (Countdown + Notifications + User Avatar) */}
          <div className="flex items-center gap-4">
            {/* Countdown Timer */}
            <div
              className="hidden lg:flex items-center gap-2 bg-[#232334] border border-white/10 text-xs px-3.5 py-2 rounded-2xl shadow-md"
              title="Countdown to SAF Festival Opening: 13 Dec 2026, 11:00 AM"
            >
              <div className="flex items-center gap-1.5 text-white font-extrabold mr-1">
                <Clock className="w-4 h-4 text-[#8b5cf6] animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider text-white font-extrabold hidden xl:inline">Festival Launch:</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="bg-[#1c1c2a] text-white px-1.5 py-0.5 rounded-lg border border-white/10 font-extrabold" title="Months">
                  {countdown.months}<span className="text-[9px] text-white/80 font-normal ml-0.5">M</span>
                </span>
                <span className="text-white/60 font-bold">:</span>
                <span className="bg-[#1c1c2a] text-white px-1.5 py-0.5 rounded-lg border border-white/10 font-extrabold" title="Weeks">
                  {countdown.weeks}<span className="text-[9px] text-white/80 font-normal ml-0.5">W</span>
                </span>
                <span className="text-white/60 font-bold">:</span>
                <span className="bg-[#1c1c2a] text-white px-1.5 py-0.5 rounded-lg border border-white/10 font-extrabold" title="Days">
                  {countdown.days}<span className="text-[9px] text-white/80 font-normal ml-0.5">D</span>
                </span>
                <span className="text-white/60 font-bold">:</span>
                <span className="bg-[#1c1c2a] text-white px-1.5 py-0.5 rounded-lg border border-white/10 font-extrabold" title="Hours">
                  {countdown.hours}<span className="text-[9px] text-white/80 font-normal ml-0.5">H</span>
                </span>
                <span className="text-white/60 font-bold">:</span>
                <span className="bg-[#1c1c2a] text-white px-1.5 py-0.5 rounded-lg border border-white/10 font-extrabold" title="Minutes">
                  {countdown.minutes}<span className="text-[9px] text-white/80 font-normal ml-0.5">M</span>
                </span>
                <span className="text-white/60 font-bold">:</span>
                <span className="bg-[#1c1c2a] text-white px-1.5 py-0.5 rounded-lg border border-white/10 font-extrabold" title="Seconds">
                  {String(countdown.seconds).padStart(2, '0')}<span className="text-[9px] text-white/80 font-normal ml-0.5">S</span>
                </span>
              </div>
            </div>

            {/* Notifications Pill Button */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-10 h-10 rounded-2xl bg-[#232334] border border-white/5 hover:border-[#8b5cf6]/50 flex items-center justify-center text-[#8a8d9b] hover:text-white transition-all relative shadow-sm cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5 text-[#8a8d9b]" />
                {notifications.some((n) => !n.isRead) && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff85a1] absolute top-2 right-2 ring-2 ring-[#161622] animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#232334] border border-white/10 rounded-3xl shadow-2xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#8b5cf6]" /> Operational Notifications
                    </h4>
                    <button
                      onClick={() => setNotifications(notifications.map((n) => ({ ...n, isRead: true })))}
                      className="text-[10px] text-[#8b5cf6] hover:underline font-bold"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border text-xs transition-colors ${
                          n.isRead ? 'bg-[#1c1c2a]/60 border-white/5 text-[#8a8d9b]' : 'bg-[#1c1c2a] border-[#8b5cf6]/40 text-white'
                        }`}
                      >
                        <p className="font-semibold text-white">{n.title}</p>
                        <p className="text-[11px] text-[#8a8d9b] mt-0.5">{n.message}</p>
                        <p className="text-[9px] text-[#8b5cf6] mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile User Avatar & Logout */}
            <div className="flex items-center gap-3 bg-[#232334] p-1.5 pr-3.5 rounded-2xl border border-white/10 shadow-sm">
              <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#38bdf8] via-[#a855f7] to-[#ff85a1]">
                {userSession?.avatar ? (
                  <img src={userSession.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#8b5cf6] text-white font-extrabold text-xs flex items-center justify-center">
                    {(userSession?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{userSession?.name || 'Admin User'}</p>
                <p className="text-[9px] text-[#38bdf8] font-semibold">@{userSession?.username || 'Admin'}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </div>

      {/* GLOBAL SEARCH MODAL */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-[#161622]/80 backdrop-blur-md flex items-start justify-center pt-20 px-4">
          <div className="bg-[#232334] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#1c1c2a]">
              <div className="flex items-center gap-3 flex-1 bg-[#232334] rounded-2xl px-4 py-2.5 border border-white/10 focus-within:border-[#8b5cf6]">
                <Search className="w-5 h-5 text-[#8b5cf6]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type SAF Code (Ac-15), Artist Name, Model, Serial, Venue, Procurement..."
                  className="bg-transparent text-sm text-white placeholder-[#8a8d9b] focus:outline-none w-full"
                  autoFocus
                />
                {isSearching && <RefreshCw className="w-4 h-4 text-[#8b5cf6] animate-spin" />}
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="w-10 h-10 rounded-2xl bg-[#232334] hover:bg-[#2c2c40] flex items-center justify-center text-[#8a8d9b] hover:text-white border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {!searchQuery.trim() ? (
                <div className="text-center py-8 text-[#8a8d9b]">
                  <Sparkles className="w-8 h-8 text-[#8b5cf6] mx-auto mb-2" />
                  <p className="text-sm font-medium">Search across Artists, SAF Inventory Codes, Models, Venues, and Purchase Requests</p>
                </div>
              ) : (
                <>
                  {/* Inventory Matches */}
                  {searchResults.inventory?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Package className="w-4 h-4" /> Inventory Items ({searchResults.inventory.length})
                      </h4>
                      <div className="space-y-2">
                        {searchResults.inventory.map((inv: any) => (
                          <Link
                            key={inv.id}
                            href={`/inventory/${inv.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 hover:border-[#8b5cf6] flex items-center justify-between transition-all group"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#8b5cf6] bg-[#232334] px-2 py-0.5 rounded-lg border border-white/10">
                                  {inv.safCode}
                                </span>
                                <span className="font-semibold text-white group-hover:text-[#38bdf8]">{inv.element}</span>
                              </div>
                              <p className="text-xs text-[#8a8d9b] mt-1">
                                {inv.inventoryCategory} › {inv.subCategory} | Model: {inv.model} | Serial: {inv.serialNo}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-white">{inv.availableQuantity} Available</span>
                              <span className="text-[10px] block text-[#8a8d9b]">Total: {inv.totalQuantity}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Artist Matches */}
                  {searchResults.artists?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#a855f7] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Artists ({searchResults.artists.length})
                      </h4>
                      <div className="space-y-2">
                        {searchResults.artists.map((art: any) => (
                          <Link
                            key={art.id}
                            href={`/artists/${art.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="p-3.5 rounded-2xl bg-[#1c1c2a] border border-white/5 hover:border-[#a855f7] flex items-center justify-between transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              {art.artistPhoto ? (
                                <img src={art.artistPhoto} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] font-bold text-xs flex items-center justify-center">
                                  {art.artistName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-white group-hover:text-[#a855f7] text-xs">{art.artistName}</p>
                                <p className="text-[11px] text-[#8a8d9b]">{art.country || 'International'} | Status: {art.status}</p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-[#8a8d9b] group-hover:text-[#a855f7]" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY FIRST-TIME LOGIN PROFILE SETUP MODAL */}
      {userSession?.mustChangePassword && (
        <div className="fixed inset-0 bg-[#0d0d16]/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#191928] border border-[#38bdf8]/40 shadow-[0_0_50px_rgba(56,189,248,0.2)] rounded-3xl max-w-lg w-full p-6 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#2a2a3e] pb-4">
              <div className="p-3 bg-[#38bdf8]/10 rounded-2xl border border-[#38bdf8]/30 text-[#38bdf8]">
                <ShieldCheck className="w-7 h-7 text-[#38bdf8]" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                  First-Time Login Setup <Sparkles className="w-4 h-4 text-amber-400" />
                </h2>
                <p className="text-xs text-[#8a8d9b]">
                  Please update your default credentials and profile info to continue to the SAF Portal.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {profileError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateFirstTimeProfile} className="space-y-4">
              {/* Profile Picture Upload */}
              <ImageUploadInput
                label="Profile Picture (Optional)"
                value={profileFormData.avatar}
                onChange={(url) => setProfileFormData({ ...profileFormData, avatar: url })}
                placeholder="Image URL or upload photo"
              />

              {/* Username */}
              <div className="space-y-1 text-xs">
                <label className="text-[#8a8d9b] font-medium block">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileFormData.username}
                  onChange={(e) => setProfileFormData({ ...profileFormData, username: e.target.value })}
                  placeholder="Enter unique username"
                  className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#38bdf8] focus:outline-none"
                />
              </div>

              {/* Passwords grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-xs">
                  <label className="text-[#8a8d9b] font-medium block">
                    New Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={profileFormData.newPassword}
                    onChange={(e) => setProfileFormData({ ...profileFormData, newPassword: e.target.value })}
                    placeholder="At least 4 characters"
                    className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-[#8a8d9b] font-medium block">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={profileFormData.confirmPassword}
                    onChange={(e) => setProfileFormData({ ...profileFormData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-xs">
                  <label className="text-[#8a8d9b] font-medium block">Email Address</label>
                  <input
                    type="email"
                    value={profileFormData.email}
                    onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-[#8a8d9b] font-medium block">Phone Number</label>
                  <input
                    type="tel"
                    value={profileFormData.phone}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#0f172a] font-black py-3 rounded-xl transition-all shadow-lg text-xs flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {profileSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-[#0f172a]" />
                    <span>Saving Setup...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#0f172a]" />
                    <span>Save Profile & Access Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUPER ADMIN ONLY: CREATE NEW EVENT MODAL */}
      {createEventModalOpen && (
        <div className="fixed inset-0 bg-[#0d0d16]/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-[#191928] border border-[#38bdf8]/40 shadow-2xl rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2a3e] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#38bdf8]/10 rounded-xl text-[#38bdf8]">
                  <Calendar className="w-5 h-5 text-[#38bdf8]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Create New Event</h3>
                  <p className="text-[11px] text-[#8a8d9b]">Super Admin Event Management</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateEventModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {eventError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{eventError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8a8d9b] font-medium block mb-1">
                  Event Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={eventFormData.name}
                  onChange={(e) => setEventFormData({ ...eventFormData, name: e.target.value })}
                  placeholder="e.g. Serendipity Arts Festival 2027"
                  className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8d9b] font-medium block mb-1">
                    Event Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventFormData.code}
                    onChange={(e) => setEventFormData({ ...eventFormData, code: e.target.value })}
                    placeholder="e.g. SAF2027"
                    className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8a8d9b] font-medium block mb-1">
                    Event Year <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={eventFormData.year}
                    onChange={(e) => setEventFormData({ ...eventFormData, year: e.target.value })}
                    placeholder="2027"
                    className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8d9b] font-medium block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={eventFormData.startDate}
                    onChange={(e) => setEventFormData({ ...eventFormData, startDate: e.target.value })}
                    className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8a8d9b] font-medium block mb-1">End Date</label>
                  <input
                    type="date"
                    value={eventFormData.endDate}
                    onChange={(e) => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                    className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2.5 text-white focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8a8d9b] font-medium block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={eventFormData.description}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                  placeholder="Optional details about this festival edition..."
                  className="w-full bg-[#12121c] border border-[#2a2a3e] rounded-xl px-3.5 py-2 text-white focus:border-[#38bdf8] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2a2a3e]">
                <button
                  type="button"
                  onClick={() => setCreateEventModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white"
                  disabled={eventSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="bg-[#38bdf8] hover:bg-[#7dd3fc] text-[#0f172a] font-bold px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {eventSubmitting ? <Sparkles className="w-4 h-4 animate-spin text-[#0f172a]" /> : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Notification Pop-up Toast with Audio Chime */}
      <NotificationToast />
    </div>
  );
}
