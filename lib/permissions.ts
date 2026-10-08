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
  { id: 'progress-tracker', name: 'Progress Tracker', category: 'OVERVIEW' },
  { id: 'events', name: 'Events', category: 'OVERVIEW' },
  { id: 'artists', name: 'Artists', category: 'CURATORIAL & PROGRAMMING' },
  { id: 'artworks', name: 'Artworks', category: 'CURATORIAL & PROGRAMMING' },
  { id: 'curators', name: 'Curators', category: 'CURATORIAL & PROGRAMMING' },
  { id: 'teams', name: 'Teams & Staff', category: 'CURATORIAL & PROGRAMMING' },
  { id: 'venues', name: 'Venues', category: 'SPACES & PRODUCTION' },
  { id: 'rooms', name: 'Rooms', category: 'SPACES & PRODUCTION' },
  { id: 'installations', name: 'Installations', category: 'SPACES & PRODUCTION' },
  { id: 'artist-docket', name: 'Artist Docket', category: 'SPACES & PRODUCTION' },
  { id: 'venue-tech-inventory', name: 'Venue Tech Inventory', category: 'INVENTORY & PROCUREMENT' },
  { id: 'inventory', name: 'Master Inventory Pool', category: 'INVENTORY & PROCUREMENT' },
  { id: 'import', name: 'Excel Migration Wizard', category: 'INVENTORY & PROCUREMENT' },
  { id: 'procurement', name: 'Purchase & Rentals', category: 'INVENTORY & PROCUREMENT' },
  { id: 'vendors', name: 'Vendors Directory', category: 'INVENTORY & PROCUREMENT' },
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
  ['dashboard', 'progress-tracker', 'events', 'venues', 'rooms', 'installations', 'artist-docket', 'venue-tech-inventory', 'inventory', 'procurement', 'vendors'].forEach((id) => {
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
  ['dashboard', 'progress-tracker', 'events', 'artists', 'venues', 'rooms', 'installations', 'artist-docket', 'venue-tech-inventory', 'inventory', 'procurement', 'vendors'].forEach((id) => {
    if (perm[id]) {
      perm[id].canView = true;
      perm[id].canEdit = true;
      perm[id].canDelete = false;
    }
  });
  return perm;
};

const progTeamPermissions = (): Record<string, ModulePermission> => {
  const perm: Record<string, ModulePermission> = {};
  MODULE_DEFINITIONS.forEach((mod) => {
    perm[mod.id] = { id: mod.id, name: mod.name, category: mod.category, canView: false, canEdit: false, canDelete: false };
  });

  // OVERVIEW: Hide progress Tracker & Events for Programming Team
  perm['dashboard'] = { id: 'dashboard', name: 'Dashboard', category: 'OVERVIEW', canView: true, canEdit: false, canDelete: false };
  perm['progress-tracker'] = { id: 'progress-tracker', name: 'Progress Tracker', category: 'OVERVIEW', canView: false, canEdit: false, canDelete: false };
  perm['events'] = { id: 'events', name: 'Events', category: 'OVERVIEW', canView: false, canEdit: false, canDelete: false };

  // CURATORIAL & PROGRAMMING: Hide Team & Staff for Programming Team
  perm['artists'] = { id: 'artists', name: 'Artists', category: 'CURATORIAL & PROGRAMMING', canView: true, canEdit: true, canDelete: true };
  perm['artworks'] = { id: 'artworks', name: 'Artworks', category: 'CURATORIAL & PROGRAMMING', canView: true, canEdit: true, canDelete: false };
  perm['curators'] = { id: 'curators', name: 'Curators', category: 'CURATORIAL & PROGRAMMING', canView: true, canEdit: true, canDelete: false };
  perm['teams'] = { id: 'teams', name: 'Teams & Staff', category: 'CURATORIAL & PROGRAMMING', canView: false, canEdit: false, canDelete: false };

  // SPACES & PRODUCTION
  perm['venues'] = { id: 'venues', name: 'Venues', category: 'SPACES & PRODUCTION', canView: true, canEdit: false, canDelete: false };
  perm['rooms'] = { id: 'rooms', name: 'Rooms', category: 'SPACES & PRODUCTION', canView: true, canEdit: false, canDelete: false };
  perm['artist-docket'] = { id: 'artist-docket', name: 'Artist Docket', category: 'SPACES & PRODUCTION', canView: true, canEdit: true, canDelete: true };

  // INVENTORY & PROCUREMENT: Hide Venue Tech inventory for Programming Team
  perm['venue-tech-inventory'] = { id: 'venue-tech-inventory', name: 'Venue Tech Inventory', category: 'INVENTORY & PROCUREMENT', canView: false, canEdit: false, canDelete: false };
  perm['inventory'] = { id: 'inventory', name: 'Master Inventory Pool', category: 'INVENTORY & PROCUREMENT', canView: true, canEdit: false, canDelete: false };
  
  return perm;
};

const invTeamPermissions = (): Record<string, ModulePermission> => {
  const perm = readOnlyPermissions();
  ['dashboard', 'progress-tracker', 'inventory', 'import', 'procurement', 'vendors', 'artist-docket'].forEach((id) => {
    if (perm[id]) {
      perm[id].canView = true;
      perm[id].canEdit = true;
      perm[id].canDelete = true;
    }
  });
  return perm;
};

const spatialDesignerPermissions = (): Record<string, ModulePermission> => {
  const perm = readOnlyPermissions();
  ['dashboard', 'progress-tracker', 'events', 'artists', 'artworks', 'venues', 'rooms', 'installations', 'artist-docket'].forEach((id) => {
    if (perm[id]) {
      perm[id].canView = true;
      perm[id].canEdit = true;
      perm[id].canDelete = false;
    }
  });
  return perm;
};

const techLayoutDesignerPermissions = (): Record<string, ModulePermission> => {
  const perm = readOnlyPermissions();
  ['dashboard', 'progress-tracker', 'events', 'artists', 'artworks', 'venues', 'rooms', 'installations', 'artist-docket', 'inventory'].forEach((id) => {
    if (perm[id]) {
      perm[id].canView = true;
      perm[id].canEdit = true;
      perm[id].canDelete = id === 'rooms';
    }
  });
  return perm;
};

const installationTeamPermissions = (): Record<string, ModulePermission> => {
  const perm = readOnlyPermissions();
  ['dashboard', 'progress-tracker', 'events', 'artists', 'artworks', 'venues', 'rooms', 'installations', 'artist-docket', 'inventory'].forEach((id) => {
    if (perm[id]) {
      perm[id].canView = true;
      perm[id].canEdit = true;
      perm[id].canDelete = false;
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
    id: 'SPATIAL DESIGNER',
    name: 'SPATIAL DESIGNER',
    description: 'Spatial & exhibition design focus: room space planning, 3D layouts, venues & artist installations.',
    badgeColor: 'purple',
    isSystem: true,
    permissions: spatialDesignerPermissions(),
  },
  {
    id: 'TECH LAYOUT DESIGNER',
    name: 'TECH LAYOUT DESIGNER',
    description: 'Technical layout & drawing focus: CAD/technical drawings, spatial layout diagrams, venue & room technical plans, and artist tech requirements.',
    badgeColor: 'sky',
    isSystem: true,
    permissions: techLayoutDesignerPermissions(),
  },
  {
    id: 'INSTALLATION TEAM',
    name: 'INSTALLATION TEAM',
    description: 'On-site installation focus: artwork setup, venue & room readiness, technical installation tracking & status updates.',
    badgeColor: 'emerald',
    isSystem: true,
    permissions: installationTeamPermissions(),
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
