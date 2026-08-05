import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, User, Sun, Moon, Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../features/auth/store/auth.store';
import { useThemeStore } from '../../../core/stores/theme.store';
import { useNotificationStore, Notification } from '../../../core/stores/notification.store';
import { userApi } from '../../../core/api/services/user.api';

interface HeaderProps {
  onMenuClick: () => void;
}

const formatTimeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const typeStyles: Record<string, string> = {
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

const NotificationItem: React.FC<{
  n: Notification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ n, onRead, onRemove }) => (
  <div
    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
      !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
    }`}
    onClick={() => !n.read && onRead(n.id)}
  >
    <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${typeStyles[n.type]}`} />
    <div className="flex-1 min-w-0">
      <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} text-gray-900 dark:text-white truncate`}>
        {n.title}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{n.message}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTimeAgo(n.timestamp)}</p>
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onRemove(n.id); }}
      className="text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-1"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { isAuthenticated, tokenPayload, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getMe(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const displayName = profile?.fullName || tokenPayload?.name || tokenPayload?.email || 'User';
  const displayRole = profile?.roles?.[0] || tokenPayload?.role || tokenPayload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
  const initials = displayName
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex-1 lg:ml-0 ml-4" />

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-center text-gray-400">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <NotificationItem key={n.id} n={n} onRead={markAsRead} onRemove={removeNotification} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div ref={userRef} className="relative ml-1">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{initials}</span>
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                {displayRole && <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{displayRole}</p>}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="w-4 h-4" /> Profile
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
