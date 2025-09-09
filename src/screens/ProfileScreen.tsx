import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";
import ProtectedContent from "../components/ProtectedContent";
import { useAuth } from "../contexts/AuthContext";

interface UserStats {
  reportsSubmitted?: number;
  reportsVerified?: number;
  eventsJoined?: number;
  eventsCreated?: number;
  eventsCompleted?: number;
  badgesEarned?: number;
  volunteersManaged?: number;
  dataAnalyzed?: number;
  researchPublished?: number;
  communityPoints?: number;
  accuracyRate?: number;
  badges?: string[];
}

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  useEffect(() => {
    // Mock data fetch
    setTimeout(() => {
      setUserStats({
        reportsSubmitted: 15,
        eventsJoined: 8,
        badgesEarned: 5,
        communityPoints: 1250,
        badges: ["Water Guardian", "Eco Champion", "Community Helper", "Pollution Fighter", "Green Hero"]
      });
      setIsLoading(false);
    }, 1000);
  }, []);

  const getBadgeIcon = (badgeName: string) => {
    const name = badgeName?.toLowerCase() || '';
    if (name.includes('water') || name.includes('clean')) return '💧';
    if (name.includes('eco') || name.includes('green')) return '🌱';
    if (name.includes('champion') || name.includes('hero')) return '🏆';
    if (name.includes('guardian') || name.includes('protector')) return '🛡️';
    if (name.includes('volunteer') || name.includes('helper')) return '🤝';
    if (name.includes('leader') || name.includes('captain')) return '⭐';
    return '🏅';
  };

  const renderStatsCards = () => {
    const statsConfig = [
      {
        icon: "document-text",
        value: userStats.reportsSubmitted || 0,
        label: "Reports Submitted",
        color: "#0ea5e9"
      },
      {
        icon: "calendar",
        value: userStats.eventsJoined || 0,
        label: "Events Joined",
        color: "#22c55e"
      },
      {
        icon: "star",
        value: userStats.badgesEarned || 0,
        label: "Badges Earned",
        color: "#f59e0b"
      },
      {
        icon: "trophy",
        value: userStats.communityPoints || 0,
        label: "Community Points",
        color: "#8b5cf6"
      }
    ];

    return statsConfig.map((stat, index) => (
      <Card key={index} className="border-waterbase-200 flex-1 mx-1">
        <CardContent className="p-3 pt-4 items-center">
          <View className="items-center justify-center mb-2">
            <Ionicons name={stat.icon as any} size={24} color={stat.color} />
          </View>
          <Text className="text-xl font-bold text-waterbase-950">
            {stat.value}
          </Text>
          <Text className="text-xs text-waterbase-600 text-center leading-tight">
            {stat.label}
          </Text>
        </CardContent>
      </Card>
    ));
  };

  const TabButton = ({ id, title, isActive }: { id: string; title: string; isActive: boolean }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(id)}
      className={`flex-1 py-3 px-4 rounded-lg ${isActive ? 'bg-waterbase-500' : 'bg-gray-100'}`}
    >
      <Text className={`text-center font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
      return (
    <ProtectedContent>
      <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Profile" showBackButton={true} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="px-4 py-6">
          <Card className="border-waterbase-200">
            <CardContent className="p-4">
              <View className="items-center">
                <View className="relative mb-4">
                  <LinearGradient
                    colors={['#0ea5e9', '#22c55e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-20 h-20 rounded-full items-center justify-center"
                  >
                    <Text className="text-white text-2xl font-bold">
                      {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
                    </Text>
                  </LinearGradient>
                  <TouchableOpacity className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full items-center justify-center border border-gray-300">
                    <Ionicons name="camera" size={14} color="#0369a1" />
                  </TouchableOpacity>
                </View>

                <Text className="text-xl font-bold text-waterbase-950 mb-1 text-center">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                </Text>
                
                {user && (
                  <Text className="text-sm text-waterbase-600 mb-3 text-center">
                    {user.email}
                  </Text>
                )}

                <View className="items-center mb-3">
                  {user?.areaOfResponsibility && (
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="location" size={16} color="#0369a1" />
                      <Text className="ml-1 text-sm text-waterbase-600">{user.areaOfResponsibility}</Text>
                    </View>
                  )}
                  {user?.organization && (
                    <View className="flex-row items-center">
                      <Ionicons name="business" size={16} color="#0369a1" />
                      <Text className="ml-1 text-sm text-waterbase-600">{user.organization}</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center space-x-2 mb-3">
                  <View className="bg-waterbase-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-medium text-waterbase-700">
                      {user ? user.role.toUpperCase() : 'GUEST'}
                    </Text>
                  </View>
                  <View className="bg-enviro-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-medium text-enviro-700">
                      Member since {user ? 'Jan 2024' : 'Today'}
                    </Text>
                  </View>
                </View>

                {/* Badges Display */}
                {userStats.badges && userStats.badges.length > 0 && (
                  <View className="items-center">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">Badges:</Text>
                    <View className="flex-row flex-wrap justify-center">
                      {userStats.badges.slice(0, 5).map((badge, index) => (
                        <View key={index} className="mx-1 mb-2">
                          <View className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full border-2 border-yellow-300 items-center justify-center">
                            <Text className="text-lg">{getBadgeIcon(badge)}</Text>
                          </View>
                          <Text className="text-xs text-center mt-1 w-10" numberOfLines={1}>
                            {badge.split(' ')[0]}
                          </Text>
                        </View>
                      ))}
                      {userStats.badges.length > 5 && (
                        <View className="mx-1 mb-2">
                          <View className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full border-2 border-gray-300 items-center justify-center">
                            <Text className="text-xs font-bold text-gray-600">
                              +{userStats.badges.length - 5}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Stats Cards */}
        <View className="px-4 mb-6">
          <View className="flex-row space-x-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-waterbase-200 flex-1 mx-1">
                  <CardContent className="p-3 pt-4 items-center">
                    <View className="animate-pulse">
                      <View className="w-6 h-6 bg-gray-300 rounded mb-2" />
                      <View className="w-8 h-6 bg-gray-300 rounded mb-2" />
                      <View className="w-16 h-4 bg-gray-300 rounded" />
                    </View>
                  </CardContent>
                </Card>
              ))
            ) : (
              renderStatsCards()
            )}
          </View>
        </View>

        {/* Tabbed Content */}
        <View className="px-4 mb-6">
          <View className="flex-row space-x-2 mb-4">
            <TabButton id="activity" title="Activity" isActive={activeTab === 'activity'} />
            <TabButton id="settings" title="Settings" isActive={activeTab === 'settings'} />
          </View>

          <Card className="border-waterbase-200">
            <CardContent className="p-4">
              {activeTab === 'activity' ? (
                <View>
                  <Text className="text-lg font-semibold text-waterbase-950 mb-3">Recent Activity</Text>
                  <View className="space-y-3">
                    <View className="flex-row items-start space-x-3">
                      <View className="w-2 h-2 bg-waterbase-500 rounded-full mt-2" />
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-waterbase-900">Report submitted</Text>
                        <Text className="text-xs text-waterbase-600">Plastic pollution at Manila Bay - 2 hours ago</Text>
                      </View>
                    </View>
                    <View className="flex-row items-start space-x-3">
                      <View className="w-2 h-2 bg-enviro-500 rounded-full mt-2" />
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-waterbase-900">Event joined</Text>
                        <Text className="text-xs text-waterbase-600">Beach cleanup at Roxas Boulevard - 1 day ago</Text>
                      </View>
                    </View>
                    <View className="flex-row items-start space-x-3">
                      <View className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-waterbase-900">Badge earned</Text>
                        <Text className="text-xs text-waterbase-600">Water Guardian badge - 3 days ago</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View>
                  <Text className="text-lg font-semibold text-waterbase-950 mb-3">Settings</Text>
                  <View className="space-y-3">
                    <TouchableOpacity className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Ionicons name="person-outline" size={20} color="#0369a1" />
                        <Text className="ml-3 text-waterbase-900">Edit Profile</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Ionicons name="notifications-outline" size={20} color="#0369a1" />
                        <Text className="ml-3 text-waterbase-900">Notifications</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Ionicons name="shield-outline" size={20} color="#0369a1" />
                        <Text className="ml-3 text-waterbase-900">Privacy</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleLogout}
                      className="flex-row items-center justify-between py-2"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                        <Text className="ml-3 text-red-600">Sign Out</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
    </ProtectedContent>
  );
};

export default ProfileScreen;
