import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, View, Text, TouchableOpacity } from "react-native";
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
import { useFeedback } from "../contexts/FeedbackContext";

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

type CleanupDrive = {
  id: number;
  title: string;
  address: string;
  date: string;
  time: string;
  duration: string | number;
  description: string;
  maxVolunteers: number;
  currentVolunteers?: number;
  points: number;
  badge?: string;
  status: string;
  creator?: {
    firstName: string;
    lastName: string;
    organization?: string;
  };
};

const CommunityScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showLoading, showProcessing, showSuccess, showError, hideFeedback } = useFeedback();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updates, setUpdates] = useState<CommunityUpdate[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDirectoryEntry[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestRecord[]>([]);
  const [orgJoinRequests, setOrgJoinRequests] = useState<JoinRequestRecord[]>([]);
  const [autoAcceptJoinRequests, setAutoAcceptJoinRequests] = useState(false);
  const [cleanupDrives, setCleanupDrives] = useState<CleanupDrive[]>([]);
  const [joinedDriveIds, setJoinedDriveIds] = useState<number[]>([]);
  const [driveActionId, setDriveActionId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<"drives" | "feed" | "organizations">("drives");
  const [selectedDrive, setSelectedDrive] = useState<CleanupDrive | null>(null);

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

  const joinRequestByOrgId = useMemo(() => {
    const map: Record<number, JoinRequestRecord> = {};

    joinRequests.forEach((request) => {
      if (!map[request.organization_user_id]) {
        map[request.organization_user_id] = request;
      }
    });

    return map;
  }, [joinRequests]);

  const getJoinRequestStatusByOrgId = useMemo(() => {
    const map: Record<number, JoinRequestRecord["status"]> = {};
    Object.entries(joinRequestByOrgId).forEach(([orgId, request]) => {
      map[Number(orgId)] = request.status;
    });
    return map;
  }, [joinRequestByOrgId]);

  const joinedDriveIdSet = useMemo(() => new Set(joinedDriveIds), [joinedDriveIds]);

  const handleActionError = (title: string, error: unknown) => {
    const message = error instanceof Error ? error.message : "Please try again.";
    Alert.alert(title, message);
  };

  const fetchCommunityData = useCallback(async () => {
    showLoading("Loading Community", "Fetching cleanup drives, organizations, and updates...");
    try {
      const [feedResponse, directoryResponse, userRequestsResponse, userEventsResponse] = await Promise.all([
        apiRequest(API_ENDPOINTS.COMMUNITY_FEED, { method: "GET" }),
        apiRequest(API_ENDPOINTS.ORGANIZATIONS_DIRECTORY, { method: "GET" }),
        apiRequest(API_ENDPOINTS.USER_JOIN_REQUESTS, { method: "GET" }),
        apiRequest(API_ENDPOINTS.USER_EVENTS, { method: "GET" }),
      ]);

      const drivesResponse = await apiRequest(API_ENDPOINTS.EVENTS, { method: "GET" });

      const feedPayload = await feedResponse.json();
      const directoryPayload = await directoryResponse.json();
      const userRequestsPayload = await userRequestsResponse.json();
      const userEventsPayload = await userEventsResponse.json();
      const drivesPayload = await drivesResponse.json();

      setUpdates(Array.isArray(feedPayload?.data) ? feedPayload.data : []);
      setOrganizations(Array.isArray(directoryPayload?.data) ? directoryPayload.data : []);
      setJoinRequests(Array.isArray(userRequestsPayload?.data) ? userRequestsPayload.data : []);
      setCleanupDrives(Array.isArray(drivesPayload) ? drivesPayload : Array.isArray(drivesPayload?.data) ? drivesPayload.data : []);
      setJoinedDriveIds(
        (Array.isArray(userEventsPayload) ? userEventsPayload : [])
          .map((event) => Number(event?.id))
          .filter((eventId) => !Number.isNaN(eventId))
      );

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
      showError("Unable to load community data", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      hideFeedback();
    }
  }, [hideFeedback, isOrganizationAccount, showError, showLoading, user]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const handleFollow = async (organizationId: number, isFollowing: boolean) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    showProcessing("Updating Follow State", isFollowing ? "Removing follow status..." : "Following organization...");
    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to update follow state", error);
      showError("Follow action failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
      hideFeedback();
    }
  };

  const handleJoinRequest = async (organizationId: number) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    showProcessing("Submitting Join Request", "Please wait while we send your request...");
    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${organizationId}/join-requests`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to submit join request", error);
      showError("Join request failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
      hideFeedback();
    }
  };

  const handleCancelJoinRequest = async (organizationId: number) => {
    const request = joinRequestByOrgId[organizationId];

    if (isSubmitting || !request || request.status !== "pending") {
      return;
    }

    setIsSubmitting(true);
    showProcessing("Cancelling Request", "Removing your pending join request...");
    try {
      await apiRequest(API_ENDPOINTS.ORGANIZATION_JOIN_REQUEST(organizationId, request.id), {
        method: "DELETE",
      });
      showSuccess("Request Cancelled", "You can request to join again at any time.");
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to cancel join request", error);
      showError("Unable to cancel request", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateJoinRequest = async (requestId: number, status: "accepted" | "rejected") => {
    if (isSubmitting || !user) {
      return;
    }

    setIsSubmitting(true);
    showProcessing("Updating Request", "Applying your moderation action...");
    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to update join request", error);
      showError("Unable to update request", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
      hideFeedback();
    }
  };

  const handleToggleAutoAccept = async () => {
    if (isSubmitting || !user) {
      return;
    }

    setIsSubmitting(true);
    showProcessing("Updating Settings", "Saving organization request settings...");
    try {
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-settings`, {
        method: "PATCH",
        body: JSON.stringify({ auto_accept_join_requests: !autoAcceptJoinRequests }),
      });
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to toggle auto-accept", error);
      showError("Unable to update settings", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
      hideFeedback();
    }
  };

  const handleJoinCleanupDrive = async (driveId: number) => {
    if (isSubmitting || driveActionId === driveId) {
      return;
    }

    setDriveActionId(driveId);
    setIsSubmitting(true);
    showProcessing("Joining Cleanup Drive", "Please wait while we register your attendance...");
    try {
      await apiRequest(`${API_ENDPOINTS.EVENTS}/${driveId}/join`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      Alert.alert("Cleanup drive joined", "You are now part of this cleanup drive.");
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to join cleanup drive", error);
      showError("Unable to join cleanup drive", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setDriveActionId(null);
      setIsSubmitting(false);
      hideFeedback();
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                <View className="flex-row space-x-2">
                  {[
                    { key: "drives", label: "Cleanup Drives" },
                    { key: "feed", label: "Community Feed" },
                    { key: "organizations", label: "Organizations" },
                  ].map((section) => (
                    <TouchableOpacity
                      key={section.key}
                      onPress={() => setActiveSection(section.key as "drives" | "feed" | "organizations")}
                      className={`px-4 py-2 rounded-full ${activeSection === section.key ? "bg-waterbase-500" : "bg-gray-100"}`}
                    >
                      <Text className={`text-sm font-medium ${activeSection === section.key ? "text-white" : "text-gray-700"}`}>
                        {section.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

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

              {activeSection === "drives" && (
              <Card className="border-waterbase-200 mb-6">
                <CardHeader>
                  <CardTitle className="text-waterbase-950">Cleanup Drives</CardTitle>
                  <CardDescription className="text-waterbase-600">
                    Live volunteer events pulled from the backend event queue.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cleanupDrives.length === 0 ? (
                    <Text className="text-waterbase-600">
                      No cleanup drives are recruiting right now.
                    </Text>
                  ) : (
                    <View className="space-y-3">
                      {cleanupDrives
                        .filter((drive) => drive.status === "recruiting" || drive.status === "active")
                        .slice(0, 5)
                        .map((drive) => {
                          const volunteers = drive.currentVolunteers ?? 0;
                          const slotsLeft = Math.max(drive.maxVolunteers - volunteers, 0);
                          const isJoined = joinedDriveIdSet.has(drive.id);

                          return (
                            <View key={drive.id} className="p-4 rounded-xl border border-waterbase-200 bg-waterbase-50">
                              <View className="flex-row items-start justify-between gap-3 mb-2">
                                <View className="flex-1">
                                  <Text className="font-semibold text-waterbase-950">
                                    {drive.title}
                                  </Text>
                                  <Text className="text-xs text-waterbase-600 mt-1">
                                    {drive.address}
                                  </Text>
                                </View>
                                <View className="px-2 py-1 rounded-full bg-enviro-100">
                                  <Text className="text-xs font-medium text-enviro-800">
                                    {drive.status}
                                  </Text>
                                </View>
                              </View>

                              <Text className="text-sm text-waterbase-700 mb-3">
                                {drive.description}
                              </Text>

                              <View className="flex-row flex-wrap gap-2 mb-3">
                                <View className="px-2 py-1 bg-white rounded-full border border-waterbase-200">
                                  <Text className="text-xs text-waterbase-700">
                                    {new Date(`${drive.date}T${drive.time}`).toLocaleString()}
                                  </Text>
                                </View>
                                <View className="px-2 py-1 bg-white rounded-full border border-waterbase-200">
                                  <Text className="text-xs text-waterbase-700">
                                    {volunteers}/{drive.maxVolunteers} volunteers
                                  </Text>
                                </View>
                                <View className="px-2 py-1 bg-white rounded-full border border-waterbase-200">
                                  <Text className="text-xs text-waterbase-700">
                                    {slotsLeft} slots left
                                  </Text>
                                </View>
                                <View className="px-2 py-1 bg-white rounded-full border border-waterbase-200">
                                  <Text className="text-xs text-waterbase-700">
                                    {drive.points} points
                                  </Text>
                                </View>
                              </View>

                              <View className="flex-row space-x-2">
                                <TouchableOpacity
                                  className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
                                  onPress={() => setSelectedDrive(drive)}
                                >
                                  <Text className="text-gray-800 font-semibold">View Details</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  className={`flex-1 rounded-lg py-3 items-center ${isJoined ? "bg-enviro-200" : "bg-waterbase-500"}`}
                                  onPress={() => handleJoinCleanupDrive(drive.id)}
                                  disabled={isSubmitting || driveActionId === drive.id || isJoined}
                                >
                                  <Text className={`${isJoined ? "text-enviro-900" : "text-white"} font-semibold`}>
                                    {isJoined ? "Joined" : driveActionId === drive.id ? "Joining..." : "Join Cleanup Drive"}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  )}
                </CardContent>
              </Card>
              )}

              {activeSection === "feed" && (
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
              )}

              {activeSection === "organizations" && (
              <Card className="border-waterbase-200 mb-6">
                <CardHeader>
                  <CardTitle className="text-waterbase-950">Organizations</CardTitle>
                  <CardDescription className="text-waterbase-600">Follow organizations or request to become a member.</CardDescription>
                </CardHeader>
                <CardContent>
                  <View className="space-y-3">
                    {organizations.map((org) => {
                      const request = joinRequestByOrgId[org.id];
                      const requestStatus = request?.status;
                      const canCancelRequest = requestStatus === "pending";

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
                              className={`flex-1 px-3 py-2 rounded-lg items-center ${org.is_member ? "bg-enviro-100" : canCancelRequest ? "bg-red-100" : "bg-enviro-500"}`}
                              disabled={isSubmitting || org.is_member}
                              onPress={() => (canCancelRequest ? handleCancelJoinRequest(org.id) : handleJoinRequest(org.id))}
                            >
                              <Text className={`${org.is_member ? "text-enviro-800" : canCancelRequest ? "text-red-800" : "text-white"} text-xs font-medium`}>
                                {org.is_member ? "Member" : canCancelRequest ? "Cancel Request" : "Join"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </CardContent>
              </Card>
              )}
            </View>
          </ScrollView>
        )}

        <Modal visible={!!selectedDrive} transparent animationType="slide" onRequestClose={() => setSelectedDrive(null)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-5">
              {selectedDrive && (
                <>
                  <Text className="text-xl font-bold text-waterbase-950 mb-1">{selectedDrive.title}</Text>
                  <Text className="text-waterbase-600 mb-4">{selectedDrive.address}</Text>
                  <Text className="text-sm text-waterbase-800 mb-2">{selectedDrive.description}</Text>
                  <Text className="text-sm text-waterbase-700 mb-1">Date: {selectedDrive.date}</Text>
                  <Text className="text-sm text-waterbase-700 mb-1">Time: {selectedDrive.time}</Text>
                  <Text className="text-sm text-waterbase-700 mb-1">Duration: {selectedDrive.duration} hours</Text>
                  <Text className="text-sm text-waterbase-700 mb-1">Volunteers: {selectedDrive.currentVolunteers ?? 0}/{selectedDrive.maxVolunteers}</Text>
                  <Text className="text-sm text-waterbase-700 mb-4">Reward points: {selectedDrive.points}</Text>

                  <TouchableOpacity className="bg-waterbase-500 rounded-lg py-3 items-center" onPress={() => setSelectedDrive(null)}>
                    <Text className="text-white font-semibold">Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ProtectedContent>
  );
};

export default CommunityScreen;
