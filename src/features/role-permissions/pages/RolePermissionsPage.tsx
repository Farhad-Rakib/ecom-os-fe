import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Shield } from 'lucide-react';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

interface RoleDto {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

interface PermissionToggleDto {
  id: number;
  name: string;
  description: string;
  isAssigned: boolean;
}

class RolesApi extends BaseRepository {
  constructor() { super('/roles'); }
  async getAll(): Promise<RoleDto[]> {
    const res = await this.get<ApiResponse<RoleDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async getPermissionsWithAssignment(roleId: number, search: string): Promise<PermissionToggleDto[]> {
    const res = await this.get<ApiResponse<PermissionToggleDto[]>>(`/${roleId}/permissions/all`, {
      params: search ? { search } : undefined,
    });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async addPermission(roleId: number, permissionId: number): Promise<RoleDto> {
    const res = await this.post<ApiResponse<RoleDto>>(`/${roleId}/permissions/${permissionId}`, {});
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async removePermission(roleId: number, permissionId: number): Promise<RoleDto> {
    const res = await this.delete<ApiResponse<RoleDto>>(`/${roleId}/permissions/${permissionId}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

const rolesApi = new RolesApi();

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

const ToggleSwitch: React.FC<{ checked: boolean; disabled?: boolean; onChange: () => void }> = ({ checked, disabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export const RolePermissionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });

  const { data: permissions = [], isLoading: loadingPerms } = useQuery({
    queryKey: ['role-permissions-toggle', selectedRoleId, search],
    queryFn: () => rolesApi.getPermissionsWithAssignment(selectedRoleId!, search),
    enabled: selectedRoleId !== null,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ roleId, permissionId, assign }: { roleId: number; permissionId: number; assign: boolean }) =>
      assign ? rolesApi.addPermission(roleId, permissionId) : rolesApi.removePermission(roleId, permissionId),
    onMutate: ({ permissionId }) => setPendingId(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions-toggle', selectedRoleId] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update permission'),
    onSettled: () => setPendingId(null),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Permissions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Toggle permissions on or off for each role</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Role selector */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Select Role</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-96 overflow-y-auto">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selectedRoleId === role.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{role.name}</p>
                    {role.description && <p className="text-xs text-gray-400 truncate">{role.description}</p>}
                  </div>
                </button>
              ))}
              {roles.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">No roles found</p>
              )}
            </div>
          </div>
        </div>

        {/* Permissions list */}
        <div className="flex-1">
          {selectedRoleId === null ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
              <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Select a role to manage its permissions</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Permissions for "{roles.find(r => r.id === selectedRoleId)?.name}"
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search permissions..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {loadingPerms ? (
                <div className="p-8 text-center text-gray-400">Loading...</div>
              ) : permissions.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No permissions match your search</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50 max-h-[28rem] overflow-y-auto">
                  {permissions.map(perm => (
                    <div key={perm.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{perm.name}</p>
                        {perm.description && <p className="text-xs text-gray-400 truncate">{perm.description}</p>}
                      </div>
                      <ToggleSwitch
                        checked={perm.isAssigned}
                        disabled={toggleMutation.isPending && pendingId === perm.id}
                        onChange={() => toggleMutation.mutate({ roleId: selectedRoleId, permissionId: perm.id, assign: !perm.isAssigned })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
