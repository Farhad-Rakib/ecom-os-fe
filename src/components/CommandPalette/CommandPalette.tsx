import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Users, FileText, Settings, Activity, Sliders, Moon, Sun, LogOut } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { useThemeStore } from '../../core/stores/theme.store';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string;
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const go = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  const commands: Command[] = useMemo(() => [
    { id: 'dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'Navigation', action: () => go('/dashboard'), keywords: 'home overview' },
    { id: 'users', label: 'Go to Users', icon: <Users className="w-4 h-4" />, category: 'Navigation', action: () => go('/users'), keywords: 'people accounts' },
    { id: 'reports', label: 'Go to Reports', icon: <FileText className="w-4 h-4" />, category: 'Navigation', action: () => go('/reports') },
    { id: 'settings', label: 'Go to Settings', icon: <Settings className="w-4 h-4" />, category: 'Navigation', action: () => go('/settings/general') },
    { id: 'activity', label: 'Go to Activity Log', icon: <Activity className="w-4 h-4" />, category: 'Navigation', action: () => go('/activity'), keywords: 'audit log history' },
    { id: 'preferences', label: 'Go to Preferences', icon: <Sliders className="w-4 h-4" />, category: 'Navigation', action: () => go('/preferences'), keywords: 'theme density display' },
    { id: 'theme', label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode', icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />, category: 'Actions', action: () => { toggleTheme(); setOpen(false); }, keywords: 'dark light mode appearance' },
    { id: 'logout', label: 'Logout', icon: <LogOut className="w-4 h-4" />, category: 'Actions', action: () => { setOpen(false); logout(); navigate('/login'); }, keywords: 'sign out exit' },
  ], [go, theme, toggleTheme, logout, navigate]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q));
  }, [query, commands]);

  useEffect(() => setActiveIdx(0), [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((p) => !p);
        setQuery('');
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[activeIdx]) { filtered[activeIdx].action(); }
  };

  if (!open) return null;

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    (acc[cmd.category] ??= []).push(cmd);
    return acc;
  }, {});

  let globalIdx = -1;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd>
          </div>
          <div className="max-h-72 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-sm text-center text-gray-400">No results found</p>
            ) : (
              Object.entries(grouped).map(([cat, cmds]) => (
                <div key={cat}>
                  <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{cat}</p>
                  {cmds.map((cmd) => {
                    globalIdx++;
                    const idx = globalIdx;
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          activeIdx === idx
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span className={activeIdx === idx ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}>{cmd.icon}</span>
                        {cmd.label}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-medium">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-medium">↵</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-medium">Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
