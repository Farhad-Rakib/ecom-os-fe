import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff, Plug, PlugZap, BellOff, Bell } from 'lucide-react';
import { toast } from '../../../components/ui/Toast/toast.store';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import {
  courierApi,
  SUPPORTED_INTEGRATIONS,
  connectionStatusClasses,
  connectionStatusLabel,
  integrationLabel,
} from './CouriersPage';

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

export const CourierConnectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courierId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [isPauseFeedOpen, setIsPauseFeedOpen] = useState(false);

  const { data: courier, isLoading, error } = useQuery({
    queryKey: ['couriers', courierId],
    queryFn: () => courierApi.getById(courierId),
    enabled: Number.isFinite(courierId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['couriers'] });
  };

  const connectMutation = useMutation({
    mutationFn: () => courierApi.connect(courierId, credentials),
    onSuccess: (updated) => {
      // Saved credentials are never returned by the backend, so the local form is cleared rather
      // than left holding secrets in component state after they are no longer needed.
      setCredentials({});
      setRevealed({});
      invalidate();

      if (updated.connectionStatus === 'Failed') {
        toast.error(updated.lastFailureReason ?? 'The courier rejected these credentials.');
      } else {
        toast.success('Connection saved and verified');
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const testMutation = useMutation({
    mutationFn: () => courierApi.testConnection(courierId),
    onSuccess: (result) => {
      invalidate();
      if (result.success) {
        toast.success('Connection is working');
      } else {
        // The courier's own words, not a generic failure -- that text is what tells an admin
        // whether the key is wrong or the courier is simply unreachable.
        toast.error(result.message ?? 'The connection test failed.');
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusUpdatesMutation = useMutation({
    mutationFn: (enabled: boolean) => courierApi.setStatusUpdates(courierId, enabled),
    onSuccess: (updated) => {
      toast.success(
        updated.statusUpdatesEnabled
          ? 'Delivery updates resumed'
          : 'Delivery updates paused — this courier can no longer change consignment statuses',
      );
      setIsPauseFeedOpen(false);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setIsPauseFeedOpen(false);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => courierApi.disconnect(courierId),
    onSuccess: () => {
      toast.success('Connection removed');
      setIsDisconnectOpen(false);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setIsDisconnectOpen(false);
    },
  });

  if (isLoading) {
    return <div className="text-gray-600 dark:text-gray-400">Loading courier…</div>;
  }

  if (error || !courier) {
    return <div className="text-red-600 dark:text-red-400">{error?.message ?? 'Courier not found.'}</div>;
  }

  const integration = SUPPORTED_INTEGRATIONS.find((i) => i.value === courier.integration);

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        type="button"
        onClick={() => navigate('/couriers')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back to couriers
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{courier.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{integrationLabel(courier.integration)} connection</p>
      </div>

      {courier.integration === 'Manual' ? (
        // A manual courier has nothing to connect to. Saying so plainly is the whole content of the
        // page -- it must never look like a connection that is merely missing.
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
          <p className="text-gray-700 dark:text-gray-300">
            This is a manual courier. There is nothing to connect — you record its consignments and
            delivery outcomes by hand from the order page.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${connectionStatusClasses[courier.connectionStatus]}`}>
                {connectionStatusLabel[courier.connectionStatus]}
              </span>
            </div>

            {courier.lastTestedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Last tested</span>
                <span className="text-gray-900 dark:text-white">{new Date(courier.lastTestedAt).toLocaleString()}</span>
              </div>
            )}

            {courier.connectionStatus === 'Failed' && courier.lastFailureReason && (
              <p className="text-sm text-red-600 dark:text-red-400">{courier.lastFailureReason}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={!courier.hasCredentials || testMutation.isPending}
                onClick={() => testMutation.mutate()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                <PlugZap className="w-4 h-4" />
                {testMutation.isPending ? 'Testing…' : 'Test connection'}
              </button>

              {courier.hasCredentials && (
                <button
                  type="button"
                  onClick={() => setIsDisconnectOpen(true)}
                  className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Deliberately its own card rather than a row in the Status block above: this is not a
              fact about the connection but a decision about whether to trust what comes back
              through it, and pausing it leaves the connection itself untouched. */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery updates</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Whether this courier's webhook callbacks and the periodic status poll are allowed
                  to update your consignments.
                </p>
              </div>
              <span
                className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-full ${
                  courier.statusUpdatesEnabled
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
              >
                {courier.statusUpdatesEnabled ? 'Receiving' : 'Paused'}
              </span>
            </div>

            {!courier.statusUpdatesEnabled && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Nothing this courier reports is being recorded. Consignments already in flight keep
                their current status and can still be settled by hand from the order page.
              </p>
            )}

            <button
              type="button"
              disabled={statusUpdatesMutation.isPending}
              onClick={() =>
                courier.statusUpdatesEnabled ? setIsPauseFeedOpen(true) : statusUpdatesMutation.mutate(true)
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              {courier.statusUpdatesEnabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {courier.statusUpdatesEnabled ? 'Pause delivery updates' : 'Resume delivery updates'}
            </button>
          </div>

          <form
            className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              connectMutation.mutate();
            }}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {courier.hasCredentials ? 'Replace credentials' : 'Add credentials'}
            </h2>

            {courier.hasCredentials && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Saved credentials are encrypted and never shown again. Entering new ones replaces them.
              </p>
            )}

            {(integration?.credentialFields ?? []).map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                <div className="relative">
                  <input
                    className={inputClasses}
                    type={field.type === 'password' && !revealed[field.key] ? 'password' : 'text'}
                    value={credentials[field.key] ?? ''}
                    placeholder={field.placeholder}
                    autoComplete="off"
                    onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => setRevealed({ ...revealed, [field.key]: !revealed[field.key] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      aria-label={revealed[field.key] ? `Hide ${field.label}` : `Show ${field.label}`}
                    >
                      {revealed[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {field.helpText && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{field.helpText}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={connectMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plug className="w-4 h-4" />
              {connectMutation.isPending ? 'Saving…' : 'Save and verify'}
            </button>
          </form>
        </>
      )}

      <ConfirmDialog
        isOpen={isPauseFeedOpen}
        onClose={() => setIsPauseFeedOpen(false)}
        onConfirm={() => statusUpdatesMutation.mutate(false)}
        title="Pause delivery updates"
        message={`${courier.name} will keep accepting dispatches, but nothing it reports will change a consignment until you resume. Outcomes it reports while paused are not queued — resume and the next update will be picked up.`}
        confirmText="Pause updates"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={isDisconnectOpen}
        onClose={() => setIsDisconnectOpen(false)}
        onConfirm={() => disconnectMutation.mutate()}
        title="Disconnect courier"
        message={`${courier.name} will stop accepting new dispatches until it is connected again. Existing consignments are kept.`}
        confirmText="Disconnect"
        variant="danger"
      />
    </div>
  );
};
