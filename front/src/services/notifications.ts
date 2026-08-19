import { authFetch } from './api';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export const notificationsApi = {
  getAll: async (): Promise<AppNotification[]> => {
    const res = await authFetch('/notifications');
    return res.json();
  },
  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await authFetch('/notifications/unread-count');
    return res.json();
  },
  markAsRead: async (notificationIds: string[]): Promise<void> => {
    await authFetch('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds }),
    });
  },
  delete: async (id: string): Promise<void> => {
    await authFetch(`/notifications/${id}`, { method: 'DELETE' });
  },
  executeTask: async (id: string, actionData?: any): Promise<void> => {
    await authFetch(`/notifications/${id}/execute`, { 
      method: 'POST',
      body: JSON.stringify(actionData || {})
    });
  },
  deleteAll: async (): Promise<void> => {
    await authFetch('/notifications/all', { method: 'DELETE' });
  }
};
