import React, { useState, useEffect, useCallback } from "react";
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
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
import { Button } from "../components/ui/Button";
import Navigation from "../components/Navigation";
import ProtectedContent from "../components/ProtectedContent";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { useFeedback } from "../contexts/FeedbackContext";
import { WBSICalculator, type Report } from "../utils/wbsiCalculator";
import { toTitleCaseInput } from "../utils/textFormat";

interface MobileReport extends Report {
  report_group_id?: number;
  region_code?: string;
  region_name?: string;
  province_name?: string;
  municipality_name?: string;
  barangay_name?: string;
  geocoded_at?: string;
}

interface AreaReport {
  id: number;
  location: string;
  coordinates: { lat: number; lng: number };
  reportCount: number;
  severityLevel: string;
  lastReported: string;
  description: string;
  estimatedCleanupEffort: string;
  priority: string;
  reports: MobileReport[];
}

interface Volunteer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  totalEvents: number;
  totalPoints: number;
  eventsThisMonth: number;
  totalHours: number;
  lastActivity: string;
  status: 'active' | 'inactive';
  joinDate: string;
  badges: string[];
  rank: string;
  currentEvents: Array<{ id: number; title: string; task_note?: string | null }>;
}

interface JoinRequestRecord {
  id: number;
  organization_user_id: number;
  requester_user_id: number;
  status: "pending" | "accepted" | "rejected" | "auto_accepted" | "cancelled";
  requester?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface CleanupEvidence {
  id: number;
  image: string;
  ai_annotated_image?: string | null;
  ai_severity?: string | null;
  ai_confidence?: number | string;
  pollution_percentage?: number | string;
  result: string;
  notes?: string | null;
  created_at: string;
  submitter?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

const EVENT_PRESETS = {
  quick: {
    name: "Quick",
    detail: "2 hrs / 15 volunteers",
    duration: "2",
    maxVolunteers: "15",
    rewardPoints: "30",
    rewardBadge: "Water Defender",
  },
  halfDay: {
    name: "Half-day",
    detail: "4 hrs / 25 volunteers",
    duration: "4",
    maxVolunteers: "25",
    rewardPoints: "60",
    rewardBadge: "Environmental Steward",
  },
  fullDay: {
    name: "Full-day",
    detail: "8 hrs / 40 volunteers",
    duration: "8",
    maxVolunteers: "40",
    rewardPoints: "100",
    rewardBadge: "Cleanup Champion",
  },
};

const OrganizerPortalScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const { showLoading, showProcessing, showSuccess, showError, hideFeedback } = useFeedback();
  const [activeTab, setActiveTab] = useState('areas');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eligibleAreas, setEligibleAreas] = useState<AreaReport[]>([]);
  const [createdEvents, setCreatedEvents] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaReport | null>(null);
  const [showAreaDetails, setShowAreaDetails] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    duration: "",
    maxVolunteers: "",
    description: "",
    rewardPoints: "",
    rewardBadge: "",
  });
  const [eventError, setEventError] = useState("");
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [taskVolunteer, setTaskVolunteer] = useState<Volunteer | null>(null);
  const [taskEventId, setTaskEventId] = useState<number | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [isSavingTaskNote, setIsSavingTaskNote] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editEventId, setEditEventId] = useState<number | null>(null);
  const [editEvent, setEditEvent] = useState({
    title: "",
    date: "",
    time: "",
    duration: "",
    maxVolunteers: "",
    description: "",
    rewardPoints: "",
    rewardBadge: "",
  });
  const [orgJoinRequests, setOrgJoinRequests] = useState<JoinRequestRecord[]>([]);
  const [autoAcceptJoinRequests, setAutoAcceptJoinRequests] = useState(false);
  const [isOrgLoading, setIsOrgLoading] = useState(false);
  const [orgMembers, setOrgMembers] = useState<Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    joined_at: string;
    joined_via: string;
  }>>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [isStartingEvent, setIsStartingEvent] = useState<number | null>(null);
  const [isCompletingEvent, setIsCompletingEvent] = useState<number | null>(null);
  const [messageEvent, setMessageEvent] = useState<any>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [cleanupEvent, setCleanupEvent] = useState<any>(null);
  const [cleanupEvidences, setCleanupEvidences] = useState<CleanupEvidence[]>([]);
  const [cleanupEvidenceAsset, setCleanupEvidenceAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // QR Code display state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEvent, setQrEvent] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const wbsiCalculator = new WBSICalculator();

  const isOrganizerRole = ['ngo', 'lgu'].includes((user?.role || '').toLowerCase());

  // Combined data loading function to reduce API spam
  const loadAllData = useCallback(async () => {
    if (!user?.id || !token) return;

    try {
      setIsLoading(true);
      setIsOrgLoading(true);

      // Make API calls in parallel
      const requests: Promise<Response>[] = [
        apiRequest(API_ENDPOINTS.REPORTS_ACCESSIBLE, { method: "GET" }),
        apiRequest(`${API_ENDPOINTS.EVENTS}?user_id=${user.id}`, { method: "GET" }),
      ];

      if (isOrganizerRole) {
        requests.push(
          apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-requests`, { method: "GET" }),
          apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-settings`, { method: "GET" })
        );
      }

      const responses = await Promise.all(requests);
      const reportsResponse = responses[0];
      const eventsResponse = responses[1];
      const orgRequestsResponse = isOrganizerRole ? responses[2] : null;
      const orgSettingsResponse = isOrganizerRole ? responses[3] : null;

      // Process reports
      const allReports = await reportsResponse.json();
      const verifiedReports = Array.isArray(allReports) ? allReports.filter((r: MobileReport) => r.status === 'verified') : [];

      // Process events
      const eventsData = await eventsResponse.json();
      const events = Array.isArray(eventsData) ? eventsData : [];
      setCreatedEvents(events);

      // Process organization data only for organizers
      if (isOrganizerRole && orgRequestsResponse && orgSettingsResponse) {
        const orgRequestsData = await orgRequestsResponse.json();
        const orgSettingsData = await orgSettingsResponse.json();
        setOrgJoinRequests(Array.isArray(orgRequestsData?.data) ? orgRequestsData.data : []);
        setAutoAcceptJoinRequests(!!orgSettingsData?.auto_accept_join_requests);
      } else {
        setOrgJoinRequests([]);
        setAutoAcceptJoinRequests(false);
      }

      // Process areas with events data
      processEligibleAreas(verifiedReports, events);

      // Process volunteers from events
      await processVolunteersFromEvents(events);

      // Fetch organization members only for organizers
      if (isOrganizerRole) {
        await fetchOrgMembers();
      } else {
        setOrgMembers([]);
      }
    } catch (error) {
      console.error('Failed to load organizer data:', error);
      showError('Failed to load organizer data', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
      setIsOrgLoading(false);
      setIsRefreshing(false);
      hideFeedback();
    }
  }, [user?.id, user?.role, showError, hideFeedback]);

  const areLocationsMatching = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }) => {
    const latDiff = Math.abs(coord1.lat - coord2.lat);
    const lngDiff = Math.abs(coord1.lng - coord2.lng);
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) <= 0.001;
  };

  const isAreaBlockingEvent = (event: any) => {
    const status = String(event.status || "").toLowerCase();
    return status === "recruiting" || status === "active" || (status === "completed" && event.cleanup_verification_status !== "failed");
  };

  const getLocationString = (report: MobileReport) => {
    if (report.barangay_name) return `${report.barangay_name}, ${report.municipality_name}, ${report.province_name}`;
    if (report.municipality_name) return `${report.municipality_name}, ${report.province_name}`;
    if (report.province_name) return report.province_name;
    return report.address || `Location ${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`;
  };

  const getMostRecentEventDateForLocation = (coordinates: { lat: number; lng: number }, eventsData: any[]) => {
    const eventsAtLocation = eventsData.filter((event) =>
      isAreaBlockingEvent(event) && areLocationsMatching({ lat: event.latitude, lng: event.longitude }, coordinates)
    );
    if (eventsAtLocation.length === 0) return new Date(0);

    const mostRecentEvent = [...eventsAtLocation].sort((a, b) =>
      new Date(b.created_at || b.createdAt || b.date).getTime() - new Date(a.created_at || a.createdAt || a.date).getTime()
    )[0];
    if (mostRecentEvent.status === "recruiting" || mostRecentEvent.status === "active") {
      return new Date(8640000000000000);
    }
    return new Date(mostRecentEvent.created_at || mostRecentEvent.createdAt || mostRecentEvent.date);
  };

  const buildAreaFromReports = (areaId: number, groupReports: MobileReport[], suffix = ""): AreaReport => {
    const sortedReports = [...groupReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const mostRecentReport = sortedReports[0];
    const pollutionTypes = [...new Set(groupReports.map((r) => r.pollutionType))];
    const wbsiResult = wbsiCalculator.calculateWBSI(groupReports);
    const severityLevel = getSeverityLevel(wbsiResult.wbsi_mode);
    const location = `${getLocationString(mostRecentReport)}${suffix}`;

    return {
      id: areaId,
      location,
      coordinates: { lat: mostRecentReport.latitude, lng: mostRecentReport.longitude },
      reportCount: groupReports.length,
      severityLevel,
      lastReported: formatDistanceToNow(new Date(mostRecentReport.created_at)),
      description: groupReports.length === 1
        ? `${pollutionTypes[0]} pollution reported`
        : `Multiple pollution types: ${pollutionTypes.join(", ")} (${groupReports.length} reports)`,
      estimatedCleanupEffort: estimateCleanupEffort(groupReports.length),
      priority: calculatePriority(severityLevel, groupReports.length),
      reports: groupReports,
    };
  };

  // Process reports into eligible areas
  const processEligibleAreas = (reports: MobileReport[], eventsData: any[]) => {
    if (!reports || reports.length === 0) {
      setEligibleAreas([]);
      return;
    }

    const groups: Record<string, MobileReport[]> = {};
    const DISTANCE_THRESHOLD = 0.001; // approximately 100m

    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return;

      if (report.report_group_id) {
        const groupKey = `group-${report.report_group_id}`;
        groups[groupKey] = groups[groupKey] || [];
        groups[groupKey].push(report);
        return;
      }

      let foundGroup = false;
      Object.keys(groups).forEach((groupKey) => {
        if (foundGroup) return;
        if (groupKey.startsWith("group-")) return;
        const [groupLat, groupLng] = groupKey.split(',').map(Number);
        const distance = Math.sqrt(
          Math.pow(report.latitude - groupLat, 2) + Math.pow(report.longitude - groupLng, 2)
        );
        if (distance <= DISTANCE_THRESHOLD) {
          groups[groupKey].push(report);
          foundGroup = true;
        }
      });

      if (!foundGroup) {
        const newGroupKey = `${report.latitude},${report.longitude}`;
        groups[newGroupKey] = [report];
      }
    });

    const areas: AreaReport[] = [];
    let areaIdCounter = 1;

    Object.values(groups).forEach((groupReports) => {
      const activeReports = groupReports.filter((report) => report.status !== "declined");
      if (activeReports.length === 0) return;

      const mostRecentReport = [...activeReports].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const coordinates = { lat: mostRecentReport.latitude, lng: mostRecentReport.longitude };
      const hasExistingEvent = eventsData.some((event: any) =>
        isAreaBlockingEvent(event) && areLocationsMatching({ lat: event.latitude, lng: event.longitude }, coordinates)
      );

      if (hasExistingEvent) {
        const mostRecentEventDate = getMostRecentEventDateForLocation(coordinates, eventsData);
        const reportsAfterEvent = activeReports.filter((report) => new Date(report.created_at) > mostRecentEventDate);
        if (reportsAfterEvent.length > 0) {
          areas.push(buildAreaFromReports(areaIdCounter++, reportsAfterEvent, " (New Reports)"));
        }
        return;
      }

      areas.push(buildAreaFromReports(areaIdCounter++, activeReports));
    });

    setEligibleAreas(areas);
  };

  // Process volunteers from events data
  const processVolunteersFromEvents = async (events: any[]) => {
    const volunteerMap = new Map<number, Volunteer>();

    for (const event of events) {
      try {
        const volunteersResponse = await apiRequest(API_ENDPOINTS.EVENT_VOLUNTEERS(event.id), { method: "GET" });
        const eventVolunteers = await volunteersResponse.json();

        eventVolunteers.forEach((volunteer: any) => {
          const userId = volunteer.user_id || volunteer.id;
          if (!volunteerMap.has(userId)) {
            volunteerMap.set(userId, {
              id: userId,
              firstName: volunteer.firstName || 'Unknown',
              lastName: volunteer.lastName || 'Volunteer',
              email: volunteer.email || 'no-email@provided.com',
              phone: volunteer.phone || '',
              address: volunteer.organization || '',
              totalEvents: 0,
              totalPoints: 0,
              eventsThisMonth: 0,
              totalHours: 0,
              lastActivity: event.date || event.created_at,
              status: 'active',
              joinDate: volunteer.pivot?.created_at || event.created_at,
              badges: ['Environmental Volunteer'],
              rank: 'Active',
              currentEvents: []
            });
          }

          const volunteerRecord = volunteerMap.get(userId)!;
          volunteerRecord.totalEvents++;
          volunteerRecord.totalPoints += event.points || 50;
          volunteerRecord.totalHours += parseInt(event.duration) || 3;
          volunteerRecord.currentEvents.push({
            id: event.id,
            title: event.title,
            task_note: volunteer.task_note ?? volunteer.pivot?.task_note ?? null,
          });

          const eventDate = new Date(event.date);
          const now = new Date();
          if (eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()) {
            volunteerRecord.eventsThisMonth++;
          }
        });
      } catch (volunteerError) {
        console.log(`Could not fetch volunteers for event ${event.id}:`, volunteerError);
      }
    }

    const volunteersArray = Array.from(volunteerMap.values());
    volunteersArray.forEach(volunteer => {
      const lastActivityDate = new Date(volunteer.lastActivity);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastActivityDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      volunteer.lastActivity = diffDays === 1 ? '1 day ago' :
        diffDays <= 7 ? `${diffDays} days ago` :
        diffDays <= 30 ? `${Math.ceil(diffDays / 7)} weeks ago` :
        `${Math.ceil(diffDays / 30)} months ago`;

      volunteer.status = diffDays <= 30 ? 'active' : 'inactive';
    });

    setVolunteers(volunteersArray);
  };

  const getSeverityLevel = (wbsi: number): string => {
    if (wbsi < 25) return 'Low';
    if (wbsi < 50) return 'Medium';
    if (wbsi < 75) return 'High';
    return 'Critical';
  };

  const formatDistanceToNow = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const estimateCleanupEffort = (count: number): string => {
    if (count >= 10) return 'High effort required';
    if (count >= 5) return 'Medium effort required';
    return 'Low effort required';
  };

  const calculatePriority = (severityLevel: string, count: number): string => {
    if (severityLevel === 'Critical' || count >= 10) return 'High';
    if (severityLevel === 'High' || count >= 5) return 'Medium';
    return 'Low';
  };

  const fetchOrgMembers = async () => {
    if (!user?.id) return;
    try {
      setIsMembersLoading(true);
      const response = await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/members`, { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        setOrgMembers(Array.isArray(data?.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch org members:', error);
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!user) return;
    Alert.alert(
      "Remove Member",
      "Are you sure you want to remove this member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/members/${memberId}`, {
                method: "DELETE",
              });
              setOrgMembers((prev) => prev.filter((m) => m.id !== memberId));
            } catch (error) {
              console.error("Failed to remove member", error);
              showError("Unable to remove member", error instanceof Error ? error.message : "Please try again.");
            }
          },
        },
      ]
    );
  };

  // Organization controls handlers
  const handleUpdateJoinRequest = async (requestId: number, status: "accepted" | "rejected") => {
    if (!user || !isOrganizerRole) return;

    try {
      showProcessing("Updating Request", "Applying your moderation action...");
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadAllData();
      showSuccess("Request Updated", `Join request has been ${status}.`);
    } catch (error) {
      console.error("Failed to update join request", error);
      showError("Unable to update request", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleToggleAutoAccept = async () => {
    if (!user || !isOrganizerRole) return;

    try {
      showProcessing("Updating Settings", "Saving organization request settings...");
      await apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-settings`, {
        method: "PATCH",
        body: JSON.stringify({ auto_accept_join_requests: !autoAcceptJoinRequests }),
      });
      await loadAllData();
      showSuccess("Settings Updated", "Auto-accept setting has been saved.");
    } catch (error) {
      console.error("Failed to toggle auto-accept", error);
      showError("Unable to update settings", error instanceof Error ? error.message : "Please try again.");
    }
  };

  // Load data on mount
  useEffect(() => {
    if (user?.id && token) {
      showLoading('Loading Organizer Portal', 'Fetching reports, events, and volunteers...');
      loadAllData();
    }
  }, [user?.id, token, loadAllData, showLoading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
  };

  const handleCreateEvent = async () => {
    if (!selectedArea) return;

    if (!newEvent.title.trim()) {
      setEventError("Event title is required");
      return;
    }
    if (!newEvent.date || !newEvent.time) {
      setEventError("Date and time are required");
      return;
    }
    if (!newEvent.maxVolunteers || parseInt(newEvent.maxVolunteers) < 1) {
      setEventError("Maximum volunteers must be at least 1");
      return;
    }

    setIsCreatingEvent(true);
    setEventError("");

    try {
      const eventData = {
        title: newEvent.title,
        address: selectedArea.location,
        latitude: selectedArea.coordinates.lat,
        longitude: selectedArea.coordinates.lng,
        date: newEvent.date,
        time: newEvent.time,
        duration: newEvent.duration,
        description: newEvent.description || `Cleanup event for ${selectedArea.location}`,
        maxVolunteers: parseInt(newEvent.maxVolunteers),
        points: parseInt(newEvent.rewardPoints) || 50,
        badge: newEvent.rewardBadge || "Environmental Volunteer",
        status: 'recruiting',
        user_id: user?.id,
      };

      const response = await apiRequest(API_ENDPOINTS.EVENTS, {
        method: 'POST',
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        setNewEvent({
          title: "",
          date: "",
          time: "",
          duration: "",
          maxVolunteers: "",
          description: "",
          rewardPoints: "",
          rewardBadge: "",
        });
        setShowCreateEvent(false);
        setSelectedArea(null);
        await handleRefresh();
        Alert.alert("Success", "Cleanup event created successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setEventError(error instanceof Error ? error.message : 'Failed to create event. Please try again.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const openEditEventModal = (event: any) => {
    setEditEventId(event.id);
    setEditEvent({
      title: event.title || "",
      date: event.date ? event.date.split("T")[0] : "",
      time: event.time || "",
      duration: String(event.duration || ""),
      maxVolunteers: String(event.maxVolunteers || ""),
      description: event.description || "",
      rewardPoints: String(event.points || ""),
      rewardBadge: event.badge || "",
    });
    setEventError("");
    setShowEditEvent(true);
  };

  const openQRModal = async (event: any) => {
    setQrEvent(event);
    setQrDataUrl("");
    setShowQRModal(true);
    setIsGeneratingQR(true);

    try {
      // Dynamically import and generate QR code
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(
        `waterbase://event/${event.id}/attend`,
        {
          width: 300,
          margin: 2,
          color: {
            dark: "#0369a1",
            light: "#ffffff",
          },
        }
      );
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
      setQrDataUrl(""); // Will show error state
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editEventId) return;

    if (!editEvent.title.trim()) {
      setEventError("Event title is required");
      return;
    }
    if (!editEvent.date || !editEvent.time) {
      setEventError("Date and time are required");
      return;
    }
    if (!editEvent.maxVolunteers || parseInt(editEvent.maxVolunteers) < 1) {
      setEventError("Maximum volunteers must be at least 1");
      return;
    }

    setIsEditingEvent(true);
    setEventError("");

    try {
      const eventData = {
        title: editEvent.title,
        date: editEvent.date,
        time: editEvent.time,
        duration: editEvent.duration,
        description: editEvent.description,
        maxVolunteers: parseInt(editEvent.maxVolunteers),
        points: parseInt(editEvent.rewardPoints) || 50,
        badge: editEvent.rewardBadge || "Environmental Volunteer",
      };

      const response = await apiRequest(`${API_ENDPOINTS.EVENTS}/${editEventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        setShowEditEvent(false);
        setEditEventId(null);
        await handleRefresh();
        Alert.alert("Success", "Event updated successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setEventError(error instanceof Error ? error.message : 'Failed to update event. Please try again.');
    } finally {
      setIsEditingEvent(false);
    }
  };

  const handleStartEvent = async (event: any) => {
    setIsStartingEvent(event.id);
    try {
      const response = await apiRequest(API_ENDPOINTS.EVENT_START(event.id), { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to start event");
      await handleRefresh();
      openQRModal({ ...event, status: "active" });
    } catch (error) {
      showError("Unable to start event", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsStartingEvent(null);
    }
  };

  const handleCompleteEvent = (event: any) => {
    Alert.alert(
      "Complete Event",
      `Mark "${event.title}" as completed? Linked reports will wait for after-cleanup evidence before resolution.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            setIsCompletingEvent(event.id);
            try {
              const response = await apiRequest(API_ENDPOINTS.EVENT_COMPLETE(event.id), { method: "POST" });
              const data = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(data.message || "Failed to complete event");
              await handleRefresh();
              showSuccess("Event Completed", "Cleanup event was marked completed.");
            } catch (error) {
              showError("Unable to complete event", error instanceof Error ? error.message : "Please try again.");
            } finally {
              setIsCompletingEvent(null);
            }
          },
        },
      ]
    );
  };

  const handleCancelEvent = (event: any) => {
    Alert.alert(
      "Cancel Event",
      `Cancel "${event.title}"? Registered volunteers will be notified.`,
      [
        { text: "Keep Event", style: "cancel" },
        {
          text: "Cancel Event",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiRequest(API_ENDPOINTS.EVENT_CANCEL(event.id), { method: "POST" });
              if (!response.ok) throw new Error("Failed to cancel event");
              await handleRefresh();
              showSuccess("Event Cancelled", "Cleanup event was cancelled.");
            } catch (error) {
              showError("Unable to cancel event", error instanceof Error ? error.message : "Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = async (useCustom: boolean) => {
    if (!messageEvent) return;
    setIsSendingMessage(true);
    try {
      const body = useCustom && customMessage.trim() ? { message: customMessage.trim() } : {};
      const response = await apiRequest(API_ENDPOINTS.EVENT_MESSAGE_VOLUNTEERS(messageEvent.id), {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to send message");
      setMessageEvent(null);
      setCustomMessage("");
      showSuccess("Message Sent", "Volunteers were notified.");
    } catch (error) {
      showError("Unable to message volunteers", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const openTaskNoteModal = (volunteer: Volunteer) => {
    const event = volunteer.currentEvents[0];
    if (!event) return;

    setTaskVolunteer(volunteer);
    setTaskEventId(event.id);
    setTaskNote(event.task_note || "");
  };

  const handleSaveTaskNote = async () => {
    if (!taskVolunteer || !taskEventId) return;
    setIsSavingTaskNote(true);
    try {
      await apiRequest(API_ENDPOINTS.EVENT_VOLUNTEER_TASK_NOTE(taskEventId, taskVolunteer.id), {
        method: "PATCH",
        body: JSON.stringify({ task_note: taskNote.trim() || null }),
      });
      setTaskVolunteer(null);
      setTaskEventId(null);
      setTaskNote("");
      await handleRefresh();
      showSuccess("Task Updated", "Volunteer task note was saved.");
    } catch (error) {
      showError("Unable to save task", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSavingTaskNote(false);
    }
  };

  const loadCleanupEvidence = async (event: any) => {
    setCleanupEvent(event);
    setCleanupEvidenceAsset(null);
    setIsLoadingEvidence(true);
    try {
      const response = await apiRequest(API_ENDPOINTS.EVENT_CLEANUP_EVIDENCE(event.id), { method: "GET" });
      const data = await response.json().catch(() => ({}));
      setCleanupEvidences(Array.isArray(data.evidences) ? data.evidences : []);
    } catch (error) {
      setCleanupEvidences([]);
    } finally {
      setIsLoadingEvidence(false);
    }
  };

  const pickCleanupEvidence = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setCleanupEvidenceAsset(result.assets[0]);
    }
  };

  const submitCleanupEvidence = async () => {
    if (!cleanupEvent || !cleanupEvidenceAsset) return;
    const formData = new FormData();
    formData.append("image", {
      uri: cleanupEvidenceAsset.uri,
      name: cleanupEvidenceAsset.fileName || `cleanup-${cleanupEvent.id}.jpg`,
      type: cleanupEvidenceAsset.mimeType || "image/jpeg",
    } as any);

    setIsSubmittingEvidence(true);
    try {
      const response = await apiRequest(API_ENDPOINTS.EVENT_CLEANUP_EVIDENCE(cleanupEvent.id), {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      } as any);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to submit cleanup evidence");
      setCleanupEvidenceAsset(null);
      await loadCleanupEvidence(cleanupEvent);
      await handleRefresh();
      showSuccess("Evidence Submitted", data.message || "Cleanup evidence was uploaded.");
    } catch (error) {
      showError("Unable to submit evidence", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleDeclineReport = async (reportId: number) => {
    Alert.alert(
      "Decline Report",
      "Are you sure you want to decline this report? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(API_ENDPOINTS.REPORT_STATUS(reportId), {
                method: 'PATCH',
                body: JSON.stringify({ status: 'declined' }),
              });
              await handleRefresh();
              Alert.alert("Success", "Report declined successfully!");
            } catch (error) {
              console.error('Error declining report:', error);
              Alert.alert("Error", "Failed to decline report. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleBulkDeclineReports = (pendingReports: MobileReport[]) => {
    if (pendingReports.length === 0) return;
    Alert.alert(
      "Decline Reports",
      `Decline all ${pendingReports.length} pending reports in this area?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline All",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiRequest(API_ENDPOINTS.REPORTS_BULK_STATUS, {
                method: "PATCH",
                body: JSON.stringify({
                  report_ids: pendingReports.map((report) => report.id),
                  status: "declined",
                }),
              });
              const data = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(data.message || "Failed to decline reports");
              await handleRefresh();
              setShowAreaDetails(false);
              showSuccess("Reports Declined", `${pendingReports.length} reports were declined.`);
            } catch (error) {
              showError("Unable to decline reports", error instanceof Error ? error.message : "Please try again.");
            }
          },
        },
      ]
    );
  };

  const filteredAreas = showUrgentOnly
    ? eligibleAreas.filter((area) => ["high", "critical"].includes(area.severityLevel.toLowerCase()))
    : eligibleAreas;

  const sortedEvents = [...createdEvents].sort((a, b) => {
    const statusOrder: Record<string, number> = { recruiting: 1, active: 2, completed: 3, cancelled: 4 };
    const statusDiff = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime();
  });

  const applyPreset = (presetKey: keyof typeof EVENT_PRESETS) => {
    const preset = EVENT_PRESETS[presetKey];
    setNewEvent((prev) => ({
      ...prev,
      duration: preset.duration,
      maxVolunteers: preset.maxVolunteers,
      rewardPoints: preset.rewardPoints,
      rewardBadge: preset.rewardBadge,
    }));
  };

  const generateDefaultTitle = () => {
    if (!selectedArea) return "";
    const isUrgent = ["critical", "high"].includes(selectedArea.severityLevel.toLowerCase());
    return `${isUrgent ? "Urgent Cleanup:" : "Cleanup Event:"} ${selectedArea.location}`;
  };

  const getBadgeClass = (value?: string) => {
    switch ((value || "").toLowerCase()) {
      case "critical":
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
      case "recruiting":
        return "bg-blue-100 text-blue-800";
      case "active":
      case "low":
      case "approved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCleanupVerificationLabel = (status?: string) => {
    switch (status) {
      case "pending":
        return "Pending cleanup proof";
      case "approved":
        return "Cleanliness verified";
      case "failed":
        return "Cleanup proof failed";
      default:
        return "Cleanup proof not required yet";
    }
  };

  const tabs = [
    { key: 'areas', label: 'Reports', icon: 'map' },
    { key: 'events', label: 'My Events', icon: 'calendar' },
    { key: 'volunteers', label: 'Volunteers', icon: 'people' },
    ...(isOrganizerRole
      ? [
          { key: 'members', label: 'Members', icon: 'people-circle' },
          { key: 'organization', label: 'Controls', icon: 'business' },
        ]
      : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'areas':
        return (
          <View className="space-y-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-semibold text-waterbase-950">Areas with Reports</Text>
                <Text className="text-xs text-gray-600">{filteredAreas.length} of {eligibleAreas.length} locations shown</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowUrgentOnly((value) => !value)}
                className={`px-3 py-2 rounded-lg ${showUrgentOnly ? "bg-red-500" : "bg-gray-100"}`}
              >
                <Text className={`text-xs font-semibold ${showUrgentOnly ? "text-white" : "text-gray-700"}`}>
                  {showUrgentOnly ? "Urgent" : "All"}
                </Text>
              </TouchableOpacity>
            </View>

            {filteredAreas.length === 0 ? (
              <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                  <Ionicons name="document-text-outline" size={48} color="#6b7280" />
                  <Text className="text-lg font-medium text-gray-900 mt-4 mb-2">
                    {showUrgentOnly ? "No Urgent Areas" : "No Eligible Areas Yet"}
                  </Text>
                  <Text className="text-gray-600">
                    {showUrgentOnly
                      ? "No high or critical areas are currently available."
                      : "Areas need at least 1 verified report to be eligible for cleanup events."}
                  </Text>
                </CardContent>
              </Card>
            ) : (
              filteredAreas.map((area) => (
                <Card key={area.id} className="border-waterbase-200">
                  <CardHeader>
                    <View className="flex-row items-start justify-between">
                      <CardTitle className="text-base text-waterbase-950 flex-1 mr-2">{area.location}</CardTitle>
                      <View className={`px-2 py-1 rounded-full ${getBadgeClass(area.severityLevel)}`}>
                        <Text className="text-xs font-semibold">{area.severityLevel}</Text>
                      </View>
                    </View>
                    <CardDescription className="text-sm">{area.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <View className="grid grid-cols-2 gap-4 mb-4">
                      <View>
                        <Text className="text-xs text-gray-600">Reports</Text>
                        <Text className="font-semibold text-waterbase-950">{area.reportCount} verified</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-600">Effort</Text>
                        <Text className="font-semibold text-waterbase-950">{area.estimatedCleanupEffort}</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-600">Last Report</Text>
                        <Text className="font-semibold text-waterbase-950">{area.lastReported}</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-600">Priority</Text>
                        <Text className="font-semibold text-waterbase-950">{area.priority}</Text>
                      </View>
                    </View>
                    <View className="flex-row space-x-2">
                      <Button
                        title="Create Event"
                        onPress={() => {
                          setSelectedArea(area);
                          setNewEvent((prev) => ({ ...prev, title: prev.title || `${["high", "critical"].includes(area.severityLevel.toLowerCase()) ? "Urgent Cleanup:" : "Cleanup Event:"} ${area.location}` }));
                          setShowCreateEvent(true);
                        }}
                        variant="primary"
                        className="flex-1"
                      />
                      <Button
                        title="View Details"
                        onPress={() => {
                          setSelectedArea(area);
                          setShowAreaDetails(true);
                        }}
                        variant="outline"
                        className="flex-1"
                      />
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        );

      case 'events':
        return (
          <View className="space-y-4">
            {createdEvents.length > 0 && (
              <Card className="border-waterbase-200">
                <CardHeader>
                  <CardTitle className="text-base text-waterbase-950">Event Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <View className="grid grid-cols-2 gap-3">
                    <View className="p-3 bg-waterbase-50 rounded-lg">
                      <Text className="text-xl font-bold text-waterbase-700">{createdEvents.length}</Text>
                      <Text className="text-xs text-gray-600">Total Events</Text>
                    </View>
                    <View className="p-3 bg-enviro-50 rounded-lg">
                      <Text className="text-xl font-bold text-enviro-700">{createdEvents.filter((event) => event.status === "active").length}</Text>
                      <Text className="text-xs text-gray-600">Active Events</Text>
                    </View>
                    <View className="p-3 bg-green-50 rounded-lg">
                      <Text className="text-xl font-bold text-green-700">{createdEvents.reduce((sum, event) => sum + (event.currentVolunteers || 0), 0)}</Text>
                      <Text className="text-xs text-gray-600">Volunteers</Text>
                    </View>
                    <View className="p-3 bg-yellow-50 rounded-lg">
                      <Text className="text-xl font-bold text-yellow-700">{createdEvents.reduce((sum, event) => sum + (event.points || 0), 0)}</Text>
                      <Text className="text-xs text-gray-600">Points Offered</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {createdEvents.length === 0 ? (
              <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                  <Ionicons name="calendar-outline" size={48} color="#6b7280" />
                  <Text className="text-lg font-medium text-gray-900 mt-4 mb-2">
                    No Events Created Yet
                  </Text>
                  <Text className="text-gray-600">
                    Create your first cleanup event from the Reports/Areas tab.
                  </Text>
                </CardContent>
              </Card>
            ) : (
              sortedEvents.map((event) => (
                <Card key={event.id} className="border-waterbase-200">
                  <CardHeader>
                    <View className="flex-row items-start justify-between">
                      <CardTitle className="text-base text-waterbase-950 flex-1 mr-2">{event.title}</CardTitle>
                      <View className={`px-2 py-1 rounded-full ${getBadgeClass(event.status)}`}>
                        <Text className="text-xs font-semibold capitalize">{event.status}</Text>
                      </View>
                    </View>
                    <CardDescription className="text-sm">
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <View className="grid grid-cols-2 gap-4 mb-4">
                      <View>
                        <Text className="text-xs text-gray-600">Volunteers</Text>
                        <Text className="font-semibold text-waterbase-950">
                          {event.currentVolunteers || 0}/{event.maxVolunteers}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-600">Points</Text>
                        <Text className="font-semibold text-waterbase-950">{event.points}</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-600">Duration</Text>
                        <Text className="font-semibold text-waterbase-950">{event.duration} hours</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-600">Badge</Text>
                        <Text className="font-semibold text-waterbase-950">{event.badge || "Environmental Volunteer"}</Text>
                      </View>
                    </View>
                    <View className="w-full h-2 bg-gray-200 rounded-full mb-3">
                      <View
                        className="h-2 bg-waterbase-500 rounded-full"
                        style={{ width: `${Math.min(((event.currentVolunteers || 0) / Math.max(event.maxVolunteers || 1, 1)) * 100, 100)}%` }}
                      />
                    </View>
                    {event.status === "completed" && (
                      <Text className="text-xs text-gray-600 mb-2">{getCleanupVerificationLabel(event.cleanup_verification_status)}</Text>
                    )}
                    <View className="space-y-2">
                      {event.status === 'recruiting' && (
                        <Button
                          title={isStartingEvent === event.id ? "Starting..." : "Start Event"}
                          onPress={() => handleStartEvent(event)}
                          variant="primary"
                          disabled={isStartingEvent === event.id}
                          className="w-full bg-enviro-500"
                        />
                      )}
                      {event.status === 'active' && (
                        <Button
                          title={isCompletingEvent === event.id ? "Completing..." : "Complete Event"}
                          onPress={() => handleCompleteEvent(event)}
                          variant="primary"
                          disabled={isCompletingEvent === event.id}
                          className="w-full bg-green-600"
                        />
                      )}
                      {(event.status === 'recruiting' || event.status === 'active') && (
                        <Button
                          title="Show QR Code"
                          onPress={() => openQRModal(event)}
                          variant="primary"
                          className="w-full"
                        />
                      )}
                      <Button
                        title="Message Volunteers"
                        onPress={() => {
                          setMessageEvent(event);
                          setCustomMessage("");
                        }}
                        variant="outline"
                        className="w-full"
                      />
                      <Button
                        title="Event Updates"
                        onPress={() => loadCleanupEvidence(event)}
                        variant="outline"
                        className="w-full"
                      />
                      <Button
                        title="Edit Event"
                        onPress={() => openEditEventModal(event)}
                        variant="outline"
                        className="w-full"
                      />
                      {(event.status === 'recruiting' || event.status === 'active') && (
                        <Button
                          title="Cancel Event"
                          onPress={() => handleCancelEvent(event)}
                          variant="outline"
                          className="w-full bg-red-50 border-red-200"
                          textColor="text-red-700"
                        />
                      )}
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        );

      case 'volunteers':
        return (
          <View className="space-y-4">
            <Card className="border-waterbase-200">
              <CardHeader>
                <CardTitle className="text-base text-waterbase-950">Volunteer Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="grid grid-cols-2 gap-4">
                  <View className="text-center p-4 bg-waterbase-50 rounded-lg">
                    <Text className="text-2xl font-bold text-waterbase-600">{volunteers.length}</Text>
                    <Text className="text-sm text-gray-600">Total Volunteers</Text>
                  </View>
                  <View className="text-center p-4 bg-enviro-50 rounded-lg">
                    <Text className="text-2xl font-bold text-enviro-600">
                      {volunteers.filter(v => v.eventsThisMonth > 0).length}
                    </Text>
                    <Text className="text-sm text-gray-600">Active This Month</Text>
                  </View>
                  <View className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Text className="text-2xl font-bold text-yellow-600">
                      {volunteers.reduce((sum, v) => sum + v.totalPoints, 0)}
                    </Text>
                    <Text className="text-sm text-gray-600">Points Awarded</Text>
                  </View>
                  <View className="text-center p-4 bg-purple-50 rounded-lg">
                    <Text className="text-2xl font-bold text-purple-600">
                      {volunteers.length > 0 ? Math.round(volunteers.reduce((sum, v) => sum + v.totalEvents, 0) / volunteers.length * 10) / 10 : 0}
                    </Text>
                    <Text className="text-sm text-gray-600">Avg Events per Volunteer</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card className="border-waterbase-200">
              <CardHeader>
                <CardTitle className="text-base text-waterbase-950">Volunteer Directory</CardTitle>
              </CardHeader>
              <CardContent>
                {volunteers.length === 0 ? (
                  <Text className="text-center text-gray-600 py-4">
                    No volunteers found. Volunteers will appear here once they join your events.
                  </Text>
                ) : (
                  volunteers.map((volunteer) => (
                    <View key={volunteer.id} className="p-3 bg-gray-50 rounded-lg mb-3">
                      <Text className="font-medium text-waterbase-950">
                        {volunteer.firstName} {volunteer.lastName}
                      </Text>
                      <Text className="text-sm text-gray-600">{volunteer.email}</Text>
                      <View className="flex-row justify-between mt-2">
                        <Text className="text-xs text-gray-600">
                          {volunteer.totalEvents} events • {volunteer.totalPoints} points
                        </Text>
                        <Text className="text-xs text-gray-600">{volunteer.lastActivity}</Text>
                      </View>
                      {volunteer.currentEvents[0]?.task_note ? (
                        <Text className="text-xs text-waterbase-700 mt-2">
                          Task: {volunteer.currentEvents[0].task_note}
                        </Text>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => openTaskNoteModal(volunteer)}
                        className="mt-3 px-3 py-2 rounded-lg bg-waterbase-100 self-start"
                      >
                        <Text className="text-xs text-waterbase-800 font-medium">
                          {volunteer.currentEvents[0]?.task_note ? "Edit Task" : "Assign Task"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </CardContent>
            </Card>
          </View>
        );

      case 'members':
        return (
          <View className="space-y-4">
            <Card className="border-waterbase-200">
              <CardHeader>
                <CardTitle className="text-base text-waterbase-950">Organization Members</CardTitle>
                <CardDescription className="text-sm">Members who have joined your organization</CardDescription>
              </CardHeader>
              <CardContent>
                {isMembersLoading ? (
                  <View className="items-center py-6">
                    <ActivityIndicator size="small" color="#0369a1" />
                    <Text className="text-waterbase-600 mt-2">Loading members...</Text>
                  </View>
                ) : orgMembers.length === 0 ? (
                  <Text className="text-center text-gray-600 py-4">
                    No members found. Members will appear here once they join your organization.
                  </Text>
                ) : (
                  orgMembers.map((member) => (
                    <View key={member.id} className="p-3 bg-gray-50 rounded-lg mb-3">
                      <Text className="font-medium text-waterbase-950">
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text className="text-sm text-gray-600">{member.email}</Text>
                      <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-xs text-gray-600">
                          Joined: {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveMember(member.id)}
                          className="px-3 py-1 rounded-lg bg-red-100"
                        >
                          <Text className="text-xs text-red-700 font-medium">Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </CardContent>
            </Card>
          </View>
        );

      case 'organization':
        return (
          <View className="space-y-4">
            <Card className="border-waterbase-200">
              <CardHeader>
                <CardTitle className="text-base text-waterbase-950">Organization Controls</CardTitle>
                <CardDescription className="text-sm">Manage how members join your organization.</CardDescription>
              </CardHeader>
              <CardContent>
                {isOrgLoading ? (
                  <View className="items-center py-6">
                    <ActivityIndicator size="small" color="#0369a1" />
                    <Text className="text-waterbase-600 mt-2">Loading organization data...</Text>
                  </View>
                ) : (
                  <View className="space-y-4">
                    <TouchableOpacity
                      className="flex-row items-center justify-between p-3 bg-waterbase-50 rounded-lg"
                      onPress={handleToggleAutoAccept}
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

                    <Text className="font-semibold text-waterbase-950">Pending join requests</Text>
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
                                <Button
                                  title="Accept"
                                  onPress={() => handleUpdateJoinRequest(request.id, "accepted")}
                                  variant="primary"
                                  className="flex-1 mr-2 bg-enviro-500"
                                />
                                <Button
                                  title="Reject"
                                  onPress={() => handleUpdateJoinRequest(request.id, "rejected")}
                                  variant="primary"
                                  className="flex-1 ml-2 bg-red-500"
                                />
                              </View>
                            </View>
                          ))}
                      </View>
                    )}
                  </View>
                )}
              </CardContent>
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedContent>
      <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
        <Navigation title="Organizer Portal" showBackButton={true} />

        <View className="border-b border-gray-200 py-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={{ minWidth: 96 }}
                className={`mr-2 py-3 px-3 rounded-lg items-center ${activeTab === tab.key ? 'bg-waterbase-500' : 'bg-gray-100'}`}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.key ? '#ffffff' : '#6b7280'}
                />
                <Text
                  numberOfLines={1}
                  className={`text-xs mt-1 font-medium ${activeTab === tab.key ? 'text-white' : 'text-gray-600'}`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-8">
              <ActivityIndicator size="large" color="#0369a1" />
              <Text className="text-waterbase-600 mt-4">Loading...</Text>
            </View>
          ) : (
            renderTabContent()
          )}
        </ScrollView>

        {/* Create Event Modal */}
        <Modal visible={showCreateEvent} transparent animationType="slide" onRequestClose={() => setShowCreateEvent(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
              <Text className="text-xl font-bold text-waterbase-950 mb-4">Create Cleanup Event</Text>

              {eventError ? (
                <Text className="text-red-600 mb-4">{eventError}</Text>
              ) : null}

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-waterbase-950 mb-2">Quick Templates</Text>
                    <View className="flex-row space-x-2">
                      {Object.entries(EVENT_PRESETS).map(([key, preset]) => (
                        <TouchableOpacity
                          key={key}
                          onPress={() => applyPreset(key as keyof typeof EVENT_PRESETS)}
                          className="flex-1 p-3 rounded-lg border border-waterbase-200 bg-waterbase-50 mr-2"
                        >
                          <Text className="text-xs font-semibold text-waterbase-950">{preset.name}</Text>
                          <Text className="text-[10px] text-waterbase-700 mt-1">{preset.detail}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-waterbase-950 mb-2">Event Title *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      placeholder={generateDefaultTitle() || "e.g., Beach Cleanup at Manila Bay"}
                      value={newEvent.title}
                      onChangeText={(text) => setNewEvent({ ...newEvent, title: toTitleCaseInput(text) })}
                    />
                    {!newEvent.title && generateDefaultTitle() ? (
                      <Text className="text-xs text-gray-500 mt-1">Suggested: {generateDefaultTitle()}</Text>
                    ) : null}
                  </View>

                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Date *</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="YYYY-MM-DD"
                        value={newEvent.date}
                        onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Time *</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="HH:MM"
                        value={newEvent.time}
                        onChangeText={(text) => setNewEvent({ ...newEvent, time: text })}
                      />
                    </View>
                  </View>

                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Duration (hours)</Text>
                      <View className="flex-row flex-wrap">
                        {["2", "3", "4", "6", "8"].map((duration) => (
                          <TouchableOpacity
                            key={duration}
                            onPress={() => setNewEvent({ ...newEvent, duration })}
                            className={`px-3 py-2 rounded-lg mr-2 mb-2 ${newEvent.duration === duration ? "bg-waterbase-500" : "bg-gray-100"}`}
                          >
                            <Text className={`text-xs font-medium ${newEvent.duration === duration ? "text-white" : "text-gray-700"}`}>{duration}h</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Max Volunteers *</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="20"
                        value={newEvent.maxVolunteers}
                        onChangeText={(text) => setNewEvent({ ...newEvent, maxVolunteers: text })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-waterbase-950 mb-2">Description</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Describe the cleanup activities..."
                      value={newEvent.description}
                      onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Points</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="50"
                        value={newEvent.rewardPoints}
                        onChangeText={(text) => setNewEvent({ ...newEvent, rewardPoints: text })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Badge</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Environmental Volunteer"
                        value={newEvent.rewardBadge}
                        onChangeText={(text) => setNewEvent({ ...newEvent, rewardBadge: toTitleCaseInput(text) })}
                      />
                    </View>
                  </View>

                  <View className="flex-row space-x-4 mt-6">
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setShowCreateEvent(false);
                        setSelectedArea(null);
                        setEventError("");
                      }}
                      variant="outline"
                      disabled={isCreatingEvent}
                      className="flex-1 mr-2"
                    />
                    <Button
                      title={isCreatingEvent ? "Creating..." : "Create Event"}
                      onPress={handleCreateEvent}
                      variant="primary"
                      disabled={isCreatingEvent}
                      className="flex-1 ml-2"
                    />
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Edit Event Modal */}
        <Modal visible={showEditEvent} transparent animationType="slide" onRequestClose={() => setShowEditEvent(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
              <Text className="text-xl font-bold text-waterbase-950 mb-4">Edit Event</Text>

              {eventError ? (
                <Text className="text-red-600 mb-4">{eventError}</Text>
              ) : null}

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="space-y-4">
                  <View>
                    <Text className="text-sm font-medium text-waterbase-950 mb-2">Event Title *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g., Beach Cleanup at Manila Bay"
                      value={editEvent.title}
                      onChangeText={(text) => setEditEvent({ ...editEvent, title: toTitleCaseInput(text) })}
                    />
                  </View>

                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Date *</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="YYYY-MM-DD"
                        value={editEvent.date}
                        onChangeText={(text) => setEditEvent({ ...editEvent, date: text })}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Time *</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="HH:MM"
                        value={editEvent.time}
                        onChangeText={(text) => setEditEvent({ ...editEvent, time: text })}
                      />
                    </View>
                  </View>

                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Duration (hours)</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="2"
                        value={editEvent.duration}
                        onChangeText={(text) => setEditEvent({ ...editEvent, duration: text })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Max Volunteers *</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="20"
                        value={editEvent.maxVolunteers}
                        onChangeText={(text) => setEditEvent({ ...editEvent, maxVolunteers: text })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-waterbase-950 mb-2">Description</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Describe the cleanup activities..."
                      value={editEvent.description}
                      onChangeText={(text) => setEditEvent({ ...editEvent, description: text })}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View className="flex-row space-x-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Points</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="50"
                        value={editEvent.rewardPoints}
                        onChangeText={(text) => setEditEvent({ ...editEvent, rewardPoints: text })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-waterbase-950 mb-2">Badge</Text>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Environmental Volunteer"
                        value={editEvent.rewardBadge}
                        onChangeText={(text) => setEditEvent({ ...editEvent, rewardBadge: toTitleCaseInput(text) })}
                      />
                    </View>
                  </View>

                  <View className="flex-row space-x-4 mt-6">
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setShowEditEvent(false);
                        setEditEventId(null);
                        setEventError("");
                      }}
                      variant="outline"
                      disabled={isEditingEvent}
                      className="flex-1 mr-2"
                    />
                    <Button
                      title={isEditingEvent ? "Saving..." : "Save Changes"}
                      onPress={handleUpdateEvent}
                      variant="primary"
                      disabled={isEditingEvent}
                      className="flex-1 ml-2"
                    />
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Area Details Modal */}
        <Modal visible={showAreaDetails} transparent animationType="slide" onRequestClose={() => setShowAreaDetails(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
              <Text className="text-xl font-bold text-waterbase-950 mb-4">Area Details</Text>

              {selectedArea && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="space-y-4">
                    <Text className="text-lg font-semibold text-waterbase-950">{selectedArea.location}</Text>
                    <Text className="text-sm text-gray-600">{selectedArea.description}</Text>

                    <View className="grid grid-cols-2 gap-4">
                      <View className="p-3 bg-gray-50 rounded-lg">
                        <Text className="text-xs text-gray-600">Reports</Text>
                        <Text className="font-semibold text-waterbase-950">{selectedArea.reportCount}</Text>
                      </View>
                      <View className="p-3 bg-gray-50 rounded-lg">
                        <Text className="text-xs text-gray-600">Severity</Text>
                        <Text className="font-semibold text-waterbase-950">{selectedArea.severityLevel}</Text>
                      </View>
                      <View className="p-3 bg-gray-50 rounded-lg">
                        <Text className="text-xs text-gray-600">Last Report</Text>
                        <Text className="font-semibold text-waterbase-950">{selectedArea.lastReported}</Text>
                      </View>
                      <View className="p-3 bg-gray-50 rounded-lg">
                        <Text className="text-xs text-gray-600">Priority</Text>
                        <Text className="font-semibold text-waterbase-950">{selectedArea.priority}</Text>
                      </View>
                    </View>

                    <Text className="text-sm font-medium text-waterbase-950 mt-4 mb-2">Individual Reports</Text>
                    {selectedArea.reports.some((report) => report.status === "pending") && (
                      <Button
                        title={`Decline ${selectedArea.reports.filter((report) => report.status === "pending").length} Pending Reports`}
                        onPress={() => handleBulkDeclineReports(selectedArea.reports.filter((report) => report.status === "pending"))}
                        variant="outline"
                        className="bg-red-50 border-red-200"
                        textColor="text-red-700"
                      />
                    )}
                    {selectedArea.reports.map((report) => (
                      <View key={report.id} className="p-3 bg-gray-50 rounded-lg">
                        <Text className="font-medium text-waterbase-950">{report.title}</Text>
                        <Text className="text-sm text-gray-600">{report.content}</Text>
                        <View className="flex-row justify-between items-center mt-2">
                          <Text className="text-xs text-gray-600 flex-1">
                            {new Date(report.created_at).toLocaleDateString()}
                          </Text>
                          <Button
                            title="Decline"
                            onPress={() => handleDeclineReport(report.id)}
                            variant="outline"
                            size="sm"
                            className="bg-red-500 border-red-500"
                            textColor="text-white"
                          />
                        </View>
                      </View>
                    ))}

                    <Button
                      title="Close"
                      onPress={() => setShowAreaDetails(false)}
                      variant="primary"
                      className="mt-6"
                    />
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Message Volunteers Modal */}
        <Modal visible={!!messageEvent} transparent animationType="fade" onRequestClose={() => setMessageEvent(null)}>
          <View className="flex-1 bg-black/50 justify-center px-6">
            <View className="bg-white rounded-xl p-4">
              <Text className="text-lg font-semibold text-waterbase-950 mb-1">Message Volunteers</Text>
              <Text className="text-sm text-gray-600 mb-3">
                Send a reminder or custom message for "{messageEvent?.title}".
              </Text>
              <TextInput
                value={customMessage}
                onChangeText={setCustomMessage}
                placeholder="Custom message (optional)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm mb-4"
              />
              <View className="space-y-2">
                <Button title="Send Pre-built Reminder" onPress={() => handleSendMessage(false)} variant="outline" disabled={isSendingMessage} />
                <Button title={isSendingMessage ? "Sending..." : "Send Custom Message"} onPress={() => handleSendMessage(true)} disabled={isSendingMessage || !customMessage.trim()} />
                <Button title="Cancel" onPress={() => setMessageEvent(null)} variant="outline" disabled={isSendingMessage} />
              </View>
            </View>
          </View>
        </Modal>

        {/* Cleanup Evidence Modal */}
        <Modal visible={!!cleanupEvent} animationType="slide" onRequestClose={() => setCleanupEvent(null)}>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
              <View className="flex-1 mr-3">
                <Text className="text-lg font-semibold text-waterbase-950">Cleanup Evidence</Text>
                <Text className="text-xs text-gray-600">{cleanupEvent?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setCleanupEvent(null)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
              {(cleanupEvent?.status === "active" || cleanupEvent?.status === "completed") && cleanupEvent?.cleanup_verification_status !== "approved" && (
                <Card className="border-waterbase-200 mb-4">
                  <CardHeader>
                    <CardTitle className="text-base text-waterbase-950">Upload after-cleanup photo</CardTitle>
                    <CardDescription className="text-sm">AI will check if visible trash pollution has dropped enough to resolve linked reports.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {cleanupEvidenceAsset ? (
                      <Image source={{ uri: cleanupEvidenceAsset.uri }} className="w-full h-44 rounded-lg mb-3" resizeMode="cover" />
                    ) : null}
                    <View className="space-y-2">
                      <Button title={cleanupEvidenceAsset ? "Choose Different Photo" : "Choose Photo"} onPress={pickCleanupEvidence} variant="outline" />
                      <Button title={isSubmittingEvidence ? "Submitting..." : "Submit Evidence"} onPress={submitCleanupEvidence} disabled={!cleanupEvidenceAsset || isSubmittingEvidence} />
                    </View>
                  </CardContent>
                </Card>
              )}

              <Text className="text-sm font-semibold text-waterbase-950 mb-2">Submitted evidence</Text>
              {isLoadingEvidence ? (
                <View className="items-center py-6">
                  <ActivityIndicator size="small" color="#0369a1" />
                  <Text className="text-waterbase-600 mt-2">Loading evidence...</Text>
                </View>
              ) : cleanupEvidences.length === 0 ? (
                <Text className="text-gray-600">No cleanup evidence submitted yet.</Text>
              ) : (
                cleanupEvidences.map((evidence) => (
                  <View key={evidence.id} className="p-3 bg-gray-50 rounded-lg mb-3">
                    <Text className="font-semibold text-waterbase-950 capitalize">{evidence.result}</Text>
                    <Text className="text-xs text-gray-600">
                      AI severity: {evidence.ai_severity || "n/a"} | Pollution: {evidence.pollution_percentage ?? 0}%
                    </Text>
                    <Text className="text-xs text-gray-600">
                      Submitted {new Date(evidence.created_at).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <Modal visible={!!taskVolunteer} transparent animationType="fade" onRequestClose={() => setTaskVolunteer(null)}>
          <View className="flex-1 bg-black/60 justify-center p-4">
            <View className="bg-white rounded-2xl p-5">
              <Text className="text-lg font-semibold text-waterbase-950 mb-1">Volunteer Task</Text>
              <Text className="text-sm text-gray-600 mb-4">
                {taskVolunteer ? `${taskVolunteer.firstName} ${taskVolunteer.lastName}` : ""}
              </Text>
              <TextInput
                value={taskNote}
                onChangeText={setTaskNote}
                placeholder="Example: Bring sacks and cover shoreline section A"
                multiline
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-gray-900 min-h-24 mb-4"
              />
              <View className="space-y-2">
                <Button title={isSavingTaskNote ? "Saving..." : "Save Task"} onPress={handleSaveTaskNote} disabled={isSavingTaskNote} />
                <Button title="Cancel" onPress={() => setTaskVolunteer(null)} variant="outline" disabled={isSavingTaskNote} />
              </View>
            </View>
          </View>
        </Modal>

        {/* QR Code Display Modal */}
        <Modal visible={showQRModal} transparent animationType="fade" onRequestClose={() => setShowQRModal(false)}>
          <View className="flex-1 bg-black/70 justify-center items-center p-4">
            <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <Text className="text-xl font-bold text-waterbase-950 mb-2 text-center">Event QR Code</Text>
              <Text className="text-sm text-gray-600 mb-4 text-center">
                Volunteers can scan this code to check in for "{qrEvent?.title}"
              </Text>

              {isGeneratingQR ? (
                <View className="w-64 h-64 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ActivityIndicator size="large" color="#0369a1" />
                  <Text className="text-gray-500 mt-2">Generating QR code...</Text>
                </View>
              ) : qrDataUrl ? (
                <View className="bg-white p-4 rounded-xl border-2 border-waterbase-200 mb-4 items-center justify-center mx-auto">
                  <Image
                    source={{ uri: qrDataUrl }}
                    style={{ width: 280, height: 280 }}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View className="w-64 h-64 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Text className="text-red-600 text-center">Failed to generate QR code</Text>
                </View>
              )}

              <View className="bg-waterbase-50 px-4 py-3 rounded-lg mb-4 flex-row items-center">
                <Ionicons name="people" size={16} color="#0369a1" />
                <Text className="text-sm text-waterbase-700 ml-2">
                  {qrEvent?.currentVolunteers || 0} volunteer{(qrEvent?.currentVolunteers || 0) !== 1 ? 's' : ''} checked in
                </Text>
              </View>

              <Text className="text-xs text-gray-600 text-center mb-4">
                Ask volunteers to open the WaterbasePH app and scan this QR code to mark their attendance.
              </Text>

              <Button
                title="Close"
                onPress={() => setShowQRModal(false)}
                variant="primary"
                className="w-full"
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ProtectedContent>
  );
};

export default OrganizerPortalScreen;
