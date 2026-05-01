// API Configuration for WaterBase Mobile
// This handles the difference between web localhost and mobile network access
import AsyncStorage from '@react-native-async-storage/async-storage';

const isDev = __DEV__;
const GIMENEZ_LAPTOP_IP = "192.168.0.25";
// Your computer's IP address from ipconfig: 192.168.0.224
const API_CONFIG = {
  BASE_URL: isDev 
    // ? 'http://192.168.0.224:8000/api'  // Your computer's actual IP address
    ? `http://${GIMENEZ_LAPTOP_IP}:8000/api`  // Gimenez's laptop IP address
    : 'https://your-production-api.com/api',
    
  TIMEOUT: 10000, // 10 seconds
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
  EVENT_VOLUNTEERS: (id: number) => `${API_CONFIG.BASE_URL}/events/${id}/volunteers`,
  REPORT_STATUS: (id: number) => `${API_CONFIG.BASE_URL}/reports/${id}/status`,
  REPORTS_BULK_STATUS: `${API_CONFIG.BASE_URL}/reports/bulk-status`,
  REPORTS_BULK_UPLOAD: `${API_CONFIG.BASE_URL}/reports/bulk-upload`,
  RESEARCH_DOCUMENTS: `${API_CONFIG.BASE_URL}/research-documents`,
};

// API helper function with proper mobile configuration and authentication
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Get auth token from AsyncStorage
  const token = await AsyncStorage.getItem('auth_token');
  
  // Set up default headers
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  // Add auth header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Only set Content-Type for JSON requests (not for FormData)
  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  // For FormData, don't set Content-Type - let the browser set it with boundary
  
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
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    console.error('❌ API Request Error:', error);
    console.error('🔗 Failed URL:', url);
    throw error;
  }
};

export default API_CONFIG;