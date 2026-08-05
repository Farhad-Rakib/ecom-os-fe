import { BaseRepository } from '../base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface FeatureFlagDto {
  id: number;
  key: string;
  isEnabled: boolean;
  rolloutPercentage: number;
}

export interface SetFeatureFlagDto {
  key: string;
  isEnabled: boolean;
  rolloutPercentage: number;
}

class FeatureFlagsApi extends BaseRepository {
  constructor() {
    super('/feature-flags');
  }

  async getAll(): Promise<FeatureFlagDto[]> {
    const res = await this.get<ApiResponse<FeatureFlagDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async set(dto: SetFeatureFlagDto): Promise<FeatureFlagDto> {
    const res = await this.post<ApiResponse<FeatureFlagDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async remove(id: number): Promise<void> {
    const res = await this.delete<ApiResponse<any>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
  }
}

export const featureFlagsApi = new FeatureFlagsApi();
