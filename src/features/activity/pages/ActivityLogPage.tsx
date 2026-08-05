import { useState, useMemo } from 'react';
import { Search, Filter, User, Settings, Shield, Database, LogIn, Trash2, CreditCard as Edit, Plus } from 'lucide-react';

interface ActivityEntry {
  id: string;
  user: string;
  avatar: string;
  action: string;
  category: string;
  target: string;
  ip: string;
  timestamp: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: '1', user: 'John Admin', avatar: 'JA', action: 'Created user', category: 'users', target: 'emma.wilson@example.com', ip: '192.168.1.1', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'success' },
  { id: '2', user: 'John Admin', avatar: 'JA', action: 'Updated settings', category: 'settings', target: 'General Settings', ip: '192.168.1.1', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), type: 'info' },
  { id: '3', user: 'Sarah Manager', avatar: 'SM', action: 'Failed login attempt', category: 'auth', target: 'sarah@example.com', ip: '10.0.0.45', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), type: 'error' },
  { id: '4', user: 'Sarah Manager', avatar: 'SM', action: 'Logged in', category: 'auth', target: 'Dashboard', ip: '10.0.0.45', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), type: 'success' },
  { id: '5', user: 'John Admin', avatar: 'JA', action: 'Deleted user', category: 'users', target: 'old.user@example.com', ip: '192.168.1.1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), type: 'warning' },
  { id: '6', user: 'Mike User', avatar: 'MU', action: 'Exported report', category: 'reports', target: 'Monthly Revenue', ip: '172.16.0.12', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), type: 'info' },
  { id: '7', user: 'John Admin', avatar: 'JA', action: 'Updated role', category: 'users', target: 'david.brown@example.com', ip: '192.168.1.1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), type: 'info' },
  { id: '8', user: 'David Brown', avatar: 'DB', action: 'Changed password', category: 'auth', target: 'Self', ip: '192.168.1.50', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), type: 'success' },
  { id: '9', user: 'John Admin', avatar: 'JA', action: 'Backup created', category: 'system', target: 'Full database', ip: '192.168.1.1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'success' },
  { id: '10', user: 'Sarah Manager', avatar: 'SM', action: 'Edited user', category: 'users', target: 'lisa.anderson@example.com', ip: '10.0.0.45', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), type: 'info' },
];

const categoryIcons: Record<string, React.ReactNode> = {
  users: <User className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  auth: <Shield className="w-4 h-4" />,
  system: <Database className="w-4 h-4" />,
  reports: <Filter className="w-4 h-4" />,
};

const actionIcons: Record<string, React.ReactNode> = {
  'Created user': <Plus className="w-3.5 h-3.5" />,
  'Deleted user': <Trash2 className="w-3.5 h-3.5" />,
  'Edited user': <Edit className="w-3.5 h-3.5" />,
  'Updated role': <Shield className="w-3.5 h-3.5" />,
  'Logged in': <LogIn className="w-3.5 h-3.5" />,
  'Failed login attempt': <Shield className="w-3.5 h-3.5" />,
};

const typeBadge: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const CATEGORIES = ['all', 'users', 'auth', 'settings', 'system', 'reports'];

export const ActivityLogPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    return MOCK_ACTIVITY.filter((e) => {
      const matchSearch = !search || e.user.toLowerCase().includes(search.toLowerCase()) || e.action.toLowerCase().includes(search.toLowerCase()) || e.target.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || e.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const formatTs = (ts: string) => {
    const d = new Date(ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track all user actions and system events</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                category === c
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-gray-400 text-sm">No activity found</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {filtered.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                  {entry.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.user}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      {actionIcons[entry.action] || categoryIcons[entry.category]}
                      {entry.action}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">--</span>
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{entry.target}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${typeBadge[entry.type]}`}>
                      {entry.type}
                    </span>
                    <span className="text-xs text-gray-400">{entry.ip}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">{formatTs(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
