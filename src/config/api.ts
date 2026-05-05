import AsyncStorage from '@react-native-async-storage/async-storage';

const isDev = __DEV__;
const IP_POOL = [
  "192.168.0.25", 
  "172.18.15.106",
  "10.231.38.15",
  "100.127.78.24"
];
const CHOOSE_IP = 2;

const API_CONFIG = {
  BASE_URL: isDev 
    ? `http://${IP_POOL[CHOOSE_IP]}:8000/api` 
    : 'https://your-production-api.com/api',  
  TIMEOUT: 10000,
};

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: `${API_CONFIG.BASE_URL}/login`,
  REGISTER: `${API_CONFIG.BASE_URL}/register`,
  LOGOUT: `${API_CONFIG.BASE_URL}/logout`,
  USER_PROFILE: `${API_CONFIG.BASE_URL}/user/profile`,
  USER_PUSH_TOKEN: `${API_CONFIG.BASE_URL}/user/push-token`,
  USER_ORGANIZATIONS: `${API_CONFIG.BASE_URL}/user/organizations`,
  USER_ORGANIZATION_AUDIENCE: `${API_CONFIG.BASE_URL}/user/organization-audience`,
  USER_JOIN_REQUESTS: `${API_CONFIG.BASE_URL}/user/join-requests`,
  USER_JOINED_ORGANIZATIONS: `${API_CONFIG.BASE_URL}/user/joined-organizations`,
  USER_FOLLOWING_ORGANIZATIONS: `${API_CONFIG.BASE_URL}/user/following-organizations`,
  ORGANIZATIONS: `${API_CONFIG.BASE_URL}/organizations`,
  ORGANIZATIONS_DIRECTORY: `${API_CONFIG.BASE_URL}/organizations/directory`,
  ORGANIZATION_JOIN_REQUEST: (organizationId: number, requestId: number) => `${API_CONFIG.BASE_URL}/organizations/${organizationId}/join-requests/${requestId}`,
  REPORTS: `${API_CONFIG.BASE_URL}/reports`,
  EVENTS: `${API_CONFIG.BASE_URL}/events`,
  USER_EVENTS: `${API_CONFIG.BASE_URL}/user/events`,
  USER_STATS: `${API_CONFIG.BASE_URL}/user/stats`,
  COMMUNITY_FEED: `${API_CONFIG.BASE_URL}/community/feed`,
  NOTIFICATIONS: `${API_CONFIG.BASE_URL}/notifications`,
  NOTIFICATIONS_PREFERENCES: `${API_CONFIG.BASE_URL}/notifications/preferences`,
  NOTIFICATIONS_UNREAD_COUNT: `${API_CONFIG.BASE_URL}/notifications/unread-count`,
  NOTIFICATIONS_MARK_ALL_READ: `${API_CONFIG.BASE_URL}/notifications/mark-all-read`,
  DASHBOARD: `${API_CONFIG.BASE_URL}/dashboard`,
  PREDICT: `${API_CONFIG.BASE_URL}/predict`,
  ADMIN_STATS: `${API_CONFIG.BASE_URL}/admin/stats`,
  ADMIN_REPORTS_PENDING: `${API_CONFIG.BASE_URL}/admin/reports/pending`,
  ADMIN_REPORTS_STATS: `${API_CONFIG.BASE_URL}/admin/reports/stats`,
  ADMIN_REPORT_STATUS: (id: number) => `${API_CONFIG.BASE_URL}/admin/reports/${id}/status`,
  ADMIN_HIGH_SEVERITY: `${API_CONFIG.BASE_URL}/admin/reports/high-severity`,
  ADMIN_USERS: `${API_CONFIG.BASE_URL}/admin/users`,
  ADMIN_USER: (id: number) => `${API_CONFIG.BASE_URL}/admin/users/${id}`,
  ADMIN_EVENTS: `${API_CONFIG.BASE_URL}/admin/events`,
  ADMIN_EVENT: (id: number) => `${API_CONFIG.BASE_URL}/admin/events/${id}`,
  ADMIN_SYSTEM_SETTINGS: `${API_CONFIG.BASE_URL}/admin/system-settings`,
  ADMIN_MAINTENANCE_HEALTH: `${API_CONFIG.BASE_URL}/admin/maintenance/health`,
  ADMIN_MAINTENANCE_STATS: `${API_CONFIG.BASE_URL}/admin/maintenance/stats`,
  ADMIN_MAINTENANCE_CACHE_CLEAR: `${API_CONFIG.BASE_URL}/admin/maintenance/cache-clear`,
  ADMIN_MAINTENANCE_QUEUE_RESTART: `${API_CONFIG.BASE_URL}/admin/maintenance/queue-restart`,
  REPORTS_ACCESSIBLE: `${API_CONFIG.BASE_URL}/reports/accessible`,
  EVENT_CANCEL: (id: number) => `${API_CONFIG.BASE_URL}/events/${id}/cancel`,
  EVENT_START: (id: number) => `${API_CONFIG.BASE_URL}/events/${id}/start`,
  EVENT_QR_SCAN: (id: number) => `${API_CONFIG.BASE_URL}/events/${id}/qr-scan`,
  EVENT_MESSAGE_VOLUNTEERS: (id: number) => `${API_CONFIG.BASE_URL}/events/${id}/message-volunteers`,
  EVENT_COMPLETE: (id: number) => `${API_CONFIG.BASE_URL}/events/${id}/complete`,
  EVENT_VOLUNTEERS: (id: number) => `${API_CONFIG.BASE_URL}/events/${id}/volunteers`,
  REPORT_STATUS: (id: number) => `${API_CONFIG.BASE_URL}/reports/${id}/status`,
  REPORTS_BULK_STATUS: `${API_CONFIG.BASE_URL}/reports/bulk-status`,
  REPORTS_BULK_UPLOAD: `${API_CONFIG.BASE_URL}/reports/bulk-upload`,
  RESEARCH_DOCUMENTS: `${API_CONFIG.BASE_URL}/research-documents`,
  DEVICES: `${API_CONFIG.BASE_URL}/devices`,
  DEVICES_DISCOVERED: `${API_CONFIG.BASE_URL}/devices/discovered`,
  DEVICE: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}`,
  DEVICE_PAIR: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/pair`,
  DEVICE_TELEMETRY_LATEST: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/telemetry/latest`,
  DEVICE_TELEMETRY_HISTORY: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/telemetry`,
  DEVICE_COMMANDS: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/commands`,
  DEVICE_LOCATION: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/location`,
  DEVICE_CALIBRATE: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/calibrate`,
  DEVICE_MAINTENANCE: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/maintenance`,
  DEVICE_METRICS_DAILY: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/metrics/daily`,
  DEVICE_METRICS_MONTHLY: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/metrics/monthly`,
  DEVICE_LIVE_READ: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/live-read`,
  DEVICES_MAP: `${API_CONFIG.BASE_URL}/devices/map`,
  DEVICES_MAINTENANCE_OVERDUE: `${API_CONFIG.BASE_URL}/devices/maintenance/overdue`,
  DEVICES_MAINTENANCE_UPCOMING: `${API_CONFIG.BASE_URL}/devices/maintenance/upcoming`,
  DEVICE_MAINTENANCE_SCHEDULE: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/maintenance/schedule`,
  DEVICE_ACTIVITY_LOGS: (id: number) => `${API_CONFIG.BASE_URL}/devices/${id}/activity-logs`,
};

// API helper function with proper mobile configuration and authentication
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const token = await AsyncStorage.getItem('auth_token');
  
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log('🚀 Making API request to:', url);
    console.log('📊 Request config:', {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? 'Body included' : 'No body',
      hasAuth: !!token
    });
    
    const response = await fetch(url, config);
    console.log('✅ API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      let message = `HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          message = errorJson.message;
        }
      } catch {
        // Not JSON, keep status-based message
      }
      throw new Error(message);
    }
    
    return response;
  } catch (error) {
    console.error('❌ API Request Error:', error);
    console.error('🔗 Failed URL:', url);
    throw error;
  }
};

export { API_CONFIG };
export default API_CONFIG;