import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { SearchableLocationSelect } from "../components/ui/SearchableLocationSelect";
import Navigation from "../components/Navigation";

type Report = {
  id: number;
  title: string;
  address: string;
  content?: string;
  pollutionType: string;
  severityByUser?: string;
  severityByAI?: string;
  ai_confidence: number;
  ai_annotated_image?: string;
  image?: string;
  created_at: string;
  updated_at?: string;
  username?: string;
  auto_approved?: boolean;
};

type UserItem = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  organization?: string;
  areaOfResponsibility?: string;
  created_at?: string;
  attended_events_count?: number;
  total_points?: number;
  created_events_count?: number;
};

type EventItem = {
  id: number;
  title: string;
  date: string;
  time?: string;
  duration?: number;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  maxVolunteers?: number;
  attendees_count?: number;
  currentVolunteers?: number;
  status: string;
  points?: number;
  badge?: string;
  creator?: { firstName: string; lastName: string };
};

type AdminStats = {
  totalUsers: number;
  totalReports: number;
  pendingValidation: number;
  activeEvents: number;
  activeVolunteers: number;
  verifiedReports: number;
  rejectedReports: number;
  monthlyGrowth: number;
};

type TabKey = "reports" | "users" | "events" | "settings";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "reports", label: "Reports", icon: "document-text" },
  { key: "users", label: "Users", icon: "people" },
  { key: "events", label: "Events", icon: "calendar" },
  { key: "settings", label: "Settings", icon: "settings" },
];

const getSeverityColor = (severity?: string) => {
  switch ((severity || "").toLowerCase()) {
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-green-500";
    default:
      return "bg-red-500";
  }
};

const getSeverityTextColor = (severity?: string) => {
  switch ((severity || "").toLowerCase()) {
    case "high":
      return "text-orange-700";
    case "medium":
      return "text-yellow-700";
    case "low":
      return "text-green-700";
    default:
      return "text-red-700";
  }
};

const getEventStatusColor = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "recruiting":
      return "bg-blue-100 text-blue-800";
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-gray-100 text-gray-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const shouldShowOrganizationFields = (role?: string) => {
  return ["ngo", "lgu", "researcher"].includes((role || "").toLowerCase());
};

