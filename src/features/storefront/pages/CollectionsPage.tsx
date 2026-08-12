import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, ListOrdered } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface CollectionDto {
  id: number;
  name: string;
  itemCount: number;
}

export interface CollectionItemDto {
  productId: number;
  productName: string;
  sku: string;
  slug: string;
  thumbnailUrl: string | null;
  displayOrder: number;
}

class CollectionApi extends BaseRepository {
  constructor() { super('/collections'); }
  async getAll(): Promise<CollectionDto[]> {
    const res = await this.get<ApiResponse<CollectionDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async getById(id: number): Promise<CollectionDto> {
    const res = await this.get<ApiResponse<CollectionDto>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(name: string): Promise<CollectionDto> {
    const res = await this.post<ApiResponse<CollectionDto>>('', { name });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async rename(id: number, name: string): Promise<CollectionDto> {
    const res = await this.put<ApiResponse<CollectionDto>>(`/${id}`, { name });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
  async getItems(id: number): Promise<CollectionItemDto[]> {
    const res = await this.get<ApiResponse<CollectionItemDto[]>>(`/${id}/items`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async addItem(id: number, productId: number): Promise<CollectionItemDto> {
    const res = await this.post<ApiResponse<CollectionItemDto>>(`/${id}/items`, { productId });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async removeItem(id: number, productId: number): Promise<void> {
    await this.delete<any>(`/${id}/items/${productId}`);
  }
  async reorderItems(id: number, productIdsInOrder: number[]): Promise<void> {
    await this.post<any>(`/${id}/items/reorder`, { productIdsInOrder });
  }
}

export const collectionApi = new CollectionApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';

const CollectionForm: React.FC<{
  initial: string;
  isEdit: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}> = ({ initial, isEdit, isLoading, onCancel, onSubmit }) => {
  const [name, setName] = useState(initial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Featured"
          className={inputClasses}
        />
      </div>
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isEdit ? 'Rename Collection' : 'Create Collection'}
        </button>
      </div>
    </form>
  );
};

export const CollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCollection, setEditCollection] = useState<CollectionDto | null>(null);
  const [deleteCollection, setDeleteCollection] = useState<CollectionDto | null>(null);

  const { data: collections = [], isLoading, error, refetch } = useQuery({
    queryKey: ['storefront', 'collections'],
    queryFn: () => collectionApi.getAll(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['storefront', 'collections'] });

  const createMutation = useMutation({
    mutationFn: (name: string) => collectionApi.create(name),
    onSuccess: () => {
      invalidate();
      toast.success('Collection created');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create collection'),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => collectionApi.rename(id, name),
    onSuccess: () => {
      invalidate();
      toast.success('Collection renamed');
      setEditCollection(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to rename collection'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => collectionApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Collection deleted');
      setDeleteCollection(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete collection'),
  });

  const columns: Column<CollectionDto>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'itemCount', label: 'Products', width: '120px' },
  ];

  const rowActions: RowAction<CollectionDto>[] = [
    { icon: ListOrdered, label: 'Manage Products', onClick: (c) => navigate(`/storefront/collections/${c.id}`), variant: 'primary' },
    { icon: Pencil, label: 'Rename', onClick: (c) => setEditCollection(c), variant: 'secondary' },
    { icon: Trash2, label: 'Delete', onClick: (c) => setDeleteCollection(c), variant: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Showcases</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Curate named, ordered sets of products to highlight on the storefront</p>
      </div>

      <DataTable
        columns={columns}
        data={collections}
        isLoading={isLoading}
        error={error?.message}
        searchable={false}
        sortable={false}
        emptyState={{ title: 'No collections found', description: 'Create one to start curating products' }}
        actions={{ add: { label: 'Add Collection', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Collection" size="md">
        <CollectionForm
          initial=""
          isEdit={false}
          isLoading={createMutation.isPending}
          onCancel={() => setShowAddModal(false)}
          onSubmit={(name) => createMutation.mutate(name)}
        />
      </Modal>

      <Modal isOpen={editCollection !== null} onClose={() => setEditCollection(null)} title="Rename Collection" size="md">
        {editCollection && (
          <CollectionForm
            key={editCollection.id}
            initial={editCollection.name}
            isEdit
            isLoading={renameMutation.isPending}
            onCancel={() => setEditCollection(null)}
            onSubmit={(name) => renameMutation.mutate({ id: editCollection.id, name })}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteCollection !== null}
        onClose={() => setDeleteCollection(null)}
        onConfirm={() => deleteCollection !== null && deleteMutation.mutate(deleteCollection.id)}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? Its member products will not be deleted."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
