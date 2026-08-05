import { GetDashboardResponseDto } from '../../domain/dto/dashboard.dto';

export interface IDashboardService {
  getDashboardData(): Promise<GetDashboardResponseDto>;
}
