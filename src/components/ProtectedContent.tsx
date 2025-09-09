import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedContentProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallbackContent?: React.ReactNode;
  feature?: string;
}

const ProtectedContent: React.FC<ProtectedContentProps> = ({
  children,
  requireAuth = true,
  fallbackContent,
  feature = "this feature",
}) => {
  const { isAuthenticated, isGuest } = useAuth();
  const navigation = useNavigation();

  const handleLoginPrompt = () => {
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
  };

  // If authentication is required and user is not authenticated
  if (requireAuth && (!isAuthenticated || isGuest)) {
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }

    return (
      <View className="flex-1 items-center justify-center p-6">
        <View className="items-center">
          <View className="w-16 h-16 bg-waterbase-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="lock-closed" size={32} color="#0ea5e9" />
          </View>
          <Text className="text-xl font-semibold text-waterbase-950 mb-2 text-center">
            Sign In Required
          </Text>
          <Text className="text-waterbase-600 text-center mb-6">
            You need to sign in to access {feature}
          </Text>
          <TouchableOpacity
            onPress={handleLoginPrompt}
            className="bg-waterbase-500 rounded-lg px-6 py-3 flex-row items-center"
          >
            <Ionicons name="log-in" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

export default ProtectedContent;
