import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

interface RoleDto {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

class RoleApi extends BaseRepository {
  constructor() { super('/roles'); }
  async getAll(): Promise<RoleDto[]> {
    const res = await this.get<ApiResponse<RoleDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: { name: string; description: string }): Promise<RoleDto> {
    const res = await this.post<ApiResponse<RoleDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: { name: string; description: string }): Promise<RoleDto> {
    const res = await this.put<ApiResponse<RoleDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
}

const roleApi = new RoleApi();

export const RolesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRole, setEditRole] = useState<RoleDto | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<number | null>(null);

  const { data: roles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; description: string }) => roleApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create role'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: { name: string; description: string } }) => roleApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role updated successfully');
      setEditRole(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update role'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
      setDeleteRoleId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete role'),
  });

  const columns: Column<RoleDto>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    {
      key: 'permissions',
      label: 'Permissions',
      sortable: false,
      render: (_, role) => (
        <div className="flex flex-wrap gap-1">
          {(role.permissions || []).slice(0, 3).map(p => (
            <span key={p} className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{p}</span>
          ))}
          {(role.permissions || []).length > 3 && (
            <span className="text-xs text-gray-400">+{role.permissions.length - 3} more</span>
          )}
          {(!role.permissions || role.permissions.length === 0) && (
            <span className="text-xs text-gray-400">None</span>
          )}
        </div>
      ),
    },
  ];

  const rowActions: RowAction<RoleDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (r) => setEditRole(r), variant: 'primary' },
    { icon: Trash2, label: 'Delete', onClick: (r) => setDeleteRoleId(r.id), variant: 'danger' },
  ];

  const createFields: FormField[] = [
    { name: 'name', label: 'Role Name', type: 'text', required: true, placeholder: 'e.g. Manager' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Role description...' },
  ];

  const editFields: FormField[] = [
    { name: 'name', label: 'Role Name', type: 'text', required: true, defaultValue: editRole?.name || '' },
    { name: 'description', label: 'Description', type: 'textarea', defaultValue: editRole?.description || '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage system roles</p>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search roles..."
        emptyState={{ title: 'No roles found', description: 'Create a new role to get started' }}
        actions={{ add: { label: 'Add Role', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Role" size="md">
        <DynamicForm
          fields={createFields}
          onSubmit={(data) => createMutation.mutate({ name: data.name, description: data.description || '' })}
          submitLabel="Create Role"
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editRole !== null} onClose={() => setEditRole(null)} title="Edit Role" size="md">
        {editRole && (
          <DynamicForm
            key={editRole.id}
            fields={editFields}
            onSubmit={(data) => updateMutation.mutate({ id: editRole.id, dto: { name: data.name, description: data.description || '' } })}
            submitLabel="Update Role"
            onCancel={() => setEditRole(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteRoleId !== null}
        onClose={() => setDeleteRoleId(null)}
        onConfirm={() => deleteRoleId !== null && deleteMutation.mutate(deleteRoleId)}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
