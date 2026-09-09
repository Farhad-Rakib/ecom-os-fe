import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { DataTable, Column } from '../../../components/table/DataTable';
import { toast } from '../../../components/ui/Toast/toast.store';
import {
  notificationsApi,
  templateLabel,
  EmailDeliveryDto,
  EmailDeliveryStatus,
} from '../notifications.api';

const inputClasses =
  'px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

const STATUSES: EmailDeliveryStatus[] = ['Pending', 'Sent', 'Failed', 'Abandoned'];

// Abandoned is styled apart from Failed deliberately. "Still retrying" and "we gave up" are
// different answers to the only question this page exists to answer.
const statusClasses: Record<EmailDeliveryStatus, string> = {
  Pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  Sent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Failed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Abandoned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabel: Record<EmailDeliveryStatus, string> = {
  Pending: 'Queued',
  Sent: 'Sent',
  Failed: 'Retrying',
  Abandoned: 'Not delivered',
};

export const EmailDeliveryLogPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<EmailDeliveryStatus | ''>('');
  const [orderId, setOrderId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const parsedOrderId = orderId.trim() === '' ? undefined : Number(orderId);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', 'deliveries', { status, parsedOrderId, page, pageSize }],
    queryFn: () => notificationsApi.getDeliveries({
      status: status || undefined,
      orderId: Number.isFinite(parsedOrderId) ? parsedOrderId : undefined,
      page,
      pageSize,
    }),
  });

  const retryMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.retryDelivery(id),
    onSuccess: () => {
      toast.success('Message requeued');
      queryClient.invalidateQueries({ queryKey: ['notifications', 'deliveries'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const columns: Column<EmailDeliveryDto>[] = [
    {
      key: 'templateKey',
      label: 'Message',
      render: (_, delivery) => (
        <div>
          <div className="text-gray-900 dark:text-white">
            {templateLabel[delivery.templateKey] ?? delivery.templateKey}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{delivery.subject}</div>
        </div>
      ),
    },
    { key: 'toAddress', label: 'To', width: '220px' },
    {
      key: 'relatedOrderId',
      label: 'Order',
      width: '100px',
      render: (_, delivery) => (delivery.relatedOrderId ? `#${delivery.relatedOrderId}` : '—'),
    },
    {
      key: 'status',
      label: 'Status',
      width: '160px',
      render: (_, delivery) => (
        <div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusClasses[delivery.status]}`}>
            {statusLabel[delivery.status]}
          </span>
          {delivery.lastError && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">{delivery.lastError}</div>
          )}
        </div>
      ),
    },
    {
      key: 'sentAtUtc',
      label: 'When',
      width: '170px',
      render: (_, delivery) =>
        delivery.sentAtUtc
          ? new Date(delivery.sentAtUtc).toLocaleString()
          : delivery.lastAttemptAtUtc
            ? `Tried ${new Date(delivery.lastAttemptAtUtc).toLocaleString()}`
            : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Log</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Every message this store has tried to send, and whether it arrived
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className={inputClasses}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as EmailDeliveryStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>

        <input
          className={inputClasses}
          type="number"
          min={1}
          value={orderId}
          onChange={(e) => {
            setOrderId(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by order #"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        error={error?.message}
        searchable={false}
        sortable={false}
        rowActions={[
          {
            icon: RefreshCw,
            label: 'Retry',
            onClick: (delivery) => retryMutation.mutate(delivery.id),
            variant: 'secondary',
            // A sent message has nothing to retry; offering the action would only produce an error.
            show: (delivery) => delivery.status !== 'Sent',
          },
        ]}
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
        emptyState={{
          title: 'Nothing sent yet',
          description: 'Customer emails will appear here as orders move through their lifecycle',
        }}
        onRetry={() => refetch()}
      />
    </div>
  );
};
