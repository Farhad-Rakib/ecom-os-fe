import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, AlertCircle } from 'lucide-react';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { toast } from '../../../components/ui/Toast/toast.store';
import { courierApi, CourierDto } from './CouriersPage';
import { OrderDetailDto } from '../../orders/pages/OrdersPage';

export type ConsignmentStatus = 'InFlight' | 'Delivered' | 'Returned';
export type DeliveryOutcomeSource = 'Webhook' | 'Poll' | 'Manual';

export interface ConsignmentDto {
  id: number;
  orderId: number;
  courierId: number;
  courierName: string;
  externalConsignmentId: string | null;
  trackingCode: string | null;
  codAmount: number;
  isManuallyEntered: boolean;
  dispatchedAt: string;
  status: ConsignmentStatus;
  outcomeSetBy: DeliveryOutcomeSource | null;
  outcomeAt: string | null;
  lastFailureReason: string | null;
}

export interface DeliveryEventDto {
  id: number;
  consignmentId: number;
  orderId: number;
  outcome: ConsignmentStatus;
  externalStatus: string;
  source: DeliveryOutcomeSource;
  occurredAt: string;
  recordedAt: string;
}

export const consignmentStatusClasses: Record<ConsignmentStatus, string> = {
  InFlight: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Returned: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export const consignmentStatusLabel: Record<ConsignmentStatus, string> = {
  InFlight: 'In transit',
  Delivered: 'Delivered',
  Returned: 'Returned',
};

// A person recording an outcome by hand and a courier reporting one are different kinds of fact,
// and PRD Feature 5 AC6 requires them to be distinguishable wherever an outcome is shown.
export const outcomeSourceLabel: Record<DeliveryOutcomeSource, string> = {
  Webhook: 'Reported by courier',
  Poll: 'Reported by courier',
  Manual: 'Recorded by staff',
};

class ConsignmentApi extends BaseRepository {
  constructor() { super(''); }

  // A 404 here is the ordinary "this order was never dispatched" case, not an error worth a toast.
  async getForOrder(orderId: number): Promise<ConsignmentDto | null> {
    try {
      const res = await this.get<ApiResponse<ConsignmentDto>>(`/orders/${orderId}/consignment`);
      return res.success ? res.data : null;
    } catch {
      return null;
    }
  }

  async dispatch(orderId: number, payload: { courierId: number; note?: string; codAmount?: number }): Promise<ConsignmentDto> {
    const res = await this.post<ApiResponse<ConsignmentDto>>(`/orders/${orderId}/dispatch`, payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async dispatchManual(orderId: number, payload: { courierId: number; trackingId: string; codAmount?: number }): Promise<ConsignmentDto> {
    const res = await this.post<ApiResponse<ConsignmentDto>>(`/orders/${orderId}/dispatch/manual`, payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getEvents(consignmentId: number): Promise<DeliveryEventDto[]> {
    const res = await this.get<ApiResponse<DeliveryEventDto[]>>(`/consignments/${consignmentId}/events`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async recordOutcome(consignmentId: number, outcome: ConsignmentStatus): Promise<ConsignmentDto> {
    const res = await this.post<ApiResponse<ConsignmentDto>>(`/consignments/${consignmentId}/outcome`, { outcome });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const consignmentApi = new ConsignmentApi();

// Mirrors the backend's DispatchPreconditions. It exists to EXPLAIN, never to authorize -- the
// backend checks all of this again and is the only thing that decides. The value here is that an
// admin reads why an order cannot go out in plain words instead of clicking and getting a 400.
const dispatchBlockedReason = (order: OrderDetailDto): string | null => {
  if (order.customerId === null) {
    return 'This order came from a connected external platform, which owns its fulfilment. Dispatch it from that platform instead.';
  }
  // A cash-on-delivery order is legitimately unpaid at dispatch -- the money arrives at the door.
  // fulfilment-readiness-prd backend task group 03 widened the dispatchable set for COD only, and
  // this mirror has to match or it would block a dispatch the backend would happily accept.
  const dispatchableStatuses = order.paymentMethod === 'CashOnDelivery'
    ? ['PendingPayment', 'Paid', 'Processing']
    : ['Paid', 'Processing'];

  if (!dispatchableStatuses.includes(order.status)) {
    return `An order with status ${order.status} cannot be dispatched.`;
  }
  if (!order.shippingAddress.recipientPhoneNormalized) {
    return 'This order has no usable recipient phone number, which every courier requires.';
  }
  if (!order.shippingAddress.line1 || !order.shippingAddress.city) {
    return 'This order has no usable delivery address.';
  }
  return null;
};

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

interface DispatchPanelProps {
  order: OrderDetailDto;
}

export const DispatchPanel: React.FC<DispatchPanelProps> = ({ order }) => {
  const queryClient = useQueryClient();

  const [courierId, setCourierId] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [codOverride, setCodOverride] = useState<string>('');

  const { data: consignment, isLoading } = useQuery({
    queryKey: ['consignment', order.id],
    queryFn: () => consignmentApi.getForOrder(order.id),
  });

  const { data: couriers } = useQuery({
    queryKey: ['couriers', { includeInactive: false }],
    queryFn: () => courierApi.getAll(false),
  });

  const { data: events } = useQuery({
    queryKey: ['consignment', consignment?.id, 'events'],
    queryFn: () => consignmentApi.getEvents(consignment!.id),
    enabled: !!consignment,
  });

  const selectedCourier: CourierDto | undefined = useMemo(
    () => couriers?.find((c) => c.id === courierId),
    [couriers, courierId],
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['consignment', order.id] });
    queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const dispatchMutation = useMutation({
    mutationFn: () => {
      const cod = codOverride === '' ? undefined : Number(codOverride);

      if (selectedCourier?.integration === 'Manual') {
        return consignmentApi.dispatchManual(order.id, { courierId: Number(courierId), trackingId, codAmount: cod });
      }

      return consignmentApi.dispatch(order.id, { courierId: Number(courierId), note: note || undefined, codAmount: cod });
    },
    onSuccess: () => {
      toast.success('Order dispatched');
      refresh();
    },
    // Carries the courier's own rejection message through verbatim (a 422 from the backend) --
    // "recipient phone invalid for this delivery zone" is actionable, "dispatch failed" is not.
    onError: (err: Error) => toast.error(err.message),
  });

  const outcomeMutation = useMutation({
    mutationFn: (outcome: ConsignmentStatus) => consignmentApi.recordOutcome(consignment!.id, outcome),
    onSuccess: () => {
      toast.success('Delivery outcome recorded');
      refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const blockedReason = dispatchBlockedReason(order);

  if (isLoading) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Truck className="w-5 h-5" /> Delivery
      </h2>

      {consignment ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Courier</div>
              <div className="text-gray-900 dark:text-white">{consignment.courierName}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Consignment</div>
              <div className="text-gray-900 dark:text-white">{consignment.externalConsignmentId ?? '—'}</div>
            </div>
            {consignment.trackingCode && (
              <div>
                <div className="text-gray-500 dark:text-gray-400">Tracking code</div>
                <div className="text-gray-900 dark:text-white">{consignment.trackingCode}</div>
              </div>
            )}
            <div>
              <div className="text-gray-500 dark:text-gray-400">Dispatched</div>
              <div className="text-gray-900 dark:text-white">{new Date(consignment.dispatchedAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Cash to collect</div>
              <div className="text-gray-900 dark:text-white">
                {order.currency} {consignment.codAmount.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Status</div>
              <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${consignmentStatusClasses[consignment.status]}`}>
                {consignmentStatusLabel[consignment.status]}
              </span>
              {consignment.outcomeSetBy && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {outcomeSourceLabel[consignment.outcomeSetBy]}
                  {consignment.outcomeAt && ` · ${new Date(consignment.outcomeAt).toLocaleString()}`}
                </div>
              )}
            </div>
          </div>

          {consignment.isManuallyEntered && consignment.status === 'InFlight' && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                This courier has no API, so its final outcome is recorded here.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={outcomeMutation.isPending}
                  onClick={() => outcomeMutation.mutate('Delivered')}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Mark delivered
                </button>
                <button
                  type="button"
                  disabled={outcomeMutation.isPending}
                  onClick={() => outcomeMutation.mutate('Returned')}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  Mark returned
                </button>
              </div>
            </div>
          )}

          {events && events.length > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery history</div>
              <ul className="space-y-2">
                {events.map((event) => (
                  <li key={event.id} className="flex items-start justify-between text-sm">
                    <div>
                      <span className="text-gray-900 dark:text-white">{consignmentStatusLabel[event.outcome]}</span>
                      {/* The courier's own word, kept verbatim -- when a mapping turns out wrong,
                          this is the only record of what was actually reported. */}
                      <span className="text-gray-500 dark:text-gray-400"> · {event.externalStatus}</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{outcomeSourceLabel[event.source]}</div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(event.occurredAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : blockedReason ? (
        <div className="flex items-start gap-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">This order cannot be dispatched yet</div>
            <div>{blockedReason}</div>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            dispatchMutation.mutate();
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Courier</label>
            <select
              className={inputClasses}
              value={courierId}
              onChange={(e) => setCourierId(e.target.value === '' ? '' : Number(e.target.value))}
              required
            >
              <option value="">Choose a courier…</option>
              {(couriers ?? []).map((courier) => (
                <option key={courier.id} value={courier.id} disabled={!courier.canDispatch}>
                  {courier.name}
                  {!courier.canDispatch ? ' (not connected)' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedCourier?.integration === 'Manual' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tracking ID</label>
              <input
                className={inputClasses}
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="The reference this courier gave you"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note <span className="text-gray-400">(optional)</span>
              </label>
              <input
                className={inputClasses}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Passed to the courier with the parcel"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cash to collect{' '}
              <span className="text-gray-400">
                {order.paymentMethod === 'CashOnDelivery'
                  ? `(defaults to ${order.currency} ${order.total.toFixed(2)} — this order is unpaid)`
                  : '(this order is already paid, so nothing is collected)'}
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputClasses}
              value={codOverride}
              onChange={(e) => setCodOverride(e.target.value)}
              placeholder={order.paymentMethod === 'CashOnDelivery' ? order.total.toFixed(2) : '0.00'}
            />
          </div>

          <button
            type="submit"
            disabled={courierId === '' || dispatchMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Truck className="w-4 h-4" />
            {dispatchMutation.isPending ? 'Dispatching…' : 'Dispatch order'}
          </button>
        </form>
      )}
    </div>
  );
};
