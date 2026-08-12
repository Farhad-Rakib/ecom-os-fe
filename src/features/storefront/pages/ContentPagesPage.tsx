import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, UploadCloud, ArchiveRestore } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface ContentPageDto {
  id: number;
  title: string;
  slug: string;
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
  status: 'Draft' | 'Published';
  updatedAt: string;
}

export interface ContentPageWriteDto {
  title: string;
  slug: string;
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
}

interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

class ContentPageApi extends BaseRepository {
  constructor() { super('/content-pages'); }
  async getPaged(params: { search?: string; page: number; pageSize: number }): Promise<PagedResultDto<ContentPageDto>> {
    const res = await this.get<ApiResponse<PagedResultDto<ContentPageDto>>>('', { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async getById(id: number): Promise<ContentPageDto> {
    const res = await this.get<ApiResponse<ContentPageDto>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(dto: ContentPageWriteDto): Promise<ContentPageDto> {
    const res = await this.post<ApiResponse<ContentPageDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, dto: ContentPageWriteDto): Promise<ContentPageDto> {
    const res = await this.put<ApiResponse<ContentPageDto>>(`/${id}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
  async publish(id: number): Promise<ContentPageDto> {
    const res = await this.post<ApiResponse<ContentPageDto>>(`/${id}/publish`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async unpublish(id: number): Promise<ContentPageDto> {
    const res = await this.post<ApiResponse<ContentPageDto>>(`/${id}/unpublish`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const contentPageApi = new ContentPageApi();

const statusBadgeClasses: Record<ContentPageDto['status'], string> = {
  Draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  Published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export const ContentPagesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [deletePageId, setDeletePageId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['storefront', 'content-pages', { page, pageSize, search }],
    queryFn: () => contentPageApi.getPaged({ page, pageSize, search: search || undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['storefront', 'content-pages'] });

  const publishMutation = useMutation({
    mutationFn: (id: number) => contentPageApi.publish(id),
    onSuccess: () => {
      invalidate();
      toast.success('Page published');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to publish page'),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: number) => contentPageApi.unpublish(id),
    onSuccess: () => {
      invalidate();
      toast.success('Page unpublished');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to unpublish page'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contentPageApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Page deleted');
      setDeletePageId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete page'),
  });

  const columns: Column<ContentPageDto>[] = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'slug', label: 'Slug', width: '200px' },
    {
      key: 'status',
      label: 'Status',
      width: '110px',
      render: (_, p) => <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClasses[p.status]}`}>{p.status}</span>,
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      width: '160px',
      render: (_, p) => new Date(p.updatedAt).toLocaleString(),
    },
  ];

  const rowActions: RowAction<ContentPageDto>[] = [
    { icon: Pencil, label: 'Edit', onClick: (p) => navigate(`/storefront/pages/${p.id}`), variant: 'primary' },
    { icon: UploadCloud, label: 'Publish', onClick: (p) => publishMutation.mutate(p.id), variant: 'success', show: (p) => p.status === 'Draft' },
    { icon: ArchiveRestore, label: 'Unpublish', onClick: (p) => unpublishMutation.mutate(p.id), variant: 'warning', show: (p) => p.status === 'Published' },
    { icon: Trash2, label: 'Delete', onClick: (p) => setDeletePageId(p.id), variant: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Pages</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Static informational pages for your storefront (About, Contact, Terms, etc.)</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search pages..."
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
        emptyState={{ title: 'No pages found', description: 'Create a page to get started' }}
        actions={{ add: { label: 'Add Page', onClick: () => navigate('/storefront/pages/new') } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <ConfirmDialog
        isOpen={deletePageId !== null}
        onClose={() => setDeletePageId(null)}
        onConfirm={() => deletePageId !== null && deleteMutation.mutate(deletePageId)}
        title="Delete Page"
        message="Are you sure you want to delete this page? This removes it entirely -- there is no version history."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
