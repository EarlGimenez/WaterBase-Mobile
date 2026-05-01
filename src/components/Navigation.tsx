import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { fetchUnreadCount } from "../services/notifications";
import { resolveProfilePhotoUri } from "../utils/imageUrl";

interface NavigationProps {
  title?: string;
  showBackButton?: boolean;
  rightActions?: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({
  title = "WaterBase",
  showBackButton = false,
  rightActions,
}) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { token, isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!token || !isAuthenticated || !isFocused) {
      setUnreadCount(0);
      return;
    }

    let mounted = true;

    const refreshUnreadCount = async () => {
      try {
        const count = await fetchUnreadCount(token);
        if (mounted) {
          setUnreadCount(count);
        }
      } catch (error) {
        console.log('Notification badge refresh failed:', error);
      }
    };

    refreshUnreadCount();
    const intervalId = setInterval(refreshUnreadCount, 60000);

      return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [token, isAuthenticated, isFocused]);

  useEffect(() => {
    setImageError(false);
  }, [user?.profile_photo, isFocused]);

  const getInitials = (): string => {
    const firstInitial = user?.firstName?.trim().charAt(0) || "";
    const lastInitial = user?.lastName?.trim().charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "?";
  };

  const renderProfileAvatar = () => {
    const photoUrl = resolveProfilePhotoUri(user?.profile_photo);
    const showImage = !!photoUrl && !imageError;

    return (
      <View className="w-7 h-7 rounded-full overflow-hidden">
        <LinearGradient
          colors={['#0ea5e9', '#22c55e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0 w-7 h-7 rounded-full items-center justify-center"
        >
          {user?.firstName || user?.lastName ? (
            <Text className="text-xs font-bold text-white">{getInitials()}</Text>
          ) : (
            <Ionicons name="person" size={17} color="white" />
          )}
        </LinearGradient>
        {showImage && (
          <Image
            key={photoUrl}
            source={{ uri: photoUrl }}
            className="absolute inset-0 w-7 h-7 rounded-full"
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}
      </View>
    );
  };

  return (
    <View className="bg-white border-b-2 border-[#89CFEB] pt-2 pb-4 px-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          {showBackButton && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3 p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#0369a1" />
            </TouchableOpacity>
          )}
          <View className="flex-row items-center flex-1">
            <LinearGradient
              colors={['#0284C5', '#10B77F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-8 h-8 rounded-lg items-center justify-center mr-2"
            >
              <Ionicons name="location" size={20} color="white" />
            </LinearGradient>
            <Text className="text-xl font-bold text-waterbase-950 flex-shrink" numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center" style={{ marginRight: -8 }}>
          {/* Notifications Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications" as never)}
            className="p-3 relative mr-1"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <Ionicons name="notifications-outline" size={22} color="#0369a1" />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 min-w-4 h-4 px-1 bg-red-500 rounded-full items-center justify-center">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile" as never)}
            className="p-3"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            {renderProfileAvatar()}
          </TouchableOpacity>

          {rightActions && (
            <View className="flex-row items-center ml-2">{rightActions}</View>
          )}
        </View>
      </View>
    </View>
  );
};

export default Navigation;
