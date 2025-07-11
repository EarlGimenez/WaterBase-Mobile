import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";

const ProfileScreen = () => {
  const userStats = [
    { label: "Reports Filed", value: "24", icon: "document-text" },
    { label: "Cleanups Joined", value: "8", icon: "leaf" },
    { label: "Impact Score", value: "156", icon: "star" },
  ];

  const menuItems = [
    { title: "Edit Profile", icon: "person-outline", color: "#0ea5e9" },
    { title: "My Reports", icon: "document-text-outline", color: "#0ea5e9" },
    { title: "Notifications", icon: "notifications-outline", color: "#0ea5e9" },
    { title: "Privacy Settings", icon: "shield-outline", color: "#0ea5e9" },
    { title: "Help & Support", icon: "help-circle-outline", color: "#0ea5e9" },
    {
      title: "About WaterBase",
      icon: "information-circle-outline",
      color: "#0ea5e9",
    },
    { title: "Sign Out", icon: "log-out-outline", color: "#ef4444" },
  ];

  const achievements = [
    {
      title: "First Reporter",
      description: "Filed your first pollution report",
      icon: "medal",
      color: "#f59e0b",
    },
    {
      title: "Community Helper",
      description: "Joined 5 cleanup activities",
      icon: "people",
      color: "#22c55e",
    },
    {
      title: "Verified Contributor",
      description: "Account verified by WaterBase",
      icon: "checkmark-circle",
      color: "#3b82f6",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Profile" showBackButton={true} />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          {/* Profile Header */}
          <Card className="border-waterbase-200 mb-6">
            <CardContent className="p-6 items-center">
              <View className="w-24 h-24 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-full items-center justify-center mb-4">
                <Ionicons name="person" size={40} color="white" />
              </View>
              <Text className="text-xl font-bold text-waterbase-950 mb-1">
                Maria Santos
              </Text>
              <Text className="text-waterbase-600 mb-3">
                Environmental Advocate
              </Text>
              <View className="flex-row items-center bg-enviro-100 px-3 py-1 rounded-full">
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text className="text-enviro-700 text-sm font-medium ml-1">
                  Verified Citizen
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* User Stats */}
          <Card className="border-waterbase-200 mb-6">
            <CardContent className="p-4">
              <Text className="text-lg font-semibold text-waterbase-950 mb-4 text-center">
                Your Impact
              </Text>
              <View className="flex-row justify-around">
                {userStats.map((stat, index) => (
                  <View key={index} className="items-center">
                    <View className="w-12 h-12 bg-waterbase-100 rounded-full items-center justify-center mb-2">
                      <Ionicons name={stat.icon} size={24} color="#0ea5e9" />
                    </View>
                    <Text className="text-2xl font-bold text-waterbase-950">
                      {stat.value}
                    </Text>
                    <Text className="text-xs text-gray-600 text-center">
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-waterbase-200 mb-6">
            <CardHeader>
              <CardTitle className="text-waterbase-950">Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                {achievements.map((achievement, index) => (
                  <View
                    key={index}
                    className="flex-row items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: achievement.color + "20" }}
                    >
                      <Ionicons
                        name={achievement.icon}
                        size={20}
                        color={achievement.color}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-sm text-waterbase-950">
                        {achievement.title}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {achievement.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card className="border-waterbase-200 mb-6">
            <CardContent className="p-0">
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className={`flex-row items-center p-4 ${
                    index < menuItems.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                  <Text
                    className="flex-1 ml-3 font-medium"
                    style={{ color: item.color }}
                  >
                    {item.title}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </CardContent>
          </Card>

          {/* App Version */}
          <View className="items-center mb-6">
            <Text className="text-xs text-gray-500">
              WaterBase Mobile v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
