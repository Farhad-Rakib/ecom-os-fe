import { LoginConfigDto, LoginRequestDto, LoginResultDto, RefreshTokenResponseDto, RegisterRequestDto, RegisterResponseDto, TenantBrandingDto } from '../../domain/dto/auth.dto';

export interface IAuthService {
  getLoginConfig(): Promise<LoginConfigDto>;
  getBranding(): Promise<TenantBrandingDto>;
  login(dto: LoginRequestDto): Promise<LoginResultDto>;
  register(dto: RegisterRequestDto): Promise<RegisterResponseDto>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto>;
}
