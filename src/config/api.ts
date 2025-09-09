// API Configuration for WaterBase Mobile
// This handles the difference between web localhost and mobile network access

const isDev = __DEV__;

// Your computer's IP address from ipconfig: 192.168.0.224
const API_CONFIG = {
  BASE_URL: isDev 
    ? 'http://192.168.0.224:8000/api'  // Your computer's actual IP address
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

// API helper function with proper mobile configuration
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  };

  try {
    console.log('🚀 Making API request to:', url);
    console.log('📊 Request config:', {
      method: config.method,
      headers: config.headers,
      body: config.body ? 'Body included' : 'No body'
    });
    
    const response = await fetch(url, config);
    console.log('✅ API response status:', response.status);
    console.log('📝 Response headers:', response.headers);
    
    return response;
  } catch (error) {
    console.error('❌ API Request Error:', error);
    console.error('🔗 Failed URL:', url);
    throw new Error('Network request failed. Please check your connection and server status.');
  }
};

export default API_CONFIG;