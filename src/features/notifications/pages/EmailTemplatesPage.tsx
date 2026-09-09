import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { Loader } from '../../../components/ui/Loader/Loader';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { toast } from '../../../components/ui/Toast/toast.store';
import { notificationsApi, templateLabel } from '../notifications.api';

const inputClasses =
  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500';

export const EmailTemplatesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['notifications', 'templates'],
    queryFn: () => notificationsApi.getTemplates(),
  });

  useEffect(() => {
    if (!selectedKey && templates && templates.length > 0) {
      setSelectedKey(templates[0].templateKey);
    }
  }, [templates, selectedKey]);

  const { data: template } = useQuery({
    queryKey: ['notifications', 'template', selectedKey],
    queryFn: () => notificationsApi.getTemplate(selectedKey!),
    enabled: !!selectedKey,
  });

  useEffect(() => {
    if (!template) return;
    setSubject(template.subject);
    setHtmlBody(template.htmlBody);
  }, [template]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications', 'templates'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'template', selectedKey] });
  };

  const saveMutation = useMutation({
    mutationFn: (isEnabled: boolean) =>
      notificationsApi.updateTemplate(selectedKey!, { subject, htmlBody, isEnabled }),
    onSuccess: () => {
      toast.success('Template saved');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
      notificationsApi.getTemplate(key).then((t) =>
        notificationsApi.updateTemplate(key, { subject: t.subject, htmlBody: t.htmlBody, isEnabled })),
    onSuccess: (updated) => {
      toast.success(updated.isEnabled ? 'Message switched on' : 'Message switched off');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <Loader />;
  if (error || !templates) return <ErrorState message={(error as Error)?.message || 'Could not load templates'} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Templates</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          What your customers read when something happens to their order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ul className="space-y-2 lg:col-span-1">
          {templates.map((t) => (
            <li
              key={t.templateKey}
              className={`rounded-lg border px-3 py-3 ${
                t.templateKey === selectedKey
                  ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedKey(t.templateKey)}
                  className="text-left"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {templateLabel[t.templateKey] ?? t.templateKey}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.subject}</div>
                </button>

                <label className="inline-flex items-center gap-2 shrink-0">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600"
                    checked={t.isEnabled}
                    disabled={toggleMutation.isPending}
                    onChange={(e) => toggleMutation.mutate({ key: t.templateKey, isEnabled: e.target.checked })}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>

        <div className="lg:col-span-2">
          {template && (
            <form
              className="space-y-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(template.isEnabled);
              }}
            >
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {templateLabel[template.templateKey] ?? template.templateKey}
              </h2>

              {!template.isEnabled && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  This message is switched off. Customers will not receive it.
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input className={inputClasses} value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body</label>
                <textarea
                  className={`${inputClasses} font-mono text-xs`}
                  rows={12}
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available values
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.availableTokens.map((token) => (
                    <code
                      key={token}
                      className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {`{{${token}}}`}
                    </code>
                  ))}
                </div>
                {/* Says plainly what happens to a typo, because the backend leaves an unknown
                    token visible rather than blanking it -- which is the behaviour that makes a
                    mistake findable. */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Anything else in double braces is left in the message exactly as written, so a
                  mistyped value is visible rather than silently blank.
                </p>
              </div>

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Saving…' : 'Save template'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
