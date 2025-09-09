import React from 'react';
import { View } from 'react-native';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <View className="flex-1">
      <View className="flex-1" style={{ paddingBottom: 55 }}>
        {children}
      </View>
      <Footer />
    </View>
  );
};

export default Layout;
