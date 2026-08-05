export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
  profileImageUrl: string | null;
  roles: string[];
}
