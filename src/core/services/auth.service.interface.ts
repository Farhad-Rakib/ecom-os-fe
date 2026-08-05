import { LoginConfigDto, LoginRequestDto, LoginResultDto, RefreshTokenResponseDto, RegisterRequestDto, RegisterResponseDto } from '../../domain/dto/auth.dto';

export interface IAuthService {
  getLoginConfig(): Promise<LoginConfigDto>;
  login(dto: LoginRequestDto): Promise<LoginResultDto>;
  register(dto: RegisterRequestDto): Promise<RegisterResponseDto>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<RefreshTokenResponseDto>;
}
