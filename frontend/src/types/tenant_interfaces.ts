import { ResourceType, ActionType } from "../auth/RoleGuard";

export const STATUS_OPTIONS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    ARCHIVED: 'archived',
} as const;
export type EntityStatus = typeof STATUS_OPTIONS[keyof typeof STATUS_OPTIONS];

export const ROLE_NAME = {
    ADMIN: 'admin',
    EDITOR: 'editor',
    USER: 'user',
    GUEST: 'guest',
} as const;
export type RoleName = typeof ROLE_NAME[keyof typeof ROLE_NAME];

export const PLAN_NAME = {
    BASIC: 'basic',
    PREMIUM: 'premium',
    ENTERPRISE: 'enterprise',
} as const;
export type PlanName = typeof PLAN_NAME[keyof typeof PLAN_NAME];

export const CELL_ID = {
    DEFAULT: 'cell-default',
    EU: 'cell-eu',
} as const;
export type CellID = typeof CELL_ID[keyof typeof CELL_ID];

export interface TenantBrandingConfig {
    logo_url: string | null;
    header_video_url: string | null;
    heading_text: string;
    subheading_text: string;
    primary_hex_color: string;
}

export interface TenantRolePermissions {
  role: RoleName;
  permissions: Record<ResourceType, ActionType[]>;
}

export interface Tenant {
  id: string;
  external_sys_id?: string;
  name: string;
  slug: string;
  cell_id: CellID;
  status: EntityStatus;
  plan: PlanName;
  branding_config: TenantBrandingConfig;  
  role_permissions: TenantRolePermissions[];
  created_at: string; // ISO string for datetime
  updated_at: string; // ISO string for datetime
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: EntityStatus;
  plan: PlanName;
}

export interface TenantCreate{    
    name: string;
    slug: string;
    cell_id: CellID;
    plan: PlanName;
    branding_config?: TenantBrandingConfig;
}

/**
 * Updating an existing tenant by SUPERADMIN.
 */
export interface TenantUpdate{    
    tenant_id: string;
    name?: string;
    slug?: string;
    cell_id?: CellID
    status?: EntityStatus
    plan?: PlanName
}

/**
 * Updating/Customising tenant settings by TENANT ADMIN.
 */
export interface TenantSettings{    
    tenant_id: string;
    branding_config?: TenantBrandingConfig;
    role_permissions?: TenantRolePermissions[];
}