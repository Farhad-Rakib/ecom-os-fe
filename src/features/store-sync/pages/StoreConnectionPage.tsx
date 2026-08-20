import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { toast } from '../../../components/ui/Toast/toast.store';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';

export interface StoreConnectionStatusDto {
  platform: string | null;
  status: string | null;
  lastCatalogSyncedAt: string | null;
  lastOrderSyncedAt: string | null;
}

interface CatalogSyncResultDto {
  categoriesSynced: number;
  productsSynced: number;
  failedRecords: number;
  syncedAt: string;
}

interface OrderSyncResultDto {
  ordersSynced: number;
  failedRecords: number;
  syncedAt: string;
}

interface PlatformCredentialField {
  key: string;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
}

interface SupportedPlatform {
  value: string;
  label: string;
  credentialFields: PlatformCredentialField[];
}

// Only Shopify is functional in v1, but the selector is driven by this array (not a hardcoded
// Shopify-only form) so a second platform later is a new entry here, not a rewritten form --
// see slipway/memory/store-sync-prd/decisions.md.
const SUPPORTED_PLATFORMS: SupportedPlatform[] = [
  {
    value: 'Shopify',
    label: 'Shopify',
    credentialFields: [
      { key: 'shopDomain', label: 'Shop Domain', type: 'text', placeholder: 'your-store.myshopify.com' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    ],
  },
];

class StoreSyncApi extends BaseRepository {
  constructor() {
    super('/store-sync');
  }

  async getConnection(): Promise<StoreConnectionStatusDto> {
    const res = await this.get<ApiResponse<StoreConnectionStatusDto>>('/connection');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async connect(payload: { platform: string; credentialFields: Record<string, string> }): Promise<StoreConnectionStatusDto> {
    const res = await this.post<ApiResponse<StoreConnectionStatusDto>>('/connection', payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async disconnect(): Promise<void> {
    await this.delete<void>('/connection');
  }

  async syncCatalog(): Promise<CatalogSyncResultDto> {
    const res = await this.post<ApiResponse<CatalogSyncResultDto>>('/catalog/sync');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async syncOrders(): Promise<OrderSyncResultDto> {
    const res = await this.post<ApiResponse<OrderSyncResultDto>>('/orders/sync');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

const storeSyncApi = new StoreSyncApi();

const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

const formatDate = (value: string | null): string => (value ? new Date(value).toLocaleString() : 'Never');

export const StoreConnectionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState(SUPPORTED_PLATFORMS[0].value);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [catalogSyncResult, setCatalogSyncResult] = useState<CatalogSyncResultDto | null>(null);
  const [orderSyncResult, setOrderSyncResult] = useState<OrderSyncResultDto | null>(null);

  const { data: connection, isLoading } = useQuery({
    queryKey: ['store-sync-connection'],
    queryFn: () => storeSyncApi.getConnection(),
  });

  const selectedPlatform = SUPPORTED_PLATFORMS.find((p) => p.value === platform) ?? SUPPORTED_PLATFORMS[0];

  const connectMutation = useMutation({
    mutationFn: (payload: { platform: string; credentialFields: Record<string, string> }) => storeSyncApi.connect(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['store-sync-connection'], data);
      setConnectError(null);
      setCredentials({});
      toast.success('Store connected');
    },
    onError: (err: any) => setConnectError(err?.response?.data?.message || err.message || 'Failed to connect store'),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => storeSyncApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-sync-connection'] });
      setCatalogSyncResult(null);
      setOrderSyncResult(null);
      toast.success('Store disconnected');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to disconnect store'),
  });

  const catalogSyncMutation = useMutation({
    mutationFn: () => storeSyncApi.syncCatalog(),
    onSuccess: (data) => {
      setCatalogSyncResult(data);
      queryClient.invalidateQueries({ queryKey: ['store-sync-connection'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Catalog sync failed'),
  });

  const orderSyncMutation = useMutation({
    mutationFn: () => storeSyncApi.syncOrders(),
    onSuccess: (data) => {
      setOrderSyncResult(data);
      queryClient.invalidateQueries({ queryKey: ['store-sync-connection'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Order sync failed'),
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError(null);
    connectMutation.mutate({ platform, credentialFields: credentials });
  };

  const toggleShowSecret = (key: string) => setShowSecret((prev) => ({ ...prev, [key]: !prev[key] }));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasNoConnection =
    !connection ||
    (connection.platform === null &&
      connection.status === null &&
      connection.lastCatalogSyncedAt === null &&
      connection.lastOrderSyncedAt === null);
  const isActiveConnection = connection?.status === 'Connected';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Sync</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Connect an external store platform and sync its catalog and orders</p>
      </div>

      {!hasNoConnection && connection && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Store className="w-5 h-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Connection Status</h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Platform</span>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{connection.platform}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</span>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      isActiveConnection
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActiveConnection ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {connection.status}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Catalog Synced At</span>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatDate(connection.lastCatalogSyncedAt)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Order Synced At</span>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatDate(connection.lastOrderSyncedAt)}</p>
              </div>
            </div>

            {isActiveConnection && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => catalogSyncMutation.mutate()}
                  disabled={catalogSyncMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${catalogSyncMutation.isPending ? 'animate-spin' : ''}`} />
                  {catalogSyncMutation.isPending ? 'Syncing Catalog...' : 'Sync Catalog Now'}
                </button>
                <button
                  onClick={() => orderSyncMutation.mutate()}
                  disabled={orderSyncMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${orderSyncMutation.isPending ? 'animate-spin' : ''}`} />
                  {orderSyncMutation.isPending ? 'Syncing Orders...' : 'Sync Orders Now'}
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}

            {catalogSyncResult && (
              <div className="text-sm bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-700 dark:text-gray-300">
                  {catalogSyncResult.categoriesSynced} categories / {catalogSyncResult.productsSynced} products synced
                </p>
                {catalogSyncResult.failedRecords > 0 && (
                  <p className="text-amber-600 dark:text-amber-400 mt-1">
                    ⚠ {catalogSyncResult.failedRecords} records failed, will retry automatically
                  </p>
                )}
              </div>
            )}

            {orderSyncResult && (
              <div className="text-sm bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-700 dark:text-gray-300">{orderSyncResult.ordersSynced} orders synced</p>
                {orderSyncResult.failedRecords > 0 && (
                  <p className="text-amber-600 dark:text-amber-400 mt-1">
                    ⚠ {orderSyncResult.failedRecords} records failed, will retry automatically
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {(hasNoConnection || !isActiveConnection) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Store className="w-5 h-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {hasNoConnection ? 'Connect a Store' : 'Reconnect Store'}
            </h3>
          </div>
          <form onSubmit={handleConnect} className="p-6 space-y-4">
            <div>
              <label className={labelCls}>Platform</label>
              <select
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setCredentials({});
                }}
                className={inputCls}
              >
                {SUPPORTED_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlatform.credentialFields.map((field) => (
              <div key={field.key}>
                <label className={labelCls}>{field.label}</label>
                {field.type === 'password' ? (
                  <div className="relative">
                    <input
                      type={showSecret[field.key] ? 'text' : 'password'}
                      value={credentials[field.key] || ''}
                      onChange={(e) => setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      required
                      className={inputCls}
                      placeholder={field.placeholder}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={credentials[field.key] || ''}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    required
                    className={inputCls}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}

            {connectError && <p className="text-sm text-red-600 dark:text-red-400">{connectError}</p>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={connectMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {connectMutation.isPending ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={() => disconnectMutation.mutate()}
        title="Disconnect Store"
        message="Are you sure you want to disconnect this store? Sync actions will be unavailable until you reconnect."
        confirmText="Disconnect"
        variant="danger"
      />
    </div>
  );
};
