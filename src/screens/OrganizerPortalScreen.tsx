import React, { useState, useEffect, useCallback } from "react";
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, View, Text, TouchableOpacity, TextInput, Image } from "react-native";
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
  reports: Report[];
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
  currentEvents: any[];
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

const OrganizerPortalScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
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

  // QR Code display state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrEvent, setQrEvent] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const wbsiCalculator = new WBSICalculator();

  // Combined data loading function to reduce API spam
  const loadAllData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setIsOrgLoading(true);

      // Make all API calls in parallel
      const [reportsResponse, eventsResponse, orgRequestsResponse, orgSettingsResponse] = await Promise.all([
        apiRequest(API_ENDPOINTS.REPORTS_ACCESSIBLE, { method: "GET" }),
        apiRequest(`${API_ENDPOINTS.EVENTS}?user_id=${user.id}`, { method: "GET" }),
        apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-requests`, { method: "GET" }),
        apiRequest(`${API_ENDPOINTS.ORGANIZATIONS}/${user.id}/join-settings`, { method: "GET" }),
      ]);

      // Process reports
      const allReports = await reportsResponse.json();
      const verifiedReports = Array.isArray(allReports) ? allReports.filter((r: Report) => r.status === 'verified') : [];

      // Process events
      const eventsData = await eventsResponse.json();
      const events = Array.isArray(eventsData) ? eventsData : [];
      setCreatedEvents(events);

      // Process organization data
      const orgRequestsData = await orgRequestsResponse.json();
      const orgSettingsData = await orgSettingsResponse.json();
      setOrgJoinRequests(Array.isArray(orgRequestsData?.data) ? orgRequestsData.data : []);
      setAutoAcceptJoinRequests(!!orgSettingsData?.auto_accept_join_requests);

      // Process areas with events data
      processEligibleAreas(verifiedReports, events);

      // Process volunteers from events
      await processVolunteersFromEvents(events);

    } catch (error) {
      console.error('Failed to load organizer data:', error);
      showError('Failed to load organizer data', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
      setIsOrgLoading(false);
      setIsRefreshing(false);
      hideFeedback();
    }
  }, [user?.id, showError, hideFeedback]);

  // Process reports into eligible areas
  const processEligibleAreas = (reports: Report[], eventsData: any[]) => {
    if (!reports || reports.length === 0) {
      setEligibleAreas([]);
      return;
    }

    // Group reports by location (simplified for mobile)
    const locationGroups: { [key: string]: Report[] } = {};
    const DISTANCE_THRESHOLD = 0.001; // approximately 100m

    reports.forEach((report) => {
      if (!report.latitude || !report.longitude) return;

      let foundGroup = false;
      Object.keys(locationGroups).forEach((groupKey) => {
        if (foundGroup) return;
        const [groupLat, groupLng] = groupKey.split(',').map(Number);
        const distance = Math.sqrt(
          Math.pow(report.latitude - groupLat, 2) + Math.pow(report.longitude - groupLng, 2)
        );
        if (distance <= DISTANCE_THRESHOLD) {
          locationGroups[groupKey].push(report);
          foundGroup = true;
        }
      });

      if (!foundGroup) {
        const newGroupKey = `${report.latitude},${report.longitude}`;
        locationGroups[newGroupKey] = [report];
      }
    });

    // Convert groups to eligible areas
    const areas: AreaReport[] = [];
    let areaIdCounter = 1;

    Object.entries(locationGroups)
      .filter(([_, groupReports]) => groupReports.length >= 1)
      .forEach(([locationKey, groupReports]) => {
        const [lat, lng] = locationKey.split(',').map(Number);

        // Check if this location already has a cleanup event
        const locationCoords = { lat, lng };
        const hasExistingEvent = eventsData.some((event: any) =>
          Math.abs(event.latitude - lat) <= 0.001 && Math.abs(event.longitude - lng) <= 0.001
        );

        if (!hasExistingEvent) {
          const mostRecentReport = groupReports.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

          const pollutionTypes = [...new Set(groupReports.map(r => r.pollutionType))];
          const description = groupReports.length === 1
            ? `${pollutionTypes[0]} pollution reported`
            : `Multiple pollution types: ${pollutionTypes.join(', ')} (${groupReports.length} reports)`;

          // Calculate severity using WBSI
          const wbsiResult = wbsiCalculator.calculateWBSI(groupReports);
          const severityLevel = getSeverityLevel(wbsiResult.wbsi_mode);

          areas.push({
            id: areaIdCounter++,
            location: mostRecentReport.address || `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            coordinates: { lat, lng },
            reportCount: groupReports.length,
            severityLevel,
            lastReported: formatDistanceToNow(new Date(mostRecentReport.created_at)),
            description,
            estimatedCleanupEffort: estimateCleanupEffort(groupReports.length),
            priority: calculatePriority(severityLevel, groupReports.length),
            reports: groupReports,
          });
        }
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

  // Organization controls handlers
  const handleUpdateJoinRequest = async (requestId: number, status: "accepted" | "rejected") => {
    if (!user) return;

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
    if (!user) return;

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
    if (user?.id) {
      showLoading('Loading Organizer Portal', 'Fetching reports, events, and volunteers...');
      loadAllData();
    }
  }, [user?.id, loadAllData, showLoading]);

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

  const tabs = [
    { key: 'areas', label: 'Reports', icon: 'map' },
    { key: 'events', label: 'My Events', icon: 'calendar' },
    { key: 'volunteers', label: 'Volunteers', icon: 'people' },
    { key: 'organization', label: 'Controls', icon: 'business' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'areas':
        return (
          <View className="space-y-4">
            {eligibleAreas.length === 0 ? (
              <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                  <Ionicons name="document-text-outline" size={48} color="#6b7280" />
                  <Text className="text-lg font-medium text-gray-900 mt-4 mb-2">
                    No Eligible Areas Yet
                  </Text>
                  <Text className="text-gray-600">
                    Areas need at least 1 verified report to be eligible for cleanup events.
                  </Text>
                </CardContent>
              </Card>
            ) : (
              eligibleAreas.map((area) => (
                <Card key={area.id} className="border-waterbase-200">
                  <CardHeader>
                    <CardTitle className="text-base text-waterbase-950">{area.location}</CardTitle>
                    <CardDescription className="text-sm">{area.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <View className="grid grid-cols-2 gap-4 mb-4">
                      <View>
                        <Text className="text-xs text-gray-600">Reports</Text>
                        <Text className="font-semibold text-waterbase-950">{area.reportCount} verified</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-gray-600">Severity</Text>
                        <Text className="font-semibold text-waterbase-950">{area.severityLevel}</Text>
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
              createdEvents.map((event) => (
                <Card key={event.id} className="border-waterbase-200">
                  <CardHeader>
                    <CardTitle className="text-base text-waterbase-950">{event.title}</CardTitle>
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
                        <Text className="text-xs text-gray-600">Status</Text>
                        <Text className="font-semibold text-waterbase-950 capitalize">{event.status}</Text>
                      </View>
                    </View>
                    <View className="space-y-2">
                      {event.status === 'active' && (
                        <Button
                          title="Show QR Code"
                          onPress={() => openQRModal(event)}
                          variant="primary"
                          className="w-full"
                        />
                      )}
                      <Button
                        title="Edit Event"
                        onPress={() => openEditEventModal(event)}
                        variant="outline"
                        className="w-full"
                      />
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

        <View className="flex-row px-4 py-4 border-b border-gray-200">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-3 px-4 rounded-lg items-center ${activeTab === tab.key ? 'bg-waterbase-500' : 'bg-gray-100'}`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? '#ffffff' : '#6b7280'}
              />
              <Text className={`text-xs mt-1 font-medium ${activeTab === tab.key ? 'text-white' : 'text-gray-600'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
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
                    <Text className="text-sm font-medium text-waterbase-950 mb-2">Event Title *</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g., Beach Cleanup at Manila Bay"
                      value={newEvent.title}
                      onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                    />
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
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="2"
                        value={newEvent.duration}
                        onChangeText={(text) => setNewEvent({ ...newEvent, duration: text })}
                        keyboardType="numeric"
                      />
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
                        onChangeText={(text) => setNewEvent({ ...newEvent, rewardBadge: text })}
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
                      onChangeText={(text) => setEditEvent({ ...editEvent, title: text })}
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
                        onChangeText={(text) => setEditEvent({ ...editEvent, rewardBadge: text })}
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
                Ask volunteers to open the WaterBase app and scan this QR code to mark their attendance.
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