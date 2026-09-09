import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plug, Power, Pencil, X } from 'lucide-react';
import { DataTable, Column } from '../../../components/table/DataTable';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { toast } from '../../../components/ui/Toast/toast.store';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';

export type CourierIntegration = 'Manual' | 'Steadfast';

export type CourierConnectionStatus = 'NotApplicable' | 'NotConnected' | 'Connected' | 'Failed';

export interface CourierDto {
  id: number;
  name: string;
  integration: CourierIntegration;
  coverageNotes: string | null;
  displayOrder: number;
  isActive: boolean;
  statusUpdatesEnabled: boolean;
  hasCredentials: boolean;
  connectionStatus: CourierConnectionStatus;
  lastTestedAt: string | null;
  lastFailureReason: string | null;
  canDispatch: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourierCredentialField {
  key: string;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
  helpText?: string;
}

export interface SupportedIntegration {
  value: CourierIntegration;
  label: string;
  description: string;
  credentialFields: CourierCredentialField[];
}

// Steadfast is the only API-backed courier in v1, but the selector is driven by this array rather
// than a hardcoded Steadfast form -- adding Pathao or RedX later is a new entry here, not a
// rewritten page. Same call store-sync-prd made with SUPPORTED_PLATFORMS.
export const SUPPORTED_INTEGRATIONS: SupportedIntegration[] = [
  {
    value: 'Manual',
    label: 'Manual / Offline',
    description: 'A courier with no API. Consignments and delivery outcomes are recorded by hand.',
    credentialFields: [],
  },
  {
    value: 'Steadfast',
    label: 'Steadfast',
    description: 'Connects to the Steadfast Courier API for dispatch and delivery status.',
    credentialFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Steadfast Api-Key' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Your Steadfast Secret-Key' },
      {
        key: 'webhookToken',
        label: 'Webhook Token',
        type: 'password',
        placeholder: 'Bearer token Steadfast sends on delivery callbacks',
        helpText: 'Optional, but delivery updates arrive far slower without it — only the periodic poll will pick them up.',
      },
    ],
  },
];

export const integrationLabel = (integration: CourierIntegration): string =>
  SUPPORTED_INTEGRATIONS.find((i) => i.value === integration)?.label ?? integration;

