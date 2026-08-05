import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, User } from 'lucide-react';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';

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
  description: string;
}

class UsersApi extends BaseRepository {
  constructor() { super('/Users'); }
  async getAll(): Promise<UserDto[]> {
    const res = await this.get<ApiResponse<UserDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async getUserRoles(userId: number): Promise<RoleDto[]> {
    const res = await this.get<ApiResponse<RoleDto[]>>(`/${userId}/roles`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async addRole(userId: number, roleId: number): Promise<UserDto> {
    const res = await this.post<ApiResponse<UserDto>>(`/${userId}/roles/${roleId}`, {});
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async removeRole(userId: number, roleId: number): Promise<UserDto> {
    const res = await this.delete<ApiResponse<UserDto>>(`/${userId}/roles/${roleId}`);
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
const rolesListApi = new RolesListApi();

export const UserRolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ userId: number; roleId: number; name: string } | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesListApi.getAll(),
  });

  const { data: userRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['user-roles', selectedUserId],
    queryFn: () => usersApi.getUserRoles(selectedUserId!),
    enabled: selectedUserId !== null,
  });

  const addMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      usersApi.addRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role added to user');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add role'),
  });

  const removeMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      usersApi.removeRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role removed from user');
      setRemoveTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to remove role'),
  });

  const assignedIds = new Set(userRoles.map(r => r.id));
  const availableRoles = allRoles.filter(r => !assignedIds.has(r.id));

  const addFields: FormField[] = [
    {
      name: 'roleId',
      label: 'Role',
      type: 'select',
      required: true,
      options: availableRoles.map(r => ({ label: r.name, value: r.id })),
    },
  ];

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Roles</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Assign roles to users</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* User selector */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Select User</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-[500px] overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selectedUserId === user.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-medium">
                      {user.fullName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </button>
              ))}
              {users.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">No users found</p>
              )}
            </div>
          </div>
        </div>

        {/* Roles list */}
        <div className="flex-1">
          {selectedUserId === null ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
              <User className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Select a user to manage their roles</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Roles for "{selectedUser?.fullName}"
                </h3>
                {availableRoles.length > 0 && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Role
                  </button>
                )}
              </div>

              {loadingRoles ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : userRoles.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No roles assigned</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {userRoles.map(role => (
                    <div key={role.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{role.name}</p>
                        {role.description && <p className="text-xs text-gray-400">{role.description}</p>}
                      </div>
                      <button
                        onClick={() => setRemoveTarget({ userId: selectedUserId, roleId: role.id, name: role.name })}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Role to User" size="md">
        <DynamicForm
          fields={addFields}
          onSubmit={(data) => addMutation.mutate({ userId: selectedUserId!, roleId: Number(data.roleId) })}
          submitLabel="Add Role"
          onCancel={() => setShowAddModal(false)}
          isLoading={addMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && removeMutation.mutate({ userId: removeTarget.userId, roleId: removeTarget.roleId })}
        title="Remove Role"
        message={`Remove "${removeTarget?.name}" from this user?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};
