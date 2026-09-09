import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { RatingBadge, DeliveryRatingDto } from '../components/RatingBadge';

export interface RecipientOrderDto {
  id: number;
  customerId: number | null;
  recipientName: string;
  buyerName: string | null;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  // Null while in flight or never dispatched -- deliberately distinct from a settled outcome.
  deliveryOutcome: string | null;
}

export interface RecipientDto {
  normalizedPhone: string;
  namesOrderedUnder: string[];
  linkedCustomerId: number | null;
  linkedCustomerName: string | null;
  linkedCustomerEmail: string | null;
  linkedCustomerIsActive: boolean;
  orders: RecipientOrderDto[];
  rating: DeliveryRatingDto | null;
}

class RecipientApi extends BaseRepository {
  constructor() { super('/admin'); }

  // Phone travels as a query parameter, not a path segment -- a real number carries a leading "+",
  // which gets mangled in a path by clients and proxies that decode it back to a space.
  async getByPhone(phone: string): Promise<RecipientDto> {
    const res = await this.get<ApiResponse<RecipientDto>>('/recipients', { params: { phone } });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getRatingsForOrders(orderIds: number[]): Promise<Record<number, DeliveryRatingDto>> {
    const res = await this.post<ApiResponse<Record<number, DeliveryRatingDto>>>('/ratings/batch', { orderIds });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const recipientApi = new RecipientApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

const sectionClasses = 'rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900';

export const RecipientPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const phoneParam = searchParams.get('phone') ?? '';
  const [input, setInput] = useState(phoneParam);

  const { data: recipient, isLoading, error } = useQuery({
    queryKey: ['recipient', phoneParam],
    queryFn: () => recipientApi.getByPhone(phoneParam),
    enabled: phoneParam.trim().length > 0,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recipient lookup</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Check a phone number's delivery history before dispatching to it
        </p>
      </div>

      <form
        className="flex gap-3 max-w-lg"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchParams(input.trim() ? { phone: input.trim() } : {});
        }}
      >
        <input
          className={inputClasses}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Any format — 01712-345678, +8801712345678"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
        >
          <Search className="w-4 h-4" /> Look up
        </button>
      </form>

      {/* A 400 means the number could not be read. Shown here as a validation message, deliberately
          distinct from a valid number that simply has no history (which returns 200 with an empty
          recipient). */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 max-w-lg">
          {error.message}
        </div>
      )}

      {isLoading && <div className="text-gray-600 dark:text-gray-400">Looking up…</div>}

      {recipient && (
        <div className="space-y-6">
          <div className={sectionClasses}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Recipient</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">{recipient.normalizedPhone}</div>
                {recipient.namesOrderedUnder.length > 0 && (
                  // Plural on purpose: a household or shop shares one number, and collapsing that to
                  // a single name would assert something untrue about who the buyer is.
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Ordered under: {recipient.namesOrderedUnder.join(', ')}
                  </div>
                )}
              </div>
              <RatingBadge rating={recipient.rating} />
            </div>

            {recipient.linkedCustomerId !== null && (
              <button
                type="button"
                onClick={() => navigate(`/customers/${recipient.linkedCustomerId}`)}
                className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <User className="w-4 h-4" />
                {recipient.linkedCustomerName}
                {recipient.linkedCustomerEmail && ` (${recipient.linkedCustomerEmail})`}
                {!recipient.linkedCustomerIsActive && ' — deactivated'}
              </button>
            )}
          </div>

          <div className={sectionClasses}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Orders to this number
            </h2>

            {recipient.orders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This number has no order history.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Delivery</th>
                    <th className="pb-2 font-medium">Total</th>
                    <th className="pb-2 font-medium">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {recipient.orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-2 text-gray-900 dark:text-white">#{order.id}</td>
                      <td className="py-2 text-gray-900 dark:text-white">{order.recipientName}</td>
                      <td className="py-2 text-gray-900 dark:text-white">{order.status}</td>
                      <td className="py-2">
                        {order.deliveryOutcome === 'Delivered' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Delivered
                          </span>
                        )}
                        {order.deliveryOutcome === 'Returned' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            Returned
                          </span>
                        )}
                        {order.deliveryOutcome === null && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Not settled</span>
                        )}
                      </td>
                      <td className="py-2 text-gray-900 dark:text-white">{order.currency} {order.total.toFixed(2)}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
