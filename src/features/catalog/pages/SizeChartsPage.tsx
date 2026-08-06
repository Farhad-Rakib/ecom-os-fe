import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { brandApi, BrandDto } from './BrandsPage';
import { SizeChartRowsEditor } from '../components/SizeChartRowsEditor';

export interface SizeChartRowDto {
  id: number;
  sizeLabel: string;
  measurementsJson: string;
}

export interface SizeChartDto {
  id: number;
  name: string;
  scopeCategoryId: number | null;
  scopeBrandId: number | null;
  rows: SizeChartRowDto[];
}

class SizeChartApi extends BaseRepository {
  constructor() { super('/size-charts'); }
  async getAll(): Promise<SizeChartDto[]> {
    const res = await this.get<ApiResponse<SizeChartDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async create(name: string, scopeBrandId: number | null): Promise<SizeChartDto> {
    const res = await this.post<ApiResponse<SizeChartDto>>('', { name, scopeCategoryId: null, scopeBrandId, rows: [] });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async update(id: number, name: string, scopeBrandId: number | null): Promise<SizeChartDto> {
    const res = await this.put<ApiResponse<SizeChartDto>>(`/${id}`, { name, scopeCategoryId: null, scopeBrandId });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async remove(id: number): Promise<void> {
    await this.delete<any>(`/${id}`);
  }
  async addRow(sizeChartId: number, sizeLabel: string, measurementsJson: string): Promise<SizeChartRowDto> {
    const res = await this.post<ApiResponse<SizeChartRowDto>>(`/${sizeChartId}/rows`, { sizeLabel, measurementsJson });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async updateRow(sizeChartId: number, rowId: number, sizeLabel: string, measurementsJson: string): Promise<SizeChartRowDto> {
    const res = await this.put<ApiResponse<SizeChartRowDto>>(`/${sizeChartId}/rows/${rowId}`, { sizeLabel, measurementsJson });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async deleteRow(sizeChartId: number, rowId: number): Promise<void> {
    await this.delete<any>(`/${sizeChartId}/rows/${rowId}`);
  }
}

export const sizeChartApi = new SizeChartApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

export const SizeChartsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editChart, setEditChart] = useState<SizeChartDto | null>(null);
  const [rowsChart, setRowsChart] = useState<SizeChartDto | null>(null);
  const [deleteChartId, setDeleteChartId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [scopeBrandId, setScopeBrandId] = useState<number | ''>('');

  const { data: charts = [], isLoading, error, refetch } = useQuery({ queryKey: ['catalog', 'size-charts'], queryFn: () => sizeChartApi.getAll() });
  const { data: brandsPage } = useQuery({ queryKey: ['catalog', 'brands', 'all'], queryFn: () => brandApi.getPaged({ page: 1, pageSize: 200 }) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', 'size-charts'] });

  const createMutation = useMutation({
    mutationFn: () => sizeChartApi.create(name.trim(), scopeBrandId === '' ? null : Number(scopeBrandId)),
    onSuccess: () => {
      invalidate();
      toast.success('Size chart created');
      setShowAddModal(false);
      setName('');
      setScopeBrandId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to create size chart'),
  });

  const updateMutation = useMutation({
    mutationFn: () => sizeChartApi.update(editChart!.id, name.trim(), scopeBrandId === '' ? null : Number(scopeBrandId)),
    onSuccess: () => {
      invalidate();
      toast.success('Size chart updated');
      setEditChart(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update size chart'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sizeChartApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Size chart deleted');
      setDeleteChartId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to delete size chart'),
  });

  const brandName = (id: number | null) => (id === null ? '—' : brandsPage?.items.find((b: BrandDto) => b.id === id)?.name ?? id);

  const columns: Column<SizeChartDto>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'scopeBrandId', label: 'Brand Scope', width: '160px', render: (_, c) => brandName(c.scopeBrandId) },
    { key: 'rows', label: 'Sizes', width: '90px', render: (_, c) => c.rows.length },
  ];

  const rowActions: RowAction<SizeChartDto>[] = [
    {
      icon: Pencil,
      label: 'Edit',
      onClick: (c) => {
        setEditChart(c);
        setName(c.name);
        setScopeBrandId(c.scopeBrandId ?? '');
      },
      variant: 'primary',
    },
    { icon: Trash2, label: 'Delete', onClick: (c) => setDeleteChartId(c.id), variant: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Size Charts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Scope a size chart to a brand so it appears on every product under it, without re-entering it per product</p>
      </div>

      <DataTable
        columns={columns}
        data={charts}
        isLoading={isLoading}
        error={error?.message}
        sortable={false}
        emptyState={{ title: 'No size charts found', description: 'Create a size chart to get started' }}
        actions={{ add: { label: 'Add Size Chart', onClick: () => setShowAddModal(true) } }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create Size Chart" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMutation.mutate(); }} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name<span className="text-red-500 ml-1">*</span></label>
            <input className={inputClasses} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand Scope</label>
            <select className={inputClasses} value={scopeBrandId} onChange={(e) => setScopeBrandId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Unscoped</option>
              {brandsPage?.items.map((b: BrandDto) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Create
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={editChart !== null} onClose={() => setEditChart(null)} title="Edit Size Chart" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) updateMutation.mutate(); }} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name<span className="text-red-500 ml-1">*</span></label>
            <input className={inputClasses} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand Scope</label>
            <select className={inputClasses} value={scopeBrandId} onChange={(e) => setScopeBrandId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Unscoped</option>
              {brandsPage?.items.map((b: BrandDto) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setEditChart(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Save
            </button>
          </div>
        </form>
        {editChart && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setRowsChart(editChart)} className="text-sm text-blue-600 hover:underline">
              Edit sizes &amp; measurements →
            </button>
          </div>
        )}
      </Modal>

      <Modal isOpen={rowsChart !== null} onClose={() => setRowsChart(null)} title={`Sizes -- ${rowsChart?.name ?? ''}`} size="lg">
        {rowsChart && <SizeChartRowsEditor sizeChartId={rowsChart.id} rows={charts.find((c) => c.id === rowsChart.id)?.rows ?? rowsChart.rows} />}
      </Modal>

      <ConfirmDialog
        isOpen={deleteChartId !== null}
        onClose={() => setDeleteChartId(null)}
        onConfirm={() => deleteChartId !== null && deleteMutation.mutate(deleteChartId)}
        title="Delete Size Chart"
        message="Are you sure you want to delete this size chart?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
