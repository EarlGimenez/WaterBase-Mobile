import { API_ENDPOINTS, apiRequest } from '../config/api';

const UNREAD_COUNT_CACHE_TTL_MS = 15000;
let unreadCountCache: { value: number; fetchedAt: number } | null = null;
let unreadCountInFlight: Promise<number> | null = null;

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

export interface NotificationPreferences {
  push_notifications_enabled: boolean;
  report_updates: boolean;
  event_reminders: boolean;
  achievements: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
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
  const now = Date.now();
  if (unreadCountCache && (now - unreadCountCache.fetchedAt) < UNREAD_COUNT_CACHE_TTL_MS) {
    return unreadCountCache.value;
  }

  if (unreadCountInFlight) {
    return unreadCountInFlight;
  }

  unreadCountInFlight = (async () => {
    const response = await apiRequest(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json();
    const value = Number(payload.unread_count ?? 0);
    unreadCountCache = { value, fetchedAt: Date.now() };
    return value;
  })();

  try {
    return await unreadCountInFlight;
  } finally {
    unreadCountInFlight = null;
  }
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

export const fetchNotificationPreferences = async (token: string): Promise<NotificationPreferences> => {
  const response = await apiRequest(API_ENDPOINTS.NOTIFICATIONS_PREFERENCES, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const updateNotificationPreferences = async (
  token: string,
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> => {
  const response = await apiRequest(API_ENDPOINTS.NOTIFICATIONS_PREFERENCES, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });

  const payload = await response.json();
  return payload.preferences ?? payload;
};
