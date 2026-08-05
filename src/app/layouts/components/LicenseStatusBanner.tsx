import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, X } from 'lucide-react';
import { tenantSelfApi, LicenseStatus } from '../../../core/api/services/tenant-self.api';

const BANNER_STYLES: Partial<Record<LicenseStatus, { container: string; icon: React.ReactNode; message: string; dismissible: boolean }>> = {
  [LicenseStatus.Trial]: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    icon: <Info className="w-4 h-4 shrink-0" />,
    message: "You're on a trial license.",
    dismissible: true,
  },
  [LicenseStatus.GracePeriod]: {
    container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
    message: 'Your license has expired and is in its grace period. Renew soon to avoid losing access.',
    dismissible: true,
  },
  [LicenseStatus.Expired]: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
    message: 'Your license has expired. Most features are unavailable until it is renewed — contact your administrator.',
    dismissible: false,
  },
  [LicenseStatus.Suspended]: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
    message: 'This tenant has been suspended. Contact your administrator.',
    dismissible: false,
  },
};

export const LicenseStatusBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery({
    queryKey: ['tenant-self-license'],
    queryFn: () => tenantSelfApi.getLicenseStatus(),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });

  if (!data || data.status === LicenseStatus.Active) return null;

  const config = BANNER_STYLES[data.status];
  if (!config || (config.dismissible && dismissed)) return null;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 border-b text-sm ${config.container}`}>
      {config.icon}
      <span className="flex-1">{config.message}</span>
      {config.dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
