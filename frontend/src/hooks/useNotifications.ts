import { useCallback, useEffect, useMemo, useState } from 'react';
import { NotificationsResponse, NotificationItem } from '../types';
import { notificationService } from '../services/notificationService';
import { connectRealtime, disconnectRealtime, subscribeToEvent } from '../services/realtime';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const response: NotificationsResponse | undefined = await notificationService.getNotifications(20);
      if (!response) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectRealtime();
      return;
    }

    const socket = connectRealtime();
    if (!socket) {
      return;
    }

    const unsubscribe = subscribeToEvent<{ notification: NotificationItem; userId: number }>(
      'notification:created',
      ({ notification, userId }) => {
        if (user?.id && userId !== user.id) {
          return;
        }
        setNotifications((current) => [notification, ...current]);
        setUnreadCount((count) => count + 1);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user?.id]);

  const markAsRead = useCallback(async (id: number) => {
    await notificationService.markRead(id);
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllRead();
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    const target = notifications.find((item) => item.id === id);
    await notificationService.deleteNotification(id);
    setNotifications((current) => current.filter((item) => item.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((count) => Math.max(0, count - 1));
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    await notificationService.clearAll();
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  return {
    notifications,
    unreadCount,
    hasUnread,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};
