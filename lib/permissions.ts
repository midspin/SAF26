export interface ModulePermission {
  id: string;
  name: string;
  category: 'OVERVIEW' | 'CURATORIAL & PROGRAMMING' | 'SPACES & PRODUCTION' | 'INVENTORY & PROCUREMENT' | 'INTEGRATIONS & GOVERNANCE';
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  badgeColor: 'sky' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo';
  isSystem?: boolean;
  permissions: Record<string, ModulePermission>;
}

export const MODULE_DEFINITIONS: { id: string; name: string; category: ModulePermission['category'] }[] = [
  { id: 'dashboard', name: 'Dashboard', category: 'OVERVIEW' },
  { id: 'events', name: 'Events', category: 'OVERVIEW' },
  { id: 'artists', name: 'Artists', category: 'CURATORIAL & PROGRAMMING' },
  { id: 'artworks', name: 'Artworks', category: 'CURATORIAL & PROGRAMMING' },
  { id: 'curators', name: 'Curators', category: 'CURATORIAL & PROGRAMMING' },
  { id: 'teams', name: 'Teams & Staff', category: 'CURATORIAL & PROGRAMMING' },
  { id: 'venues', name: 'Venues', category: 'SPACES & PRODUCTION' },
  { id: 'rooms', name: 'Rooms', category: 'SPACES & PRODUCTION' },
  { id: 'installations', name: 'Installations', category: 'SPACES & PRODUCTION' },
  { id: 'inventory', name: 'Master Inventory Pool', category: 'INVENTORY & PROCUREMENT' },
  { id: 'import', name: 'Excel Migration Wizard', category: 'INVENTORY & PROCUREMENT' },
  { id: 'procurement', name: 'Purchase & Rentals', category: 'INVENTORY & PROCUREMENT' },
  { id: 'vendors', name: 'Vendors Directory', category: 'INVENTORY & PROCUREMENT' },
  { id: 'google-sheets', name: 'Google Sheets 1-Way Sync', category: 'INTEGRATIONS & GOVERNANCE' },
  { id: 'reports', name: 'Reports & Analytics', category: 'INTEGRATIONS & GOVERNANCE' },
  { id: 'audit-logs', name: 'Audit Logs', category: 'INTEGRATIONS & GOVERNANCE' },
  { id: 'settings', name: 'Settings & Users', category: 'INTEGRATIONS & GOVERNANCE' },
];

const fullPermissions = (): Record<string, ModulePermission> => {
  const perm: Record<string, ModulePermission> = {};
  MODULE_DEFINITIONS.forEach((mod) => {
    perm[mod.id] = { id: mod.id, name: mod.name, category: mod.category, canView: true, canEdit: true, canDelete: true };
  });
  return perm;
};

const readOnlyPermissions = (): Record<string, ModulePermission> => {
  const perm: Record<string, ModulePermission> = {};
  MODULE_DEFINITIONS.forEach((mod) => {
    const isGov = mod.category === 'INTEGRATIONS & GOVERNANCE';
    perm[mod.id] = { id: mod.id, name: mod.name, category: mod.category, canView: !isGov, canEdit: false, canDelete: false };
  });
  return perm;
};

const techTeamPermissions = (): Record<string, ModulePermission> => {
  const perm = readOnlyPermissions();
  ['dashboard', 'events', 'venues', 'rooms', 'installations', 'inventory', 'procurement', 'vendors'].forEach((id) => {
    if (perm[id]) {
      perm[id].canView = true;
      perm[id].canEdit = true;
      perm[id].canDelete = false;
    }
  });
  return perm;
};

const prodTeamPermissions = (): Record<string, ModulePermission> => {
  const perm = readOnlyPermissions();
  ['dashboard', 'events', 'artists', 'venues', 'rooms', 'installations', 'inventory', 'procurement', 'vendors'].forEach((id) => {
    if (perm[id]) {
      perm[id].canView = true;
      perm[id].canEdit = true;
      perm[id].canDelete = false;
    }
  });
  return perm;
};

const progTeamPermissions = (): Record<string, ModulePermission> => {
  const perm = readOnlyPermissions();
  ['dashboard', 'events', 'artists', 'artworks', 'curators', 'teams', 'venues', 'rooms'].forEach((id) => {
    if (perm[id]) {
      perm[id].canView = true;
      perm[id].canEdit = true;
      perm[id].canDelete = false;
    }
  });
  return perm;
};

