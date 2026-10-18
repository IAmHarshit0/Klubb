import { client } from './client';
import { AppNotification } from '../types/api';

export async function getNotifications(params?: { limit?: number }): Promise<{
  notifications: AppNotification[];
  unreadCount: number;
}> {
  const { data } = await client.get('/notifications', { params });
  return data;
}

export async function markNotificationRead(notificationId: string): Promise<{ notification: AppNotification }> {
  const { data } = await client.patch(`/notifications/${notificationId}`, { read: true });
  return data;
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  const { data } = await client.post('/notifications/read-all');
  return data;
}