// NotApplicable is deliberately styled as neutral, not as a warning: a manual courier has nothing
// to connect to and must never be presented as misconfigured.
export const connectionStatusClasses: Record<CourierConnectionStatus, string> = {
  NotApplicable: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  NotConnected: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Connected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const connectionStatusLabel: Record<CourierConnectionStatus, string> = {
  NotApplicable: 'No connection needed',
  NotConnected: 'Not connected',
  Connected: 'Connected',
  Failed: 'Connection failed',
};

class CourierApi extends BaseRepository {
  constructor() { super('/couriers'); }

  async getAll(includeInactive: boolean): Promise<CourierDto[]> {
    const res = await this.get<ApiResponse<CourierDto[]>>('', { params: { includeInactive } });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getById(id: number): Promise<CourierDto> {
    const res = await this.get<ApiResponse<CourierDto>>(`/${id}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async create(payload: CourierWritePayload): Promise<CourierDto> {
    const res = await this.post<ApiResponse<CourierDto>>('', payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async update(id: number, payload: CourierWritePayload): Promise<CourierDto> {
    const res = await this.put<ApiResponse<CourierDto>>(`/${id}`, payload);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async setActive(id: number, isActive: boolean): Promise<CourierDto> {
    const res = await this.patch<ApiResponse<CourierDto>>(`/${id}/active`, { isActive });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async setStatusUpdates(id: number, enabled: boolean): Promise<CourierDto> {
    const res = await this.patch<ApiResponse<CourierDto>>(`/${id}/status-updates`, { enabled });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async connect(id: number, credentialFields: Record<string, string>): Promise<CourierDto> {
    const res = await this.post<ApiResponse<CourierDto>>(`/${id}/connection`, { credentialFields });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async testConnection(id: number): Promise<{ success: boolean; message: string | null }> {
    const res = await this.post<ApiResponse<{ success: boolean; message: string | null }>>(`/${id}/connection/test`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async disconnect(id: number): Promise<void> {
    await this.delete(`/${id}/connection`);
  }
}

export interface CourierWritePayload {
  name: string;
  integration: CourierIntegration;
  coverageNotes: string | null;
  displayOrder: number;
}

export const courierApi = new CourierApi();

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

const emptyForm: CourierWritePayload = { name: '', integration: 'Steadfast', coverageNotes: null, displayOrder: 0 };

export const CouriersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [includeInactive, setIncludeInactive] = useState(false);
  const [editing, setEditing] = useState<CourierDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<CourierWritePayload>(emptyForm);
  const [pendingActive, setPendingActive] = useState<CourierDto | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['couriers', { includeInactive }],
    queryFn: () => courierApi.getAll(includeInactive),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['couriers'] });

  const saveMutation = useMutation({
    mutationFn: (payload: CourierWritePayload) =>
      editing ? courierApi.update(editing.id, payload) : courierApi.create(payload),
    onSuccess: () => {
      toast.success(editing ? 'Courier updated' : 'Courier created');
      setIsFormOpen(false);
      setEditing(null);
      invalidate();
    },
    // The backend's own message carries the useful detail -- a duplicate name comes back as a 409
    // naming the courier, which is far more actionable than "save failed".
    onError: (err: Error) => toast.error(err.message),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => courierApi.setActive(id, isActive),
    onSuccess: (courier) => {
      toast.success(courier.isActive ? 'Courier activated' : 'Courier deactivated');
      setPendingActive(null);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingActive(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (courier: CourierDto) => {
    setEditing(courier);
    setForm({
      name: courier.name,
      integration: courier.integration,
      coverageNotes: courier.coverageNotes,
      displayOrder: courier.displayOrder,
    });
    setIsFormOpen(true);
  };

  const columns: Column<CourierDto>[] = [
    {
      key: 'name',
      label: 'Courier',
      render: (_, courier) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{courier.name}</div>
          {courier.coverageNotes && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{courier.coverageNotes}</div>
          )}
        </div>
      ),
    },
    { key: 'integration', label: 'Integration', width: '160px', render: (_, c) => integrationLabel(c.integration) },
    {
      key: 'connectionStatus',
      label: 'Connection',
      width: '190px',
      render: (_, courier) => (
        <div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${connectionStatusClasses[courier.connectionStatus]}`}>
            {connectionStatusLabel[courier.connectionStatus]}
          </span>
          {courier.connectionStatus === 'Failed' && courier.lastFailureReason && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">{courier.lastFailureReason}</div>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      width: '110px',
      render: (_, courier) => (
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            courier.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {courier.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'statusUpdatesEnabled',
      label: 'Delivery feed',
      width: '130px',
      render: (_, courier) =>
        // Manual couriers have no feed to pause, so the cell stays empty rather than claiming one
        // is running.
        courier.integration === 'Manual' ? (
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        ) : (
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              courier.statusUpdatesEnabled
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            {courier.statusUpdatesEnabled ? 'Receiving' : 'Paused'}
          </span>
        ),
    },
  ];

  const selectedIntegration = SUPPORTED_INTEGRATIONS.find((i) => i.value === form.integration);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Couriers</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage the courier companies you dispatch orders through
        </p>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={includeInactive}
          onChange={(e) => setIncludeInactive(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600"
        />
        Show deactivated couriers
      </label>

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error?.message}
        searchable={false}
        sortable={false}
        actions={{ add: { label: 'Add Courier', onClick: openCreate } }}
        rowActions={[
          {
            icon: Pencil,
            label: 'Edit',
            onClick: openEdit,
            variant: 'secondary',
          },
          {
            icon: Plug,
            label: 'Connection',
            onClick: (courier) => navigate(`/couriers/${courier.id}/connection`),
            variant: 'primary',
            // A manual courier has no connection to configure -- offering the action would lead to
            // a page that can only tell them so.
            show: (courier) => courier.integration !== 'Manual',
          },
          {
            icon: Power,
            label: 'Activate / Deactivate',
            onClick: (courier) => setPendingActive(courier),
            variant: 'warning',
          },
        ]}
        emptyState={{
          title: 'No couriers yet',
          description: 'Add the courier companies you use so orders can be dispatched to them',
        }}
        onRetry={() => refetch()}
      />

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editing ? `Edit ${editing.name}` : 'Add Courier'}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(form);
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  className={inputClasses}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Integration</label>
                <select
                  className={inputClasses}
                  value={form.integration}
                  onChange={(e) => setForm({ ...form, integration: e.target.value as CourierIntegration })}
                >
                  {SUPPORTED_INTEGRATIONS.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
                {selectedIntegration && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedIntegration.description}</p>
                )}
                {editing && editing.integration !== form.integration && editing.hasCredentials && (
                  // Mirrors the backend, which discards credentials when the integration changes --
                  // an admin should know that before saving, not discover it afterwards.
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Changing the integration will discard this courier's saved credentials.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Coverage notes <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  className={inputClasses}
                  value={form.coverageNotes ?? ''}
                  onChange={(e) => setForm({ ...form, coverageNotes: e.target.value || null })}
                  placeholder="e.g. Dhaka metro only"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display order</label>
                <input
                  type="number"
                  min={0}
                  className={inputClasses}
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingActive !== null}
        onClose={() => setPendingActive(null)}
        onConfirm={() => pendingActive && activeMutation.mutate({ id: pendingActive.id, isActive: !pendingActive.isActive })}
        title={pendingActive?.isActive ? 'Deactivate courier' : 'Activate courier'}
        message={
          pendingActive?.isActive
            ? `${pendingActive?.name} will no longer be available for dispatch. Consignments already sent through it are kept.`
            : `${pendingActive?.name} will be available for dispatch again.`
        }
        confirmText={pendingActive?.isActive ? 'Deactivate' : 'Activate'}
        variant={pendingActive?.isActive ? 'warning' : 'info'}
      />
    </div>
  );
};
