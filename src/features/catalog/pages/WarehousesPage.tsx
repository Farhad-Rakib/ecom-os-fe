import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { Modal } from '../../../components/ui/Modal/Modal';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface WarehouseDto {
  id: number;
  code: string;
  name: string;
  address: string | null;
  isDefault: boolean;
}

class WarehouseApi extends BaseRepository {
  constructor() { super('/warehouses'); }
  async getAll(): Promise<WarehouseDto[]> {
    const res = await this.get<ApiResponse<WarehouseDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: Record<string, any>): Promise<WarehouseDto> {
    const res = await this.post<ApiResponse<WarehouseDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: Record<string, any>): Promise<WarehouseDto> {
    const res = await this.put<ApiResponse<WarehouseDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
}

export const warehouseApi = new WarehouseApi();

export const WarehousesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<WarehouseDto | null>(null);
  const [deleteWarehouseId, setDeleteWarehouseId] = useState<number | null>(null);

  const { data: warehouses = [], isLoading, error, refetch } = useQuery({ queryKey: ['catalog', 'warehouses'], queryFn: () => warehouseApi.getAll() });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'warehouses'] });

  const createMutation = useMutation({
    mutationFn: (dto: Record<string, any>) => warehouseApi.create(dto),
    onSuccess: () => {
      invalidate();
      toast.success('Warehouse created successfully');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create warehouse'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Record<string, any> }) => warehouseApi.update(id, dto),
    onSuccess: () => {
      invalidate();
      toast.success('Warehouse updated successfully');
      setEditWarehouse(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update warehouse'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => warehouseApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Warehouse deleted successfully');
      setDeleteWarehouseId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete warehouse'),
  });

  const createFields: FormField[] = [
    { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. east-1' },
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. East Coast Fulfillment' },
    { name: 'address', label: 'Address', type: 'textarea', rows: 2 },
    { name: 'isDefault', label: 'Default warehouse', type: 'checkbox' },
  ];

  const editFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true, defaultValue: editWarehouse?.name },
    { name: 'address', label: 'Address', type: 'textarea', rows: 2, defaultValue: editWarehouse?.address ?? '' },
    { name: 'isDefault', label: 'Default warehouse', type: 'checkbox', defaultValue: editWarehouse?.isDefault ?? false },
  ];

  const columns: Column<WarehouseDto>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', width: '140px' },
    { key: 'address', label: 'Address', render: (_, w) => w.address || '—' },
    {
      key: 'isDefault',
      label: 'Default',
      width: '100px',
      render: (_, w) =>
        w.isDefault ? (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Default</span>
        ) : (
          '—'
        ),
    },
  ];

  const rowActions: RowAction<WarehouseDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (w) => setEditWarehouse(w), variant: 'primary' },
    { icon: Trash2, label: 'Delete', onClick: (w) => setDeleteWarehouseId(w.id), variant: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warehouses</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage the locations stock is tracked and reserved against</p>
      </div>

      <DataTable
        columns={columns}
        data={warehouses}
        isLoading={isLoading}
        error={error?.message}
        sortable={false}
        emptyState={{ title: 'No warehouses found', description: 'Create a warehouse to start tracking inventory' }}
        actions={{ add: { label: 'Add Warehouse', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Warehouse" size="md">
        <DynamicForm
          fields={createFields}
          submitLabel="Create Warehouse"
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
          onSubmit={(data) => createMutation.mutate({ code: data.code, name: data.name, address: data.address || null, isDefault: !!data.isDefault })}
        />
      </Modal>

      <Modal isOpen={editWarehouse !== null} onClose={() => setEditWarehouse(null)} title="Edit Warehouse" size="md">
        {editWarehouse && (
          <DynamicForm
            key={editWarehouse.id}
            fields={editFields}
            submitLabel="Save Changes"
            onCancel={() => setEditWarehouse(null)}
            isLoading={updateMutation.isPending}
            onSubmit={(data) =>
              updateMutation.mutate({ id: editWarehouse.id, dto: { name: data.name, address: data.address || null, isDefault: !!data.isDefault } })
            }
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteWarehouseId !== null}
        onClose={() => setDeleteWarehouseId(null)}
        onConfirm={() => deleteWarehouseId !== null && deleteMutation.mutate(deleteWarehouseId)}
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? This will fail if it still has inventory records."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
