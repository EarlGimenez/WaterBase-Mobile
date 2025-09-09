import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
            {/* Notification Badge */}
            <View className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full" />
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile" as never)}
            className="p-3"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <View className="w-7 h-7 bg-waterbase-100 rounded-full items-center justify-center">
              <Ionicons name="person" size={18} color="#0369a1" />
            </View>
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
