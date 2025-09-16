// API Configuration for WaterBase Mobile
// This handles the difference between web localhost and mobile network access
import AsyncStorage from '@react-native-async-storage/async-storage';

const isDev = __DEV__;
const GIMENEZ_LAPTOP_IP = "172.18.18.217";
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
  USER_PROFILE: `${API_CONFIG.BASE_URL}/user`,
  REPORTS: `${API_CONFIG.BASE_URL}/reports`,
  EVENTS: `${API_CONFIG.BASE_URL}/events`,
  DASHBOARD: `${API_CONFIG.BASE_URL}/dashboard`,
  PREDICT: `${API_CONFIG.BASE_URL}/predict`,
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