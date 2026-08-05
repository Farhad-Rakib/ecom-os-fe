import { BaseRepository } from '../base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface SiteSettingDto {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
}

class SiteSettingsApi extends BaseRepository {
  constructor() {
    super('/SiteSettings');
  }

  async getAll(): Promise<SiteSettingDto[]> {
    const res = await this.get<ApiResponse<SiteSettingDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getByKey(key: string): Promise<SiteSettingDto> {
    const res = await this.get<ApiResponse<SiteSettingDto>>(`/${key}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async create(dto: SiteSettingDto): Promise<SiteSettingDto> {
    const res = await this.post<ApiResponse<SiteSettingDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async remove(id: number): Promise<void> {
    const res = await this.delete<ApiResponse<any>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
  }
}

export const siteSettingsApi = new SiteSettingsApi();
