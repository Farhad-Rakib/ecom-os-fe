import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { siteSettingsApi } from '../../core/api/services/site-settings.api';
import { useSiteSettingsStore } from '../../core/stores/site-settings.store';

export const AuthLayout: React.FC = () => {
  const { siteTitle, setSettings, settings } = useSiteSettingsStore();

  const { data: fetchedSettings } = useQuery({
    queryKey: ['site-settings-all'],
    queryFn: () => siteSettingsApi.getAll().catch(() => []),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (fetchedSettings && fetchedSettings.length > 0 && fetchedSettings !== settings) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  const getVal = (key: string) => {
    const list = fetchedSettings || settings;
    const s = list.find(s => s.key === key);
    return s?.value || null;
  };

  const title = siteTitle || getVal('site_title') || getVal('SiteTitle') || 'Admin Panel';
  const description = getVal('site_description') || getVal('SiteDescription') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-400">{description}</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
