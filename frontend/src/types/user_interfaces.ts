import { RoleName, EntityStatus } from './tenant_interfaces';

export interface UserCreate {
  email: string;
  username: string;
  display_name?: string;
  password: string;
  roles: RoleName[];
}

export interface UserUpdate {
  status?: EntityStatus;
  roles?: RoleName[];
}

export interface UserSummary {
  id: string;
  username: string;
  display_name?: string;
  status: EntityStatus;
  roles: RoleName[];
}
