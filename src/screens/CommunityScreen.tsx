import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Modal, RefreshControl, ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
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
import { resolveProfilePhotoUri } from "../utils/imageUrl";

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
    profile_photo?: string | null;
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
  cleanup_verification_status?: "not_required" | "pending" | "approved" | "failed";
  cleanup_verification_notes?: string | null;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    organization?: string;
    profile_photo?: string | null;
  };
};

const getInitials = (firstName?: string, lastName?: string, organization?: string) => {
  const source = organization || `${firstName || ""} ${lastName || ""}`.trim();
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "WB";
};

const CommunityScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const { showLoading, showProcessing, showSuccess, showError, hideFeedback } = useFeedback();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updates, setUpdates] = useState<CommunityUpdate[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDirectoryEntry[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestRecord[]>([]);
  const [cleanupDrives, setCleanupDrives] = useState<CleanupDrive[]>([]);
  const [joinedDriveIds, setJoinedDriveIds] = useState<number[]>([]);
  const [presentDriveIds, setPresentDriveIds] = useState<Set<number>>(new Set());
  const [driveActionId, setDriveActionId] = useState<number | null>(null);
  const [cleanupEvidenceActionId, setCleanupEvidenceActionId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<"drives" | "feed" | "organizations">("drives");
  const [selectedDrive, setSelectedDrive] = useState<CleanupDrive | null>(null);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");

  const isOrganizationAccount = useMemo(() => {
    const role = (user?.role || "").toLowerCase();
    return role === "ngo" || role === "lgu";
  }, [user?.role]);

  const isVolunteer = useMemo(() => {
    const role = (user?.role || "").toLowerCase();
    return role === "volunteer";
  }, [user?.role]);

  const canJoinOrganizations = useMemo(() => {
    const role = (user?.role || "").toLowerCase();
    return role !== "ngo" && role !== "lgu" && role !== "admin" && role !== "researcher";
  }, [user?.role]);

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

  const organizationNetworkById = useMemo(() => {
    const map = new Map<number, "Member org" | "Following">();
    organizations.forEach((organization) => {
      if (organization.is_member) {
        map.set(organization.id, "Member org");
      } else if (organization.is_following) {
        map.set(organization.id, "Following");
      }
    });
    return map;
  }, [organizations]);

  const recruitingDrives = useMemo(() => {
    return cleanupDrives
      .filter((drive) => drive.status === "recruiting" || drive.status === "active")
      .sort((a, b) => {
        const aIsNetwork = a.creator?.id ? organizationNetworkById.has(a.creator.id) : false;
        const bIsNetwork = b.creator?.id ? organizationNetworkById.has(b.creator.id) : false;
        if (aIsNetwork !== bIsNetwork) return aIsNetwork ? -1 : 1;
        return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
      });
  }, [cleanupDrives, organizationNetworkById]);

  const filteredOrganizations = useMemo(() => {
    if (!orgSearchQuery.trim()) return organizations;
    const query = orgSearchQuery.toLowerCase();
    return organizations.filter((org) => {
      const name = (org.organization || `${org.firstName} ${org.lastName}`).toLowerCase();
      const area = (org.areaOfResponsibility || "").toLowerCase();
      return name.includes(query) || area.includes(query);
    });
  }, [organizations, orgSearchQuery]);

  const handleActionError = (title: string, error: unknown) => {
    const message = error instanceof Error ? error.message : "Please try again.";
    Alert.alert(title, message);
  };

  const fetchCommunityData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      let feedPayload: any = { data: [] };
      let directoryPayload: any = { data: [] };
      let userRequestsPayload: any = { data: [] };
      let userEventsPayload: any = [];
      let drivesPayload: any = [];

      try {
        const res = await apiRequest(API_ENDPOINTS.COMMUNITY_FEED, { method: "GET" });
        feedPayload = await res.json();
      } catch (e) {
        console.error("Failed to fetch community feed", e);
      }

      try {
        const res = await apiRequest(API_ENDPOINTS.ORGANIZATIONS_DIRECTORY, { method: "GET" });
        directoryPayload = await res.json();
      } catch (e) {
        console.error("Failed to fetch organizations directory", e);
      }

      try {
        const res = await apiRequest(API_ENDPOINTS.USER_JOIN_REQUESTS, { method: "GET" });
        userRequestsPayload = await res.json();
      } catch (e) {
        console.error("Failed to fetch join requests", e);
      }

      try {
        const res = await apiRequest(API_ENDPOINTS.USER_EVENTS, { method: "GET" });
        userEventsPayload = await res.json();
      } catch (e) {
        console.error("Failed to fetch user events", e);
      }

      try {
        const res = await apiRequest(API_ENDPOINTS.EVENTS, { method: "GET" });
        drivesPayload = await res.json();
      } catch (e) {
        console.error("Failed to fetch events", e);
      }

      setUpdates(Array.isArray(feedPayload?.data) ? feedPayload.data : []);
      setOrganizations(Array.isArray(directoryPayload?.data) ? directoryPayload.data : []);
      setJoinRequests(Array.isArray(userRequestsPayload?.data) ? userRequestsPayload.data : []);
      setCleanupDrives(Array.isArray(drivesPayload) ? drivesPayload : Array.isArray(drivesPayload?.data) ? drivesPayload.data : []);
      const userEvents = Array.isArray(userEventsPayload) ? userEventsPayload : [];
      setJoinedDriveIds(
        userEvents
          .map((event) => Number(event?.id))
          .filter((eventId) => !Number.isNaN(eventId))
      );
      setPresentDriveIds(
        new Set(
          userEvents
            .filter((event) => event.pivot?.is_present === true || event.pivot?.is_present === 1)
            .map((event) => Number(event?.id))
            .filter((eventId) => !Number.isNaN(eventId))
        )
      );
    } catch (error) {
      console.error("Failed to fetch community data", error);
      showError("Unable to load community data", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [hideFeedback, showError, showLoading, user]);

  const fetchOrganizations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiRequest(API_ENDPOINTS.ORGANIZATIONS_DIRECTORY, { method: "GET" });
      const directoryPayload = await res.json();
      setOrganizations(Array.isArray(directoryPayload?.data) ? directoryPayload.data : []);
    } catch (e) {
      console.error("Failed to fetch organizations directory", e);
    }
  }, [token]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  useEffect(() => {
    if (activeSection === "organizations" && organizations.length === 0) {
      fetchOrganizations();
    }
  }, [activeSection, fetchOrganizations, organizations.length]);

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



  const handleJoinCleanupDrive = async (driveId: number) => {
    if (!isVolunteer || isSubmitting || driveActionId === driveId) {
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

  const handleLeaveCleanupDrive = async (driveId: number) => {
    if (!isVolunteer || isSubmitting || driveActionId === driveId) {
      return;
    }

    setDriveActionId(driveId);
    setIsSubmitting(true);
    showProcessing("Leaving Cleanup Drive", "Please wait while we cancel your participation...");
    try {
      await apiRequest(`${API_ENDPOINTS.EVENTS}/${driveId}/leave`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      Alert.alert("Participation cancelled", "You have left this cleanup drive.");
      await fetchCommunityData();
    } catch (error) {
      console.error("Failed to leave cleanup drive", error);
      showError("Unable to leave cleanup drive", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setDriveActionId(null);
      setIsSubmitting(false);
      hideFeedback();
    }
  };

  const getCleanupVerificationLabel = (status?: string) => {
    switch (status) {
      case "pending":
        return "Pending cleanup proof";
      case "approved":
        return "Cleanliness verified";
      case "failed":
        return "Cleanup proof failed / needs more evidence";
      default:
        return "Cleanup proof not required yet";
    }
  };

  const handleSubmitCleanupEvidence = async (drive: CleanupDrive) => {
    if (!isVolunteer || cleanupEvidenceActionId === drive.id) {
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Please allow photo access to submit cleanup evidence.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName || `cleanup-evidence-${drive.id}.jpg`;
      const mimeType = asset.mimeType || "image/jpeg";
      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);

      setCleanupEvidenceActionId(drive.id);
      showProcessing("Submitting Cleanup Photo", "AI is checking the after-cleanup image...");

      const response = await apiRequest(API_ENDPOINTS.EVENT_CLEANUP_EVIDENCE(drive.id), {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      await fetchCommunityData();
      Alert.alert(
        payload.result === "approved" ? "Cleanup verified" : "More cleanup needed",
        payload.message || "Cleanup evidence submitted."
      );
    } catch (error) {
      console.error("Failed to submit cleanup evidence", error);
      showError("Cleanup photo failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setCleanupEvidenceActionId(null);
      hideFeedback();
    }
  };

  const openOrganizationProfile = (organizationId: number) => {
    (navigation as any).navigate("OrganizationProfile", { organizationId });
  };

  return (
    <ProtectedContent>
      <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
        <Navigation title="Community" showBackButton={true} />

        {/* Removed loading indicator to avoid annoying modal */}
        <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    fetchCommunityData();
                    if (activeSection === "organizations") {
                      fetchOrganizations();
                    }
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
                      {recruitingDrives
                        .slice(0, 5)
                        .map((drive) => {
                          const volunteers = drive.currentVolunteers ?? 0;
                          const slotsLeft = Math.max(drive.maxVolunteers - volunteers, 0);
                          const isJoined = joinedDriveIdSet.has(drive.id);
                          const isPresent = presentDriveIds.has(drive.id);
                          const canSubmitCleanupEvidence = isVolunteer
                            && isJoined
                            && isPresent
                            && (drive.status === "active" || drive.status === "completed")
                            && drive.cleanup_verification_status !== "approved";
                          const networkLabel = drive.creator?.id ? organizationNetworkById.get(drive.creator.id) : null;

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
                                <View className="items-end gap-1">
                                  {networkLabel && (
                                    <View className="px-2 py-1 rounded-full bg-waterbase-100">
                                      <Text className="text-xs font-medium text-waterbase-800">
                                        {networkLabel}
                                      </Text>
                                    </View>
                                  )}
                                  <View className="px-2 py-1 rounded-full bg-enviro-100">
                                    <Text className="text-xs font-medium text-enviro-800">
                                      {drive.status}
                                    </Text>
                                  </View>
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

                              {isJoined && presentDriveIds.has(drive.id) && (
                                <View className="bg-teal-100 rounded-lg px-3 py-2 mb-3 flex-row items-center justify-center">
                                  <Ionicons name="checkmark-circle" size={16} color="#0d9488" />
                                  <Text className="text-teal-800 text-xs font-semibold ml-1">Checked in</Text>
                                </View>
                              )}

                              {(drive.status === "completed" || drive.cleanup_verification_status) && (
                                <View className="bg-white rounded-lg px-3 py-2 mb-3 border border-waterbase-200">
                                  <Text className="text-xs font-semibold text-waterbase-800">
                                    {getCleanupVerificationLabel(drive.cleanup_verification_status)}
                                  </Text>
                                </View>
                              )}

                              <View className="flex-row space-x-2">
                                <TouchableOpacity
                                  className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
                                  onPress={() => setSelectedDrive(drive)}
                                >
                                  <Text className="text-gray-800 font-semibold">View Details</Text>
                                </TouchableOpacity>
                                {isVolunteer && (
                                  <TouchableOpacity
                                    className={`flex-1 rounded-lg py-3 items-center ${isJoined ? "bg-enviro-200" : "bg-waterbase-500"}`}
                                    onPress={() => (isJoined ? handleLeaveCleanupDrive(drive.id) : handleJoinCleanupDrive(drive.id))}
                                    disabled={isSubmitting || driveActionId === drive.id}
                                  >
                                    <Text className={`${isJoined ? "text-enviro-900" : "text-white"} font-semibold`}>
                                      {isJoined
                                        ? (driveActionId === drive.id ? "Cancelling..." : "Cancel Participation")
                                        : (driveActionId === drive.id ? "Joining..." : "Join Cleanup Drive")}
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>

                              {isJoined && !presentDriveIds.has(drive.id) && (drive.status === "recruiting" || drive.status === "active") && (
                                <TouchableOpacity
                                  className="mt-2 bg-teal-500 rounded-lg py-3 items-center flex-row justify-center"
                                  onPress={() => navigation.navigate("QRScanner" as never)}
                                >
                                  <Ionicons name="qr-code-outline" size={16} color="#ffffff" />
                                  <Text className="text-white font-semibold ml-2">Scan QR to check in</Text>
                                </TouchableOpacity>
                              )}

                              {canSubmitCleanupEvidence && (
                                <TouchableOpacity
                                  className="mt-2 bg-emerald-600 rounded-lg py-3 items-center flex-row justify-center"
                                  onPress={() => handleSubmitCleanupEvidence(drive)}
                                  disabled={cleanupEvidenceActionId === drive.id}
                                >
                                  <Ionicons name="camera-outline" size={16} color="#ffffff" />
                                  <Text className="text-white font-semibold ml-2">
                                    {cleanupEvidenceActionId === drive.id ? "Submitting Photo..." : "Submit Cleanup Photo"}
                                  </Text>
                                </TouchableOpacity>
                              )}
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
                            {resolveProfilePhotoUri(update.organization.profile_photo) ? (
                              <Image
                                source={{ uri: resolveProfilePhotoUri(update.organization.profile_photo) || "" }}
                                className="w-10 h-10 rounded-full mr-3 bg-waterbase-50"
                              />
                            ) : (
                              <View
                                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                style={{ backgroundColor: `${getUpdateColor(update.update_type)}20` }}
                              >
                                <Text className="text-xs font-semibold" style={{ color: getUpdateColor(update.update_type) }}>
                                  {getInitials(update.organization.firstName, update.organization.lastName, update.organization.organization)}
                                </Text>
                              </View>
                            )}
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
                  <TextInput
                    value={orgSearchQuery}
                    onChangeText={setOrgSearchQuery}
                    placeholder="Search organizations..."
                    className="border border-waterbase-200 rounded-lg px-3 py-2 mb-4 bg-white text-waterbase-950"
                    placeholderTextColor="#6b7280"
                  />
                  <View className="space-y-3">
                    {filteredOrganizations.map((org) => {
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

                            {canJoinOrganizations && (
                              <TouchableOpacity
                                className={`flex-1 px-3 py-2 rounded-lg items-center ${org.is_member ? "bg-enviro-100" : canCancelRequest ? "bg-red-100" : "bg-enviro-500"}`}
                                disabled={isSubmitting || org.is_member}
                                onPress={() => (canCancelRequest ? handleCancelJoinRequest(org.id) : handleJoinRequest(org.id))}
                              >
                                <Text className={`${org.is_member ? "text-enviro-800" : canCancelRequest ? "text-red-800" : "text-white"} text-xs font-medium`}>
                                  {org.is_member ? "Member" : canCancelRequest ? "Cancel Request" : "Join"}
                                </Text>
                              </TouchableOpacity>
                            )}
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
                  <View className="bg-waterbase-50 rounded-lg px-3 py-2 mb-4 border border-waterbase-200">
                    <Text className="text-sm font-semibold text-waterbase-900">
                      {getCleanupVerificationLabel(selectedDrive.cleanup_verification_status)}
                    </Text>
                    {selectedDrive.cleanup_verification_notes && (
                      <Text className="text-xs text-waterbase-700 mt-1">{selectedDrive.cleanup_verification_notes}</Text>
                    )}
                  </View>

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
