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
import { useFeedback } from "../contexts/FeedbackContext";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { SearchableLocationSelect } from "../components/ui/SearchableLocationSelect";
import { resolveProfilePhotoUri } from "../utils/imageUrl";

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
  const navigation = useNavigation<any>();
  const { user, logout, login, token } = useAuth();
  const { showLoading, showProcessing, showSuccess, showError, hideFeedback } = useFeedback();
  const [userStats, setUserStats] = useState<UserStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [isOrganizationsLoading, setIsOrganizationsLoading] = useState(false);
  const [joinedOrganizations, setJoinedOrganizations] = useState<OrganizationSummary[]>([]);
  const [followedOrganizations, setFollowedOrganizations] = useState<OrganizationSummary[]>([]);
  const [members, setMembers] = useState<OrganizationSummary[]>([]);
  const [followers, setFollowers] = useState<OrganizationSummary[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(user?.profile_photo || null);
  const [profilePhotoError, setProfilePhotoError] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedAreaOfResponsibility, setSelectedAreaOfResponsibility] = useState(user?.areaOfResponsibility || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [networkSubTab, setNetworkSubTab] = useState<'members' | 'followers'>('members');
  const [activities, setActivities] = useState<any[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

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
          onPress: async () => {
            await logout();
            Alert.alert(
              "Signed Out",
              "You have been successfully signed out. See you soon!",
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
  };

  const handleProfilePhotoPress = async () => {
    try {
      showLoading('Loading Image Picker', 'Choose an image to update your profile photo...');
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
      showError('Error', 'Failed to pick image: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      hideFeedback();
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    try {
      setIsUploadingPhoto(true);
      showProcessing('Uploading Photo', 'Saving your profile photo...');

      // Create FormData
      const formData = new FormData();
      formData.append('_method', 'PUT');
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
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setProfilePhotoUri(result.user?.profile_photo || uri);
        
        // Update auth context with new user data
        if (result.user && token) {
          await login(token, result.user);
        }

        showSuccess('Success', 'Profile photo updated successfully!');
      } else {
        throw new Error('Failed to upload profile photo');
      }
    } catch (error) {
      showError('Error', 'Failed to upload profile photo: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !token) {
      showError('Error', 'You need to be logged in to update your profile.');
      return;
    }

    const trimmedArea = selectedAreaOfResponsibility.trim();

    if (shouldRequireArea(user.role) && !trimmedArea) {
      showError('Missing Location', 'Area of responsibility is required for your role.');
      return;
    }

    try {
      setIsSavingProfile(true);
      showProcessing('Saving Profile', 'Updating your organization location...');

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
      showSuccess('Success', 'Profile location updated successfully.');
    } catch (error) {
      showError('Error', 'Failed to update profile location: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.USER_STATS, {
        method: 'GET',
      });
      const result = await response.json();
      setUserStats(result);
    } catch (error) {
      console.error('Failed to load user stats', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setProfilePhotoUri(user?.profile_photo || null);
    setProfilePhotoError(false);
    setSelectedAreaOfResponsibility(user?.areaOfResponsibility || '');
  }, [user]);

  const fetchUserOrganizations = async () => {
    try {
      setIsOrganizationsLoading(true);
      showLoading('Loading Organizations', 'Fetching your organizations...');

      const isOrg = ['ngo', 'lgu', 'admin'].includes((user?.role || '').toLowerCase());
      const endpoint = isOrg ? API_ENDPOINTS.USER_ORGANIZATION_AUDIENCE : API_ENDPOINTS.USER_ORGANIZATIONS;

      const response = await apiRequest(endpoint, {
        method: 'GET',
      });

      const result = await response.json();

      if (isOrg) {
        setMembers(result.members || []);
        setFollowers(result.followers || []);
        setFollowedOrganizations(result.following || []);
      } else {
        setJoinedOrganizations(result.joinedOrganizations || []);
        setFollowedOrganizations(result.followedOrganizations || []);
      }
    } catch (error) {
      console.error('Failed to load user organizations', error);
      showError('Failed to load organizations', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsOrganizationsLoading(false);
      hideFeedback();
    }
  };

  const fetchUserActivities = async () => {
    if (!user || !token) return;
    try {
      setIsActivitiesLoading(true);
      const role = (user.role || '').toLowerCase();
      let activitiesData: any[] = [];

      const fetchReports = async () => {
        try {
          const res = await apiRequest(API_ENDPOINTS.REPORTS, { method: 'GET' });
          const data = await res.json();
          return Array.isArray(data) ? data : data.data || [];
        } catch { return []; }
      };

      const fetchEvents = async () => {
        try {
          const res = await apiRequest(API_ENDPOINTS.USER_EVENTS, { method: 'GET' });
          const data = await res.json();
          return Array.isArray(data) ? data : data.data || [];
        } catch { return []; }
      };

      const fetchAllEvents = async () => {
        try {
          const res = await apiRequest(API_ENDPOINTS.EVENTS, { method: 'GET' });
          const data = await res.json();
          return Array.isArray(data) ? data : data.data || [];
        } catch { return []; }
      };

      if (role === 'ngo' || role === 'lgu' || role === 'admin') {
        const [reports, allEvents] = await Promise.all([fetchReports(), fetchAllEvents()]);
        const userEvents = allEvents.filter((e: any) => e.user_id === user.id);
        activitiesData = [
          ...userEvents.slice(0, 5).map((e: any) => ({
            id: `event-${e.id}`,
            type: e.status === 'completed' ? 'event_completed' : 'event_created',
            description: e.status === 'completed'
              ? `Completed cleanup: ${e.title}`
              : `Created event: ${e.title}`,
            date: e.created_at,
            status: e.status,
          })),
          ...reports
            .filter((r: any) => r.user_id === user.id)
            .slice(0, 3)
            .map((r: any) => ({
              id: `report-${r.id}`,
              type: 'report_submitted',
              description: `Submitted report: ${r.title || 'Water Quality Report'}`,
              date: r.created_at,
              status: r.status || 'pending',
            })),
        ];
      } else {
        const [reports, events] = await Promise.all([fetchReports(), fetchEvents()]);
        activitiesData = [
          ...reports
            .filter((r: any) => r.user_id === user.id)
            .slice(0, 5)
            .map((r: any) => ({
              id: `report-${r.id}`,
              type: 'report_submitted',
              description: `Submitted report: ${r.title || 'Water Quality Report'}`,
              date: r.created_at,
              status: r.status || 'pending',
            })),
          ...events.slice(0, 5).map((e: any) => ({
            id: `event-${e.id}`,
            type: e.status === 'completed' ? 'event_completed' : 'event_joined',
            description: e.status === 'completed'
              ? `Completed event: ${e.title}`
              : `Joined event: ${e.title}`,
            date: e.pivot?.joined_at || e.created_at,
            status: e.status,
          })),
        ];
      }

      activitiesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(activitiesData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setIsActivitiesLoading(false);
    }
  };



  useEffect(() => {
    if (user) {
      fetchUserOrganizations();
      fetchUserStats();
      fetchUserActivities();
    }
  }, [user]);

  const openOrganizationProfile = (organizationId: number) => {
    navigation.navigate('OrganizationProfile', { organizationId });
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
      <Card key={index} className="border-waterbase-200 w-24 mx-1">
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
                    {profilePhotoUri && !profilePhotoError ? (
                      <Image
                        source={{ uri: resolveProfilePhotoUri(profilePhotoUri) || undefined }}
                        className="w-20 h-20 rounded-full"
                        onError={() => setProfilePhotoError(true)}
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
                      Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="border-waterbase-200 w-24 mx-1">
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
          </ScrollView>
        </View>

        {/* Tabbed Content */}
        <View className="px-4 mb-6">
          <View className="flex-row space-x-2 mb-4">
            <TabButton id="activity" title="Activity" isActive={activeTab === 'activity'} />
            {['ngo', 'lgu', 'admin'].includes((user?.role || '').toLowerCase()) ? (
              <TabButton id="following" title="Following" isActive={activeTab === 'following'} textClassName="text-[13px] leading-[14px]" buttonClassName="items-center justify-center" />
            ) : (
              <TabButton id="joined" title="Groups Joined" isActive={activeTab === 'joined'} />
            )}
            {['ngo', 'lgu', 'admin'].includes((user?.role || '').toLowerCase()) ? (
              <TabButton id="network" title="Network" isActive={activeTab === 'network'} />
            ) : (
              <TabButton id="followed" title="Following" isActive={activeTab === 'followed'} textClassName="text-[13px] leading-[14px]" buttonClassName="items-center justify-center" />
            )}
            <TabButton id="settings" title="Settings" isActive={activeTab === 'settings'} />
          </View>

          <Card className="border-waterbase-200">
            <CardContent className="p-4">
              {activeTab === 'activity' ? (
                <View>
                  <Text className="text-lg font-semibold text-waterbase-950 mb-3">Recent Activity</Text>
                  {isActivitiesLoading ? (
                    <View className="items-center py-6">
                      <ActivityIndicator size="small" color="#0369a1" />
                      <Text className="text-waterbase-600 mt-2">Loading activities...</Text>
                    </View>
                  ) : activities.length === 0 ? (
                    <View className="bg-waterbase-50 p-4 rounded-lg border border-waterbase-200">
                      <Text className="text-waterbase-700 text-center">No recent activities found.</Text>
                      <Text className="text-waterbase-600 text-center text-xs mt-1">Start by submitting a report or joining an event!</Text>
                    </View>
                  ) : (
                    <View className="space-y-3">
                      {activities.map((activity) => {
                        const iconName =
                          activity.type === 'report_submitted' || activity.type === 'report_reviewed'
                            ? 'camera'
                            : activity.type === 'event_joined' || activity.type === 'event_completed' || activity.type === 'event_created'
                            ? 'calendar'
                            : activity.type === 'achievement'
                            ? 'trophy'
                            : activity.type === 'volunteers_managed'
                            ? 'people'
                            : 'document-text';
                        const iconColor =
                          activity.type === 'report_submitted'
                            ? '#0ea5e9'
                            : activity.type === 'event_joined' || activity.type === 'event_created'
                            ? '#22c55e'
                            : activity.type === 'event_completed'
                            ? '#f59e0b'
                            : '#8b5cf6';
                        return (
                          <View key={activity.id} className="flex-row items-start space-x-3">
                            <View className="w-8 h-8 rounded-full bg-waterbase-100 items-center justify-center mt-0.5">
                              <Ionicons name={iconName as any} size={16} color={iconColor} />
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm font-medium text-waterbase-900">{activity.description}</Text>
                              <Text className="text-xs text-waterbase-600 mt-0.5">
                                {activity.date ? new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                              </Text>
                            </View>
                            {activity.status ? (
                              <View className={`px-2 py-0.5 rounded-full ${
                                activity.status === 'verified' || activity.status === 'completed'
                                  ? 'bg-green-100'
                                  : activity.status === 'pending'
                                  ? 'bg-yellow-100'
                                  : 'bg-gray-100'
                              }`}>
                                <Text className={`text-xs capitalize ${
                                  activity.status === 'verified' || activity.status === 'completed'
                                    ? 'text-green-700'
                                    : activity.status === 'pending'
                                    ? 'text-yellow-700'
                                    : 'text-gray-600'
                                }`}>
                                  {activity.status}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ) : activeTab === 'joined' ? (
                renderOrganizationsTab(
                  'Groups Joined',
                  joinedOrganizations,
                  'You have not joined any organizations yet. Find organizations in Community and send a join request.',
                  'Member'
                )
              ) : activeTab === 'following' ? (
                renderOrganizationsTab(
                  'Following',
                  followedOrganizations,
                  'You are not following any organizations yet. Follow organizations in Community to track their updates.',
                  'Following'
                )
              ) : activeTab === 'followed' ? (
                renderOrganizationsTab(
                  'Organizations Followed',
                  followedOrganizations,
                  'You are not following any organizations yet. Follow organizations in Community to track their updates.',
                  'Following'
                )
              ) : activeTab === 'network' ? (
                <View>
                  <Text className="text-lg font-semibold text-waterbase-950 mb-3">Network</Text>
                  <View className="flex-row space-x-2 mb-3">
                    <TouchableOpacity
                      onPress={() => setNetworkSubTab('members')}
                      className={`flex-1 py-2 px-3 rounded-lg items-center ${networkSubTab === 'members' ? 'bg-waterbase-500' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-center font-medium ${networkSubTab === 'members' ? 'text-white' : 'text-gray-600'}`}>
                        Members ({members.length})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setNetworkSubTab('followers')}
                      className={`flex-1 py-2 px-3 rounded-lg items-center ${networkSubTab === 'followers' ? 'bg-waterbase-500' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-center font-medium ${networkSubTab === 'followers' ? 'text-white' : 'text-gray-600'}`}>
                        Followers ({followers.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {networkSubTab === 'members'
                    ? renderOrganizationsTab('Members', members, 'No members have joined your organization yet.', 'Member')
                    : renderOrganizationsTab('Followers', followers, 'No followers yet.', 'Follower')}
                </View>
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
                    <TouchableOpacity
                      className="flex-row items-center justify-between py-2"
                      onPress={() => navigation.navigate('Notifications')}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="notifications-outline" size={20} color="#0369a1" />
                        <Text className="ml-3 text-waterbase-900">Notifications</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center justify-between py-2"
                      onPress={() => {
                        Alert.alert(
                          'Privacy & Account Controls',
                          'Manage your profile visibility and account details through Edit Profile. Notification privacy can be configured in Notification Settings.',
                          [
                            {
                              text: 'Open Edit Profile',
                              onPress: () => setIsEditProfileOpen(true),
                            },
                            {
                              text: 'Notification Settings',
                              onPress: () => navigation.navigate('Notifications'),
                            },
                            { text: 'Close', style: 'cancel' },
                          ]
                        );
                      }}
                    >
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

        {/* Activity Log Button */}
        <View className="px-4 mb-6">
          <TouchableOpacity
            onPress={() => {
              const role = (user?.role || '').toLowerCase();
              if (role === 'volunteer') {
                navigation.navigate('VolunteerActivityLog');
              } else if (['ngo', 'lgu'].includes(role)) {
                navigation.navigate('OrganizerActivityLog');
              } else if (role === 'researcher') {
                navigation.navigate('ResearcherActivityLog');
              } else if (role === 'admin') {
                navigation.navigate('VolunteerActivityLog');
              } else {
                navigation.navigate('VolunteerActivityLog');
              }
            }}
            activeOpacity={0.7}
          >
            <Card className="border-waterbase-200">
              <CardContent className="p-4">
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 bg-blue-100 rounded-lg items-center justify-center">
                    <Ionicons name="list" size={24} color="#0369A1" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-waterbase-950">View Activity Log</Text>
                    <Text className="text-xs text-waterbase-600">View all your activity and statistics</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </View>
              </CardContent>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </ProtectedContent>
  );
};

export default ProfileScreen;
