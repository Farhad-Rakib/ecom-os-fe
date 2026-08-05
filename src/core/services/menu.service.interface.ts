import { GetMenuResponseDto } from '../../domain/dto/menu.dto';

export interface IMenuService {
  getMenuItems(): Promise<GetMenuResponseDto>;
  getAllMenuItems(): Promise<GetMenuResponseDto>;
}
