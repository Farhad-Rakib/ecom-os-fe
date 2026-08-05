import { Sun, Moon, Rows3, Rows2, AlignJustify } from 'lucide-react';
import { useThemeStore } from '../../../core/stores/theme.store';
import { usePreferencesStore } from '../../../core/stores/preferences.store';

const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
];

const densityOptions = [
  { value: 'compact' as const, label: 'Compact', icon: Rows3, desc: 'Smaller rows, more data visible' },
  { value: 'normal' as const, label: 'Normal', icon: Rows2, desc: 'Default spacing and sizing' },
  { value: 'comfortable' as const, label: 'Comfortable', icon: AlignJustify, desc: 'Larger rows, easier reading' },
];

export const PreferencesPage: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { tableDensity, setTableDensity } = usePreferencesStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preferences</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your experience</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose your preferred color theme</p>
        <div className="grid grid-cols-2 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  active
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <span className={`text-sm font-medium ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Table Density</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Control how compact table rows appear</p>
        <div className="space-y-2">
          {densityOptions.map((opt) => {
            const Icon = opt.icon;
            const active = tableDensity === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTableDensity(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                  active
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-medium ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Preview</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">See how table density looks</p>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {['John Admin', 'Sarah Manager', 'Mike User'].map((name) => (
                <tr key={name}>
                  <td className={`px-4 text-gray-900 dark:text-white ${tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'comfortable' ? 'py-4' : 'py-2.5'}`}>{name}</td>
                  <td className={`px-4 text-gray-600 dark:text-gray-400 ${tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'comfortable' ? 'py-4' : 'py-2.5'}`}>{name.split(' ')[1]}</td>
                  <td className={`px-4 ${tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'comfortable' ? 'py-4' : 'py-2.5'}`}>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
