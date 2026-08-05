export interface LoginRequestDto {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface LoginConfigDto {
  requiresTenantSlug: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors: string | null;
  timestamp: string;
}

export interface LoginTokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  refreshTokenExpiresAtUtc: string;
}

export interface TenantBrandingDto {
  title: string | null;
  logoUrl: string | null;
  tagline: string | null;
}

export interface LoginResultDto {
  tokens: LoginTokenData;
  branding: TenantBrandingDto;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  refreshTokenExpiresAtUtc: string;
}

export interface RegisterRequestDto {
  fullName: string;
  email: string;
  password: string;
  roles: string[];
}

export interface RegisterResponseDto {
  user: {
    id: number;
    fullName: string;
    email: string;
    isActive: boolean;
    roles: string[];
  };
}
