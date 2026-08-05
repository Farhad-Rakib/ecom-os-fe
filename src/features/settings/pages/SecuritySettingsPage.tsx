import { useState } from 'react';
import { Save, Shield } from 'lucide-react';
import { useSettingsStore } from '../store/settings.store';
import { toast } from '../../../components/ui/Toast/toast.store';

export const SecuritySettingsPage: React.FC = () => {
  const { security, updateSecurity } = useSettingsStore();
  const [form, setForm] = useState(security);

  const handleSave = () => {
    updateSecurity(form);
    toast.success('Security settings saved');
  };

  const inputCls = 'w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string; desc: string }> = ({ checked, onChange, label, desc }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{label}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" /> Security Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure security policies and access controls</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-6 space-y-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Authentication</h2>
          <Toggle checked={form.twoFactorAuth} onChange={() => setForm({ ...form, twoFactorAuth: !form.twoFactorAuth })} label="Two-Factor Authentication" desc="Require 2FA for all user accounts" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
            <div>
              <label className={labelCls}>Session Timeout (minutes)</label>
              <input type="number" value={form.sessionTimeout} onChange={(e) => setForm({ ...form, sessionTimeout: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Login Attempts</label>
              <input type="number" value={form.maxLoginAttempts} onChange={(e) => setForm({ ...form, maxLoginAttempts: e.target.value })} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Password Policy</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-3">
            <div>
              <label className={labelCls}>Minimum Password Length</label>
              <input type="number" value={form.passwordMinLength} onChange={(e) => setForm({ ...form, passwordMinLength: e.target.value })} className={inputCls} />
            </div>
          </div>
          <Toggle checked={form.requireSpecialChars} onChange={() => setForm({ ...form, requireSpecialChars: !form.requireSpecialChars })} label="Require Special Characters" desc="Passwords must contain at least one special character" />
          <Toggle checked={form.requireUppercase} onChange={() => setForm({ ...form, requireUppercase: !form.requireUppercase })} label="Require Uppercase Letters" desc="Passwords must contain at least one uppercase letter" />
        </div>

        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Advanced</h2>
          <div>
            <label className={labelCls}>IP Whitelist (comma-separated)</label>
            <textarea rows={2} value={form.ipWhitelist} onChange={(e) => setForm({ ...form, ipWhitelist: e.target.value })} className={`${inputCls} resize-none`} placeholder="e.g. 192.168.1.1, 10.0.0.0/24" />
          </div>
          <div>
            <label className={labelCls}>Audit Log Retention (days)</label>
            <input type="number" value={form.auditLogRetention} onChange={(e) => setForm({ ...form, auditLogRetention: e.target.value })} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>
    </div>
  );
};
