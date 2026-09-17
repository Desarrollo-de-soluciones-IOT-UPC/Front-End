import { Role, RoleApiValue } from './role';
import { UserStatus } from './user-status';

export interface User {
  id: number;
  name: string;
  initials: string;
  joinDate: string;
  role: Role;
  email: string;
  status: UserStatus;
  phone?: string;
  location?: string;
  address?: string;
  specialty?: string;
  department?: string;
  notes?: string;
  clientType?: string;
  taxId?: string;
  industry?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

/** Perfil del usuario autenticado (`GET /api/users/profile`). */
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  initials: string;
  phone: string;
  location: string;
  joinDate: string;
  status: string;
}

export interface CreateUserPayload {
  name: string;
  initials?: string;
  email: string;
  password: string;
  role: RoleApiValue;
  phone?: string;
  location?: string;
  specialty?: string;
  department?: string;
  status?: string;
  notes?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  specialty?: string;
  department?: string;
  status?: string;
  notes?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  clientType?: string;
  taxId?: string;
  industry?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
