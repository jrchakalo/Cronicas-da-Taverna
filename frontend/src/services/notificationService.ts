import api from './api';
import { NotificationsResponse } from '../types';

export const notificationService = {
  async getNotifications(limit = 20): Promise<NotificationsResponse> {
    const response = await api.get<NotificationsResponse>(`/notifications?limit=${limit}`);
    return response.data;
  },

  async markRead(id: number): Promise<void> {
    await api.post(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },

  async deleteNotification(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async clearAll(): Promise<void> {
    await api.delete('/notifications');
  },
};
