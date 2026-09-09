import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Undo2 } from 'lucide-react';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { orderApi, CodSettlementDto, CodSettlementSource, OrderDetailDto } from '../pages/OrdersPage';

// What each kind of settlement record means, in the admin's terms rather than the enum's.
const sourceLabel: Record<CodSettlementSource, string> = {
  CourierDelivery: 'Courier reported delivery',
  Manual: 'Recorded by an admin',
  ManualReversal: 'Reversed by an admin',
  AutomaticReversal: 'Parcel returned',
};

// A manual record is authoritative regardless of when it happened -- the backend's precedence rule,
// surfaced so an admin can see WHY the order reads the way it does when two records disagree.
const isManual = (source: CodSettlementSource) => source === 'Manual' || source === 'ManualReversal';

interface Props {
  order: OrderDetailDto;
}

export const CodSettlementPanel: React.FC<Props> = ({ order }) => {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<'settle' | 'reverse' | null>(null);
  const [note, setNote] = useState('');

  const isCod = order.paymentMethod === 'CashOnDelivery';

  const { data: history } = useQuery({
    queryKey: ['orders', 'cod-settlement', order.id],
    queryFn: () => orderApi.getSettlementHistory(order.id),
    // A prepaid order has no settlement history and never will -- asking for it would be a request
    // that can only ever answer "nothing".
    enabled: isCod,
  });

  const settleMutation = useMutation({
    mutationFn: (isSettled: boolean) => orderApi.settleCod(order.id, isSettled, note || undefined),
    onSuccess: (updated) => {
      toast.success(updated.isCodSettled ? 'Cash collection recorded' : 'Cash collection reversed');
      setPendingAction(null);
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', order.id] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'cod-settlement', order.id] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'cod-unsettled'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  // Rendered for cash-on-delivery orders only. A card order has nothing to collect, and an empty
  // "no cash due" panel would be noise on every other order in the system.
  if (!isCod) return null;

  // Array.prototype.at is not in this project's configured lib target, so the last element is
  // taken by index.
  const last = <T,>(items: T[]): T | undefined => (items.length > 0 ? items[items.length - 1] : undefined);

  const authoritative = last((history ?? []).filter((h) => isManual(h.source))) ?? last(history ?? []);

  return (
    <section className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Cash on delivery</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {order.isCodSettled
              ? 'The cash for this order has been accounted for.'
              : 'The courier collects this amount from the buyer at the door.'}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {order.currency} {(order.isCodSettled ? order.total : order.codAmountDue).toFixed(2)}
          </div>
          <span
            className={`inline-block mt-1 px-2.5 py-1 text-xs font-medium rounded-full ${
              order.isCodSettled
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            {order.isCodSettled ? 'Collected' : 'Outstanding'}
          </span>
        </div>
      </div>

      {history && history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Settlement history</h3>

          {/* Every record, automatic and manual alike. The backend deliberately keeps both rather
              than overwriting one with the other, so an admin can see that the courier said one
              thing and a person decided another. */}
          <ul className="space-y-2">
            {history.map((entry: CodSettlementDto) => {
              const wins = authoritative?.id === entry.id;

              return (
                <li
                  key={entry.id}
                  className={`text-sm rounded-lg border px-3 py-2 ${
                    wins
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-900 dark:text-white">
                      {sourceLabel[entry.source]} — {entry.isSettled ? 'collected' : 'not collected'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {new Date(entry.occurredAtUtc).toLocaleString()}
                    </span>
                  </div>
                  {entry.note && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{entry.note}</div>
                  )}
                  {wins && history.length > 1 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This is the record the order reflects.
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="space-y-3 pt-1">
        <input
          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Note (optional) — e.g. why you are overriding the courier"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            type="button"
            disabled={settleMutation.isPending || order.isCodSettled}
            onClick={() => setPendingAction('settle')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <BadgeCheck className="w-4 h-4" />
            Mark collected
          </button>

          <button
            type="button"
            disabled={settleMutation.isPending || !order.isCodSettled}
            onClick={() => setPendingAction('reverse')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" />
            Reverse collection
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingAction === 'settle'}
        onClose={() => setPendingAction(null)}
        onConfirm={() => settleMutation.mutate(true)}
        title="Record cash collection"
        message={`Order #${order.id} will be marked as paid for ${order.currency} ${order.total.toFixed(2)}. This is recorded as your decision and takes precedence over what the courier reports.`}
        confirmText="Mark collected"
        variant="info"
      />

      <ConfirmDialog
        isOpen={pendingAction === 'reverse'}
        onClose={() => setPendingAction(null)}
        onConfirm={() => settleMutation.mutate(false)}
        title="Reverse cash collection"
        message={`Order #${order.id} will go back to showing ${order.currency} ${order.total.toFixed(2)} outstanding. The courier's own report is kept and stays visible.`}
        confirmText="Reverse"
        variant="warning"
      />
    </section>
  );
};
