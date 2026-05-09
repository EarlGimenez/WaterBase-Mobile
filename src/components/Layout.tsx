import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Footer from './Footer';
import PerformanceReadout from './PerformanceReadout';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { loadPerformanceMetricsSetting } from '../utils/performanceMetrics';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.profile_completed === false) {
      navigation.navigate("CompleteProfile" as never);
    }
  }, [isAuthenticated, navigation, user?.profile_completed]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPerformanceMetricsSetting(API_ENDPOINTS.ADMIN_SYSTEM_SETTINGS);
    }
  }, [isAuthenticated]);

  return (
    <View className="flex-1">
      <View className="flex-1" style={{ paddingBottom: 75 }}>
        {children}
      </View>
      <PerformanceReadout />
      <Footer />
    </View>
  );
};

export default Layout;
