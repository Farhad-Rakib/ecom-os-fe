import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, AlertTriangle, Plus, History } from 'lucide-react';
import { DataTable, Column } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { warehouseApi } from './WarehousesPage';

export interface InventoryItemDto {
  id: number;
  productVariantId: number;
  variantSku: string;
  warehouseId: number;
  warehouseName: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  backorderAllowed: boolean;
  preorderAvailableAtUtc: string | null;
  lotNumber: string | null;
  expiryDateUtc: string | null;
  isAtOrBelowReorderPoint: boolean;
}

import { StockMovementsDrawer } from '../components/StockMovementsDrawer';

class InventoryApi extends BaseRepository {
  constructor() { super('/inventory'); }
  async getFiltered(params: { variantId?: number; warehouseId?: number; belowReorderPoint?: boolean }): Promise<InventoryItemDto[]> {
    const res = await this.get<ApiResponse<InventoryItemDto[]>>('', { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
  async upsert(variantId: number, warehouseId: number, dto: Record<string, any>): Promise<InventoryItemDto> {
    const res = await this.put<ApiResponse<InventoryItemDto>>(`/${variantId}/${warehouseId}`, dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const inventoryApi = new InventoryApi();

const inputClasses =
  'px-2 py-1 text-sm border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

export const InventoryPage: React.FC = () => {
  const [movementsFor, setMovementsFor] = useState<InventoryItemDto | null>(null);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const variantId = searchParams.get('variantId') ? Number(searchParams.get('variantId')) : undefined;
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Partial<InventoryItemDto>>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWarehouseId, setNewWarehouseId] = useState<number | ''>('');
  const [newQuantity, setNewQuantity] = useState('0');

  const { data: warehouses = [] } = useQuery({ queryKey: ['catalog', 'warehouses'], queryFn: () => warehouseApi.getAll() });
  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: ['catalog', 'inventory', { variantId, warehouseId, lowStockOnly }],
    queryFn: () => inventoryApi.getFiltered({ variantId, warehouseId: warehouseId === '' ? undefined : warehouseId, belowReorderPoint: lowStockOnly || undefined }),
  });

  const addRecordMutation = useMutation({
    mutationFn: () =>
      inventoryApi.upsert(variantId!, Number(newWarehouseId), {
        quantityOnHand: Number(newQuantity || 0),
        reorderPoint: null,
        reorderQuantity: null,
        backorderAllowed: false,
        preorderAvailableAtUtc: null,
        lotNumber: null,
        expiryDateUtc: null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'inventory'] });
      toast.success('Inventory record added');
      setShowAddModal(false);
      setNewWarehouseId('');
      setNewQuantity('0');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to add inventory record'),
  });

  const rowKey = (item: InventoryItemDto) => `${item.productVariantId}-${item.warehouseId}`;
  const getDraft = (item: InventoryItemDto): InventoryItemDto => ({ ...item, ...drafts[rowKey(item)] });
  const setDraft = (item: InventoryItemDto, patch: Partial<InventoryItemDto>) =>
    setDrafts((prev) => ({ ...prev, [rowKey(item)]: { ...prev[rowKey(item)], ...patch } }));

  const saveMutation = useMutation({
    mutationFn: (item: InventoryItemDto) =>
      inventoryApi.upsert(item.productVariantId, item.warehouseId, {
        quantityOnHand: item.quantityOnHand,
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        backorderAllowed: item.backorderAllowed,
        preorderAvailableAtUtc: item.preorderAvailableAtUtc,
        lotNumber: item.lotNumber,
        expiryDateUtc: item.expiryDateUtc,
      }),
    onSuccess: (_, item) => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'inventory'] });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[rowKey(item)];
        return next;
      });
      toast.success('Inventory saved');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to save inventory'),
  });

  const columns: Column<InventoryItemDto>[] = [
    { key: 'variantSku', label: 'SKU', width: '140px' },
    { key: 'warehouseName', label: 'Warehouse', width: '160px' },
    {
      key: 'quantityOnHand',
      label: 'On Hand',
      width: '100px',
      render: (_, item) => {
        const draft = getDraft(item);
        return <input type="number" className={`${inputClasses} w-20`} value={draft.quantityOnHand} onChange={(e) => setDraft(item, { quantityOnHand: Number(e.target.value) })} />;
      },
    },
    {
      key: 'quantityReserved',
      label: 'Reserved',
      width: '90px',
      // A real number now that orders reserve stock. Highlighted when non-zero so it reads as
      // "committed to someone" rather than as a column that is always 0.
      render: (_, item) => (
        <span className={item.quantityReserved > 0 ? 'font-medium text-amber-700 dark:text-amber-400' : ''}>
          {item.quantityReserved}
        </span>
      ),
    },
    {
      key: 'availableQuantity',
      label: 'Available',
      width: '100px',
      // Always on-hand minus reserved -- never the raw on-hand number, per this task group's own
      // QA requirement that available quantity, not raw stock, is what's shown across the admin UI.
      render: (_, item) => {
        const draft = getDraft(item);
        const available = draft.quantityOnHand - item.quantityReserved;

        // Rendered as negative, never clamped at zero. An order synced from an external platform
        // can legitimately oversell, and so can a backorderable variant -- hiding that would make
        // the one situation this column exists for the one it cannot show.
        return (
          <span className={`font-medium ${available < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
            {available}
            {available < 0 && <span className="ml-1 text-xs font-normal">oversold</span>}
          </span>
        );
      },
    },
    {
      key: 'reorderPoint',
      label: 'Reorder Point',
      width: '110px',
      render: (_, item) => {
        const draft = getDraft(item);
        return (
          <input
            type="number"
            className={`${inputClasses} w-20`}
            value={draft.reorderPoint ?? ''}
            onChange={(e) => setDraft(item, { reorderPoint: e.target.value === '' ? null : Number(e.target.value) })}
          />
        );
      },
    },
    {
      key: 'backorderAllowed',
      label: 'Backorder',
      width: '90px',
      render: (_, item) => {
        const draft = getDraft(item);
        return <input type="checkbox" checked={draft.backorderAllowed} onChange={(e) => setDraft(item, { backorderAllowed: e.target.checked })} className="rounded border-gray-300" />;
      },
    },
    {
      key: 'isAtOrBelowReorderPoint',
      label: 'Status',
      width: '110px',
      render: (_, item) =>
        item.isAtOrBelowReorderPoint ? (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3" /> Low stock
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">OK</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Per-warehouse stock -- available quantity always nets out what's reserved</p>
      </div>

      <div className="flex items-center gap-4">
        {variantId !== undefined && (
          <span className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Filtered to variant #{variantId}
            <button type="button" onClick={() => setSearchParams({})} className="font-medium hover:underline">
              Clear
            </button>
          </span>
        )}
        <select className={inputClasses} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">All warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="rounded border-gray-300" />
          Low stock only
        </label>
        {variantId !== undefined && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Add Stock Record
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        error={error?.message}
        searchable={false}
        sortable={false}
        emptyState={{ title: 'No inventory records found', description: 'Inventory rows appear once stock is recorded for a variant at a warehouse' }}
        rowActions={[
          {
            icon: History,
            label: 'Stock history',
            onClick: (item) => setMovementsFor(item),
            variant: 'secondary',
          },
          {
            icon: Save,
            label: 'Save',
            onClick: (item) => saveMutation.mutate(getDraft(item)),
            variant: 'success',
            show: (item) => !!drafts[rowKey(item)],
          },
        ]}
        onRetry={() => refetch()}
      />

      {movementsFor && (
        <StockMovementsDrawer
          variantId={movementsFor.productVariantId}
          variantSku={movementsFor.variantSku}
          onClose={() => setMovementsFor(null)}
        />
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Stock Record" size="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newWarehouseId !== '') addRecordMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Warehouse<span className="text-red-500 ml-1">*</span></label>
            <select className={`${inputClasses} w-full`} value={newWarehouseId} onChange={(e) => setNewWarehouseId(e.target.value ? Number(e.target.value) : '')} required>
              <option value="">Select a warehouse...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Quantity</label>
            <input type="number" className={`${inputClasses} w-full`} value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={addRecordMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Add
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
