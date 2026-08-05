import { BaseRepository } from '../../api/base.repository';
import { GetMenuResponseDto, GetMenuApiResponse } from '../../../domain/dto/menu.dto';
import { IMenuService } from '../menu.service.interface';

export class MenuService extends BaseRepository implements IMenuService {
  constructor() {
    super('/Menu');
  }

  async getMenuItems(): Promise<GetMenuResponseDto> {
    const response = await this.get<GetMenuApiResponse>('');
    if (!response.success) {
      throw new Error(response.message || 'Failed to load menu');
    }
    return response.data;
  }

  async getAllMenuItems(): Promise<GetMenuResponseDto> {
    const response = await this.get<GetMenuApiResponse>('/all');
    if (!response.success) {
      throw new Error(response.message || 'Failed to load menu');
    }
    return response.data;
  }
}
