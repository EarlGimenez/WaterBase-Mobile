import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'volunteer' | 'ngo' | 'lgu' | 'admin' | 'researcher';
  organization?: string;
  areaOfResponsibility?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setGuestMode: () => void;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user');
      const guestMode = await AsyncStorage.getItem('guest_mode');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsGuest(false);
      } else if (guestMode === 'true') {
        setIsGuest(true);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, user: User) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.removeItem('guest_mode');
      
      setToken(token);
      setUser(user);
      setIsGuest(false);
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  };

  const logout = async () => {
    try {
      // Make API call to logout using mobile-compatible URL
      if (token) {
        console.log('Logout: Making API call to backend');
        await apiRequest(API_ENDPOINTS.LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('Logout: API call successful');
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      // Clear local storage regardless of API result
      await AsyncStorage.multiRemove(['auth_token', 'user', 'guest_mode']);
      setToken(null);
      setUser(null);
      setIsGuest(false);
    }
  };

  const setGuestMode = async () => {
    try {
      await AsyncStorage.setItem('guest_mode', 'true');
      await AsyncStorage.multiRemove(['auth_token', 'user']);
      
      setIsGuest(true);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error setting guest mode:', error);
    }
  };

  const requireAuth = (): boolean => {
    return !!token && !!user && !isGuest;
  };

  const value: AuthContextType = {
    user,
    token,
    isGuest,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    setGuestMode,
    requireAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
