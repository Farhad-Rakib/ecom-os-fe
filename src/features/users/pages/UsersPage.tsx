import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Mail, Eye } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

interface UserDto {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

interface RoleDto {
  id: number;
  name: string;
}

class UsersApi extends BaseRepository {
  constructor() { super('/Users'); }
  async getAll(): Promise<UserDto[]> {
    const res = await this.get<ApiResponse<UserDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async getById(id: number): Promise<UserDto> {
    const res = await this.get<ApiResponse<UserDto>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async updateRoles(userId: number, roleIds: number[]): Promise<UserDto> {
    const res = await this.put<ApiResponse<UserDto>>(`/${userId}/roles`, { roleIds });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

class AuthRegisterApi extends BaseRepository {
  constructor() { super('/Auth'); }
  async register(dto: { fullName: string; email: string; password: string; roles: string[] }): Promise<any> {
    const res = await this.post<ApiResponse<any>>('/register', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

class RolesListApi extends BaseRepository {
  constructor() { super('/roles'); }
  async getAll(): Promise<RoleDto[]> {
    const res = await this.get<ApiResponse<RoleDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

const usersApi = new UsersApi();
const authRegisterApi = new AuthRegisterApi();
const rolesListApi = new RolesListApi();

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<UserDto | null>(null);
  const [viewUser, setViewUser] = useState<UserDto | null>(null);

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => rolesListApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { fullName: string; email: string; password: string; roles: string[] }) =>
      authRegisterApi.register(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create user'),
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) =>
      usersApi.updateRoles(userId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User roles updated');
      setEditUser(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update roles'),
  });

  const getStatusBadge = (isActive: boolean) => (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
      isActive
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const getRoleBadges = (userRoles: string[]) => (
    <div className="flex flex-wrap gap-1">
      {userRoles.map((role) => (
        <span key={role} className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {role}
        </span>
      ))}
      {userRoles.length === 0 && <span className="text-xs text-gray-400">No roles</span>}
    </div>
  );

  const columns: Column<UserDto>[] = [
    {
      key: 'fullName',
      label: 'Name',
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.fullName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Mail className="w-3 h-3" />{user.email}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'roles', label: 'Roles', sortable: false, render: (_, user) => getRoleBadges(user.roles || []) },
    { key: 'isActive', label: 'Status', sortable: true, render: (_, user) => getStatusBadge(user.isActive) },
  ];

  const rowActions: RowAction<UserDto>[] = [
    { icon: Eye, label: 'View', onClick: (user) => setViewUser(user), variant: 'secondary' },
    { icon: Pencil, label: 'Edit Roles', onClick: (user) => setEditUser(user), variant: 'primary' },
  ];

  const createFields: FormField[] = [
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Enter password' },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: roles.map(r => ({ label: r.name, value: r.name })),
    },
  ];

  const editRoleFields: FormField[] = roles.length > 0 ? [
    {
      name: 'roleIds',
      label: 'Assign Roles',
      type: 'select',
      required: true,
      options: roles.map(r => ({ label: r.name, value: r.id })),
      defaultValue: roles.find(r => editUser?.roles?.includes(r.name))?.id || '',
    },
  ] : [];

  const handleCreate = (data: Record<string, any>) => {
    createMutation.mutate({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      roles: data.role ? [data.role] : [],
    });
  };

  const handleUpdateRoles = (data: Record<string, any>) => {
    if (!editUser) return;
    const roleIds = data.roleIds ? [Number(data.roleIds)] : [];
    updateRolesMutation.mutate({ userId: editUser.id, roleIds });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user accounts and access</p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search users by name or email..."
        emptyState={{ title: 'No users found', description: 'Create a new user to get started' }}
        actions={{ add: { label: 'Add User', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User" size="md">
        <DynamicForm
          fields={createFields}
          onSubmit={handleCreate}
          submitLabel="Create User"
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editUser !== null} onClose={() => setEditUser(null)} title="Edit User Roles" size="md">
        {editUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {editUser.fullName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{editUser.fullName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{editUser.email}</p>
              </div>
            </div>
            <DynamicForm
              key={editUser.id}
              fields={editRoleFields}
              onSubmit={handleUpdateRoles}
              submitLabel="Update Roles"
              onCancel={() => setEditUser(null)}
              isLoading={updateRolesMutation.isPending}
            />
          </div>
        )}
      </Modal>

      <Modal isOpen={viewUser !== null} onClose={() => setViewUser(null)} title="User Details" size="md">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-medium">
                  {viewUser.fullName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{viewUser.fullName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{viewUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <div className="mt-1">{getStatusBadge(viewUser.isActive)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Roles</p>
                <div className="mt-1">{getRoleBadges(viewUser.roles || [])}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
