import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";
import ProtectedContent from "../components/ProtectedContent";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { useAuth } from "../contexts/AuthContext";

type CommunityUpdate = {
  id: number;
  title: string;
  content: string;
  update_type: "update" | "announcement" | "event";
  published_at?: string;
  created_at?: string;
  organization: {
    id: number;
    organization?: string;
    firstName: string;
    lastName: string;
  };
};

type OrganizationDirectoryEntry = {
  id: number;
  firstName: string;
  lastName: string;
  organization?: string;
  areaOfResponsibility?: string;
  role: string;
  is_following: boolean;
  is_member: boolean;
};

type JoinRequestRecord = {
  id: number;
  organization_user_id: number;
  requester_user_id: number;
  status: "pending" | "accepted" | "rejected" | "auto_accepted" | "cancelled";
  requester?: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

const CommunityScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updates, setUpdates] = useState<CommunityUpdate[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDirectoryEntry[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestRecord[]>([]);
  const [orgJoinRequests, setOrgJoinRequests] = useState<JoinRequestRecord[]>([]);
  const [autoAcceptJoinRequests, setAutoAcceptJoinRequests] = useState(false);

  const isOrganizationAccount = useMemo(() => {
    const role = (user?.role || "").toLowerCase();
    return role === "ngo" || role === "lgu" || role === "researcher";
  }, [user?.role]);

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "event":
        return "calendar";
      case "announcement":
        return "megaphone";
      default:
        return "chatbubble-ellipses";
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case "event":
        return "#22c55e";
      case "announcement":
        return "#f59e0b";
      default:
        return "#3b82f6";
    }
  };

  const getJoinRequestStatusByOrgId = useMemo(() => {
    const map: Record<number, JoinRequestRecord["status"]> = {};
    joinRequests.forEach((request) => {
      map[request.organization_user_id] = request.status;
    });
    return map;
  }, [joinRequests]);

  const fetchCommunityData = useCallback(async () => {
    try {
      const [feedResponse, directoryResponse, userRequestsResponse] = await Promise.all([
        apiRequest(API_ENDPOINTS.COMMUNITY_FEED, { method: "GET" }),
        apiRequest(API_ENDPOINTS.ORGANIZATIONS_DIRECTORY, { method: "GET" }),
        apiRequest(API_ENDPOINTS.USER_JOIN_REQUESTS, { method: "GET" }),
      ]);

      const feedPayload = await feedResponse.json();
      const directoryPayload = await directoryResponse.json();
      const userRequestsPayload = await userRequestsResponse.json();

      setUpdates(Array.isArray(feedPayload?.data) ? feedPayload.data : []);
      setOrganizations(Array.isArray(directoryPayload?.data) ? directoryPayload.data : []);
      setJoinRequests(Array.isArray(userRequestsPayload?.data) ? userRequestsPayload.data : []);

      if (user && isOrganizationAccount) {
        const [orgRequestsResponse, orgSettingsResponse] = await Promise.all([
          apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-requests`, { method: "GET" }),
          apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-settings`, { method: "GET" }),
        ]);

        const orgRequestsPayload = await orgRequestsResponse.json();
        const orgSettingsPayload = await orgSettingsResponse.json();

        setOrgJoinRequests(Array.isArray(orgRequestsPayload?.data) ? orgRequestsPayload.data : []);
        setAutoAcceptJoinRequests(!!orgSettingsPayload?.auto_accept_join_requests);
      }
    } catch (error) {
      console.error("Failed to fetch community data", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isOrganizationAccount, user]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const handleFollow = async (organizationId: number, isFollowing: boolean) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to update follow state", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRequest = async (organizationId: number) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}/join-requests`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to submit join request", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateJoinRequest = async (requestId: number, status: "accepted" | "rejected") => {
    if (isSubmitting || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to update join request", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAutoAccept = async () => {
    if (isSubmitting || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-settings`, {
        method: "PATCH",
        body: JSON.stringify({ auto_accept_join_requests: !autoAcceptJoinRequests }),
      });
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to toggle auto-accept", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openOrganizationProfile = (organizationId: number) => {
    navigation.navigate("OrganizationProfile" as never, { organizationId } as never);
  };

  return (
    <ProtectedContent>
      <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
        <Navigation title="Community" showBackButton={true} />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0369a1" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchCommunityData();
                }}
              />
            }
          >
            <View className="py-6">
              {isOrganizationAccount && (
                <Card className="border-waterbase-200 mb-6">
                  <CardHeader>
                    <CardTitle className="text-waterbase-950">Organization Controls</CardTitle>
                    <CardDescription className="text-waterbase-600">Manage how members join your organization.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TouchableOpacity
                      className="flex-row items-center justify-between mb-4 p-3 bg-waterbase-50 rounded-lg"
                      onPress={handleToggleAutoAccept}
                      disabled={isSubmitting}
                    >
                      <View>
                        <Text className="font-semibold text-waterbase-950">Auto-accept join requests</Text>
                        <Text className="text-xs text-waterbase-600 mt-1">
                          {autoAcceptJoinRequests
                            ? "New requests are accepted automatically and users become members immediately."
                            : "Requests stay pending until you review them."}
                        </Text>
                      </View>
                      <View className={`w-12 h-7 rounded-full p-1 ${autoAcceptJoinRequests ? "bg-enviro-500" : "bg-gray-300"}`}>
                        <View className={`w-5 h-5 rounded-full bg-white ${autoAcceptJoinRequests ? "ml-auto" : "ml-0"}`} />
                      </View>
                    </TouchableOpacity>

                    <Text className="font-semibold text-waterbase-950 mb-2">Pending join requests</Text>
                    {orgJoinRequests.filter((request) => request.status === "pending").length === 0 ? (
                      <Text className="text-waterbase-600">No pending requests.</Text>
                    ) : (
                      <View className="space-y-3">
                        {orgJoinRequests
                          .filter((request) => request.status === "pending")
                          .map((request) => (
                            <View key={request.id} className="p-3 bg-white rounded-lg border border-waterbase-200">
                              <Text className="font-medium text-waterbase-950">
                                {request.requester ? `${request.requester.firstName} ${request.requester.lastName}` : `User #${request.requester_user_id}`}
                              </Text>
                              <Text className="text-xs text-waterbase-600 mb-3">{request.requester?.email || "No email available"}</Text>
                              <View className="flex-row space-x-2">
                                <TouchableOpacity
                                  className="flex-1 bg-enviro-500 rounded-lg py-2 items-center"
                                  onPress={() => handleUpdateJoinRequest(request.id, "accepted")}
                                  disabled={isSubmitting}
                                >
                                  <Text className="text-white font-medium">Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  className="flex-1 bg-red-500 rounded-lg py-2 items-center"
                                  onPress={() => handleUpdateJoinRequest(request.id, "rejected")}
                                  disabled={isSubmitting}
                                >
                                  <Text className="text-white font-medium">Reject</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                      </View>
                    )}
                  </CardContent>
                </Card>
              )}

              <View className="mb-6">
                <Text className="text-lg font-semibold text-waterbase-950 mb-3">Community Feed</Text>
                {updates.length === 0 ? (
                  <Card className="border-waterbase-200">
                    <CardContent className="p-4">
                      <Text className="text-waterbase-600">
                        No updates yet. Follow or join organizations to receive updates here.
                      </Text>
                    </CardContent>
                  </Card>
                ) : (
                  <View className="space-y-4">
                    {updates.map((update) => (
                      <Card key={update.id} className="border-waterbase-200">
                        <CardContent className="p-4">
                          <View className="flex-row items-start mb-3">
                            <View
                              className="w-10 h-10 rounded-full items-center justify-center mr-3"
                              style={{ backgroundColor: `${getUpdateColor(update.update_type)}20` }}
                            >
                              <Ionicons
                                name={getUpdateIcon(update.update_type)}
                                size={20}
                                color={getUpdateColor(update.update_type)}
                              />
                            </View>
                            <View className="flex-1">
                              <TouchableOpacity onPress={() => openOrganizationProfile(update.organization.id)}>
                                <Text className="font-semibold text-waterbase-950 text-sm">
                                  {update.organization.organization || `${update.organization.firstName} ${update.organization.lastName}`}
                                </Text>
                              </TouchableOpacity>
                              <Text className="text-sm font-medium text-waterbase-950 mt-1">{update.title}</Text>
                            </View>
                          </View>

                          <Text className="text-sm text-gray-700 mb-2">{update.content}</Text>
                          <Text className="text-xs text-gray-500">
                            {new Date(update.published_at || update.created_at || Date.now()).toLocaleString()}
                          </Text>
                        </CardContent>
                      </Card>
                    ))}
                  </View>
                )}
              </View>

              <Card className="border-waterbase-200 mb-6">
                <CardHeader>
                  <CardTitle className="text-waterbase-950">Organizations</CardTitle>
                  <CardDescription className="text-waterbase-600">Follow organizations or request to become a member.</CardDescription>
                </CardHeader>
                <CardContent>
                  <View className="space-y-3">
                    {organizations.map((org) => {
                      const requestStatus = getJoinRequestStatusByOrgId[org.id];

                      return (
                        <View
                          key={org.id}
                          className="p-3 bg-waterbase-50 rounded-lg border border-waterbase-200"
                        >
                          <TouchableOpacity onPress={() => openOrganizationProfile(org.id)}>
                            <Text className="font-medium text-sm text-waterbase-950">
                              {org.organization || `${org.firstName} ${org.lastName}`}
                            </Text>
                            <Text className="text-xs text-waterbase-600 mt-1">{org.areaOfResponsibility || "No area set"}</Text>
                          </TouchableOpacity>

                          <View className="flex-row space-x-2 mt-3">
                            <TouchableOpacity
                              className={`flex-1 px-3 py-2 rounded-lg items-center ${org.is_following ? "bg-gray-200" : "bg-waterbase-500"}`}
                              onPress={() => handleFollow(org.id, org.is_following)}
                              disabled={isSubmitting}
                            >
                              <Text className={`${org.is_following ? "text-gray-700" : "text-white"} text-xs font-medium`}>
                                {org.is_following ? "Following" : "Follow"}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              className={`flex-1 px-3 py-2 rounded-lg items-center ${org.is_member ? "bg-enviro-100" : requestStatus === "pending" ? "bg-yellow-100" : "bg-enviro-500"}`}
                              disabled={isSubmitting || org.is_member || requestStatus === "pending"}
                              onPress={() => handleJoinRequest(org.id)}
                            >
                              <Text className={`${org.is_member ? "text-enviro-800" : requestStatus === "pending" ? "text-yellow-800" : "text-white"} text-xs font-medium`}>
                                {org.is_member ? "Member" : requestStatus === "pending" ? "Request Pending" : "Join"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </CardContent>
              </Card>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ProtectedContent>
  );
};

export default CommunityScreen;
