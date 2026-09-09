import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export type StockMovementType = 'Reserve' | 'Commit' | 'Release' | 'ManualAdjustment';

export interface StockMovementDto {
  id: number;
  inventoryItemId: number;
  productVariantId: number;
  warehouseId: number;
  warehouseName: string;
  orderId: number | null;
  movementType: StockMovementType;
  quantityDelta: number;
  reservedDelta: number;
  reason: string | null;
  occurredAtUtc: string;
  actorUserId: number;
}

interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// What each movement means in the merchant's terms, rather than the enum's.
const movementLabel: Record<StockMovementType, string> = {
  Reserve: 'Reserved for an order',
  Commit: 'Shipped',
  Release: 'Returned to stock',
  ManualAdjustment: 'Adjusted by an admin',
};

// A manual correction is styled apart from the order-driven movements on purpose: the question a
// merchant asks this list is "did I do that, or did the system?".
const movementClasses: Record<StockMovementType, string> = {
  Reserve: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Commit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Release: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ManualAdjustment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

class StockMovementApi extends BaseRepository {
  constructor() { super('/inventory'); }

  async getForVariant(variantId: number, params: { warehouseId?: number; page: number; pageSize: number }): Promise<PagedResultDto<StockMovementDto>> {
    const res = await this.get<ApiResponse<PagedResultDto<StockMovementDto>>>(`/${variantId}/movements`, { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const stockMovementApi = new StockMovementApi();

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

interface Props {
  variantId: number;
  variantSku: string;
  onClose: () => void;
}

export const StockMovementsDrawer: React.FC<Props> = ({ variantId, variantSku, onClose }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', 'movements', variantId, page],
    queryFn: () => stockMovementApi.getForVariant(variantId, { page, pageSize: 25 }),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full overflow-y-auto bg-white dark:bg-gray-900 shadow-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stock history</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{variantSku}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close stock history"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
        {error && <div className="text-sm text-red-600 dark:text-red-400">{(error as Error).message}</div>}

        {!isLoading && (data?.items ?? []).length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Nothing has moved this variant's stock yet.
          </div>
        )}

        <ul className="space-y-2">
          {(data?.items ?? []).map((movement) => (
            <li
              key={movement.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${movementClasses[movement.movementType]}`}>
                  {movementLabel[movement.movementType]}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  {new Date(movement.occurredAtUtc).toLocaleString()}
                </span>
              </div>

              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                {movement.quantityDelta !== 0 && (
                  <span>On hand <strong>{signed(movement.quantityDelta)}</strong></span>
                )}
                {movement.reservedDelta !== 0 && (
                  <span>Reserved <strong>{signed(movement.reservedDelta)}</strong></span>
                )}
                <span className="text-gray-500 dark:text-gray-400">{movement.warehouseName}</span>
              </div>

              {movement.orderId !== null && (
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${movement.orderId}`)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Order #{movement.orderId}
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              {movement.reason && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{movement.reason}</div>
              )}
            </li>
          ))}
        </ul>

        {(data?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Page {data?.page} of {data?.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= (data?.totalPages ?? 1)}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
