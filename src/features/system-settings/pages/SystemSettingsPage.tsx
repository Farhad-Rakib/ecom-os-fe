import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders } from 'lucide-react';
import { toast } from '../../../components/ui/Toast/toast.store';
import { BaseRepository } from '../../../core/api/base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

interface SystemSettingDto {
  id: number;
  key: string;
  value: string;
  description: string | null;
}

const AUTH_EMAIL_UNIQUENESS_KEY = 'Auth.EmailUniquenessScope';

class SystemSettingsApi extends BaseRepository {
  constructor() { super('/SystemSettings'); }

  async getByKey(key: string): Promise<SystemSettingDto | null> {
    try {
      const res = await this.get<ApiResponse<SystemSettingDto>>(`/${key}`);
      return res.success ? res.data : null;
    } catch {
      return null;
    }
  }

  async save(dto: { id: number; key: string; value: string; description: string | null }): Promise<SystemSettingDto> {
    const res = await this.post<ApiResponse<SystemSettingDto>>('', dto);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

const systemSettingsApi = new SystemSettingsApi();

const ToggleSwitch: React.FC<{ checked: boolean; disabled?: boolean; onChange: () => void }> = ({ checked, disabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export const SystemSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: setting, isLoading } = useQuery({
    queryKey: ['system-settings', AUTH_EMAIL_UNIQUENESS_KEY],
    queryFn: () => systemSettingsApi.getByKey(AUTH_EMAIL_UNIQUENESS_KEY),
  });

  const isPerTenant = (setting?.value ?? 'PerTenant') === 'PerTenant';

  const toggleMutation = useMutation({
    mutationFn: (nextIsPerTenant: boolean) =>
      systemSettingsApi.save({
        id: setting?.id ?? 0,
        key: AUTH_EMAIL_UNIQUENESS_KEY,
        value: nextIsPerTenant ? 'PerTenant' : 'Global',
        description: setting?.description ?? 'Controls whether login requires a tenant name (PerTenant) or only email (Global).',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      queryClient.invalidateQueries({ queryKey: ['login-config'] });
      toast.success('System setting updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err.message || 'Failed to update setting'),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-blue-600" /> System Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Global settings that apply across all tenants</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Authentication</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Control how users identify their tenant when logging in</p>

        {isLoading ? (
          <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex items-center justify-between py-3">
            <div className="pr-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Require Tenant Name At Login</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-md">
                {isPerTenant
                  ? 'Users must enter their organization name plus email to log in. Emails only need to be unique within a tenant.'
                  : 'Users log in with email only — the system finds their tenant automatically. Emails must be unique across the entire installation.'}
              </p>
            </div>
            <ToggleSwitch
              checked={isPerTenant}
              disabled={toggleMutation.isPending}
              onChange={() => toggleMutation.mutate(!isPerTenant)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
