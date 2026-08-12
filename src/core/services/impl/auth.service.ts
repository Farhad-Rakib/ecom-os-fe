import { BaseRepository } from '../../api/base.repository';
import { LoginConfigDto, LoginRequestDto, LoginResultDto, RefreshTokenResponseDto, RegisterRequestDto, RegisterResponseDto, ApiResponse, TenantBrandingDto } from '../../../domain/dto/auth.dto';
import { IAuthService } from '../auth.service.interface';

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ChangePasswordRequestDto {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

export class AuthService extends BaseRepository implements IAuthService {
  constructor() {
    super('/Auth');
  }

  async getLoginConfig(): Promise<LoginConfigDto> {
    const response = await this.get<ApiResponse<LoginConfigDto>>('/login-config');
    if (!response.success) {
      throw new Error(response.message || 'Failed to load login config');
    }
    return response.data;
  }

  async getBranding(): Promise<TenantBrandingDto> {
    const response = await this.get<ApiResponse<TenantBrandingDto>>('/branding');
    if (!response.success) {
      throw new Error(response.message || 'Failed to load branding');
    }
    return response.data;
  }

  async login(dto: LoginRequestDto): Promise<LoginResultDto> {
    const response = await this.post<ApiResponse<LoginResultDto>>('/login', dto);
    if (!response.success) {
      throw new Error(response.message || 'Login failed');
    }
    return response.data;
  }

  async register(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    const response = await this.post<ApiResponse<RegisterResponseDto>>('/register', dto);
    if (!response.success) {
      throw new Error(response.message || 'Registration failed');
    }
    return response.data;
  }

  async logout(): Promise<void> {
    // No backend logout endpoint -- handled locally by clearing the store
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
    const response = await this.post<ApiResponse<RefreshTokenResponseDto>>('/refresh', { refreshToken });
    if (!response.success) {
      throw new Error(response.message || 'Token refresh failed');
    }
    return response.data;
  }

  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<string> {
    const response = await this.post<ApiResponse<{ message: string }>>('/forgot-password', dto);
    if (!response.success) {
      throw new Error(response.message || 'Failed to send reset email');
    }
    return response.data?.message || 'Reset link sent';
  }

  async changePassword(dto: ChangePasswordRequestDto): Promise<void> {
    const response = await this.post<ApiResponse<any>>('/change-password', dto);
    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  }
}
