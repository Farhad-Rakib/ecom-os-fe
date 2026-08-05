import { BaseRepository } from '../base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

// Matches the backend LicenseStatus enum order exactly (Domain/Enums/LicenseStatus.cs).
export enum LicenseStatus {
  Active = 0,
  Trial = 1,
  GracePeriod = 2,
  Expired = 3,
  Suspended = 4,
}

export interface TenantLicenseStatusDto {
  status: LicenseStatus;
}

// Self-scoped counterpart to the admin-only tenantApi in TenantsPage.tsx (which requires
// tenants.manage): "my own tenant", reachable by any authenticated tenant member. Backed by
// TenantSelfController (route api/v1/tenant, singular).
class TenantSelfApi extends BaseRepository {
  constructor() {
    super('/tenant');
  }

  async getLicenseStatus(): Promise<TenantLicenseStatusDto> {
    const res = await this.get<ApiResponse<TenantLicenseStatusDto>>('/license');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const tenantSelfApi = new TenantSelfApi();
