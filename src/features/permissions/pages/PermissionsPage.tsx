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

interface PermissionDto {
  id: number;
  name: string;
  description: string;
}

class PermissionApi extends BaseRepository {
  constructor() { super('/permissions'); }
  async getAll(): Promise<PermissionDto[]> {
    const res = await this.get<ApiResponse<PermissionDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: { name: string; description: string }): Promise<PermissionDto> {
    const res = await this.post<ApiResponse<PermissionDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: { name: string; description: string }): Promise<PermissionDto> {
    const res = await this.put<ApiResponse<PermissionDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
}

const permissionApi = new PermissionApi();

export const PermissionsPage: React.FC = () => {

  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<PermissionDto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: permissions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; description: string }) => permissionApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission created successfully');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create permission'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: { name: string; description: string } }) => permissionApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission updated successfully');
      setEditItem(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update permission'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => permissionApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('Permission deleted successfully');
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete permission'),
  });

  const columns: Column<PermissionDto>[] = [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Permission', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
  ];

  const rowActions: RowAction<PermissionDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (p) => setEditItem(p), variant: 'primary' },
    { icon: Trash2, label: 'Delete', onClick: (p) => setDeleteId(p.id), variant: 'danger' },
  ];

  const createFields: FormField[] = [
    { name: 'name', label: 'Permission Name', type: 'text', required: true, placeholder: 'e.g. users.read' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Permission description...' },
  ];

  const editFields: FormField[] = [
    { name: 'name', label: 'Permission Name', type: 'text', required: true, defaultValue: editItem?.name || '' },
    { name: 'description', label: 'Description', type: 'textarea', defaultValue: editItem?.description || '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Permissions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage system permissions</p>
      </div>

      <DataTable
        columns={columns}
        data={permissions}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search permissions..."
        emptyState={{ title: 'No permissions found', description: 'Create a new permission to get started' }}
        actions={{ add: { label: 'Add Permission', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Permission" size="md">
        <DynamicForm
          fields={createFields}
          onSubmit={(data) => createMutation.mutate({ name: data.name, description: data.description || '' })}
          submitLabel="Create Permission"
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editItem !== null} onClose={() => setEditItem(null)} title="Edit Permission" size="md">
        {editItem && (
          <DynamicForm
            key={editItem.id}
            fields={editFields}
            onSubmit={(data) => updateMutation.mutate({ id: editItem.id, dto: { name: data.name, description: data.description || '' } })}
            submitLabel="Update Permission"
            onCancel={() => setEditItem(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        title="Delete Permission"
        message="Are you sure you want to delete this permission? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