const invTeamPermissions = (): Record<string, ModulePermission> => {
  const perm = readOnlyPermissions();
  ['dashboard', 'inventory', 'import', 'procurement', 'vendors'].forEach((id) => {
    if (perm[id]) {
      perm[id].canView = true;
      perm[id].canEdit = true;
      perm[id].canDelete = true;
    }
  });
  return perm;
};

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'SUPER ADMIN',
    name: 'SUPER ADMIN',
    description: 'Full administrative access to all menus, components, buttons, and governance settings.',
    badgeColor: 'emerald',
    isSystem: true,
    permissions: fullPermissions(),
  },
  {
    id: 'TECHNICAL TEAM',
    name: 'TECHNICAL TEAM',
    description: 'Technical operations focus: AV, lighting, installations, tech requirements & equipment.',
    badgeColor: 'sky',
    isSystem: true,
    permissions: techTeamPermissions(),
  },
  {
    id: 'PRODUCTION TEAM',
    name: 'PRODUCTION TEAM',
    description: 'Production oversight: staging, space allocation, fabrication & material procurement.',
    badgeColor: 'purple',
    isSystem: true,
    permissions: prodTeamPermissions(),
  },
  {
    id: 'PROGRAMMING TEAM',
    name: 'PROGRAMMING TEAM',
    description: 'Curatorial & programming focus: artist liaisons, artwork details & curator assignments.',
    badgeColor: 'amber',
    isSystem: true,
    permissions: progTeamPermissions(),
  },
  {
    id: 'INVENTORY TEAM',
    name: 'INVENTORY TEAM',
    description: 'Inventory management focus: master asset pool, allocations, imports & vendor procurement.',
    badgeColor: 'indigo',
    isSystem: true,
    permissions: invTeamPermissions(),
  },
  {
    id: 'VIEWER',
    name: 'VIEWER',
    description: 'Read-only access to view non-sensitive schedules, directories, and exhibition layouts.',
    badgeColor: 'rose',
    isSystem: true,
    permissions: readOnlyPermissions(),
  },
];

const STORAGE_KEY = 'saf_custom_roles_v1';

export function getRoles(): RoleDefinition[] {
  if (typeof window === 'undefined') return DEFAULT_ROLES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_ROLES;
    const parsed: RoleDefinition[] = JSON.parse(saved);
    // Ensure default system roles are present
    const map = new Map<string, RoleDefinition>();
    DEFAULT_ROLES.forEach((r) => map.set(r.id, r));
    parsed.forEach((r) => map.set(r.id, r));
    return Array.from(map.values());
  } catch (e) {
    console.error('Error reading custom roles:', e);
    return DEFAULT_ROLES;
  }
}

export function saveRoles(roles: RoleDefinition[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
    window.dispatchEvent(new Event('saf-roles-updated'));
  } catch (e) {
    console.error('Error saving custom roles:', e);
  }
}

export function getRolePermissions(roleName: string): Record<string, ModulePermission> {
  const roles = getRoles();
  const normalized = (roleName || '').trim().toUpperCase();
  const found = roles.find((r) => r.name.toUpperCase() === normalized || r.id.toUpperCase() === normalized);
  if (found) return found.permissions;

  // Fallback to SUPER ADMIN if role is unknown or empty
  if (normalized === 'SUPER ADMIN' || !normalized) {
    return fullPermissions();
  }
  return readOnlyPermissions();
}

export function canUserViewModule(roleName: string, moduleId: string): boolean {
  if ((roleName || '').trim().toUpperCase() === 'SUPER ADMIN') return true;
  const perms = getRolePermissions(roleName);
  return perms[moduleId] ? perms[moduleId].canView : true;
}

export function canUserEditModule(roleName: string, moduleId: string): boolean {
  if ((roleName || '').trim().toUpperCase() === 'SUPER ADMIN') return true;
  const perms = getRolePermissions(roleName);
  return perms[moduleId] ? perms[moduleId].canEdit : false;
}

export function canUserDeleteModule(roleName: string, moduleId: string): boolean {
  if ((roleName || '').trim().toUpperCase() === 'SUPER ADMIN') return true;
  const perms = getRolePermissions(roleName);
  return perms[moduleId] ? perms[moduleId].canDelete : false;
}
