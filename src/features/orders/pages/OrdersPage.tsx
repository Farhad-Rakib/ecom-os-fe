import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, Column } from '../../../components/table/DataTable';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export type OrderStatus =
  | 'PendingPayment'
  | 'Paid'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded';

export interface OrderSummaryDto {
  id: number;
  customerId: number | null;
  buyerName: string | null;
  buyerEmail: string | null;
  status: OrderStatus;
  total: number;
  currency: string;
  lineItemCount: number;
  createdAt: string;
}

export interface OrderLineItemDto {
  id: number;
  productVariantId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddressDto {
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderDetailDto {
  id: number;
  customerId: number | null;
  buyerName: string | null;
  buyerEmail: string | null;
  status: OrderStatus;
  lineItems: OrderLineItemDto[];
  shippingAddress: OrderAddressDto;
  shippingMethod: string | null;
  shippingCost: number;
  tax: number;
  subtotal: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Hand-mirrored copy of ecom-be's OrderStatusTransitions.AllowedFrom -- used only to populate the
// status-update <select>'s choices so the UI never offers a transition the backend is certain to
// reject. The backend remains the source of truth and still validates on PUT /orders/{id}/status.
// If that backend table ever changes, this constant must be updated in the same PR.
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PendingPayment: ['Paid', 'Cancelled'],
  Paid: ['Processing', 'Cancelled', 'Refunded'],
  Processing: ['Shipped', 'Cancelled', 'Refunded'],
  Shipped: ['Delivered', 'Refunded'],
  Delivered: ['Refunded'],
  Cancelled: [],
  Refunded: [],
};

export const statusBadgeClasses: Record<OrderStatus, string> = {
  PendingPayment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Refunded: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export const ORDER_STATUSES: OrderStatus[] = [
  'PendingPayment',
  'Paid',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Refunded',
];

// An order shows its buyer's name when available (BuyerName is populated for both
// platform-native orders -- where it mirrors the linked customer -- and externally-sourced ones),
// falling back to email, then a placeholder if neither is present.
export const buyerLabel = (order: Pick<OrderSummaryDto, 'buyerName' | 'buyerEmail'>): string =>
  order.buyerName || order.buyerEmail || '—';

export const formatOrderDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Shown next to the buyer name/email whenever an order's customerId is null -- store-sync-prd's
// sync engine is the only writer of such orders (see order-management-prd's own status-control
// gating for the corresponding write-side rule).
export const SyncedBadge: React.FC = () => (
  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
    Synced from Shopify
  </span>
);

class OrderApi extends BaseRepository {
  constructor() { super('/orders'); }

  async getPaged(params: { status?: OrderStatus; page: number; pageSize: number }): Promise<PagedResultDto<OrderSummaryDto>> {
    const res = await this.get<ApiResponse<PagedResultDto<OrderSummaryDto>>>('', { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getById(id: number): Promise<OrderDetailDto> {
    const res = await this.get<ApiResponse<OrderDetailDto>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<OrderDetailDto> {
    const res = await this.put<ApiResponse<OrderDetailDto>>(`/${id}/status`, { status });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const orderApi = new OrderApi();

const inputClasses =
  'px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<OrderStatus | ''>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', 'list', { status, page, pageSize }],
    queryFn: () => orderApi.getPaged({ status: status || undefined, page, pageSize }),
  });

  const columns: Column<OrderSummaryDto>[] = [
    { key: 'id', label: 'Order #', width: '100px', render: (_, order) => `#${order.id}` },
    {
      key: 'buyer',
      label: 'Buyer',
      render: (_, order) => (
        <span className="inline-flex items-center gap-2">
          {buyerLabel(order)}
          {order.customerId === null && <SyncedBadge />}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '140px',
      render: (_, order) => (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClasses[order.status]}`}>{order.status}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      width: '120px',
      render: (_, order) => `${order.currency} ${order.total.toFixed(2)}`,
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '120px',
      render: (_, order) => formatOrderDate(order.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View orders and manage their fulfillment status</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          className={inputClasses}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error?.message}
        searchable={false}
        sortable={false}
        onRowClick={(order) => navigate(`/orders/${order.id}`)}
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
        emptyState={{ title: 'No orders found', description: 'Orders will appear here once customers start purchasing' }}
        onRetry={() => refetch()}
      />
    </div>
  );
};
