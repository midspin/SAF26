'use client';

import ImageUploadInput from '@/components/ImageUploadInput';

import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Sparkles,
  Mail,
  Phone,
  Globe,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Check,
  ShieldCheck,
  Lock,
  AlertTriangle,
  Users,
  Tag,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  'ALL',
  'Culinary Arts',
  'Music',
  'Theatre',
  'Dance',
  'Craft',
  'Visual Arts',
  'Special Projects',
  'Accessibility',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Culinary Arts': 'bg-amber-950/90 text-amber-300 border-amber-700/80',
  Music: 'bg-purple-950/90 text-purple-300 border-purple-700/80',
  Theatre: 'bg-rose-950/90 text-rose-300 border-rose-700/80',
  Dance: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
  Craft: 'bg-orange-950/90 text-orange-300 border-orange-700/80',
  'Visual Arts': 'bg-sky-950/90 text-sky-300 border-sky-700/80',
  'Special Projects': 'bg-indigo-950/90 text-indigo-300 border-indigo-700/80',
  Accessibility: 'bg-teal-950/90 text-teal-300 border-teal-700/80',
};

export default function CuratorsPage() {
  const [curators, setCurators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // User Role State
  const [userRole, setUserRole] = useState<string>('SUPER ADMIN');

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

  // PROGRAMMING TEAM has Full Access [FA] to Add & Edit Curators, but View Only [VO] on Delete Curator
  const canEditCurators = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'ADMIN',
    'PROGRAMMING TEAM',
    'PROGRAMMING',
    'PROGRAMMER',
    'PROGRAMMERS',
  ].includes(normalizedRole);

  const canDeleteCurators = [
    'SUPER ADMIN',
    'SUPERADMIN',
    'ADMIN',
  ].includes(normalizedRole);

  // Success Tick Animation State
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [addedCuratorName, setAddedCuratorName] = useState('');
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Modal States
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Culinary Arts',
    organisation: '',
    profile: '',
    email: '',
    phone: '',
    website: '',
    photo: '',
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCurator, setEditingCurator] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'Culinary Arts',
    organisation: '',
    profile: '',
    email: '',
    phone: '',
    website: '',
    photo: '',
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCurator, setDeletingCurator] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurators();
  }, []);

  const fetchCurators = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/curators');
      const data = await res.json();
      if (data.success) setCurators(data.curators || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Culinary Arts',
      organisation: '',
      profile: '',
      email: '',
      phone: '',
      website: '',
      photo: '',
    });
    setFormError(null);
  };

  const handleCreateCurator = async () => {
    if (!formData.name.trim()) {
      setFormError('Curator Name is required.');
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

      const res = await fetch('/api/curators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...formData }),
      });
      const data = await res.json();
      if (data.success && data.curator) {
        const newCurator = data.curator;
        setNewModalOpen(false);
        resetForm();

        setCurators((prev) => [newCurator, ...prev]);

        setAddedCuratorName(newCurator.name);
        setNewlyAddedId(newCurator.id);
        setShowSuccessAnimation(true);

        setTimeout(() => {
          setShowSuccessAnimation(false);
        }, 2200);

        setTimeout(() => {
          setNewlyAddedId(null);
        }, 6000);

        fetchCurators();
      } else {
        setFormError(data.error || 'Failed to create curator.');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error creating curator.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (curator: any) => {
    setEditingCurator(curator);
    setEditFormData({
      name: curator.name || '',
      category: curator.category || 'Culinary Arts',
      organisation: curator.organisation || '',
      profile: curator.profile || '',
      email: curator.email || '',
      phone: curator.phone || '',
      website: curator.website || '',
      photo: curator.photo || '',
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleUpdateCurator = async () => {
    if (!editingCurator) return;
    if (!editFormData.name.trim()) {
      setFormError('Curator Name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/curators/${editingCurator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingCurator(null);

        setAddedCuratorName(data.curator.name);
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);

        fetchCurators();
      } else {
        setFormError(data.error || 'Failed to update curator.');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error updating curator.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (curator: any) => {
    setDeletingCurator(curator);
    setDeleteModalOpen(true);
  };

  const handleDeleteCurator = async () => {
    if (!deletingCurator) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/curators/${deletingCurator.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setDeletingCurator(null);
        setCurators((prev) => prev.filter((c) => c.id !== deletingCurator.id));
      } else {
        alert(data.error || 'Failed to delete curator.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting curator.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCurators = curators.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.organisation && c.organisation.toLowerCase().includes(search.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      (c.category && c.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-sky-400" /> Curators Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>Official festival curators & discipline leaders</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                canEditCurators
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {canEditCurators ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Role: {userRole} (Curator Edit Access)
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-amber-400" /> Role: {userRole} (View Only)
                </>
              )}
            </span>
          </p>
        </div>

        {/* ADD CURATOR BUTTON */}
        {canEditCurators && (
          <button
            onClick={() => {
              resetForm();
              setNewModalOpen(true);
            }}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Curator
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 focus-within:border-sky-500">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by curator name, category, organisation, or email..."
            className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Tag className="w-3 h-3" />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Curators List / Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" /> Loading Curators...
        </div>
      ) : filteredCurators.length === 0 ? (
        <div className="p-12 text-center text-slate-500 glass-card rounded-2xl">
          <p className="text-sm font-semibold">No curators found matching search or category selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredCurators.map((c) => {
            const isNewlyAdded = c.id === newlyAddedId;
            const categoryBadgeStyle =
              CATEGORY_COLORS[c.category] || 'bg-slate-900 text-slate-300 border-slate-800';

            return (
              <div
                key={c.id}
                className={`glass-card p-5 rounded-2xl border transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isNewlyAdded
                    ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-emerald-950/20 ring-2 ring-emerald-500/50'
                    : 'border-slate-800 hover:border-sky-500/40'
                }`}
              >
                {isNewlyAdded && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[9px] px-3 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3" /> Newly Added
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt={c.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-purple-950 text-purple-300 font-bold text-xl flex items-center justify-center border border-purple-800 shrink-0">
                        {c.name.charAt(0)}
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors truncate">
                          {c.name}
                        </h3>
                      </div>

                      {/* Category Badge */}
                      {c.category && (
                        <div className="pt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${categoryBadgeStyle}`}
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {c.category}
                          </span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 font-medium truncate pt-0.5">
                        {c.organisation || 'Independent Curator'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 line-clamp-3 leading-relaxed">
                    {c.profile || 'No curatorial profile specified.'}
                  </p>

                  <div className="text-sky-400 text-[11px] space-y-0.5 pt-1">
                    {c.email && <p className="truncate">📧 {c.email}</p>}
                    {c.phone && <p>📞 {c.phone}</p>}
                  </div>
                </div>

                {/* EDIT & DELETE BUTTONS */}
                {(canEditCurators || canDeleteCurators) && (
                  <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-800/80">
                    {canEditCurators && (
                      <button
                        onClick={() => openEditModal(c)}
                        className="flex-1 bg-slate-800/90 hover:bg-sky-600 hover:text-white text-sky-400 text-xs font-semibold py-1.5 px-3 rounded-xl border border-sky-500/30 transition-all flex items-center justify-center gap-1.5"
                        title="Edit Curator Information"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    {canDeleteCurators && (
                      <button
                        onClick={() => openDeleteModal(c)}
                        className="bg-red-950/80 hover:bg-red-600 text-red-400 hover:text-white text-xs font-semibold py-1.5 px-3 rounded-xl border border-red-800/60 transition-all flex items-center justify-center gap-1.5"
                        title="Delete Curator"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                )}
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
              <h3 className="text-lg font-black text-slate-50 tracking-wide">Curator Record Updated!</h3>
              <p className="text-xs text-emerald-300 font-semibold mt-1">
                &ldquo;{addedCuratorName}&rdquo; curator profile saved
              </p>
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW CURATOR */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Add New Curator</h3>
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
                <label className="text-slate-400 block mb-1">Curator Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Anisha Rachel Oommen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category / Discipline *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c !== 'ALL').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <ImageUploadInput
                label="Curator Photo Image"
                value={formData.photo}
                onChange={(url) => setFormData({ ...formData, photo: url })}
                placeholder="https://... or upload local image file"
              />

              <div>
                <label className="text-slate-400 block mb-1">Organisation</label>
                <input
                  type="text"
                  value={formData.organisation}
                  onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                  placeholder="e.g. Goya Media"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="curator@saf.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98200 11223"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Curatorial Profile / Bio</label>
                <textarea
                  value={formData.profile}
                  onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                  placeholder="Food writer, editor and co-founder of Goya Media..."
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
                onClick={handleCreateCurator}
                disabled={submitting}
                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                {submitting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : 'Create Curator'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CURATOR */}
      {editModalOpen && editingCurator && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" /> Edit Curator: {editingCurator.name}
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
                <label className="text-slate-400 block mb-1">Curator Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category / Discipline *</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c !== 'ALL').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <ImageUploadInput
                label="Curator Photo Image"
                value={editFormData.photo}
                onChange={(url) => setEditFormData({ ...editFormData, photo: url })}
                placeholder="https://... or upload local image file"
              />

              <div>
                <label className="text-slate-400 block mb-1">Organisation</label>
                <input
                  type="text"
                  value={editFormData.organisation}
                  onChange={(e) => setEditFormData({ ...editFormData, organisation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                  <label className="text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Curatorial Profile / Bio</label>
                <textarea
                  value={editFormData.profile}
                  onChange={(e) => setEditFormData({ ...editFormData, profile: e.target.value })}
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
                onClick={handleUpdateCurator}
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
      {deleteModalOpen && deletingCurator && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-800/80 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 border border-red-800/80 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-100">Delete Curator Profile?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete <strong className="text-white">&ldquo;{deletingCurator.name}&rdquo;</strong>?
                This action cannot be undone.
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
                onClick={handleDeleteCurator}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                {isDeleting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Delete Curator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
