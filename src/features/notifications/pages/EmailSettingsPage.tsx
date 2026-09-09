import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Send, RotateCcw, Save } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { notificationsApi, UpdateEmailSettingsPayload } from '../notifications.api';

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

export const EmailSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<UpdateEmailSettingsPayload>({
    senderName: '',
    senderAddress: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    useSsl: true,
  });
  const [password, setPassword] = useState('');
  const [revealPassword, setRevealPassword] = useState(false);
  const [testAddress, setTestAddress] = useState('');
  const [isRevertOpen, setIsRevertOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', 'email-settings'],
    queryFn: () => notificationsApi.getSettings(),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      senderName: data.senderName,
      senderAddress: data.senderAddress,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpUsername: data.smtpUsername,
      useSsl: data.useSsl,
    });
    // Deliberately never populated from the server -- the API returns only hasSmtpPassword, and
    // the field stays empty so saving without touching it keeps whatever is stored.
    setPassword('');
  }, [data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications', 'email-settings'] });

  const saveMutation = useMutation({
    mutationFn: () => notificationsApi.updateSettings({
      ...form,
      smtpPassword: password || undefined,
    }),
    onSuccess: () => {
      toast.success('Email settings saved');
      setPassword('');
      setRevealPassword(false);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const revertMutation = useMutation({
    mutationFn: () => notificationsApi.revertToPlatformDefault(),
    onSuccess: () => {
      toast.success('Reverted to the platform default sender');
      setIsRevertOpen(false);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setIsRevertOpen(false);
    },
  });

  const testMutation = useMutation({
    mutationFn: () => notificationsApi.sendTest(testAddress),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Test message sent');
      } else {
        // The SMTP server's own words. "535 Authentication credentials invalid" tells an admin
        // exactly what to fix; "sending failed" tells them nothing.
        toast.error(result.message ?? 'The test message could not be sent.');
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <Loader />;
  if (error || !data) return <ErrorState message={(error as Error)?.message || 'Could not load email settings'} />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          The address your customers receive order emails from
        </p>
      </div>

      {data.usingPlatformDefault && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            You are using the platform's own mail server, so your customers see{' '}
            <strong>{data.senderAddress}</strong> as the sender. Configure your own below to send
            from your shop's address instead.
          </p>
        </div>
      )}

      <form
        className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sender name</label>
            <input
              className={inputClasses}
              value={form.senderName}
              onChange={(e) => setForm({ ...form, senderName: e.target.value })}
              placeholder="Ada's Shop"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sender address</label>
            <input
              className={inputClasses}
              type="email"
              value={form.senderAddress}
              onChange={(e) => setForm({ ...form, senderAddress: e.target.value })}
              placeholder="orders@adas-shop.example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP host</label>
            <input
              className={inputClasses}
              value={form.smtpHost}
              onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
              placeholder="smtp.example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP port</label>
            <input
              className={inputClasses}
              type="number"
              min={1}
              max={65535}
              value={form.smtpPort}
              onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SMTP username <span className="text-gray-400">(optional)</span>
            </label>
            <input
              className={inputClasses}
              value={form.smtpUsername ?? ''}
              onChange={(e) => setForm({ ...form, smtpUsername: e.target.value })}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP password</label>
            <div className="relative">
              <input
                className={inputClasses}
                type={revealPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={data.hasSmtpPassword ? 'Leave blank to keep the saved password' : ''}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setRevealPassword(!revealPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={revealPassword ? 'Hide password' : 'Show password'}
              >
                {revealPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {data.hasSmtpPassword && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A password is saved and is never shown again. Entering a new one replaces it.
              </p>
            )}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className="rounded border-gray-300 dark:border-gray-600"
            checked={form.useSsl}
            onChange={(e) => setForm({ ...form, useSsl: e.target.checked })}
          />
          Use SSL/TLS
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving…' : 'Save settings'}
          </button>

          {!data.usingPlatformDefault && (
            <button
              type="button"
              onClick={() => setIsRevertOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              <RotateCcw className="w-4 h-4" />
              Revert to platform default
            </button>
          )}
        </div>
      </form>

      <section className="space-y-3 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Send a test message</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Checks these settings without waiting for a real order.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className={inputClasses}
            type="email"
            value={testAddress}
            onChange={(e) => setTestAddress(e.target.value)}
            placeholder="you@example.com"
          />
          <button
            type="button"
            disabled={!testAddress || testMutation.isPending}
            onClick={() => testMutation.mutate()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
            {testMutation.isPending ? 'Sending…' : 'Send test'}
          </button>
        </div>
      </section>

      <ConfirmDialog
        isOpen={isRevertOpen}
        onClose={() => setIsRevertOpen(false)}
        onConfirm={() => revertMutation.mutate()}
        title="Revert to platform default"
        message="Your SMTP settings will be removed and customer emails will be sent from the platform's own address again. Mail keeps working throughout."
        confirmText="Revert"
        variant="warning"
      />
    </div>
  );
};
