import { MenuItem } from '../models/menu.model';
import { ApiResponse } from './auth.dto';

export type GetMenuResponseDto = MenuItem[];
export type GetMenuApiResponse = ApiResponse<MenuItem[]>;
