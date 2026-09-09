import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, Column } from '../../../components/table/DataTable';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { RatingBadge } from '../../customers/components/RatingBadge';
import { recipientApi } from '../../customers/pages/RecipientPage';

export type OrderStatus =
  | 'PendingPayment'
  | 'Paid'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded'
  // Added by courier-prd backend task group 04. A parcel the buyer refused, or that came back, is
  // NOT the same event as a merchant-initiated Cancelled -- telling those apart is the entire basis
  // of the delivery rating.
  | 'Returned';

// Added by fulfilment-readiness-prd backend task group 01.
export type PaymentMethod = 'Online' | 'CashOnDelivery';

export const PAYMENT_METHODS: PaymentMethod[] = ['Online', 'CashOnDelivery'];

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  Online: 'Card / Online',
  CashOnDelivery: 'Cash on delivery',
};

export interface OrderSummaryDto {
  id: number;
  customerId: number | null;
  buyerName: string | null;
  buyerEmail: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  isCodSettled: boolean;
  codAmountDue: number;
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
  // True when the stock ledger accepted this line beyond available stock, recorded on the order at
  // the moment it was placed.
  isBackordered: boolean;
}

export interface OrderAddressDto {
  recipientName: string;
  // Added by courier-prd backend task group 01. Null for orders created before that shipped, which
  // are structurally undispatchable -- the dispatch panel says so rather than failing at the courier.
  recipientPhone: string | null;
  recipientPhoneNormalized: string | null;
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
  paymentMethod: PaymentMethod;
  isCodSettled: boolean;
  codAmountDue: number;
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
  // Paid -> Shipped added by courier-prd backend task group 03: dispatching a paid order straight
  // to a courier is normal, and Processing is a legitimate intermediate step rather than a
  // mandatory one.
  Paid: ['Processing', 'Shipped', 'Cancelled', 'Refunded'],
  Processing: ['Shipped', 'Cancelled', 'Refunded'],
  // Shipped -> Returned added by courier-prd backend task group 04.
  Shipped: ['Delivered', 'Returned', 'Refunded'],
  Delivered: ['Refunded'],
  Cancelled: [],
  Refunded: [],
  Returned: [],
};

// fulfilment-readiness-prd backend task group 03 made the transition matrix depend on the ORDER,
// not just its status: a cash-on-delivery order may ship while still unpaid, because the money
// arrives at the door. This is the first time this mirror has needed anything but the status, and
// it is deliberately a separate table rather than an edit to the one above -- an unconditional
// PendingPayment -> Shipped would offer the transition for card orders too, which the backend will
// always reject.
const COD_ONLY_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PendingPayment: ['Shipped'],
};

export const allowedTransitionsFor = (
  status: OrderStatus,
  paymentMethod: PaymentMethod,
): OrderStatus[] => {
  const base = ALLOWED_TRANSITIONS[status] ?? [];
  if (paymentMethod !== 'CashOnDelivery') return base;
  return [...new Set([...base, ...(COD_ONLY_TRANSITIONS[status] ?? [])])];
};

export const statusBadgeClasses: Record<OrderStatus, string> = {
  PendingPayment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Paid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Refunded: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  // Deliberately not the same neutral grey as Cancelled: a returned parcel is the outcome that
  // actually costs money, and it must stand out from a merchant's own cancellation.
  Returned: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export const ORDER_STATUSES: OrderStatus[] = [
  'PendingPayment',
  'Paid',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Refunded',
  'Returned',
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

  async getPaged(params: { status?: OrderStatus; paymentMethod?: PaymentMethod; page: number; pageSize: number }): Promise<PagedResultDto<OrderSummaryDto>> {
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

  async getSettlementHistory(id: number): Promise<CodSettlementDto[]> {
    const res = await this.get<ApiResponse<CodSettlementDto[]>>(`/${id}/cod-settlement`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async settleCod(id: number, isSettled: boolean, note?: string): Promise<OrderDetailDto> {
    const res = await this.post<ApiResponse<OrderDetailDto>>(`/${id}/cod-settlement`, { isSettled, note });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getUnsettledCod(params: { page: number; pageSize: number }): Promise<PagedResultDto<OrderSummaryDto>> {
    const res = await this.get<ApiResponse<PagedResultDto<OrderSummaryDto>>>('/cod/unsettled', { params });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getNotifications(id: number): Promise<OrderNotificationDto[]> {
    const res = await this.get<ApiResponse<OrderNotificationDto[]>>(`/${id}/notifications`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export type CodSettlementSource = 'CourierDelivery' | 'Manual' | 'ManualReversal' | 'AutomaticReversal';

export interface CodSettlementDto {
  id: number;
  source: CodSettlementSource;
  isSettled: boolean;
  amount: number;
  occurredAtUtc: string;
  actor: string | null;
  note: string | null;
}

export interface OrderNotificationDto {
  id: number;
  templateKey: string;
  toAddress: string;
  subject: string;
  relatedOrderId: number | null;
  status: 'Pending' | 'Sent' | 'Failed' | 'Abandoned';
  attemptCount: number;
  lastError: string | null;
  lastAttemptAtUtc: string | null;
  sentAtUtc: string | null;
}

export const orderApi = new OrderApi();

const inputClasses =
  'px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', 'list', { status, paymentMethod, page, pageSize }],
    queryFn: () => orderApi.getPaged({
      status: status || undefined,
      paymentMethod: paymentMethod || undefined,
      page,
      pageSize,
    }),
  });

  const visibleOrderIds = (data?.items ?? []).map((order) => order.id);

  // ONE request per page render with every visible order id, never one per row -- the batch
  // endpoint exists precisely so this list does not go N+1. An order with no settled delivery gets
  // no entry back, which RatingBadge renders as "No delivery history" rather than a zero.
  const { data: ratings } = useQuery({
    queryKey: ['order-ratings', visibleOrderIds],
    queryFn: () => recipientApi.getRatingsForOrders(visibleOrderIds),
    enabled: visibleOrderIds.length > 0,
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
      key: 'paymentMethod',
      label: 'Payment',
      width: '170px',
      render: (_, order) => (
        <div>
          <div className="text-gray-900 dark:text-white">{paymentMethodLabel[order.paymentMethod]}</div>
          {/* Only cash-on-delivery orders have money that can still be outstanding, so the
              settlement state is shown for those alone rather than as an always-present column. */}
          {order.paymentMethod === 'CashOnDelivery' && (
            <span
              className={`mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                order.isCodSettled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {order.isCodSettled ? 'Collected' : `${order.currency} ${order.codAmountDue.toFixed(2)} due`}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Delivery rating',
      width: '200px',
      // Informational only -- nothing here blocks, gates, or warns on dispatch. The admin decides.
      render: (_, order) => <RatingBadge rating={ratings?.[order.id]} size="sm" />,
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

        <select
          className={inputClasses}
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value as PaymentMethod | '');
            setPage(1);
          }}
        >
          <option value="">All payment methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>{paymentMethodLabel[m]}</option>
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
