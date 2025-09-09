import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

interface FooterButtonProps {
  icon: string;
  label: string;
  screenName: string;
  isActive: boolean;
  onPress: () => void;
}

const FooterButton: React.FC<FooterButtonProps> = ({ 
  icon, 
  label, 
  screenName, 
  isActive, 
  onPress 
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 items-center py-1"
  >
    <View className={`p-3 rounded-xl ${isActive ? 'bg-waterbase-500' : 'bg-white shadow-sm border border-gray-100'}`}>
      <Ionicons
        name={icon as any}
        size={26}
        color={isActive ? '#ffffff' : '#6b7280'}
      />
    </View>
    <Text
      className={`text-xs mt-1 ${
        isActive ? 'text-waterbase-600 font-medium' : 'text-gray-500'
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const Footer: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const currentRoute = route.name;

  const footerButtons = [
    {
      icon: 'home',
      label: 'Home',
      screenName: 'Home'
    },
    {
      icon: 'map',
      label: 'Live Map',
      screenName: 'MapView'
    },
    {
      icon: 'warning',
      label: 'Report',
      screenName: 'ReportPollution'
    },
    {
      icon: 'people',
      label: 'Community',
      screenName: 'Community'
    },
    {
      icon: 'analytics',
      label: 'Dashboard',
      screenName: 'Dashboard'
    }
  ];

  const handleNavigation = (screenName: string) => {
    navigation.navigate(screenName as never);
  };

  // Don't show footer on Login screen only
  if (currentRoute === 'Login') {
    return null;
  }

  return (
    <View className="absolute bottom-0 left-0 right-0">
      {/* Background that stays at bottom */}
      <View className="bg-white border-t border-gray-200" style={{ height: 70, transform: [{ translateY: 5 }] }}>
        <LinearGradient
          colors={['rgba(14, 165, 233, 0.05)', 'rgba(16, 183, 127, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute inset-0"
        />
      </View>
      {/* Footer content raised up */}
      <View className="absolute bottom-0 left-0 right-0 flex-row items-end justify-around px-2 pt-1 pb-2" style={{ transform: [{ translateY: -5 }] }}>
        {footerButtons.map((button) => (
          <FooterButton
            key={button.screenName}
            icon={button.icon}
            label={button.label}
            screenName={button.screenName}
            isActive={currentRoute === button.screenName}
            onPress={() => handleNavigation(button.screenName)}
          />
        ))}
      </View>
    </View>
  );
};

export default Footer;
