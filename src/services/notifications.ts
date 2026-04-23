import { API_ENDPOINTS, apiRequest } from '../config/api';

export interface NotificationItem {
  id: number;
  type: string;
  channel: string;
  severity: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPage {
  data: NotificationItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const fetchNotifications = async (token: string, read?: boolean): Promise<NotificationPage> => {
  const params = new URLSearchParams({ per_page: '20' });
  if (typeof read === 'boolean') {
    params.append('read', read ? '1' : '0');
  }

  const response = await apiRequest(`${API_ENDPOINTS.NOTIFICATIONS}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const fetchUnreadCount = async (token: string): Promise<number> => {
  const response = await apiRequest(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();
  return Number(payload.unread_count ?? 0);
};

export const markNotificationReadState = async (token: string, id: number, read: boolean): Promise<void> => {
  await apiRequest(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read-state`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ read }),
  });
};

export const markAllNotificationsRead = async (token: string): Promise<void> => {
  await apiRequest(API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
