import { useQuery } from '@tanstack/react-query';
import { orderApi, OrderNotificationDto } from '../pages/OrdersPage';

// The four states a queued message can be in. Abandoned is styled distinctly from Failed on
// purpose: "still retrying" and "gave up" are different answers to the only question anyone asks
// this panel, which is whether the customer ever got the mail.
const statusClasses: Record<OrderNotificationDto['status'], string> = {
  Pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  Sent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Failed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Abandoned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabel: Record<OrderNotificationDto['status'], string> = {
  Pending: 'Queued',
  Sent: 'Sent',
  Failed: 'Retrying',
  Abandoned: 'Not delivered',
};

// Human names for the backend's template keys, so the panel reads as a story about the order
// rather than a list of identifiers.
const templateLabel: Record<string, string> = {
  'order.placed': 'Order confirmation',
  'order.placed.cod': 'Order confirmation (cash on delivery)',
  'payment.received': 'Payment received',
  'order.dispatched': 'Dispatch notice',
  'order.delivered': 'Delivery confirmation',
  'order.cancelled': 'Cancellation notice',
  'order.refunded': 'Refund notice',
  'order.returned': 'Return notice',
};

interface Props {
  orderId: number;
}

export const OrderNotificationsPanel: React.FC<Props> = ({ orderId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'notifications', orderId],
    queryFn: () => orderApi.getNotifications(orderId),
    enabled: Number.isFinite(orderId),
  });

  return (
    <section className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Customer notifications</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          What this buyer was sent about this order, and whether it arrived.
        </p>
      </div>

      {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}

      {!isLoading && (data ?? []).length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Nothing has been sent to this buyer yet.
        </div>
      )}

      {(data ?? []).length > 0 && (
        <ul className="space-y-2">
          {(data ?? []).map((notification) => (
            <li
              key={notification.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-900 dark:text-white">
                  {templateLabel[notification.templateKey] ?? notification.templateKey}
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full shrink-0 ${statusClasses[notification.status]}`}>
                  {statusLabel[notification.status]}
                </span>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                To {notification.toAddress}
                {notification.sentAtUtc && ` · sent ${new Date(notification.sentAtUtc).toLocaleString()}`}
                {!notification.sentAtUtc && notification.attemptCount > 0 && ` · ${notification.attemptCount} attempt(s)`}
              </div>

              {notification.lastError && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">{notification.lastError}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
