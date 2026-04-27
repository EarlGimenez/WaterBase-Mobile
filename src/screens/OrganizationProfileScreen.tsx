import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Navigation from "../components/Navigation";
import ProtectedContent from "../components/ProtectedContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { useFeedback } from "../contexts/FeedbackContext";

type OrganizationUpdate = {
  id: number;
  title: string;
  content: string;
  update_type: "update" | "announcement" | "event";
  published_at?: string;
  created_at?: string;
};

type OrganizationProfilePayload = {
  organization: {
    id: number;
    firstName: string;
    lastName: string;
    organization?: string;
    email: string;
    areaOfResponsibility?: string;
    profile_photo?: string;
    role: string;
    followers_count: number;
    members_count: number;
  };
  is_following: boolean;
  is_member: boolean;
  auto_accept_join_requests: boolean;
  join_request?: {
    id: number;
    status: "pending" | "accepted" | "rejected" | "auto_accepted" | "cancelled";
  } | null;
  updates: OrganizationUpdate[];
};

interface OrganizationProfileScreenProps {
  route: {
    params?: {
      organizationId?: number;
    };
  };
}

const OrganizationProfileScreen: React.FC<OrganizationProfileScreenProps> = ({ route }) => {
  const organizationId = route.params?.organizationId;
  const { showLoading, showProcessing, showSuccess, showError, hideFeedback } = useFeedback();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<OrganizationProfilePayload | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!organizationId) {
      return;
    }

    showLoading("Loading Organization", "Fetching profile and join status...");

    try {
      const response = await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}/profile`, {
        method: "GET",
      });
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Failed to load organization profile", error);
      showError("Unable to load organization", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      hideFeedback();
    }
  }, [hideFeedback, organizationId, showError, showLoading]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollowToggle = async () => {
    if (!organizationId || !profile || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    showProcessing("Updating Follow State", profile.is_following ? "Removing follow status..." : "Following organization...");

    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}/follow`, {
        method: profile.is_following ? "DELETE" : "POST",
      });

      await fetchProfile();
    } catch (error) {
      console.error("Failed to update follow status", error);
      showError("Unable to update follow state", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
      hideFeedback();
    }
  };

  const handleJoinRequest = async () => {
    if (!organizationId || !profile || profile.is_member || isSubmitting) {
      return;
    }

    if (profile.join_request?.status === "pending") {
      setIsSubmitting(true);
      showProcessing("Cancelling Request", "Removing your pending join request...");

      try {
        await apiRequest(API_ENDPOINTS.ORGANIZATION_JOIN_REQUEST(organizationId, profile.join_request.id), {
          method: "DELETE",
        });

        showSuccess("Request Cancelled", "You can request to join again whenever needed.");
        await fetchProfile();
      } catch (error) {
        console.error("Failed to cancel join request", error);
        showError("Unable to cancel request", error instanceof Error ? error.message : "Please try again.");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    setIsSubmitting(true);
    showProcessing("Submitting Join Request", "Please wait while we send your request...");

    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}/join-requests`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      await fetchProfile();
    } catch (error) {
      console.error("Failed to create join request", error);
      showError("Unable to submit request", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!organizationId) {
    return (
      <ProtectedContent>
        <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
          <Navigation title="Organization" showBackButton={true} />
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-lg font-semibold text-waterbase-950 mb-2">Missing organization</Text>
            <Text className="text-waterbase-700 text-center">This organization could not be opened because no ID was provided.</Text>
          </View>
        </SafeAreaView>
      </ProtectedContent>
    );
  }

  return (
    <ProtectedContent>
      <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
        <Navigation title="Organization" showBackButton={true} />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0369a1" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-4"
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => {
              setIsRefreshing(true);
              fetchProfile();
            }} />}
          >
            <View className="py-6">
              <Card className="border-waterbase-200 mb-4">
                <CardContent className="p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xl font-bold text-waterbase-950 flex-1">{profile?.organization.organization || `${profile?.organization.firstName} ${profile?.organization.lastName}`}</Text>
                    <View className="bg-waterbase-100 px-2 py-1 rounded-full">
                      <Text className="text-waterbase-700 text-xs font-medium uppercase">{profile?.organization.role}</Text>
                    </View>
                  </View>

                  {!!profile?.organization.areaOfResponsibility && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="location" size={14} color="#0369a1" />
                      <Text className="ml-2 text-waterbase-700 text-sm">{profile.organization.areaOfResponsibility}</Text>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-waterbase-700 text-sm">{profile?.organization.followers_count ?? 0} followers</Text>
                    <Text className="text-waterbase-700 text-sm">{profile?.organization.members_count ?? 0} members</Text>
                  </View>

                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={handleFollowToggle}
                      disabled={isSubmitting}
                      className={`flex-1 items-center py-2 rounded-lg ${profile?.is_following ? "bg-gray-200" : "bg-waterbase-500"}`}
                    >
                      <Text className={`${profile?.is_following ? "text-gray-700" : "text-white"} font-medium`}>
                        {profile?.is_following ? "Following" : "Follow"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleJoinRequest}
                      disabled={isSubmitting || profile?.is_member}
                      className={`flex-1 items-center py-2 rounded-lg ${profile?.is_member ? "bg-enviro-100" : profile?.join_request?.status === "pending" ? "bg-red-100" : "bg-enviro-500"}`}
                    >
                      <Text className={`${profile?.is_member ? "text-enviro-800" : profile?.join_request?.status === "pending" ? "text-red-800" : "text-white"} font-medium`}>
                        {profile?.is_member ? "Member" : profile?.join_request?.status === "pending" ? "Cancel Request" : "Request to Join"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>

              <Card className="border-waterbase-200">
                <CardHeader>
                  <CardTitle className="text-waterbase-950">Latest Updates</CardTitle>
                  <CardDescription className="text-waterbase-600">Organization announcements, events, and progress updates.</CardDescription>
                </CardHeader>
                <CardContent>
                  {(profile?.updates || []).length === 0 ? (
                    <Text className="text-waterbase-600">No updates published yet.</Text>
                  ) : (
                    <View className="space-y-3">
                      {(profile?.updates || []).map((update) => (
                        <View key={update.id} className="p-3 bg-waterbase-50 rounded-lg">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="font-semibold text-waterbase-950 flex-1">{update.title}</Text>
                            <View className="bg-white rounded-full px-2 py-1 border border-waterbase-200">
                              <Text className="text-xs text-waterbase-700 capitalize">{update.update_type}</Text>
                            </View>
                          </View>
                          <Text className="text-sm text-waterbase-700 mb-2">{update.content}</Text>
                          <Text className="text-xs text-waterbase-500">{new Date(update.published_at || update.created_at || Date.now()).toLocaleString()}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </CardContent>
              </Card>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ProtectedContent>
  );
};

export default OrganizationProfileScreen;
