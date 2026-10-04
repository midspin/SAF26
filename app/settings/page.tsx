'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Users,
  Lock,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  X,
  User,
  KeyRound,
  Mail,
  Sparkles,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'PERMISSIONS' | 'USERS'>('USERS');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const isSuperAdmin = (userRole || '').trim().toUpperCase() === 'SUPER ADMIN';

  // Modal States
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [editUserModal, setEditUserModal] = useState<any | null>(null);
  const [deleteUserModal, setDeleteUserModal] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: 'password',
    email: '',
    role: 'PROGRAMMING',
    department: 'Programming',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'PROGRAMMING TEAM',
    department: 'Programming',
  });

  const rolesList = [
    'SUPER ADMIN',
    'TECHNICAL TEAM',
    'PRODUCTION TEAM',
    'PROGRAMMING TEAM',
    'SPATIAL DESIGNER',
    'INSTALLATION TEAM',
    'INVENTORY TEAM',
    'VIEWER',
  ];

  const rolesPermissions = [
    { role: 'SUPER ADMIN', desc: 'Full unrestricted access to all multi-event operations, inventory, and user management', access: 'All Modules' },
    { role: 'TECHNICAL TEAM', desc: 'Technical specifications, equipment allocations, live stock assignment, and installations', access: 'Technical Specs & Inventory' },
    { role: 'PRODUCTION TEAM', desc: 'Production requirements, venues, rooms, installations, and fabrication logistics', access: 'Spaces & Production' },
    { role: 'PROGRAMMING TEAM', desc: 'Festival schedule, artist programming assignments, curators, and artworks', access: 'Curatorial & Programming' },
    { role: 'SPATIAL DESIGNER', desc: '3D spatial design, venue/room floorplans, exhibition layout & installations', access: 'Spaces & Layouts' },
    { role: 'INSTALLATION TEAM', desc: 'On-site artwork installation setup, technical installation tracking & room readiness', access: 'Installations & Venues' },
    { role: 'INVENTORY TEAM', desc: 'Master inventory pool, Excel migration wizard, live stock assignments, and procurement', access: 'Master Inventory & Procurement' },
    { role: 'VIEWER', desc: 'Read-only access across exhibition dashboards', access: 'Read Only' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.username || !formData.email) {
      alert('Name, Username, and Email are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setNewUserModalOpen(false);
        setFormData({
          name: '',
          username: '',
          password: 'password',
          email: '',
          role: 'PROGRAMMING',
          department: 'Programming',
        });
        fetchUsers();
      } else {
        alert(data.error || 'Failed to create user.');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const openEditUserModal = (u: any) => {
    setEditUserModal(u);
    setEditFormData({
      name: u.name || '',
      username: u.username || '',
      password: '',
      email: u.email || '',
      role: u.role || 'VIEWER',
      department: u.department || 'General',
    });
  };

  const handleUpdateUser = async () => {
    if (!editUserModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editUserModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (data.success) {
        setEditUserModal(null);
        fetchUsers();
      } else {
        alert(data.error || 'Failed to update user.');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${deleteUserModal.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteUserModal(null);
        fetchUsers();
      } else {
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-sky-400" /> Settings & User Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage user authentication profiles, role-based permissions (RBAC), and user credentials
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-[#232334] p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'USERS'
                ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> User Accounts ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'PERMISSIONS'
                ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Roles Matrix
          </button>
        </div>
      </div>

      {/* USER ACCOUNTS TAB */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[#1c1c2a] p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" /> System Users & Credentials Directory
              </h3>
              <p className="text-xs text-slate-400">
                Active login profiles for festival managers, technical leads, and operational curators
              </p>
            </div>
            {isSuperAdmin ? (
              <button
                onClick={() => setNewUserModalOpen(true)}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Create New User
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-xl">
                <Lock className="w-3.5 h-3.5" />
                <span>Super Admin Only</span>
              </div>
            )}
          </div>

          {!isSuperAdmin && (
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/50 flex items-center gap-3 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <strong>Notice:</strong> Creating, editing, and deleting login user accounts is restricted to{' '}
                <span className="font-bold underline text-amber-300">SUPER ADMIN</span>.
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <Sparkles className="w-6 h-6 text-sky-400 animate-spin mx-auto mb-2" />
              Loading Users...
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1c1c2a] text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">User Details</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Department</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-100">{u.name}</p>
                              <p className="text-[11px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-sky-300 font-semibold">
                          @{u.username || u.email.split('@')[0]}
                        </td>
                        <td className="p-4">
                          <span className="font-bold px-2.5 py-1 rounded-full bg-sky-950 text-sky-300 border border-sky-800 text-[11px] inline-block">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">{u.department || 'General'}</td>
                        <td className="p-4 text-right">
                          {isSuperAdmin ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditUserModal(u)}
                                title="Edit User"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {u.username !== 'Admin' && (
                                <button
                                  onClick={() => setDeleteUserModal(u)}
                                  title="Delete User"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 italic text-[11px]">Read Only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ROLES MATRIX TAB */}
      {activeTab === 'PERMISSIONS' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> System Roles & Access Matrix
          </h3>

          <div className="space-y-3">
            {rolesPermissions.map((r) => (
              <div key={r.role} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{r.role}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      {r.access}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{r.desc}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {newUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-400" /> Create New Login User
              </h3>
              <button onClick={() => setNewUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rachel Green"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. rachel_green"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Password *</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rachel@saf2026.org"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Technical"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setNewUserModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={saving}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" /> Edit User Profile
              </h3>
              <button onClick={() => setEditUserModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Username *</label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Update Password (optional)</label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Leave blank to keep existing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Email Address *</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Assigned Role *</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  >
                    {rolesList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Department</label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditUserModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={saving}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all"
              >
                {saving ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE USER CONFIRMATION */}
      {deleteUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/50 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Delete User Account</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete user{' '}
                <span className="font-bold text-slate-200">
                  {deleteUserModal.name} (@{deleteUserModal.username})
                </span>
                ? This user will no longer be able to log in.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteUserModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={saving}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-rose-600/20"
              >
                {saving ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
