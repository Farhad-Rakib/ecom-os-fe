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

interface MenuDto {
  id: number;
  title: string;
  url: string | null;
  icon: string | null;
  requiredPermission: string | null;
  parentMenuId: number | null;
  children: MenuDto[] | null;
}

interface CreateMenuDto {
  title: string;
  url: string | null;
  icon: string | null;
  requiredPermission: string | null;
  parentMenuId: number | null;
}

class MenuCrudApi extends BaseRepository {
  constructor() { super('/Menu'); }
  async getAll(): Promise<MenuDto[]> {
    const res = await this.get<ApiResponse<MenuDto[]>>('/all');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: CreateMenuDto): Promise<MenuDto> {
    const res = await this.post<ApiResponse<MenuDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: CreateMenuDto): Promise<void> {
    const res = await this.put<ApiResponse<any>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
}

const menuCrudApi = new MenuCrudApi();

// Flatten nested menu structure for table display
function flattenMenuItems(items: MenuDto[]): MenuDto[] {
    
  
  const result: MenuDto[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        if (!result.find(r => r.id === child.id)) {
          result.push(child);
        }
      }
    }
  }
  return result;
}

export const MenuPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuDto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: rawMenuItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['menu-crud'],
    queryFn: () => menuCrudApi.getAll(),
  });

  const menuItems = flattenMenuItems(rawMenuItems);
  // Deduplicate by id
  const seen = new Set<number>();
  const uniqueItems = menuItems.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateMenuDto) => menuCrudApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-crud'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item created successfully');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create menu item'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: CreateMenuDto }) => menuCrudApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-crud'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item updated successfully');
      setEditItem(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update menu item'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => menuCrudApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-crud'] });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu item deleted successfully');
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete menu item'),
  });

  const columns: Column<MenuDto>[] = [
    { key: 'id', label: 'ID', width: '60px' },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'url', label: 'URL', sortable: true, render: (val) => val ? (
      <code className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">{val}</code>
    ) : <span className="text-xs text-gray-400">-</span> },
    { key: 'icon', label: 'Icon', render: (val) => (
      <span className="text-xs text-gray-500 dark:text-gray-400">{val || '-'}</span>
    )},
    { key: 'requiredPermission', label: 'Permission', render: (val) => val ? (
      <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{val}</span>
    ) : <span className="text-xs text-gray-400">Public</span>},
    { key: 'parentMenuId', label: 'Parent', width: '80px', render: (val) => {
      if (!val) return <span className="text-xs text-gray-400">Root</span>;
      const parent = uniqueItems.find(m => m.id === val);
      return <span className="text-xs text-gray-500">{parent?.title || `#${val}`}</span>;
    }},
  ];

  const rowActions: RowAction<MenuDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (m) => setEditItem(m), variant: 'primary' },
    { icon: Trash2, label: 'Delete', onClick: (m) => setDeleteId(m.id), variant: 'danger' },
  ];

  const parentOptions = [
    { label: 'None (Root)', value: 0 },
    ...uniqueItems.filter(m => !m.parentMenuId).map((m) => ({ label: m.title, value: m.id })),
  ];

  const createFields: FormField[] = [
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Dashboard' },
    { name: 'url', label: 'URL', type: 'text', placeholder: 'e.g. /dashboard (leave blank for parent-only)' },
    { name: 'icon', label: 'Icon', type: 'text', placeholder: 'e.g. dashboard, users, settings' },
    { name: 'requiredPermission', label: 'Required Permission', type: 'text', placeholder: 'e.g. users.read (blank for public)' },
    { name: 'parentMenuId', label: 'Parent Menu', type: 'select', options: parentOptions, defaultValue: 0 },
  ];

  const editFields: FormField[] = [
    { name: 'title', label: 'Title', type: 'text', required: true, defaultValue: editItem?.title || '' },
    { name: 'url', label: 'URL', type: 'text', defaultValue: editItem?.url || '' },
    { name: 'icon', label: 'Icon', type: 'text', defaultValue: editItem?.icon || '' },
    { name: 'requiredPermission', label: 'Required Permission', type: 'text', defaultValue: editItem?.requiredPermission || '' },
    { name: 'parentMenuId', label: 'Parent Menu', type: 'select', options: parentOptions, defaultValue: editItem?.parentMenuId || 0 },
  ];

  const handleCreate = (data: Record<string, any>) => {
    createMutation.mutate({
      title: data.title,
      url: data.url || null,
      icon: data.icon || null,
      requiredPermission: data.requiredPermission || null,
      parentMenuId: data.parentMenuId ? Number(data.parentMenuId) : null,
    });
  };

  const handleUpdate = (data: Record<string, any>) => {
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      dto: {
        title: data.title,
        url: data.url || null,
        icon: data.icon || null,
        requiredPermission: data.requiredPermission || null,
        parentMenuId: data.parentMenuId ? Number(data.parentMenuId) : null,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage navigation menu items</p>
      </div>

      <DataTable
        columns={columns}
        data={uniqueItems}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search menu items..."
        emptyState={{ title: 'No menu items found', description: 'Create a new menu item to get started' }}
        actions={{ add: { label: 'Add Menu Item', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Menu Item" size="md">
        <DynamicForm
          fields={createFields}
          onSubmit={handleCreate}
          submitLabel="Create"
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editItem !== null} onClose={() => setEditItem(null)} title="Edit Menu Item" size="md">
        {editItem && (
          <DynamicForm
            key={editItem.id}
            fields={editFields}
            onSubmit={handleUpdate}
            submitLabel="Update"
            onCancel={() => setEditItem(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
