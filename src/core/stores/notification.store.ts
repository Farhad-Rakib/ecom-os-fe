import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'New user registered',
    message: 'Emma Wilson has created a new account',
    type: 'info',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    title: 'Server alert',
    message: 'CPU usage exceeded 90% threshold',
    type: 'warning',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    title: 'Deployment successful',
    message: 'v2.1.0 deployed to production',
    type: 'success',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '4',
    title: 'Payment failed',
    message: 'Invoice #1234 payment was declined',
    type: 'error',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.read).length,

  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: `notif-${Date.now()}`,
      read: false,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((s) => {
      const updated = s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    const n = get().notifications.find((n) => n.id === id);
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
      unreadCount: n && !n.read ? s.unreadCount - 1 : s.unreadCount,
    }));
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
