'use client';

import ImageUploadInput from '@/components/ImageUploadInput';
import React, { useEffect, useState } from 'react';
import {
  UserCog,
  Wrench,
  Package,
  Briefcase,
  Sparkles,
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
  Mail,
  Phone,
  Layers,
  UserCheck,
  Shield,
  Eye,
  Sliders,
  RotateCcw,
  CheckSquare,
  Square,
  Key,
} from 'lucide-react';
import {
  getRoles,
  saveRoles,
  DEFAULT_ROLES,
  MODULE_DEFINITIONS,
  RoleDefinition,
  ModulePermission,
} from '@/lib/permissions';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any>({ programming: [], technical: [], production: [], inventory: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TECHNICAL' | 'PRODUCTION' | 'PROGRAMMING' | 'INVENTORY' | 'ROLES'>('TECHNICAL');
  const [search, setSearch] = useState('');

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

  // ONLY SUPER ADMIN CAN CREATE / EDIT / DELETE TEAM MEMBERS & ROLES
  const canManageTeams = ['SUPER ADMIN'].includes(
    (userRole || '').trim().toUpperCase()
  );

  // Read URL query tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam &&
        ['TECHNICAL', 'PRODUCTION', 'PROGRAMMING', 'INVENTORY', 'ROLES'].includes(tabParam.toUpperCase())
      ) {
        setActiveTab(tabParam.toUpperCase() as any);
      }
    }
  }, []);

  // Roles & Permissions State
  const [rolesList, setRolesList] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, ModulePermission>>({});
  const [roleSaveSuccess, setRoleSaveSuccess] = useState(false);

  // Create Custom Role Modal State
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    description: '',
    badgeColor: 'sky' as 'sky' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo',
    templateRoleId: 'TECHNICAL TEAM',
  });

  const reloadRoles = () => {
    const currentRoles = getRoles();
    setRolesList(currentRoles);
    if (!selectedRole && currentRoles.length > 0) {
      const active = currentRoles.find((r) => r.id === 'SUPER ADMIN') || currentRoles[0];
      setSelectedRole(active);
      setPermissionMatrix(JSON.parse(JSON.stringify(active.permissions)));
    }
  };

  useEffect(() => {
    reloadRoles();
    window.addEventListener('saf-roles-updated', reloadRoles);
    return () => window.removeEventListener('saf-roles-updated', reloadRoles);
  }, []);

  const handleSelectRole = (role: RoleDefinition) => {
    setSelectedRole(role);
    setPermissionMatrix(JSON.parse(JSON.stringify(role.permissions)));
  };

  const handleTogglePermission = (moduleId: string, field: 'canView' | 'canEdit' | 'canDelete') => {
    if (!permissionMatrix[moduleId]) return;
    setPermissionMatrix((prev) => {
      const updatedMod = { ...prev[moduleId], [field]: !prev[moduleId][field] };
      // If turning off View, automatically turn off Edit and Delete
      if (field === 'canView' && !updatedMod.canView) {
        updatedMod.canEdit = false;
        updatedMod.canDelete = false;
      }
      // If turning on Edit or Delete, automatically turn on View
      if ((field === 'canEdit' || field === 'canDelete') && updatedMod[field]) {
        updatedMod.canView = true;
      }
      return { ...prev, [moduleId]: updatedMod };
    });
  };

  const handleApplyPreset = (presetType: 'ALL' | 'READ_ONLY' | 'RESET') => {
    if (!selectedRole) return;
    const copy: Record<string, ModulePermission> = {};

    MODULE_DEFINITIONS.forEach((mod) => {
      if (presetType === 'ALL') {
        copy[mod.id] = { id: mod.id, name: mod.name, category: mod.category, canView: true, canEdit: true, canDelete: true };
      } else if (presetType === 'READ_ONLY') {
        copy[mod.id] = { id: mod.id, name: mod.name, category: mod.category, canView: true, canEdit: false, canDelete: false };
      } else if (presetType === 'RESET') {
        const sysRole = DEFAULT_ROLES.find((r) => r.id === selectedRole.id);
        if (sysRole && sysRole.permissions[mod.id]) {
          copy[mod.id] = { ...sysRole.permissions[mod.id] };
        } else {
          copy[mod.id] = { id: mod.id, name: mod.name, category: mod.category, canView: true, canEdit: false, canDelete: false };
        }
      }
    });

    setPermissionMatrix(copy);
  };

  const handleSaveRolePermissions = () => {
    if (!selectedRole) return;
    const updatedRoles = rolesList.map((r) => {
      if (r.id === selectedRole.id) {
        return { ...r, permissions: permissionMatrix };
      }
      return r;
    });

    saveRoles(updatedRoles);
    setRolesList(updatedRoles);
    setSelectedRole({ ...selectedRole, permissions: permissionMatrix });

    setRoleSaveSuccess(true);
    setTimeout(() => setRoleSaveSuccess(false), 2500);
  };

  const handleCreateCustomRole = () => {
    if (!newRoleData.name.trim()) return;
    const roleId = newRoleData.name.trim().toUpperCase();

    // Use template role permissions
    const templateRole = rolesList.find((r) => r.id === newRoleData.templateRoleId) || rolesList[0];
    const templatePerms = JSON.parse(JSON.stringify(templateRole.permissions));

    const newRole: RoleDefinition = {
      id: roleId,
      name: newRoleData.name.trim().toUpperCase(),
      description: newRoleData.description.trim() || `Custom role for ${newRoleData.name.trim()}`,
      badgeColor: newRoleData.badgeColor,
      isSystem: false,
      permissions: templatePerms,
    };

    const updated = [...rolesList, newRole];
    saveRoles(updated);
    setRolesList(updated);
    setSelectedRole(newRole);
    setPermissionMatrix(templatePerms);
    setCreateRoleModalOpen(false);

    setNewRoleData({
      name: '',
      description: '',
      badgeColor: 'sky',
      templateRoleId: 'TECHNICAL TEAM',
    });
  };

  // Success Tick Animation State
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [addedMemberName, setAddedMemberName] = useState('');
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Generated Login Credentials Notice Modal State
  const [generatedCreds, setGeneratedCreds] = useState<{ username: string; password: string; role: string } | null>(null);

  // All Events State for Multi-Event Assignment
  const [allEvents, setAllEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success && data.events) {
          setAllEvents(data.events);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllEvents();
  }, []);

  // Modal States
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    teamType: 'TECHNICAL' as 'TECHNICAL' | 'PRODUCTION' | 'PROGRAMMING' | 'INVENTORY',
    name: '',
    role: '',
    systemRole: 'TECHNICAL TEAM',
    organisation: '',
    email: '',
    phone: '',
    skills: '',
    responsibilities: '',
    photo: '',
    eventIds: [] as string[],
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: '',
    systemRole: 'TECHNICAL TEAM',
    organisation: '',
    email: '',
    phone: '',
    skills: '',
    responsibilities: '',
    photo: '',
    eventIds: [] as string[],
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Artist Assignment Modal States for Programming Team (Artist POC)
  const [allArtists, setAllArtists] = useState<any[]>([]);
  const [assignArtistModalOpen, setAssignArtistModalOpen] = useState(false);
  const [assigningMember, setAssigningMember] = useState<any>(null);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [savingArtistAssign, setSavingArtistAssign] = useState(false);

  const openAssignArtistModal = async (member: any) => {
    setAssigningMember(member);
    const assignedIds = member.artistAssignments?.map((a: any) => a.artistId || a.artist?.id).filter(Boolean) || [];
    setSelectedArtistIds(assignedIds);
    setAssignArtistModalOpen(true);
    if (allArtists.length === 0) {
      try {
        const res = await fetch('/api/artists');
        const data = await res.json();
        if (data.artists) setAllArtists(data.artists);
      } catch (err) {
        console.error('Error fetching artists for assignment:', err);
      }
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success) setTeams(data.teams);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const defaultTeam = activeTab === 'ROLES' ? 'TECHNICAL' : activeTab;
    const defaultRole =
      defaultTeam === 'TECHNICAL'
        ? 'TECHNICAL TEAM'
        : defaultTeam === 'PRODUCTION'
        ? 'PRODUCTION TEAM'
        : defaultTeam === 'PROGRAMMING'
        ? 'PROGRAMMING TEAM'
        : 'INVENTORY TEAM';

    setFormData({
      teamType: defaultTeam,
      name: '',
      role: '',
      systemRole: defaultRole,
      organisation: '',
      email: '',
      phone: '',
      skills: '',
      responsibilities: '',
      photo: '',
      eventIds: allEvents.map((e) => e.id),
    });
    setFormError(null);
  };

  const handleCreateMember = async () => {
    if (!formData.name.trim()) {
      setFormError('Member Name is required.');
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

      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ...formData,
          systemRole: formData.systemRole,
          userRole: formData.systemRole,
          eventIds: formData.eventIds.length > 0 ? formData.eventIds : allEvents.map((e) => e.id),
        }),
      });
      const data = await res.json();
      if (data.success && data.person) {
        const newPerson = data.person;
        setNewModalOpen(false);
        resetForm();

        setAddedMemberName(newPerson.name);
        setNewlyAddedId(newPerson.id);
        setShowSuccessAnimation(true);

        if (data.generatedAccount) {
          setGeneratedCreds(data.generatedAccount);
        }

        setTimeout(() => {
          setShowSuccessAnimation(false);
        }, 2200);

        setTimeout(() => {
          setNewlyAddedId(null);
        }, 6000);

        fetchTeams();
      } else {
        setFormError(data.error || 'Failed to create team member.');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error creating team member.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (member: any) => {
    setEditingMember(member);
    let memberEventIds: string[] = [];
    if (member.eventIdsJson) {
      try {
        memberEventIds = JSON.parse(member.eventIdsJson);
      } catch (e) {}
    }
    if (memberEventIds.length === 0 && member.eventId) {
      memberEventIds = [member.eventId];
    }
    setEditFormData({
      name: member.name || '',
      role: member.role || '',
      systemRole: member.role || activeTab + ' TEAM',
      organisation: member.organisation || '',
      email: member.email || '',
      phone: member.phone || '',
      skills: member.skills || '',
      responsibilities: member.responsibilities || '',
      photo: member.photo || '',
      eventIds: memberEventIds.length > 0 ? memberEventIds : allEvents.map((e) => e.id),
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    if (!editFormData.name.trim()) {
      setFormError('Member Name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/team/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          systemRole: editFormData.systemRole,
          userRole: editFormData.systemRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingMember(null);

        setAddedMemberName(data.person.name);
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);

        fetchTeams();
      } else {
        setFormError(data.error || 'Failed to update team member.');
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Error updating team member.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (member: any) => {
    setDeletingMember(member);
    setDeleteModalOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/team/${deletingMember.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setDeletingMember(null);
        fetchTeams();
      } else {
        alert(data.error || 'Failed to delete team member.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting team member.');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentTabList = activeTab === 'ROLES' ? [] : teams[activeTab.toLowerCase()] || [];
  const filteredMembers = currentTabList.filter(
    (m: any) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.role && m.role.toLowerCase().includes(search.toLowerCase())) ||
      (m.organisation && m.organisation.toLowerCase().includes(search.toLowerCase())) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'purple':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'amber':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'indigo':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'rose':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      default:
        return 'bg-sky-950 text-sky-300 border-sky-800';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <UserCog className="w-7 h-7 text-sky-400" /> Operational Staff & Team Directories
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>Technical, Production, Programming, and Inventory teams management</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                canManageTeams
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {canManageTeams ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Role: {userRole} (Full Access)
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-amber-400" /> Role: {userRole} (View Only)
                </>
              )}
            </span>
          </p>
        </div>

        {/* ADD TEAM MEMBER BUTTON */}
        {canManageTeams && activeTab !== 'ROLES' && (
          <button
            onClick={() => {
              resetForm();
              setNewModalOpen(true);
            }}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </button>
        )}

        {/* CREATE ROLE BUTTON FOR ROLES TAB */}
        {canManageTeams && activeTab === 'ROLES' && (
          <button
            onClick={() => setCreateRoleModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Custom Role
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-4 overflow-x-auto scrollbar-none">
        {(['TECHNICAL', 'PRODUCTION', 'PROGRAMMING', 'INVENTORY'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t} TEAM ({teams[t.toLowerCase()]?.length || 0})
          </button>
        ))}

        {/* SUPER ADMIN ROLES & PERMISSIONS TAB */}
        {userRole === 'SUPER ADMIN' && (
          <button
            onClick={() => setActiveTab('ROLES')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ROLES'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-purple-400/80 hover:text-purple-300'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-400" /> ROLES & ACCESS MATRIX ({rolesList.length})
          </button>
        )}
      </div>

      {/* TAB CONTENT 1: MEMBER DIRECTORIES */}
      {activeTab !== 'ROLES' && (
        <>
          {/* Search Bar */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 flex-1 focus-within:border-sky-500">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Filter ${activeTab.toLowerCase()} team members by name, role, organisation, or email...`}
                className="bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Team Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" /> Loading Teams...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 glass-card rounded-2xl">
              <p className="text-sm font-semibold">No members found in {activeTab} TEAM matching query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMembers.map((member: any) => {
                const isNewlyAdded = member.id === newlyAddedId;
                return (
                  <div
                    key={member.id}
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
                    <div className="flex flex-col h-full justify-between space-y-3">
                      <div>
                        {member.photo ? (
                          <div className="relative mb-3 group-hover:scale-[1.02] transition-transform">
                            <img src={member.photo} alt={member.name} className="w-full aspect-square rounded-xl object-cover border border-slate-700/80 shadow-md" />
                          </div>
                        ) : (
                          <div className="w-full aspect-square rounded-xl bg-slate-800 text-slate-300 font-bold text-2xl flex items-center justify-center mb-3 border border-slate-700 shadow-md">
                            {member.name.charAt(0)}
                          </div>
                        )}

                        <div className="space-y-1.5 text-xs">
                          <div>
                            <h3 className="font-bold text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-1 text-sm">
                              {member.name}
                            </h3>
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                              {member.role || 'Staff Member'}
                            </span>
                          </div>

                          <p className="text-slate-400 text-[11px] truncate">{member.organisation || 'Serendipity Arts'}</p>

                          <div className="text-sky-400 pt-1 space-y-0.5 text-[11px]">
                            {member.email && <p className="truncate" title={member.email}>📧 {member.email}</p>}
                            {member.phone && <p>📞 {member.phone}</p>}
                          </div>

                          {member.skills && <p className="text-[11px] text-sky-400 italic pt-1 line-clamp-2">Skills: {member.skills}</p>}
                          {member.responsibilities && (
                            <p className="text-[11px] text-amber-400 italic pt-1 line-clamp-2">Resp: {member.responsibilities}</p>
                          )}

                          {/* PROGRAMMING TEAM (ARTIST POC) ASSIGNMENTS */}
                          {activeTab === 'PROGRAMMING' && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-indigo-400" /> Artists POC:
                                </span>
                                {canManageTeams && (
                                  <button
                                    onClick={() => openAssignArtistModal(member)}
                                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
                                  >
                                    + Edit
                                  </button>
                                )}
                              </div>
                              {member.artistAssignments && member.artistAssignments.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {member.artistAssignments.map((assignment: any) => (
                                    <span
                                      key={assignment.id || assignment.artistId}
                                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-200 border border-indigo-800/60 truncate max-w-full"
                                      title={assignment.artist?.artistName}
                                    >
                                      🎨 {assignment.artist?.artistName || 'Artist'}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-500 italic">No artists assigned.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* EDIT & DELETE BUTTONS */}
                      {canManageTeams && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-800/80">
                          {activeTab === 'PROGRAMMING' && (
                            <button
                              onClick={() => openAssignArtistModal(member)}
                              className="w-full bg-indigo-950/80 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-semibold py-1 px-2 rounded-lg border border-indigo-700/60 transition-all flex items-center justify-center gap-1"
                              title="Assign Artists to POC"
                            >
                              <UserCheck className="w-3 h-3" /> Assign Artists
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(member)}
                            className="flex-1 bg-slate-800/90 hover:bg-sky-600 hover:text-white text-sky-400 text-[11px] font-semibold py-1 px-2 rounded-lg border border-sky-500/30 transition-all flex items-center justify-center gap-1"
                            title="Edit Member Information"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(member)}
                            className="bg-red-950/80 hover:bg-red-600 text-red-400 hover:text-white text-[11px] font-semibold py-1 px-2 rounded-lg border border-red-800/60 transition-all flex items-center justify-center gap-1"
                            title="Delete Member"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT 2: SUPER ADMIN ROLES & PERMISSION MATRIX */}
      {activeTab === 'ROLES' && userRole === 'SUPER ADMIN' && (
        <div className="space-y-6">
          {/* Header Description */}
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" /> System Roles & Access Control Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Configure menu component visibility, data viewing rights, creation/edit privileges, and delete permissions per role.
              </p>
            </div>

            <button
              onClick={() => setCreateRoleModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> Create Custom Role
            </button>
          </div>

          {/* Role Selection Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {rolesList.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              const viewCount = Object.values(role.permissions).filter((p) => p.canView).length;
              const editCount = Object.values(role.permissions).filter((p) => p.canEdit).length;

              return (
                <button
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)] ring-2 ring-purple-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${getBadgeStyle(role.badgeColor)}`}>
                        {role.name}
                      </span>
                      {!role.isSystem && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.2 rounded">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{role.description}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-sky-400" /> {viewCount} Views
                    </span>
                    <span className="flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-emerald-400" /> {editCount} Edits
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* PERMISSION MATRIX EDITOR FOR SELECTED ROLE */}
          {selectedRole && (
            <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-800/80 text-purple-400">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                      Permissions Matrix for <span className="text-purple-300">{selectedRole.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedRole.description}</p>
                  </div>
                </div>

                {/* Preset Controls & Save */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleApplyPreset('ALL')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[11px] font-bold hover:bg-emerald-900 transition-all flex items-center gap-1"
                    title="Grant full access to all components"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Full Access
                  </button>
                  <button
                    onClick={() => handleApplyPreset('READ_ONLY')}
                    className="px-3 py-1.5 rounded-xl bg-sky-950/80 text-sky-300 border border-sky-800 text-[11px] font-bold hover:bg-sky-900 transition-all flex items-center gap-1"
                    title="Make all components read-only"
                  >
                    <Eye className="w-3.5 h-3.5" /> Read-Only
                  </button>
                  <button
                    onClick={() => handleApplyPreset('RESET')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold hover:bg-slate-700 transition-all flex items-center gap-1"
                    title="Reset to default role template"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                  <button
                    onClick={handleSaveRolePermissions}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Save Role Access
                  </button>
                </div>
              </div>

              {roleSaveSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/80 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Role access permissions saved & updated live across system!
                </div>
              )}

              {/* PERMISSION CATEGORIES MATRIX TABLE */}
              <div className="space-y-6">
                {(
                  ['OVERVIEW', 'CURATORIAL & PROGRAMMING', 'SPACES & PRODUCTION', 'INVENTORY & PROCUREMENT', 'INTEGRATIONS & GOVERNANCE'] as const
                ).map((cat) => {
                  const categoryModules = MODULE_DEFINITIONS.filter((m) => m.category === cat);
                  return (
                    <div key={cat} className="space-y-3">
                      <h4 className="text-xs font-extrabold tracking-wider text-purple-400 uppercase flex items-center gap-2 border-b border-slate-800/80 pb-2">
                        <Layers className="w-4 h-4 text-purple-400" /> {cat} COMPONENTS
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryModules.map((mod) => {
                          const perm = permissionMatrix[mod.id] || {
                            id: mod.id,
                            name: mod.name,
                            category: cat,
                            canView: true,
                            canEdit: false,
                            canDelete: false,
                          };

                          return (
                            <div
                              key={mod.id}
                              className={`p-4 rounded-xl border transition-all ${
                                perm.canView
                                  ? 'bg-slate-900/90 border-slate-700/80'
                                  : 'bg-slate-950/40 border-slate-900 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-xs text-slate-100 flex items-center gap-2">
                                  <Key className="w-3.5 h-3.5 text-sky-400" /> {mod.name}
                                </span>
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                    perm.canView ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {perm.canView ? 'Visible in Menu' : 'Hidden'}
                                </span>
                              </div>

                              {/* TOGGLE SWITCHES FOR VIEW, EDIT, DELETE */}
                              <div className="space-y-2 text-xs pt-1">
                                {/* VIEW TOGGLE */}
                                <label className="flex items-center justify-between cursor-pointer group">
                                  <span className="text-slate-300 text-[11px] font-medium flex items-center gap-1.5 group-hover:text-white">
                                    <Eye className="w-3.5 h-3.5 text-sky-400" /> View Menu & Data
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={perm.canView}
                                    onChange={() => handleTogglePermission(mod.id, 'canView')}
                                    className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                                  />
                                </label>

                                {/* EDIT TOGGLE */}
                                <label className="flex items-center justify-between cursor-pointer group">
                                  <span className="text-slate-300 text-[11px] font-medium flex items-center gap-1.5 group-hover:text-white">
                                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" /> Create & Edit Buttons
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={perm.canEdit}
                                    onChange={() => handleTogglePermission(mod.id, 'canEdit')}
                                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                                  />
                                </label>

                                {/* DELETE TOGGLE */}
                                <label className="flex items-center justify-between cursor-pointer group">
                                  <span className="text-slate-300 text-[11px] font-medium flex items-center gap-1.5 group-hover:text-white">
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete Privileges
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={perm.canDelete}
                                    onChange={() => handleTogglePermission(mod.id, 'canDelete')}
                                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
              <h3 className="text-lg font-black text-slate-50 tracking-wide">Team Record Updated!</h3>
              <p className="text-xs text-emerald-300 font-semibold mt-1">
                &ldquo;{addedMemberName}&rdquo; profile saved
              </p>
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM ROLE */}
      {createRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" /> Create Custom System Role
              </h3>
              <button onClick={() => setCreateRoleModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Role Title / Name *</label>
                <input
                  type="text"
                  value={newRoleData.name}
                  onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                  placeholder="e.g. SENIOR CURATOR, EXHIBITION AUDITOR"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none uppercase font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Role Description</label>
                <input
                  type="text"
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                  placeholder="e.g. Oversight of curatorial layouts & artwork allocations"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Base Template Role</label>
                <select
                  value={newRoleData.templateRoleId}
                  onChange={(e) => setNewRoleData({ ...newRoleData, templateRoleId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.description})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Theme Color Badge</label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {(['sky', 'emerald', 'purple', 'amber', 'rose', 'indigo'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewRoleData({ ...newRoleData, badgeColor: color })}
                      className={`p-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                        newRoleData.badgeColor === color
                          ? 'ring-2 ring-purple-400 border-purple-500 scale-105'
                          : 'border-slate-800 hover:border-slate-700'
                      } ${getBadgeStyle(color)}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setCreateRoleModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomRole}
                disabled={!newRoleData.name.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create & Configure Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW TEAM MEMBER */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Add New Team Member</h3>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Target Team *</label>
                  <select
                    value={formData.teamType}
                    onChange={(e) => {
                      const newTeam = e.target.value as any;
                      const defaultRole =
                        newTeam === 'TECHNICAL'
                          ? 'TECHNICAL TEAM'
                          : newTeam === 'PRODUCTION'
                          ? 'PRODUCTION TEAM'
                          : newTeam === 'PROGRAMMING'
                          ? 'PROGRAMMING TEAM'
                          : 'INVENTORY TEAM';
                      setFormData({ ...formData, teamType: newTeam, systemRole: defaultRole });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="TECHNICAL">TECHNICAL TEAM</option>
                    <option value="PRODUCTION">PRODUCTION TEAM</option>
                    <option value="PROGRAMMING">PROGRAMMING TEAM</option>
                    <option value="INVENTORY">INVENTORY TEAM</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold text-sky-400">System Role Rights *</label>
                  <select
                    value={formData.systemRole}
                    onChange={(e) => setFormData({ ...formData, systemRole: e.target.value })}
                    className="w-full bg-slate-950 border border-sky-500/60 rounded-xl px-3 py-2 text-sky-200 font-bold focus:border-sky-400 focus:outline-none"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Member Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <ImageUploadInput
                label="Member Photo Image"
                value={formData.photo}
                onChange={(url) => setFormData({ ...formData, photo: url })}
                placeholder="https://... or upload local image file"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Job Designation Title</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Technical Head"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Organisation</label>
                  <input
                    type="text"
                    value={formData.organisation}
                    onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                    placeholder="e.g. SAF Festival Team"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="s.jenkins@saf.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+44 7700 900077"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              {formData.teamType === 'TECHNICAL' ? (
                <div>
                  <label className="text-slate-400 block mb-1">Technical Skills / Expertise</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="e.g. Video Projection, Dante Audio, DMX Lighting"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-slate-400 block mb-1">Responsibilities</label>
                  <input
                    type="text"
                    value={formData.responsibilities}
                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                    placeholder="e.g. Venue setup, Logistics management"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              )}

              {/* ASSIGNED EVENTS (MULTI-EVENT ACCESS SELECTION) */}
              {canManageTeams && allEvents.length > 0 && (
                <div>
                  <label className="text-slate-400 font-medium block mb-1 flex items-center justify-between">
                    <span>Assigned Events Access</span>
                    <span className="text-[10px] text-sky-400 font-bold">★ Select Multiple Events</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto">
                    {allEvents.map((evt) => {
                      const isChecked = formData.eventIds.includes(evt.id);
                      return (
                        <label
                          key={evt.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-sky-950/60 border-sky-500/60 text-sky-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, eventIds: [...formData.eventIds, evt.id] });
                              } else {
                                setFormData({ ...formData, eventIds: formData.eventIds.filter((id) => id !== evt.id) });
                              }
                            }}
                            className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                          />
                          <div className="truncate text-xs">
                            <span className="font-bold block truncate">{evt.name}</span>
                            <span className="text-[10px] text-slate-500">{evt.year} ({evt.status})</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
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
                onClick={handleCreateMember}
                disabled={submitting}
                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                {submitting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : 'Create Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEAM MEMBER */}
      {editModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" /> Edit Member: {editingMember.name}
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
                <label className="text-slate-400 block mb-1">Member Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold text-sky-400">System Role Access Rights *</label>
                <select
                  value={editFormData.systemRole}
                  onChange={(e) => setEditFormData({ ...editFormData, systemRole: e.target.value })}
                  className="w-full bg-slate-950 border border-sky-500/60 rounded-xl px-3 py-2 text-sky-200 font-bold focus:border-sky-400 focus:outline-none"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <ImageUploadInput
                label="Member Photo Image"
                value={editFormData.photo}
                onChange={(url) => setEditFormData({ ...editFormData, photo: url })}
                placeholder="https://... or upload local image file"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Role / Designation</label>
                  <input
                    type="text"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Organisation</label>
                  <input
                    type="text"
                    value={editFormData.organisation}
                    onChange={(e) => setEditFormData({ ...editFormData, organisation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
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

              {/* ASSIGNED EVENTS ACCESS */}
              {canManageTeams && allEvents.length > 0 && (
                <div>
                  <label className="text-slate-400 font-medium block mb-1 flex items-center justify-between">
                    <span>Assigned Events Access</span>
                    <span className="text-[10px] text-sky-400 font-bold">★ Select Multiple Events</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto">
                    {allEvents.map((evt) => {
                      const isChecked = editFormData.eventIds.includes(evt.id);
                      return (
                        <label
                          key={evt.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-sky-950/60 border-sky-500/60 text-sky-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditFormData({ ...editFormData, eventIds: [...editFormData.eventIds, evt.id] });
                              } else {
                                setEditFormData({ ...editFormData, eventIds: editFormData.eventIds.filter((id) => id !== evt.id) });
                              }
                            }}
                            className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                          />
                          <div className="truncate text-xs">
                            <span className="font-bold block truncate">{evt.name}</span>
                            <span className="text-[10px] text-slate-500">{evt.year}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
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
                onClick={handleUpdateMember}
                disabled={submitting}
                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                {submitting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE TEAM MEMBER CONFIRMATION */}
      {deleteModalOpen && deletingMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-slate-100">Delete Member</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove <span className="font-bold text-white">&ldquo;{deletingMember.name}&rdquo;</span> from {activeTab} TEAM?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GENERATED CREDENTIALS NOTIFICATION MODAL */}
      {generatedCreds && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-500/50 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sky-400" /> Member Portal Account Created
              </h3>
              <button onClick={() => setGeneratedCreds(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <p className="text-slate-400">
                A live login account was automatically generated for this team member:
              </p>
              <div className="space-y-1 font-mono text-sky-300 pt-1">
                <p>Username: <span className="text-white font-bold">{generatedCreds.username}</span></p>
                <p>Password: <span className="text-white font-bold">{generatedCreds.password}</span></p>
                <p>System Role: <span className="text-emerald-400 font-bold">{generatedCreds.role}</span></p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setGeneratedCreds(null)}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
