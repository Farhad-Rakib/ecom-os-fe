import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../core/api/services/auth.api';
import { useSiteSettingsStore } from '../../core/stores/site-settings.store';

export const AuthLayout: React.FC = () => {
  const { siteTitle, setBranding } = useSiteSettingsStore();

  const { data: branding } = useQuery({
    queryKey: ['auth-branding'],
    queryFn: () => authApi.getBranding().catch(() => null),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (branding) {
      setBranding(branding);
    }
  }, [branding]);

  const title = siteTitle || branding?.title || 'Admin Panel';
  const description = branding?.tagline || '';

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
