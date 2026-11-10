export interface AdminUser {
  id: string;
  login: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  emailMasked: string | null;
  matricule: string | null;
  fonction: string | null;
  directionId: string | null;
  directionCode: string | null;
  isActive: boolean;
  isLocked: boolean;
  assignedDossiersCount: number;
  roles: string[];
}

export interface AdminUserPage {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminRole {
  key: string;
  name: string;
  description: string;
  scope: string;
  permissions: string[];
}

export interface UserQuery {
  search?: string;
  role?: string;
  directionId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  matricule: string;
  fonction: string;
  directionId: string;
  directionCode: string;
  roleKeys: string[];
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  matricule: string;
  fonction: string;
}

export interface UserDeactivationResult {
  assignedDossiersCount: number;
  reattributionTaskCreated: boolean;
}
