import { BaseRepository } from '../../api/base.repository';
import { GetDashboardResponseDto } from '../../../domain/dto/dashboard.dto';
import { IDashboardService } from '../dashboard.service.interface';

export class DashboardService extends BaseRepository implements IDashboardService {
  constructor() {
    super('/Dashboard');
  }

  async getDashboardData(): Promise<GetDashboardResponseDto> {
    return this.get<GetDashboardResponseDto>('');
  }
}
