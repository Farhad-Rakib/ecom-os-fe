import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { toast } from '../../../components/ui/Toast/toast.store';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';

export interface OrderSettingsDto {
  cashOnDeliveryEnabled: boolean;
}

class OrderSettingsApi extends BaseRepository {
  constructor() { super('/orders/settings'); }

  async get_(): Promise<OrderSettingsDto> {
    const res = await this.get<ApiResponse<OrderSettingsDto>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async update(payload: OrderSettingsDto): Promise<OrderSettingsDto> {
    const res = await this.put<ApiResponse<OrderSettingsDto>>('', payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const orderSettingsApi = new OrderSettingsApi();

export const OrderSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', 'settings'],
    queryFn: () => orderSettingsApi.get_(),
  });

  const mutation = useMutation({
    mutationFn: (cashOnDeliveryEnabled: boolean) => orderSettingsApi.update({ cashOnDeliveryEnabled }),
    onSuccess: (updated) => {
      toast.success(
        updated.cashOnDeliveryEnabled
          ? 'Cash on delivery enabled'
          : 'Cash on delivery disabled for new orders',
      );
      queryClient.invalidateQueries({ queryKey: ['orders', 'settings'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <Loader />;
  if (error || !data) return <ErrorState message={(error as Error)?.message || 'Could not load order settings'} />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">How your store takes orders</p>
      </div>

      <section className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Cash on delivery</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Lets buyers pay the courier at the door. A cash-on-delivery order can be dispatched
              before it is paid, and is marked paid when the courier reports the delivery.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 shrink-0 pt-1">
            <input
              type="checkbox"
              className="rounded border-gray-300 dark:border-gray-600"
              checked={data.cashOnDeliveryEnabled}
              disabled={mutation.isPending}
              onChange={(e) => mutation.mutate(e.target.checked)}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {data.cashOnDeliveryEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        {/* States the one thing an admin is most likely to worry about before switching it off. */}
        {data.cashOnDeliveryEnabled && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Turning this off stops new cash-on-delivery orders only. Orders already placed stay
            dispatchable and can still be settled.
          </p>
        )}
      </section>
    </div>
  );
};
