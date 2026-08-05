import { PaginatedResponse } from '../api/http.types';
import { User, UserProfile } from '../../domain/models/user.model';
import { GetUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto } from '../../domain/dto/user.dto';

export interface IUserService {
  getUsers(dto?: GetUsersRequestDto): Promise<PaginatedResponse<User>>;
  getUserById(id: string): Promise<User | undefined>;
  getMe(): Promise<UserProfile>;
  updateMe(dto: { fullName: string; email: string; profileImageUrl: string }): Promise<UserProfile>;
  createUser(dto: CreateUserRequestDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserRequestDto): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
