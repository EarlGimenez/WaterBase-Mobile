import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";
import ProtectedContent from "../components/ProtectedContent";
import { useAuth } from "../contexts/AuthContext";
import API_CONFIG, { API_ENDPOINTS, apiRequest } from "../config/api";
import { SearchableLocationSelect } from "../components/ui/SearchableLocationSelect";

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

interface OrganizationSummary {
  id: number;
  firstName: string;
  lastName: string;
  organization?: string;
  role: string;
  areaOfResponsibility?: string;
}

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, login, token } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [isOrganizationsLoading, setIsOrganizationsLoading] = useState(false);
  const [joinedOrganizations, setJoinedOrganizations] = useState<OrganizationSummary[]>([]);
  const [followedOrganizations, setFollowedOrganizations] = useState<OrganizationSummary[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(user?.profile_photo || null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedAreaOfResponsibility, setSelectedAreaOfResponsibility] = useState(user?.areaOfResponsibility || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const backendBaseUrl = API_CONFIG.BASE_URL.replace(/\/api$/, '');

  const resolveProfilePhotoUri = (uri: string | null) => {
    if (!uri) {
      return null;
    }

    if (
      uri.startsWith('http://') ||
      uri.startsWith('https://') ||
      uri.startsWith('file://') ||
      uri.startsWith('content://') ||
      uri.startsWith('data:')
    ) {
      return uri;
    }

    const normalizedPath = uri.startsWith('/') ? uri : `/${uri}`;
    return `${backendBaseUrl}${normalizedPath}`;
  };

  const shouldRequireArea = (role?: string) => {
    return ['ngo', 'lgu', 'researcher'].includes((role || '').toLowerCase());
  };

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

  const handleProfilePhotoPress = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    try {
      setIsUploadingPhoto(true);

      // Create FormData
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'profile_photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('profile_photo', {
        uri,
        name: filename,
        type,
      } as any);

      // Upload using apiRequest
      const response = await apiRequest(API_ENDPOINTS.USER_PROFILE, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setProfilePhotoUri(result.user?.profile_photo || uri);
        
        // Update auth context with new user data
        if (result.user && token) {
          await login(token, result.user);
        }

        Alert.alert('Success', 'Profile photo updated successfully!');
      } else {
        throw new Error('Failed to upload profile photo');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile photo: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'You need to be logged in to update your profile.');
      return;
    }

    const trimmedArea = selectedAreaOfResponsibility.trim();

    if (shouldRequireArea(user.role) && !trimmedArea) {
      Alert.alert('Missing Location', 'Area of responsibility is required for your role.');
      return;
    }

    try {
      setIsSavingProfile(true);

      const response = await apiRequest(API_ENDPOINTS.USER_PROFILE, {
        method: 'PUT',
        body: JSON.stringify({
          areaOfResponsibility: trimmedArea,
        }),
      });

      const result = await response.json();

      if (result.user) {
        await login(token, result.user);
      }

      setIsEditProfileOpen(false);
      Alert.alert('Success', 'Profile location updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile location: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    setProfilePhotoUri(user?.profile_photo || null);
    setSelectedAreaOfResponsibility(user?.areaOfResponsibility || '');
  }, [user]);

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

  const fetchUserOrganizations = async () => {
    try {
      setIsOrganizationsLoading(true);
      const response = await apiRequest(API_ENDPOINTS.USER_ORGANIZATIONS, {
        method: 'GET',
      });

      const result = await response.json();
      setJoinedOrganizations(result.joinedOrganizations || []);
      setFollowedOrganizations(result.followedOrganizations || []);
    } catch (error) {
      console.error('Failed to load user organizations', error);
    } finally {
      setIsOrganizationsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserOrganizations();
    }
  }, [user]);

  const openOrganizationProfile = (organizationId: number) => {
    navigation.navigate('OrganizationProfile' as never, { organizationId } as never);
  };

  const renderOrganizationsTab = (title: string, organizations: OrganizationSummary[], emptyMessage: string, badgeLabel: string) => {
    if (isOrganizationsLoading) {
      return (
        <View className="items-center py-6">
          <ActivityIndicator size="small" color="#0369a1" />
          <Text className="text-waterbase-600 mt-2">Loading organizations...</Text>
        </View>
      );
    }

    return (
      <View>
        <Text className="text-lg font-semibold text-waterbase-950 mb-3">{title}</Text>
        {organizations.length === 0 ? (
          <View className="bg-waterbase-50 p-4 rounded-lg border border-waterbase-200">
            <Text className="text-waterbase-700">{emptyMessage}</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {organizations.map((org) => (
              <TouchableOpacity
                key={org.id}
                onPress={() => openOrganizationProfile(org.id)}
                className="p-3 bg-waterbase-50 rounded-lg border border-waterbase-200"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-semibold text-waterbase-950">
                      {org.organization || `${org.firstName} ${org.lastName}`}
                    </Text>
                    {org.areaOfResponsibility ? (
                      <Text className="text-xs text-waterbase-600 mt-1">{org.areaOfResponsibility}</Text>
                    ) : null}
                  </View>

                  <View className="flex-row items-center">
                    <View className="bg-white border border-waterbase-200 px-2 py-1 rounded-full mr-2">
                      <Text className="text-xs text-waterbase-700">{badgeLabel}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

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

  const TabButton = ({ id, title, isActive, textClassName = '', buttonClassName = '' }: { id: string; title: string; isActive: boolean; textClassName?: string; buttonClassName?: string }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(id)}
      className={`flex-1 py-3 px-4 rounded-lg items-center justify-center ${isActive ? 'bg-waterbase-500' : 'bg-gray-100'} ${buttonClassName}`}
    >
      <Text className={`text-center font-medium ${isActive ? 'text-white' : 'text-gray-600'} ${textClassName}`}>
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
                    {profilePhotoUri ? (
                      <Image
                        source={{ uri: resolveProfilePhotoUri(profilePhotoUri) || undefined }}
                        className="w-20 h-20 rounded-full"
                      />
                    ) : (
                      <Text className="text-white text-2xl font-bold">
                        {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
                      </Text>
                    )}
                  </LinearGradient>
                  <TouchableOpacity
                    onPress={handleProfilePhotoPress}
                    disabled={isUploadingPhoto}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full items-center justify-center border border-gray-300"
                  >
                    {isUploadingPhoto ? (
                      <ActivityIndicator size="small" color="#0369a1" />
                    ) : (
                      <Ionicons name="camera" size={14} color="#0369a1" />
                    )}
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
            <TabButton id="joined" title="Groups Joined" isActive={activeTab === 'joined'} />
            <TabButton id="followed" title="Following" isActive={activeTab === 'followed'} textClassName="text-[13px] leading-[14px]" buttonClassName="items-center justify-center" />
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
              ) : activeTab === 'joined' ? (
                renderOrganizationsTab(
                  'Groups Joined',
                  joinedOrganizations,
                  'You have not joined any organizations yet. Find organizations in Community and send a join request.',
                  'Member'
                )
              ) : activeTab === 'followed' ? (
                renderOrganizationsTab(
                  'Organizations Followed',
                  followedOrganizations,
                  'You are not following any organizations yet. Follow organizations in Community to track their updates.',
                  'Following'
                )
              ) : (
                <View>
                  <Text className="text-lg font-semibold text-waterbase-950 mb-3">Settings</Text>
                  <View className="space-y-3">
                    <TouchableOpacity
                      className="flex-row items-center justify-between py-2"
                      onPress={() => setIsEditProfileOpen((prev) => !prev)}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="person-outline" size={20} color="#0369a1" />
                        <Text className="ml-3 text-waterbase-900">Edit Profile</Text>
                      </View>
                      <Ionicons
                        name={isEditProfileOpen ? "chevron-down" : "chevron-forward"}
                        size={20}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                    {isEditProfileOpen && (
                      <View className="bg-waterbase-50 rounded-lg p-3 border border-waterbase-200">
                        <Text className="text-sm font-medium text-waterbase-800 mb-2">
                          Area of Responsibility
                        </Text>
                        <SearchableLocationSelect
                          value={selectedAreaOfResponsibility}
                          onValueChange={setSelectedAreaOfResponsibility}
                          placeholder="Search and select your location..."
                          disabled={isSavingProfile}
                        />
                        <Text className="text-xs text-waterbase-600 mt-2">
                          Use the same location framework used during registration.
                        </Text>
                        <View className="flex-row justify-end mt-3">
                          <TouchableOpacity
                            className="px-3 py-2 rounded-lg border border-gray-300 mr-2"
                            onPress={() => {
                              setSelectedAreaOfResponsibility(user?.areaOfResponsibility || '');
                              setIsEditProfileOpen(false);
                            }}
                            disabled={isSavingProfile}
                          >
                            <Text className="text-gray-700">Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`px-3 py-2 rounded-lg ${isSavingProfile ? 'bg-waterbase-300' : 'bg-waterbase-600'}`}
                            onPress={handleSaveProfile}
                            disabled={isSavingProfile}
                          >
                            {isSavingProfile ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <Text className="text-white">Save</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
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
