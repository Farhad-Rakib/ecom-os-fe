import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, Column } from '../../../components/table/DataTable';
import {
  orderApi,
  OrderSummaryDto,
  buyerLabel,
  formatOrderDate,
  statusBadgeClasses,
} from './OrdersPage';

// The worklist: cash-on-delivery orders the courier has delivered but whose money has not been
// accounted for. Deliberately its own page rather than a filter on the Orders list -- it is a
// recurring task someone works through, not a view of the order book.
export const UnsettledCodPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', 'cod-unsettled', { page, pageSize }],
    queryFn: () => orderApi.getUnsettledCod({ page, pageSize }),
  });

  const columns: Column<OrderSummaryDto>[] = [
    { key: 'id', label: 'Order #', width: '100px', render: (_, order) => `#${order.id}` },
    { key: 'buyer', label: 'Buyer', render: (_, order) => buyerLabel(order) },
    {
      key: 'status',
      label: 'Status',
      width: '130px',
      render: (_, order) => (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClasses[order.status]}`}>
          {order.status}
        </span>
      ),
    },
    {
      key: 'codAmountDue',
      label: 'Cash due',
      width: '140px',
      render: (_, order) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {order.currency} {order.codAmountDue.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Ordered',
      width: '130px',
      render: (_, order) => formatOrderDate(order.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unsettled cash on delivery</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Delivered orders whose cash has not been accounted for. Open one to record or reverse a
          collection.
        </p>
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
        emptyState={{
          title: 'Nothing outstanding',
          description: 'Every delivered cash-on-delivery order has been accounted for',
        }}
        onRetry={() => refetch()}
      />
    </div>
  );
};
