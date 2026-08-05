import { UserRole, UserStatus, UserProfile } from '../models/user.model';
import { ApiResponse } from './auth.dto';

export interface GetUsersRequestDto {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: UserStatus;
  role?: UserRole;
}

export interface CreateUserRequestDto {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  permissions: string[];
}

export interface UpdateUserRequestDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
  avatar?: string;
  permissions?: string[];
}

export type GetUserProfileApiResponse = ApiResponse<UserProfile>;
export type GetUserProfileResponseDto = UserProfile;
