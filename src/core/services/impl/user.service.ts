import { BaseRepository } from '../../api/base.repository';
import { PaginatedResponse } from '../../api/http.types';
import { User, UserProfile } from '../../../domain/models/user.model';
import { GetUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto, GetUserProfileApiResponse } from '../../../domain/dto/user.dto';
import { IUserService } from '../user.service.interface';

export class UserService extends BaseRepository implements IUserService {
  constructor() {
    super('/Users');
  }

  async getUsers(dto?: GetUsersRequestDto): Promise<PaginatedResponse<User>> {
    return this.get<PaginatedResponse<User>>('', { params: dto });
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.get<User>(`/${id}`);
  }

  async getMe(): Promise<UserProfile> {
    const response = await this.get<GetUserProfileApiResponse>('/me');
    if (!response.success) {
      throw new Error(response.message || 'Failed to load profile');
    }
    return response.data;
  }

  async updateMe(dto: { fullName: string; email: string; profileImageUrl: string }): Promise<UserProfile> {
    const response = await this.put<GetUserProfileApiResponse>('/me', dto);
    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }
    return response.data;
  }

  async createUser(dto: CreateUserRequestDto): Promise<User> {
    return this.post<User>('', dto);
  }

  async updateUser(id: string, dto: UpdateUserRequestDto): Promise<User> {
    return this.put<User>(`/${id}`, dto);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete<void>(`/${id}`);
  }
}