const AdminModerationScreen: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("reports");

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stats
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    totalReports: 0,
    pendingValidation: 0,
    activeEvents: 0,
    activeVolunteers: 0,
    verifiedReports: 0,
    rejectedReports: 0,
    monthlyGrowth: 0,
  });

  // Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");

  // Report filters
  const [filterPollutionType, setFilterPollutionType] = useState("");
  const [filterSeverityByUser, setFilterSeverityByUser] = useState("");
  const [filterSeverityByAI, setFilterSeverityByAI] = useState("");
  const [filterAIConfidenceMin, setFilterAIConfidenceMin] = useState("");
  const [filterAIConfidenceMax, setFilterAIConfidenceMax] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSubmitter, setFilterSubmitter] = useState("");
  const [showReportFilters, setShowReportFilters] = useState(false);

  // Users
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // User filters
  const [filterRole, setFilterRole] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterJoinDateFrom, setFilterJoinDateFrom] = useState("");
  const [filterJoinDateTo, setFilterJoinDateTo] = useState("");
  const [filterMinReports, setFilterMinReports] = useState("");
  const [filterMinEvents, setFilterMinEvents] = useState("");
  const [showUserFilters, setShowUserFilters] = useState(false);

  // Edit user form
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
    organization: "",
    areaOfResponsibility: "",
  });

  // Events
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventPage, setEventPage] = useState(1);
  const [eventTotalPages, setEventTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Event filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEventDateFrom, setFilterEventDateFrom] = useState("");
  const [filterEventDateTo, setFilterEventDateTo] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCreator, setFilterCreator] = useState("");
  const [filterVolunteersMin, setFilterVolunteersMin] = useState("");
  const [filterVolunteersMax, setFilterVolunteersMax] = useState("");
  const [showEventFilters, setShowEventFilters] = useState(false);

  // Settings
  const [autoApproveEnabled, setAutoApproveEnabled] = useState(false);
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(80);
  const [maintenanceHealth, setMaintenanceHealth] = useState<any>(null);
  const [maintenanceStats, setMaintenanceStats] = useState<any>(null);
  const [isMaintenanceBusy, setIsMaintenanceBusy] = useState(false);

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 4000);
  };

  const refreshData = () => setRefreshKey((k) => k + 1);

  const fetchAdminStats = async () => {
    try {
      const res = await apiRequest(API_ENDPOINTS.ADMIN_STATS, { method: "GET" });
      const data = await res.json();
      setAdminStats(data);
    } catch (e) {
      console.error("Error fetching admin stats:", e);
    }
  };

  const fetchReports = async (page: number) => {
    setLoading(true);
    try {
      let url = `${API_ENDPOINTS.ADMIN_REPORTS_PENDING}?page=${page}`;
      if (filterPollutionType) url += `&pollutionType=${encodeURIComponent(filterPollutionType)}`;
      if (filterSeverityByUser) url += `&severityByUser=${encodeURIComponent(filterSeverityByUser)}`;
      if (filterSeverityByAI) url += `&severityByAI=${encodeURIComponent(filterSeverityByAI)}`;
      if (filterAIConfidenceMin) url += `&aiConfidenceMin=${filterAIConfidenceMin}`;
      if (filterAIConfidenceMax) url += `&aiConfidenceMax=${filterAIConfidenceMax}`;
      if (filterDateFrom) url += `&dateFrom=${filterDateFrom}`;
      if (filterDateTo) url += `&dateTo=${filterDateTo}`;
      if (filterSubmitter) url += `&submitter=${encodeURIComponent(filterSubmitter)}`;

      const res = await apiRequest(url, { method: "GET" });
      const data = await res.json();
      setReports(data.data || []);
      setReportTotalPages(data.last_page || 1);
    } catch (e) {
      showMessage("Failed to load reports", true);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page: number) => {
    setLoading(true);
    try {
      let url = `${API_ENDPOINTS.ADMIN_USERS}?page=${page}`;
      if (filterRole) url += `&role=${encodeURIComponent(filterRole)}`;
      if (filterOrganization) url += `&organization=${encodeURIComponent(filterOrganization)}`;
      if (filterArea) url += `&area=${encodeURIComponent(filterArea)}`;
      if (filterJoinDateFrom) url += `&joinDateFrom=${filterJoinDateFrom}`;
      if (filterJoinDateTo) url += `&joinDateTo=${filterJoinDateTo}`;
      if (filterMinReports) url += `&minReports=${filterMinReports}`;
      if (filterMinEvents) url += `&minEvents=${filterMinEvents}`;

      const res = await apiRequest(url, { method: "GET" });
      const data = await res.json();
      setUsers(data.data || []);
      setUserTotalPages(data.last_page || 1);
    } catch (e) {
      showMessage("Failed to load users", true);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (page: number) => {
    setLoading(true);
    try {
      let url = `${API_ENDPOINTS.ADMIN_EVENTS}?page=${page}`;
      if (filterStatus) url += `&status=${encodeURIComponent(filterStatus)}`;
      if (filterEventDateFrom) url += `&dateFrom=${filterEventDateFrom}`;
      if (filterEventDateTo) url += `&dateTo=${filterEventDateTo}`;
      if (filterLocation) url += `&location=${encodeURIComponent(filterLocation)}`;
      if (filterCreator) url += `&creator=${encodeURIComponent(filterCreator)}`;
      if (filterVolunteersMin) url += `&volunteersMin=${filterVolunteersMin}`;
      if (filterVolunteersMax) url += `&volunteersMax=${filterVolunteersMax}`;

      const res = await apiRequest(url, { method: "GET" });
      const data = await res.json();
      setEvents(data.data || []);
      setEventTotalPages(data.last_page || 1);
    } catch (e) {
      showMessage("Failed to load events", true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiRequest(API_ENDPOINTS.ADMIN_SYSTEM_SETTINGS, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setAutoApproveEnabled(Boolean(data.auto_approve_enabled));
        setAutoApproveThreshold(Number(data.auto_approve_threshold));
      }
    } catch (e) {
      console.error("Error fetching settings:", e);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchAdminStats();
    fetchSettings();
  }, [token, refreshKey]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "reports") {
      fetchReports(reportPage);
    } else if (activeTab === "users") {
      fetchUsers(userPage);
    } else if (activeTab === "events") {
      fetchEvents(eventPage);
    }
  }, [activeTab, reportPage, userPage, eventPage, refreshKey, token]);

  const handleReportAction = async () => {
    if (!selectedReport) return;
    const status = pendingAction === "approve" ? "verified" : "declined";
    try {
      const res = await apiRequest(API_ENDPOINTS.ADMIN_REPORT_STATUS(selectedReport.id), {
        method: "PUT",
        body: JSON.stringify({
          status,
          verifiedBy: user?.id,
          admin_notes: adminNotes,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showMessage(`Report ${pendingAction}d successfully`);
      setShowActionModal(false);
      setShowReportModal(false);
      setAdminNotes("");
      fetchReports(reportPage);
    } catch (e) {
      showMessage(`Failed to ${pendingAction} report`, true);
    }
  };

  const openActionModal = (report: Report, action: "approve" | "reject") => {
    setSelectedReport(report);
    setPendingAction(action);
    setAdminNotes("");
    setShowActionModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsUpdatingUser(true);
    try {
      const res = await apiRequest(API_ENDPOINTS.ADMIN_USER(selectedUser.id), {
        method: "PUT",
        body: JSON.stringify(editFormData),
      });
      if (!res.ok) throw new Error("Failed");
      showMessage("User updated successfully");
      setShowEditUserModal(false);
      fetchUsers(userPage);
    } catch (e) {
      showMessage("Failed to update user", true);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = (userItem: UserItem) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${userItem.firstName} ${userItem.lastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeletingUser(true);
            try {
              const res = await apiRequest(API_ENDPOINTS.ADMIN_USER(userItem.id), { method: "DELETE" });
              if (!res.ok) throw new Error("Failed");
              showMessage("User deleted successfully");
              fetchUsers(userPage);
            } catch (e) {
              showMessage("Failed to delete user", true);
            } finally {
              setIsDeletingUser(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = (eventItem: EventItem) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${eventItem.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeletingEvent(true);
            try {
              const res = await apiRequest(API_ENDPOINTS.ADMIN_EVENT(eventItem.id), { method: "DELETE" });
              if (!res.ok) throw new Error("Failed");
              showMessage("Event deleted successfully");
              fetchEvents(eventPage);
            } catch (e) {
              showMessage("Failed to delete event", true);
            } finally {
              setIsDeletingEvent(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveSettings = async () => {
    try {
      const res = await apiRequest(API_ENDPOINTS.ADMIN_SYSTEM_SETTINGS, {
        method: "PUT",
        body: JSON.stringify({
          auto_approve_enabled: autoApproveEnabled,
          auto_approve_threshold: autoApproveThreshold,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showMessage("Settings saved successfully");
    } catch (e) {
      showMessage("Failed to save settings", true);
    }
  };

  const runMaintenanceAction = async (endpoint: string, method: "GET" | "POST" = "POST") => {
    setIsMaintenanceBusy(true);
    try {
      const res = await apiRequest(endpoint, { method });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (e: any) {
      throw new Error(e?.message || "Maintenance action failed");
    } finally {
      setIsMaintenanceBusy(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      setEditFormData({
        firstName: selectedUser.firstName || "",
        lastName: selectedUser.lastName || "",
        email: selectedUser.email || "",
        phoneNumber: selectedUser.phoneNumber || "",
        role: selectedUser.role || "",
        organization: selectedUser.organization || "",
        areaOfResponsibility: selectedUser.areaOfResponsibility || "",
      });
    }
  }, [selectedUser]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // ---------- Reports Tab ----------
  const renderReportsTab = () => (
    <View className="px-4 pb-6">
      {/* Stats row */}
      <View className="flex-row flex-wrap -mx-1 mb-4">
        {[
          { label: "Total", value: adminStats.totalReports, color: "text-waterbase-700", bg: "bg-waterbase-100" },
          { label: "Verified", value: adminStats.verifiedReports, color: "text-green-700", bg: "bg-green-100" },
          { label: "Pending", value: adminStats.pendingValidation, color: "text-orange-700", bg: "bg-orange-100" },
          { label: "Rejected", value: adminStats.rejectedReports, color: "text-red-700", bg: "bg-red-100" },
        ].map((s, i) => (
          <View key={i} className="w-1/4 px-1">
            <View className={`${s.bg} rounded-lg p-2 items-center`}>
              <Text className={`text-lg font-bold ${s.color}`}>{s.value}</Text>
              <Text className="text-[10px] text-gray-600">{s.label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Filters */}
      <TouchableOpacity
        onPress={() => setShowReportFilters((v) => !v)}
        className="flex-row items-center mb-2"
      >
        <Ionicons name={showReportFilters ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
        <Text className="text-sm text-gray-600 ml-1">Filters</Text>
      </TouchableOpacity>

      {showReportFilters && (
        <View className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
          <TextInput
            placeholder="Pollution Type"
            value={filterPollutionType}
            onChangeText={setFilterPollutionType}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <View className="flex-row space-x-2">
            <TextInput
              placeholder="User Severity"
              value={filterSeverityByUser}
              onChangeText={setFilterSeverityByUser}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <TextInput
              placeholder="AI Severity"
              value={filterSeverityByAI}
              onChangeText={setFilterSeverityByAI}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
          </View>
          <View className="flex-row space-x-2">
            <TextInput
              placeholder="Min AI Conf %"
              value={filterAIConfidenceMin}
              onChangeText={setFilterAIConfidenceMin}
              keyboardType="numeric"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <TextInput
              placeholder="Max AI Conf %"
              value={filterAIConfidenceMax}
              onChangeText={setFilterAIConfidenceMax}
              keyboardType="numeric"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
          </View>
          <View className="flex-row space-x-2">
            <TextInput
              placeholder="Date From (YYYY-MM-DD)"
              value={filterDateFrom}
              onChangeText={setFilterDateFrom}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <TextInput
              placeholder="Date To (YYYY-MM-DD)"
              value={filterDateTo}
              onChangeText={setFilterDateTo}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
          </View>
          <TextInput
            placeholder="Submitter Name"
            value={filterSubmitter}
            onChangeText={setFilterSubmitter}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <Button title="Apply Filters" onPress={() => { setReportPage(1); fetchReports(1); }} size="sm" />
        </View>
      )}

      {/* Reports list */}
      {loading ? (
        <ActivityIndicator className="mt-4" />
      ) : reports.length === 0 ? (
        <Text className="text-gray-500 text-center mt-4">No pending reports</Text>
      ) : (
        reports.map((report) => (
          <TouchableOpacity
            key={report.id}
            onPress={() => { setSelectedReport(report); setShowReportModal(true); }}
            className="bg-white rounded-lg border border-gray-200 p-3 mb-3"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-2">
                <Text className="font-medium text-sm text-gray-900" numberOfLines={1}>{report.title}</Text>
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>{report.address}</Text>
                <Text className="text-xs text-gray-400 mt-1">{report.pollutionType}</Text>
              </View>
              <View className="items-end">
                <View className={`px-2 py-1 rounded-full ${getSeverityColor(report.severityByAI)}`}>
                  <Text className="text-xs text-white font-medium">{report.severityByAI || "N/A"}</Text>
                </View>
                <Text className="text-xs text-gray-500 mt-1">{report.ai_confidence}%</Text>
              </View>
            </View>
            <Text className="text-xs text-gray-400 mt-2">{formatDateTime(report.created_at)}</Text>
          </TouchableOpacity>
        ))
      )}

      {/* Pagination */}
      {reportTotalPages > 1 && (
        <View className="flex-row justify-between items-center mt-2">
          <Button
            title="Previous"
            onPress={() => setReportPage((p) => Math.max(1, p - 1))}
            disabled={reportPage === 1}
            size="sm"
            variant="outline"
          />
          <Text className="text-xs text-gray-600">Page {reportPage} of {reportTotalPages}</Text>
          <Button
            title="Next"
            onPress={() => setReportPage((p) => Math.min(reportTotalPages, p + 1))}
            disabled={reportPage === reportTotalPages}
            size="sm"
            variant="outline"
          />
        </View>
      )}
    </View>
  );

  // ---------- Users Tab ----------
  const renderUsersTab = () => (
    <View className="px-4 pb-6">
      <TouchableOpacity
        onPress={() => setShowUserFilters((v) => !v)}
        className="flex-row items-center mb-2"
      >
        <Ionicons name={showUserFilters ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
        <Text className="text-sm text-gray-600 ml-1">Filters</Text>
      </TouchableOpacity>

      {showUserFilters && (
        <View className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
          <TextInput
            placeholder="Role"
            value={filterRole}
            onChangeText={setFilterRole}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <TextInput
            placeholder="Organization"
            value={filterOrganization}
            onChangeText={setFilterOrganization}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <TextInput
            placeholder="Area"
            value={filterArea}
            onChangeText={setFilterArea}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <View className="flex-row space-x-2">
            <TextInput
              placeholder="Join From (YYYY-MM-DD)"
              value={filterJoinDateFrom}
              onChangeText={setFilterJoinDateFrom}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <TextInput
              placeholder="Join To (YYYY-MM-DD)"
              value={filterJoinDateTo}
              onChangeText={setFilterJoinDateTo}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
          </View>
          <View className="flex-row space-x-2">
            <TextInput
              placeholder="Min Reports"
              value={filterMinReports}
              onChangeText={setFilterMinReports}
              keyboardType="numeric"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <TextInput
              placeholder="Min Events"
              value={filterMinEvents}
              onChangeText={setFilterMinEvents}
              keyboardType="numeric"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
          </View>
          <Button title="Apply Filters" onPress={() => { setUserPage(1); fetchUsers(1); }} size="sm" />
        </View>
      )}

      {loading ? (
        <ActivityIndicator className="mt-4" />
      ) : users.length === 0 ? (
        <Text className="text-gray-500 text-center mt-4">No users found</Text>
      ) : (
        users.map((u) => (
          <View key={u.id} className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-2">
                <Text className="font-medium text-sm text-gray-900">{u.firstName} {u.lastName}</Text>
                <Text className="text-xs text-gray-500 mt-1">{u.email}</Text>
                <Text className="text-xs text-gray-400 mt-1">Joined {formatDate(u.created_at)}</Text>
              </View>
              <View className="items-end">
                <Badge variant="outline" className="mb-1">
                  <Text className="text-xs">{u.role}</Text>
                </Badge>
              </View>
            </View>
            <View className="flex-row justify-end mt-2 space-x-2">
              <TouchableOpacity
                onPress={() => { setSelectedUser(u); setShowUserModal(true); }}
                className="p-2 bg-gray-100 rounded-lg"
              >
                <Ionicons name="eye" size={16} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setSelectedUser(u); setShowEditUserModal(true); }}
                className="p-2 bg-gray-100 rounded-lg"
              >
                <Ionicons name="create" size={16} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteUser(u)}
                className="p-2 bg-red-50 rounded-lg"
              >
                <Ionicons name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {userTotalPages > 1 && (
        <View className="flex-row justify-between items-center mt-2">
          <Button
            title="Previous"
            onPress={() => setUserPage((p) => Math.max(1, p - 1))}
            disabled={userPage === 1}
            size="sm"
            variant="outline"
          />
          <Text className="text-xs text-gray-600">Page {userPage} of {userTotalPages}</Text>
          <Button
            title="Next"
            onPress={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
            disabled={userPage === userTotalPages}
            size="sm"
            variant="outline"
          />
        </View>
      )}
    </View>
  );

  // ---------- Events Tab ----------
  const renderEventsTab = () => (
    <View className="px-4 pb-6">
      <TouchableOpacity
        onPress={() => setShowEventFilters((v) => !v)}
        className="flex-row items-center mb-2"
      >
        <Ionicons name={showEventFilters ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
        <Text className="text-sm text-gray-600 ml-1">Filters</Text>
      </TouchableOpacity>

      {showEventFilters && (
        <View className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
          <TextInput
            placeholder="Status"
            value={filterStatus}
            onChangeText={setFilterStatus}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <View className="flex-row space-x-2">
            <TextInput
              placeholder="Date From (YYYY-MM-DD)"
              value={filterEventDateFrom}
              onChangeText={setFilterEventDateFrom}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <TextInput
              placeholder="Date To (YYYY-MM-DD)"
              value={filterEventDateTo}
              onChangeText={setFilterEventDateTo}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
          </View>
          <TextInput
            placeholder="Location"
            value={filterLocation}
            onChangeText={setFilterLocation}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <TextInput
            placeholder="Creator Name"
            value={filterCreator}
            onChangeText={setFilterCreator}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
          />
          <View className="flex-row space-x-2">
            <TextInput
              placeholder="Min Volunteers"
              value={filterVolunteersMin}
              onChangeText={setFilterVolunteersMin}
              keyboardType="numeric"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
            <TextInput
              placeholder="Max Volunteers"
              value={filterVolunteersMax}
              onChangeText={setFilterVolunteersMax}
              keyboardType="numeric"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
            />
          </View>
          <Button title="Apply Filters" onPress={() => { setEventPage(1); fetchEvents(1); }} size="sm" />
        </View>
      )}

      {loading ? (
        <ActivityIndicator className="mt-4" />
      ) : events.length === 0 ? (
        <Text className="text-gray-500 text-center mt-4">No events found</Text>
      ) : (
        events.map((evt) => (
          <View key={evt.id} className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-2">
                <Text className="font-medium text-sm text-gray-900" numberOfLines={1}>{evt.title}</Text>
                <Text className="text-xs text-gray-500 mt-1">{formatDate(evt.date)}</Text>
                <Text className="text-xs text-gray-400 mt-1">
                  Volunteers: {evt.attendees_count ?? evt.currentVolunteers ?? 0} / {evt.maxVolunteers ?? "∞"}
                </Text>
              </View>
              <View className={`px-2 py-1 rounded-full ${getEventStatusColor(evt.status)}`}>
                <Text className="text-xs font-medium">{evt.status}</Text>
              </View>
            </View>
            <View className="flex-row justify-end mt-2 space-x-2">
              <TouchableOpacity
                onPress={() => { setSelectedEvent(evt); setShowEventModal(true); }}
                className="p-2 bg-gray-100 rounded-lg"
              >
                <Ionicons name="eye" size={16} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteEvent(evt)}
                className="p-2 bg-red-50 rounded-lg"
              >
                <Ionicons name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {eventTotalPages > 1 && (
        <View className="flex-row justify-between items-center mt-2">
          <Button
            title="Previous"
            onPress={() => setEventPage((p) => Math.max(1, p - 1))}
            disabled={eventPage === 1}
            size="sm"
            variant="outline"
          />
          <Text className="text-xs text-gray-600">Page {eventPage} of {eventTotalPages}</Text>
          <Button
            title="Next"
            onPress={() => setEventPage((p) => Math.min(eventTotalPages, p + 1))}
            disabled={eventPage === eventTotalPages}
            size="sm"
            variant="outline"
          />
        </View>
      )}
    </View>
  );

  // ---------- Settings Tab ----------
  const renderSettingsTab = () => (
    <View className="px-4 pb-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Auto-approve Reports</Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setAutoApproveEnabled(true)}
                className={`flex-1 py-2 rounded-lg border items-center ${autoApproveEnabled ? "bg-waterbase-500 border-waterbase-500" : "bg-white border-gray-300"}`}
              >
                <Text className={`text-sm font-medium ${autoApproveEnabled ? "text-white" : "text-gray-700"}`}>Enabled</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAutoApproveEnabled(false)}
                className={`flex-1 py-2 rounded-lg border items-center ${!autoApproveEnabled ? "bg-waterbase-500 border-waterbase-500" : "bg-white border-gray-300"}`}
              >
                <Text className={`text-sm font-medium ${!autoApproveEnabled ? "text-white" : "text-gray-700"}`}>Disabled</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">AI Confidence Threshold (%)</Text>
            <TextInput
              value={String(autoApproveThreshold)}
              onChangeText={(v) => setAutoApproveThreshold(Number(v) || 0)}
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
              placeholder="0-100"
            />
          </View>

          <Button title="Save Settings" onPress={handleSaveSettings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            title="Clear Cache"
            variant="outline"
            disabled={isMaintenanceBusy}
            onPress={async () => {
              try {
                const data = await runMaintenanceAction(API_ENDPOINTS.ADMIN_MAINTENANCE_CACHE_CLEAR);
                showMessage(data?.message || "Cache cleared");
              } catch (e: any) {
                showMessage(e.message, true);
              }
            }}
          />
          <Button
            title="Restart Queue Worker"
            variant="outline"
            disabled={isMaintenanceBusy}
            onPress={async () => {
              try {
                const data = await runMaintenanceAction(API_ENDPOINTS.ADMIN_MAINTENANCE_QUEUE_RESTART);
                showMessage(data?.message || "Queue restarted");
              } catch (e: any) {
                showMessage(e.message, true);
              }
            }}
          />
          <Button
            title="Run Health Check"
            variant="outline"
            disabled={isMaintenanceBusy}
            onPress={async () => {
              try {
                const data = await runMaintenanceAction(API_ENDPOINTS.ADMIN_MAINTENANCE_HEALTH, "GET");
                setMaintenanceHealth(data?.data || null);
                showMessage("Health check completed");
              } catch (e: any) {
                showMessage(e.message, true);
              }
            }}
          />
          <Button
            title="View System Stats"
            variant="outline"
            disabled={isMaintenanceBusy}
            onPress={async () => {
              try {
                const data = await runMaintenanceAction(API_ENDPOINTS.ADMIN_MAINTENANCE_STATS, "GET");
                setMaintenanceStats(data?.data || null);
                showMessage("System stats refreshed");
              } catch (e: any) {
                showMessage(e.message, true);
              }
            }}
          />

          {maintenanceHealth && (
            <View className="bg-gray-50 rounded-lg p-3 mt-2">
              <Text className="text-sm font-semibold text-gray-800 mb-1">Health Snapshot</Text>
              <Text className="text-xs text-gray-600">Database: {maintenanceHealth.database?.status || "unknown"}</Text>
              <Text className="text-xs text-gray-600">Cache: {maintenanceHealth.cache?.status || "unknown"}</Text>
              <Text className="text-xs text-gray-600">
                Queue: {maintenanceHealth.queue?.status || "unknown"} ({maintenanceHealth.queue?.failed_jobs ?? 0} failed)
              </Text>
            </View>
          )}

          {maintenanceStats && (
            <View className="bg-gray-50 rounded-lg p-3 mt-2">
              <Text className="text-sm font-semibold text-gray-800 mb-1">System Stats</Text>
              <Text className="text-xs text-gray-600">Uptime: {maintenanceStats.uptime || "N/A"}</Text>
              <Text className="text-xs text-gray-600">Disk used: {maintenanceStats.disk_usage?.used_percent ?? "N/A"}%</Text>
              <Text className="text-xs text-gray-600">Memory peak: {maintenanceStats.memory_usage?.peak_mb ?? "N/A"} MB</Text>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Navigation title="Admin Moderation" showBackButton={true} />

      {/* Messages */}
      {(error || success) && (
        <View className={`mx-4 mt-2 p-3 rounded-lg ${error ? "bg-red-50" : "bg-green-50"}`}>
          <Text className={`text-sm ${error ? "text-red-600" : "text-green-600"}`}>{error || success}</Text>
        </View>
      )}

      {/* Tab Bar */}
      <View className="flex-row bg-white border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 items-center py-3 ${isActive ? "border-b-2 border-waterbase-500" : ""}`}
            >
              <Ionicons name={tab.icon as any} size={18} color={isActive ? "#0ea5e9" : "#9ca3af"} />
              <Text className={`text-xs mt-1 ${isActive ? "text-waterbase-600 font-medium" : "text-gray-500"}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === "reports" && renderReportsTab()}
        {activeTab === "users" && renderUsersTab()}
        {activeTab === "events" && renderEventsTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </ScrollView>

      {/* Report Detail Modal */}
      <Modal visible={showReportModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowReportModal(false)}>
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">Report Validation</Text>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            {selectedReport && (
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700">Title</Text>
                  <Text className="text-base text-gray-900">{selectedReport.title}</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">Location</Text>
                  <Text className="text-base text-gray-900">{selectedReport.address}</Text>
                </View>
                {selectedReport.content && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700">Description</Text>
                    <Text className="text-base text-gray-900">{selectedReport.content}</Text>
                  </View>
                )}

                {/* Images */}
                <View className="flex-row space-x-2">
                  {selectedReport.image ? (
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-1">Submitted Image</Text>
                      <Image source={{ uri: selectedReport.image }} className="w-full h-40 rounded-lg" resizeMode="cover" />
                    </View>
                  ) : null}
                  {selectedReport.ai_annotated_image ? (
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-1">AI Annotated</Text>
                      <Image source={{ uri: selectedReport.ai_annotated_image }} className="w-full h-40 rounded-lg" resizeMode="cover" />
                    </View>
                  ) : null}
                </View>

                <View className="flex-row flex-wrap -mx-1">
                  <View className="w-1/2 px-1 mb-2">
                    <Text className="text-sm font-medium text-gray-700">Type</Text>
                    <Badge variant="outline"><Text className="text-xs">{selectedReport.pollutionType}</Text></Badge>
                  </View>
                  <View className="w-1/2 px-1 mb-2">
                    <Text className="text-sm font-medium text-gray-700">User Severity</Text>
                    <View className={`self-start px-2 py-1 rounded-full ${getSeverityColor(selectedReport.severityByUser)}`}>
                      <Text className="text-xs text-white font-medium">{selectedReport.severityByUser || "N/A"}</Text>
                    </View>
                  </View>
                  <View className="w-1/2 px-1 mb-2">
                    <Text className="text-sm font-medium text-gray-700">AI Severity</Text>
                    <View className={`self-start px-2 py-1 rounded-full ${getSeverityColor(selectedReport.severityByAI)}`}>
                      <Text className="text-xs text-white font-medium">{selectedReport.severityByAI || "N/A"}</Text>
                    </View>
                  </View>
                  <View className="w-1/2 px-1 mb-2">
                    <Text className="text-sm font-medium text-gray-700">AI Confidence</Text>
                    <Text className={`text-base font-medium ${getSeverityTextColor(selectedReport.severityByAI)}`}>
                      {selectedReport.ai_confidence}%
                    </Text>
                  </View>
                  <View className="w-1/2 px-1 mb-2">
                    <Text className="text-sm font-medium text-gray-700">Submitted By</Text>
                    <Text className="text-base text-gray-900">{selectedReport.username || "N/A"}</Text>
                  </View>
                  <View className="w-1/2 px-1 mb-2">
                    <Text className="text-sm font-medium text-gray-700">Submitted At</Text>
                    <Text className="text-base text-gray-900">{formatDateTime(selectedReport.created_at)}</Text>
                  </View>
                </View>

                {/* Actions */}
                {selectedReport.auto_approved ? (
                  <View className="bg-green-100 rounded-lg p-3 items-center">
                    <Text className="text-green-800 font-medium">Auto-Approved</Text>
                  </View>
                ) : (
                  <View className="flex-row space-x-2 mt-4">
                    <View className="flex-1">
                      <Button
                        title="Approve"
                        onPress={() => { setShowReportModal(false); openActionModal(selectedReport, "approve"); }}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        title="Reject"
                        variant="secondary"
                        onPress={() => { setShowReportModal(false); openActionModal(selectedReport, "reject"); }}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Action Confirm Modal (Approve/Reject) */}
      <Modal visible={showActionModal} transparent animationType="fade" onRequestClose={() => setShowActionModal(false)}>
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-xl p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-1">
              {pendingAction === "approve" ? "Approve Report" : "Reject Report"}
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              Please provide a reason for {pendingAction}ing this report.
            </Text>
            <TextInput
              value={adminNotes}
              onChangeText={setAdminNotes}
              placeholder={`Reason for ${pendingAction}...`}
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm mb-4"
              textAlignVertical="top"
            />
            <View className="flex-row space-x-2">
              <View className="flex-1">
                <Button title="Cancel" variant="outline" onPress={() => setShowActionModal(false)} />
              </View>
              <View className="flex-1">
                <Button
                  title="Confirm"
                  onPress={handleReportAction}
                  disabled={!adminNotes.trim()}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Detail Modal */}
      <Modal visible={showUserModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowUserModal(false)}>
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">User Details</Text>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            {selectedUser && (
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700">Name</Text>
                  <Text className="text-base text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">Email</Text>
                  <Text className="text-base text-gray-900">{selectedUser.email}</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">Phone</Text>
                  <Text className="text-base text-gray-900">{selectedUser.phoneNumber || "N/A"}</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">Role</Text>
                  <Text className="text-base text-gray-900">{selectedUser.role}</Text>
                </View>
                {shouldShowOrganizationFields(selectedUser.role) && (
                  <>
                    <View>
                      <Text className="text-sm font-medium text-gray-700">Organization</Text>
                      <Text className="text-base text-gray-900">{selectedUser.organization || "N/A"}</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-700">Area of Responsibility</Text>
                      <Text className="text-base text-gray-900">{selectedUser.areaOfResponsibility || "N/A"}</Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={showEditUserModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditUserModal(false)}>
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">Edit User</Text>
            <TouchableOpacity onPress={() => setShowEditUserModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            <View className="space-y-3">
              <View className="flex-row space-x-2">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">First Name</Text>
                  <TextInput
                    value={editFormData.firstName}
                    onChangeText={(v) => setEditFormData((p) => ({ ...p, firstName: v }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
                    editable={!isUpdatingUser}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Last Name</Text>
                  <TextInput
                    value={editFormData.lastName}
                    onChangeText={(v) => setEditFormData((p) => ({ ...p, lastName: v }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
                    editable={!isUpdatingUser}
                  />
                </View>
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                <TextInput
                  value={editFormData.email}
                  onChangeText={(v) => setEditFormData((p) => ({ ...p, email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
                  editable={!isUpdatingUser}
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Phone Number</Text>
                <TextInput
                  value={editFormData.phoneNumber}
                  onChangeText={(v) => setEditFormData((p) => ({ ...p, phoneNumber: v }))}
                  keyboardType="phone-pad"
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
                  editable={!isUpdatingUser}
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Role</Text>
                <TextInput
                  value={editFormData.role}
                  onChangeText={(v) => setEditFormData((p) => ({ ...p, role: v }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
                  editable={!isUpdatingUser}
                />
              </View>
              {shouldShowOrganizationFields(editFormData.role) && (
                <>
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Organization</Text>
                    <TextInput
                      value={editFormData.organization}
                      onChangeText={(v) => setEditFormData((p) => ({ ...p, organization: v }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
                      editable={!isUpdatingUser}
                    />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-1">Area of Responsibility</Text>
                    <SearchableLocationSelect
                      value={editFormData.areaOfResponsibility}
                      onValueChange={(v) => setEditFormData((p) => ({ ...p, areaOfResponsibility: v }))}
                      disabled={isUpdatingUser}
                    />
                  </View>
                </>
              )}
              <View className="flex-row space-x-2 mt-4">
                <View className="flex-1">
                  <Button title="Cancel" variant="outline" onPress={() => setShowEditUserModal(false)} disabled={isUpdatingUser} />
                </View>
                <View className="flex-1">
                  <Button title={isUpdatingUser ? "Saving..." : "Save"} onPress={handleUpdateUser} disabled={isUpdatingUser} />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Event Detail Modal */}
      <Modal visible={showEventModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEventModal(false)}>
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">Event Details</Text>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-4">
            {selectedEvent && (
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700">Title</Text>
                  <Text className="text-base text-gray-900">{selectedEvent.title}</Text>
                </View>
                <View className="flex-row space-x-2">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Date</Text>
                    <Text className="text-base text-gray-900">{formatDate(selectedEvent.date)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Time</Text>
                    <Text className="text-base text-gray-900">{selectedEvent.time || "N/A"}</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">Duration</Text>
                  <Text className="text-base text-gray-900">{selectedEvent.duration ? `${selectedEvent.duration} hours` : "N/A"}</Text>
                </View>
                {selectedEvent.description && (
                  <View>
                    <Text className="text-sm font-medium text-gray-700">Description</Text>
                    <Text className="text-base text-gray-900">{selectedEvent.description}</Text>
                  </View>
                )}
                <View>
                  <Text className="text-sm font-medium text-gray-700">Address</Text>
                  <Text className="text-base text-gray-900">{selectedEvent.address || "N/A"}</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">Coordinates</Text>
                  <Text className="text-base text-gray-900">
                    {selectedEvent.latitude != null && selectedEvent.longitude != null
                      ? `${selectedEvent.latitude}, ${selectedEvent.longitude}`
                      : "N/A"}
                  </Text>
                </View>
                <View className="flex-row space-x-2">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Volunteers</Text>
                    <Text className="text-base text-gray-900">
                      {selectedEvent.currentVolunteers ?? selectedEvent.attendees_count ?? 0} / {selectedEvent.maxVolunteers ?? "∞"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Status</Text>
                    <View className={`self-start px-2 py-1 rounded-full mt-1 ${getEventStatusColor(selectedEvent.status)}`}>
                      <Text className="text-xs font-medium">{selectedEvent.status}</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row space-x-2">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Points</Text>
                    <Text className="text-base text-gray-900">{selectedEvent.points ?? "N/A"}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Badge</Text>
                    <Text className="text-base text-gray-900">{selectedEvent.badge || "N/A"}</Text>
                  </View>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700">Created By</Text>
                  <Text className="text-base text-gray-900">
                    {selectedEvent.creator ? `${selectedEvent.creator.firstName} ${selectedEvent.creator.lastName}` : "N/A"}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AdminModerationScreen;
