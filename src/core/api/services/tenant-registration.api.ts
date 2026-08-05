import { BaseRepository } from '../base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface TenantRegistrationInfoDto {
  tenantName: string;
  tenantSlug: string;
  alreadySubmitted: boolean;
}

export interface SubmitTenantRegistrationRequestDto {
  token: string;
  fullName: string;
  email: string;
  password: string;
}

class TenantRegistrationApi extends BaseRepository {
  constructor() {
    super('/tenant-registration');
  }

  async getInfo(token: string): Promise<TenantRegistrationInfoDto> {
    const res = await this.get<ApiResponse<TenantRegistrationInfoDto>>(`/${encodeURIComponent(token)}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async submit(dto: SubmitTenantRegistrationRequestDto): Promise<void> {
    const res = await this.post<ApiResponse<any>>('/submit', dto);
    if (!res.success) throw new Error(res.message);
  }
}

export const tenantRegistrationApi = new TenantRegistrationApi();
