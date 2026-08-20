import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { toast } from '../../../components/ui/Toast/toast.store';
import {
  orderApi,
  statusBadgeClasses,
  formatOrderDate,
  buyerLabel,
  ALLOWED_TRANSITIONS,
  OrderStatus,
  SyncedBadge,
} from './OrdersPage';

const sectionClasses = 'space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';
const sectionTitleClasses = 'text-base font-semibold text-gray-900 dark:text-white';
const labelClasses = 'text-sm text-gray-500 dark:text-gray-400';
const valueClasses = 'text-sm font-medium text-gray-900 dark:text-white';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['orders', 'detail', orderId],
    queryFn: () => orderApi.getById(orderId),
    enabled: Number.isFinite(orderId),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      toast.success('Order status updated');
      setSelectedStatus('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update order status'),
  });

  if (isLoading) return <Loader />;
  if (error || !order) return <ErrorState message={(error as Error)?.message || 'Order not found'} />;

  const allowedNext = ALLOWED_TRANSITIONS[order.status];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/orders')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.id}</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-2">
            {buyerLabel(order)} &middot; {formatOrderDate(order.createdAt)}
            {order.customerId === null && <SyncedBadge />}
          </span>
        </div>
        <span className={`ml-auto px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeClasses[order.status]}`}>{order.status}</span>
      </div>

      {order.customerId !== null && (
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Update Status</h2>
          {allowedNext.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">This order is in a terminal status and cannot be advanced further.</p>
          ) : (
            <div className="flex items-center gap-3">
              <select
                className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | '')}
              >
                <option value="">Select new status...</option>
                {allowedNext.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedStatus || updateStatusMutation.isPending}
                onClick={() => selectedStatus && updateStatusMutation.mutate(selectedStatus)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          )}
        </section>
      )}

      <section className={sectionClasses}>
        <h2 className={sectionTitleClasses}>Line Items</h2>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {order.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{item.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">{order.currency} {item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right">{order.currency} {item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Shipping Address</h2>
          <div className="text-sm text-gray-900 dark:text-gray-100 space-y-1">
            <p>{order.shippingAddress.recipientName}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </section>

        <section className={sectionClasses}>
          <h2 className={sectionTitleClasses}>Summary</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={labelClasses}>Shipping Method</span>
              <span className={valueClasses}>{order.shippingMethod || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={labelClasses}>Shipping Cost</span>
              <span className={valueClasses}>{order.currency} {order.shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={labelClasses}>Tax</span>
              <span className={valueClasses}>{order.currency} {order.tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={labelClasses}>Subtotal</span>
              <span className={valueClasses}>{order.currency} {order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{order.currency} {order.total.toFixed(2)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
