import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

interface FooterButtonProps {
  icon: string;
  label: string;
  screenName: string;
  isActive: boolean;
  onPress: () => void;
  requireAuth?: boolean;
}

const FooterButton: React.FC<FooterButtonProps> = ({ 
  icon, 
  label, 
  screenName, 
  isActive, 
  onPress,
  requireAuth = false
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 items-center py-1"
  >
    {isActive ? (
      <View className="p-3 rounded-xl bg-waterbase-500 border-2 border-waterbase-500">
        <Ionicons
          name={icon as any}
          size={26}
          color="#ffffff"
        />
      </View>
    ) : (
      <View className="p-[1px] rounded-xl">
        <LinearGradient
          colors={['#0ea5e9', '#22c55e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="p-[1px] rounded-xl"
        >
          <View className="p-3 rounded-xl bg-white">
            <Ionicons
              name={icon as any}
              size={26}
              color="#6b7280"
            />
          </View>
        </LinearGradient>
      </View>
    )}
    <Text
      className={`text-xs mt-2 text-center px-1 ${
        isActive ? 'text-waterbase-600 font-medium' : 'text-gray-500'
      }`}
      style={{ lineHeight: 14 }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const Footer: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isAuthenticated, isGuest } = useAuth();
  
  const currentRoute = route.name;

  const handleProtectedNavigation = (screenName: string, feature: string) => {
    if (isGuest || !isAuthenticated) {
      Alert.alert(
        "Sign In Required",
        `You need to sign in to access ${feature}. Would you like to sign in now?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => navigation.navigate("Login" as never),
          },
        ]
      );
    } else {
      navigation.navigate(screenName as never);
    }
  };

  const handleSignupNavigation = () => {
    Alert.alert(
      "Create Account",
      "Join WaterBase to report pollution, participate in cleanups, and help protect our water resources.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Up",
          onPress: () => navigation.navigate("Register" as never),
        },
      ]
    );
  };

  const footerButtons = [
    {
      icon: 'home',
      label: 'Home',
      screenName: 'Home',
      requireAuth: false,
      onPress: () => navigation.navigate('Home' as never)
    },
    {
      icon: 'map',
      label: 'Live Map',
      screenName: 'MapView',
      requireAuth: false,
      onPress: () => navigation.navigate('MapView' as never)
    },
    {
      icon: 'warning',
      label: 'Report',
      screenName: 'ReportPollution',
      requireAuth: true,
      onPress: () => handleProtectedNavigation('ReportPollution', 'pollution reporting')
    },
    {
      icon: 'analytics',
      label: 'Dashboard',
      screenName: 'Dashboard',
      requireAuth: false, // Dashboard is now free for guests
      onPress: () => navigation.navigate('Dashboard' as never)
    },
    {
      icon: isAuthenticated && !isGuest ? 'people' : 'person-add',
      label: isAuthenticated && !isGuest ? 'Community' : 'Sign Up',
      screenName: isAuthenticated && !isGuest ? 'Community' : 'Register',
      requireAuth: isAuthenticated && !isGuest ? true : false,
      onPress: () => {
        if (isAuthenticated && !isGuest) {
          handleProtectedNavigation('Community', 'community features');
        } else {
          handleSignupNavigation();
        }
      }
    }
  ];

  // Don't show footer on Login screen
  if (currentRoute === 'Login' || currentRoute === 'Register') {
    return null;
  }

  return (
    <View className="absolute bottom-0 left-0 right-0">
      {/* Background that stays at bottom */}
      <View className="bg-white border-t border-gray-200" style={{ height: 75, transform: [{ translateY: 5 }] }}>
        <LinearGradient
          colors={['rgba(14, 165, 233, 0.05)', 'rgba(16, 183, 127, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute inset-0"
        />
      </View>
      {/* Footer content raised up */}
      <View className="absolute bottom-0 left-0 right-0 flex-row items-end justify-around px-2 pt-2 pb-3" style={{ transform: [{ translateY: -5 }] }}>
        {footerButtons.map((button, index) => (
          <FooterButton
            key={index}
            icon={button.icon}
            label={button.label}
            screenName={button.screenName}
            isActive={currentRoute === button.screenName}
            onPress={button.onPress}
            requireAuth={button.requireAuth}
          />
        ))}
      </View>
    </View>
  );
};

export default Footer;
