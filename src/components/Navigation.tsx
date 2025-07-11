import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

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
    <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {showBackButton && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3 p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#0369a1" />
            </TouchableOpacity>
          )}
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-lg items-center justify-center mr-2">
              <Ionicons name="location" size={20} color="white" />
            </View>
            <Text className="text-xl font-bold text-waterbase-950">
              {title}
            </Text>
          </View>
        </View>

        {rightActions && (
          <View className="flex-row items-center">{rightActions}</View>
        )}
      </View>
    </View>
  );
};

export default Navigation;
