import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface BrandDto {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string;
  countryOfOrigin: string | null;
  websiteUrl: string | null;
  isActive: boolean;
}

interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface BrandWriteDto {
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string;
  countryOfOrigin: string | null;
  websiteUrl: string | null;
}

class BrandApi extends BaseRepository {
  constructor() { super('/brands'); }
  async getPaged(params: { search?: string; page: number; pageSize: number }): Promise<PagedResultDto<BrandDto>> {
    const res = await this.get<ApiResponse<PagedResultDto<BrandDto>>>('', { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: BrandWriteDto): Promise<BrandDto> {
    const res = await this.post<ApiResponse<BrandDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: BrandWriteDto): Promise<BrandDto> {
    const res = await this.put<ApiResponse<BrandDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
}

export const brandApi = new BrandApi();

interface BrandFormValues {
  slug: string;
  name: string;
  logoUrl: string;
  description: string;
  countryOfOrigin: string;
  websiteUrl: string;
}

const emptyForm: BrandFormValues = { slug: '', name: '', logoUrl: '', description: '', countryOfOrigin: '', websiteUrl: '' };

const toWriteDto = (form: BrandFormValues): BrandWriteDto => ({
  slug: form.slug.trim().toLowerCase(),
  name: form.name.trim(),
  logoUrl: form.logoUrl.trim() || null,
  description: form.description.trim(),
  countryOfOrigin: form.countryOfOrigin.trim() || null,
  websiteUrl: form.websiteUrl.trim() || null,
});

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';

const BrandForm: React.FC<{
  initial: BrandFormValues;
  isEdit: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: BrandFormValues) => void;
}> = ({ initial, isEdit, isLoading, onCancel, onSubmit }) => {
  const [form, setForm] = useState(initial);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Slug<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          required
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="e.g. acme"
          className={inputClasses}
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Acme"
          className={inputClasses}
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className={`${inputClasses} resize-none`}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country of Origin</label>
          <input
            type="text"
            value={form.countryOfOrigin}
            onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })}
            className={inputClasses}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
          <input
            type="text"
            value={form.websiteUrl}
            onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
            placeholder="https://"
            className={inputClasses}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo URL</label>
        <input
          type="text"
          value={form.logoUrl}
          onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
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
          {isEdit ? 'Update Brand' : 'Create Brand'}
        </button>
      </div>
    </form>
  );
};

export const BrandsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandDto | null>(null);
  const [deleteBrandId, setDeleteBrandId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['catalog', 'brands', { page, pageSize, search }],
    queryFn: () => brandApi.getPaged({ page, pageSize, search: search || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'brands'] });

  const createMutation = useMutation({
    mutationFn: (dto: BrandWriteDto) => brandApi.create(dto),
    onSuccess: () => {
      invalidate();
      toast.success('Brand created successfully');
      setShowAddModal(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create brand'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: BrandWriteDto }) => brandApi.update(id, dto),
    onSuccess: () => {
      invalidate();
      toast.success('Brand updated successfully');
      setEditBrand(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update brand'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => brandApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Brand deleted successfully');
      setDeleteBrandId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete brand'),
  });

  const columns: Column<BrandDto>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'slug', label: 'Slug', width: '160px' },
    { key: 'countryOfOrigin', label: 'Country', width: '140px', render: (_, brand) => brand.countryOfOrigin || '—' },
    {
      key: 'isActive',
      label: 'Status',
      width: '110px',
      render: (_, brand) => (
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            brand.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {brand.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<BrandDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (brand) => setEditBrand(brand), variant: 'primary' },
    { icon: Trash2, label: 'Delete', onClick: (brand) => setDeleteBrandId(brand.id), variant: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Brands</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage the manufacturer/label directory products can be attached to</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search brands..."
        onSearch={(term) => {
          setSearch(term);
          setPage(1);
        }}
        sortable={false}
        pagination={{
          currentPage: data?.page ?? page,
          totalPages: data?.totalPages ?? 1,
          pageSize: data?.pageSize ?? pageSize,
          total: data?.total ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        emptyState={{ title: 'No brands found', description: 'Create a brand to get started' }}
        actions={{ add: { label: 'Add Brand', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Brand" size="md">
        <BrandForm
          initial={emptyForm}
          isEdit={false}
          isLoading={createMutation.isPending}
          onCancel={() => setShowAddModal(false)}
          onSubmit={(values) => createMutation.mutate(toWriteDto(values))}
        />
      </Modal>

      <Modal isOpen={editBrand !== null} onClose={() => setEditBrand(null)} title="Edit Brand" size="md">
        {editBrand && (
          <BrandForm
            key={editBrand.id}
            initial={{
              slug: editBrand.slug,
              name: editBrand.name,
              logoUrl: editBrand.logoUrl ?? '',
              description: editBrand.description,
              countryOfOrigin: editBrand.countryOfOrigin ?? '',
              websiteUrl: editBrand.websiteUrl ?? '',
            }}
            isEdit
            isLoading={updateMutation.isPending}
            onCancel={() => setEditBrand(null)}
            onSubmit={(values) => updateMutation.mutate({ id: editBrand.id, dto: toWriteDto(values) })}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteBrandId !== null}
        onClose={() => setDeleteBrandId(null)}
        onConfirm={() => deleteBrandId !== null && deleteMutation.mutate(deleteBrandId)}
        title="Delete Brand"
        message="Are you sure you want to delete this brand?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
