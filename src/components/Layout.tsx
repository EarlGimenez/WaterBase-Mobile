import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';

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

  return (
    <View className="flex-1">
      <View className="flex-1" style={{ paddingBottom: 75 }}>
        {children}
      </View>
      <Footer />
    </View>
  );
};

export default Layout;
