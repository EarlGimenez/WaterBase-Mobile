import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
  TextInput,
  Modal,
  Alert,
  FlatList,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import LeafletMap from "../components/LeafletMap";
import SeverityDistributionChart from "../components/SeverityDistributionChart";
import { WBSICalculator, getReportsForLocation, getSeverityDescription, ChartData } from "../utils/wbsiCalculator";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const BOTTOM_SHEET_MIN_HEIGHT = 140;
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.75;
const FOOTER_HEIGHT = 10; // Lower to stick properly to footer
const GAP_HEIGHT = 25; // Increased gap for better separation

// Types
interface Report {
  id: number;
  title: string;
  content: string;
  address: string;
  latitude: number;
  longitude: number;
  pollutionType: string;
  severityByUser: string;
  severityByAI?: string;
  ai_confidence?: number;
  status: string;
  user_id: number;
  verifiedBy?: number;
  created_at: string;
  updated_at: string;
  image?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface SensorStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  waterQualityIndex: number;
  parameters: {
    physicochemical: { ph: number; temperature: number; dissolvedOxygen: number };
    organics: { cod: number; bod: number; nitrates: number };
    nutrients: { phosphorus: number; nitrogen: number };
    microbial: { coliform: number; ecoli: number };
    optical: { turbidity: number; transparency: number };
  };
  lastUpdated: string;
}

interface DistributionData {
  pollutionType: string;
  count: number;
  percentage: number;
  color: string;
}

type ViewMode = "reports" | "research";
type ResearchMode = "spatial" | "temporal";
type TemporalDataType = "sensor" | "cleanup";

// Mock sensor data (in real app, this would come from API)
const mockSensorStations: SensorStation[] = [
  {
    id: "SENSOR001",
    name: "Manila Bay Station A",
    latitude: 14.5995,
    longitude: 120.9842,
    waterQualityIndex: 72,
    parameters: {
      physicochemical: { ph: 7.2, temperature: 28.5, dissolvedOxygen: 6.8 },
      organics: { cod: 15, bod: 8, nitrates: 2.1 },
      nutrients: { phosphorus: 0.8, nitrogen: 1.2 },
      microbial: { coliform: 240, ecoli: 45 },
      optical: { turbidity: 12, transparency: 85 }
    },
    lastUpdated: "2024-01-15T10:30:00Z"
  },
  {
    id: "SENSOR002",
    name: "Pasig River Station B",
    latitude: 14.5764,
    longitude: 121.0851,
    waterQualityIndex: 45,
    parameters: {
      physicochemical: { ph: 6.8, temperature: 30.2, dissolvedOxygen: 4.2 },
      organics: { cod: 28, bod: 18, nitrates: 4.5 },
      nutrients: { phosphorus: 1.5, nitrogen: 2.8 },
      microbial: { coliform: 680, ecoli: 180 },
      optical: { turbidity: 25, transparency: 45 }
    },
    lastUpdated: "2024-01-15T10:25:00Z"
  }
];

// Utility functions
const getSeverityColor = (severity: string) => {
  const sev = severity.toLowerCase();
  if (sev.includes("critical")) return "#ef4444";
  if (sev.includes("high")) return "#f97316";
  if (sev.includes("medium")) return "#eab308";
  if (sev.includes("low")) return "#22c55e";
  return "#6b7280";
};

const getWQIColor = (wqi: number) => {
  if (wqi >= 80) return "#22c55e"; // Good
  if (wqi >= 60) return "#eab308"; // Fair
  if (wqi >= 40) return "#f97316"; // Poor
  return "#ef4444"; // Very Poor
};

const getWQIStatus = (wqi: number) => {
  if (wqi >= 80) return "Good";
  if (wqi >= 60) return "Fair";
  if (wqi >= 40) return "Poor";
  return "Very Poor";
};

const getPollutionTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    'industrial': '#8b5cf6',
    'plastic': '#06b6d4',
    'sewage': '#84cc16',
    'chemical': '#f59e0b',
    'trash': '#ef4444',
    'oil': '#1f2937',
    'algae': '#10b981'
  };
  return colors[type.toLowerCase()] || '#6b7280';
};

// Custom hook for fetching reports
const useReportsData = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await apiRequest(API_ENDPOINTS.REPORTS + "/all", {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const reportsArray = Array.isArray(data) ? data : data.data || [];

        const validReports = reportsArray
          .map((r: any) => ({
            ...r,
            latitude: parseFloat(r.latitude),
            longitude: parseFloat(r.longitude),
          }))
          .filter((report: Report) =>
            !isNaN(report.latitude) && !isNaN(report.longitude)
          );
        setReports(validReports);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  return { reports, loading, error, refetch: fetchReports };
};

const MapViewScreen = () => {
  const { user } = useAuth();
  const { reports, loading, error } = useReportsData();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("reports");
  const [researchMode, setResearchMode] = useState<ResearchMode>("spatial");
  const [temporalDataType, setTemporalDataType] = useState<TemporalDataType>("sensor");

  // Report filtering
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);

  // Research mode state  
  const [selectedSensor, setSelectedSensor] = useState<SensorStation | null>(null);
  const [showLayers, setShowLayers] = useState({
    pollution: true,
    sensors: false,
    cleanup: false
  });
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedParameters, setSelectedParameters] = useState<string[]>(["ph", "temperature"]);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 14.5995, // Manila Bay center
    longitude: 120.9842,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // WBSI state
  const [wbsiData, setWbsiData] = useState<ChartData | null>(null);

  // Bottom sheet animation
  const bottomSheetHeight = new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  // Pan responder for bottom sheet
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      const newHeight = BOTTOM_SHEET_MIN_HEIGHT + Math.max(0, -gestureState.dy);
      if (newHeight <= BOTTOM_SHEET_MAX_HEIGHT) {
        bottomSheetHeight.setValue(newHeight);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const shouldExpand = gestureState.dy < -50 || gestureState.vy < -0.5;
      const shouldCollapse = gestureState.dy > 50 || gestureState.vy > 0.5;

      if (shouldExpand && !isBottomSheetExpanded) {
        expandBottomSheet();
      } else if (shouldCollapse && isBottomSheetExpanded) {
        collapseBottomSheet();
      } else {
        Animated.spring(bottomSheetHeight, {
          toValue: isBottomSheetExpanded ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MIN_HEIGHT,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const expandBottomSheet = () => {
    setIsBottomSheetExpanded(true);
    Animated.spring(bottomSheetHeight, {
      toValue: BOTTOM_SHEET_MAX_HEIGHT,
      useNativeDriver: false,
    }).start();
  };

  const collapseBottomSheet = () => {
    setIsBottomSheetExpanded(false);
    Animated.spring(bottomSheetHeight, {
      toValue: BOTTOM_SHEET_MIN_HEIGHT,
      useNativeDriver: false,
    }).start();
  };

  // Filter reports based on current filters
  useEffect(() => {
    let filtered = reports;

    if (filterType !== "all") {
      filtered = filtered.filter(r =>
        r.pollutionType.toLowerCase().includes(filterType.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.pollutionType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  }, [reports, filterType, filterStatus, searchQuery]);

  // Calculate WBSI when selectedReport changes
  useEffect(() => {
    console.log('selectedReport state changed:', selectedReport);

    if (selectedReport) {
      console.log('Calculating WBSI for selected report');
      // Get nearby reports for the selected location
      const nearbyReports = getReportsForLocation(reports, selectedReport, 5);
      console.log('Nearby reports:', nearbyReports.length);

      if (nearbyReports.length > 0) {
        const calculator = new WBSICalculator();
        try {
          const wbsiResult = calculator.calculateWBSI([selectedReport]);
          const chartData = calculator.generateChartData(wbsiResult);
          console.log('WBSI calculation result:', chartData);
          setWbsiData(chartData);
        } catch (error) {
          console.error('Error calculating WBSI:', error);
          setWbsiData(null);
        }
      } else {
        setWbsiData(null);
      }
    } else {
      setWbsiData(null);
    }
  }, [selectedReport, reports]);

  // Calculate distribution data for charts
  const getDistributionData = (): DistributionData[] => {
    const types: { [key: string]: number } = {};
    filteredReports.forEach(report => {
      types[report.pollutionType] = (types[report.pollutionType] || 0) + 1;
    });

    const total = filteredReports.length;
    return Object.entries(types).map(([type, count]) => ({
      pollutionType: type,
      count,
      percentage: Math.round((count / total) * 100),
      color: getPollutionTypeColor(type)
    }));
  };

  // Location services
  const getCurrentLocation = async () => {
    Alert.alert("Location", "Getting current location...");
    // In real app, use expo-location
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-waterbase-50">
        <Navigation title="Live Map" showBackButton={true} />
        <View className="flex-1 items-center justify-center">
          <Ionicons name="refresh" size={48} color="#0ea5e9" />
          <Text className="text-waterbase-600 mt-4">Loading pollution data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-waterbase-50">
        <Navigation title="Live Map" showBackButton={true} />
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text className="text-red-600 mt-4 text-center">{error}</Text>
          <Button
            title="Retry"
            onPress={() => {
              console.log("Retrying to fetch reports...");
            }}
            className="mt-4"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-waterbase-50">
      <Navigation title="Live Map" showBackButton={true} />

      {/* Main Content Area */}
      <View className="flex-1 relative">
        {/* Map View - Full Screen */}
        <LeafletMap
          style={{ flex: 1 }}
          center={currentLocation}
          reports={filteredReports}
          sensors={mockSensorStations}
          showReports={viewMode === "reports" && showLayers.pollution}
          showSensors={viewMode === "research" || showLayers.sensors}
          onReportPress={(report) => {
            setSelectedReport(report as any);
            expandBottomSheet();
          }}
          onSensorPress={(sensor) => {
            setSelectedSensor(sensor as any);
            expandBottomSheet();
          }}
        />

        {/* Side Controls - Minimal */}
        <View className="absolute top-4 right-4 z-10 space-y-2">
          <TouchableOpacity
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg"
            onPress={getCurrentLocation}
          >
            <Ionicons name="locate" size={24} color="#0ea5e9" />
          </TouchableOpacity>
        </View>

        {/* White Gap Area - Sticks to footer */}
        <View
          className="absolute left-0 right-0 bg-white"
          style={{
            bottom: FOOTER_HEIGHT - 10, // Slightly overlap for better sticking
            height: GAP_HEIGHT + 10,
          }}
        />

        {/* Bottom Sheet */}
        <Animated.View
          className="absolute left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
          style={{
            bottom: FOOTER_HEIGHT + GAP_HEIGHT,
            height: bottomSheetHeight,
          }}
        >
          {/* Bottom Sheet Handle */}
          <View
            className="w-full items-center py-4"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
            <Text className="text-gray-600 text-sm mt-2">
              {isBottomSheetExpanded ? "Swipe down to collapse" : "Swipe up for details"}
            </Text>
          </View>

          {/* Bottom Sheet Content */}
          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            {/* Controls Section - Always Visible */}
            <View className="mb-4">
              {/* Mode Toggle */}
              <View className="flex-row bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <TouchableOpacity
                  className={`flex-1 py-3 px-4 ${viewMode === "reports" ? "bg-waterbase-500" : "bg-transparent"}`}
                  onPress={() => setViewMode("reports")}
                >
                  <Text className={`text-center text-sm font-medium ${viewMode === "reports" ? "text-white" : "text-gray-700"}`}>
                    Reports
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 px-4 ${viewMode === "research" ? "bg-waterbase-500" : "bg-transparent"}`}
                  onPress={() => setViewMode("research")}
                >
                  <Text className={`text-center text-sm font-medium ${viewMode === "research" ? "text-white" : "text-gray-700"}`}>
                    Research
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View className="relative mb-4">
                <Ionicons
                  name="search"
                  size={20}
                  color="#9CA3AF"
                  style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
                />
                <TextInput
                  placeholder="Search locations, descriptions..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-gray-900"
                />
              </View>

              {/* Filter and Layer Controls */}
              <View className="flex-row space-x-3 mb-4">
                <TouchableOpacity
                  className="flex-1 bg-waterbase-500 py-2 px-4 rounded-lg flex-row items-center justify-center"
                  onPress={() => setShowFilters(true)}
                >
                  <Ionicons name="filter" size={16} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white text-sm font-medium">Filters</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Legend Section */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <Text className="text-sm font-bold text-gray-800 mb-3">Map Legend</Text>

                {viewMode === "reports" ? (
                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <View className="w-4 h-4 rounded-full bg-red-500 mr-3" />
                      <Text className="text-sm text-gray-600 flex-1">Critical Pollution</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-4 h-4 rounded-full bg-orange-500 mr-3" />
                      <Text className="text-sm text-gray-600 flex-1">High Pollution</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-4 h-4 rounded-full bg-yellow-500 mr-3" />
                      <Text className="text-sm text-gray-600 flex-1">Medium Pollution</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-4 h-4 rounded-full bg-green-500 mr-3" />
                      <Text className="text-sm text-gray-600 flex-1">Low Pollution</Text>
                    </View>
                  </View>
                ) : (
                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <View className="w-4 h-4 rounded-full bg-green-500 mr-3" />
                      <Text className="text-sm text-gray-600 flex-1">Good Water Quality (80+)</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-4 h-4 rounded-full bg-yellow-500 mr-3" />
                      <Text className="text-sm text-gray-600 flex-1">Fair Water Quality (60-79)</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-4 h-4 rounded-full bg-orange-500 mr-3" />
                      <Text className="text-sm text-gray-600 flex-1">Poor Water Quality (40-59)</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-4 h-4 rounded-full bg-red-500 mr-3" />
                      <Text className="text-sm text-gray-600 flex-1">Very Poor Quality (&lt;40)</Text>
                    </View>
                  </View>
                )}

                {/* Layer Controls */}
                <View className="mt-4 pt-3 border-t border-gray-200">
                  <Text className="text-sm font-bold text-gray-800 mb-3">Layer Controls</Text>
                  <View className="space-y-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-gray-600">Show Pollution Reports</Text>
                      <Switch
                        value={showLayers.pollution}
                        onValueChange={(value) => setShowLayers(prev => ({ ...prev, pollution: value }))}
                      />
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-gray-600">Show Sensor Stations</Text>
                      <Switch
                        value={showLayers.sensors}
                        onValueChange={(value) => setShowLayers(prev => ({ ...prev, sensors: value }))}
                      />
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>
            {viewMode === "reports" ? (
              <View>
                {selectedReport ? (
                  // Selected Report Details
                  <Card className="mb-4">
                    <CardHeader>
                      <View className="flex-row items-center justify-between">
                        <CardTitle className="text-lg flex-1">{selectedReport.title || "Pollution Report"}</CardTitle>
                        <TouchableOpacity
                          onPress={() => setSelectedReport(null)}
                          className="p-2"
                        >
                          <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                    </CardHeader>
                    <CardContent>
                      <Text className="text-gray-600 mb-2">{selectedReport.content}</Text>
                      <Text className="text-sm text-gray-500 mb-2">📍 {selectedReport.address}</Text>
                      <View className="flex-row items-center space-x-4 mb-3">
                        <View className="flex-row items-center">
                          <View
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: getSeverityColor(selectedReport.severityByUser) }}
                          />
                          <Text className="text-sm text-gray-600">
                            {selectedReport.severityByUser} severity
                          </Text>
                        </View>
                        <Text className="text-sm text-gray-500">
                          {new Date(selectedReport.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-600">Type: {selectedReport.pollutionType}</Text>
                      <Text className="text-sm text-gray-600">Status: {selectedReport.status}</Text>

                      {/* Pollution Analysis Chart */}
                      {wbsiData && (
                        <View className="mt-4 border-t border-gray-200 pt-4">
                          <SeverityDistributionChart
                            chartData={wbsiData}
                            locationName={selectedReport.address}
                          />
                        </View>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  // Reports List and Distribution
                  <View>
                    {isBottomSheetExpanded && (
                      <View className="mb-4">
                        <Text className="text-lg font-bold text-gray-800 mb-3">Pollution Distribution</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View className="flex-row space-x-3">
                            {getDistributionData().map((item, index) => (
                              <Card key={index} className="w-24">
                                <CardContent className="items-center p-3">
                                  <View
                                    className="w-8 h-8 rounded-full mb-2"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <Text className="text-xs text-gray-600 text-center mb-1">
                                    {item.pollutionType}
                                  </Text>
                                  <Text className="text-sm font-bold text-gray-800">{item.count}</Text>
                                  <Text className="text-xs text-gray-500">{item.percentage}%</Text>
                                </CardContent>
                              </Card>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    <Text className="text-lg font-bold text-gray-800 mb-3">Recent Reports</Text>
                    <FlatList
                      data={filteredReports.slice(0, 10)}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedReport(item);
                          }}
                        >
                          <Card className="mb-3">
                            <CardContent className="p-3">
                              <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                  <Text className="font-medium text-gray-800">{item.title || "Pollution Report"}</Text>
                                  <Text className="text-sm text-gray-600 mt-1">{item.address}</Text>
                                  <Text className="text-xs text-gray-500 mt-1">
                                    {new Date(item.created_at).toLocaleDateString()}
                                  </Text>
                                </View>
                                <View className="items-center">
                                  <View
                                    className="w-6 h-6 rounded-full mb-1"
                                    style={{ backgroundColor: getSeverityColor(item.severityByUser) }}
                                  />
                                  <Text className="text-xs text-gray-600">{item.severityByUser}</Text>
                                </View>
                              </View>
                            </CardContent>
                          </Card>
                        </TouchableOpacity>
                      )}
                      scrollEnabled={false}
                    />
                  </View>
                )}
              </View>
            ) : (
              // Research Mode Content
              <View>
                {/* Research Mode Toggle */}
                <View className="flex-row bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <TouchableOpacity
                    className={`flex-1 py-2 px-3 ${researchMode === "spatial" ? "bg-waterbase-500" : "bg-transparent"}`}
                    onPress={() => setResearchMode("spatial")}
                  >
                    <Text className={`text-center text-sm font-medium ${researchMode === "spatial" ? "text-white" : "text-gray-700"}`}>
                      Spatial Data
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-2 px-3 ${researchMode === "temporal" ? "bg-waterbase-500" : "bg-transparent"}`}
                    onPress={() => setResearchMode("temporal")}
                  >
                    <Text className={`text-center text-sm font-medium ${researchMode === "temporal" ? "text-white" : "text-gray-700"}`}>
                      Temporal Data
                    </Text>
                  </TouchableOpacity>
                </View>

                {researchMode === "spatial" ? (
                  <View>
                    {selectedSensor ? (
                      // Selected Sensor Details
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle className="text-lg">{selectedSensor.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <View className="mb-4">
                            <Text className="text-sm text-gray-600 mb-2">Water Quality Index</Text>
                            <View className="flex-row items-center">
                              <View
                                className="w-6 h-6 rounded-full mr-3"
                                style={{ backgroundColor: getWQIColor(selectedSensor.waterQualityIndex) }}
                              />
                              <Text className="text-2xl font-bold text-gray-800">{selectedSensor.waterQualityIndex}</Text>
                              <Text className="text-sm text-gray-600 ml-2">
                                ({getWQIStatus(selectedSensor.waterQualityIndex)})
                              </Text>
                            </View>
                          </View>

                          <Text className="text-sm font-medium text-gray-800 mb-2">Parameters</Text>
                          <View className="space-y-2">
                            <Text className="text-sm text-gray-600">🧪 pH: {selectedSensor.parameters.physicochemical.ph}</Text>
                            <Text className="text-sm text-gray-600">🌡️ Temperature: {selectedSensor.parameters.physicochemical.temperature}°C</Text>
                            <Text className="text-sm text-gray-600">💨 Dissolved O₂: {selectedSensor.parameters.physicochemical.dissolvedOxygen} mg/L</Text>
                            <Text className="text-sm text-gray-600">⚗️ COD: {selectedSensor.parameters.organics.cod} mg/L</Text>
                            <Text className="text-sm text-gray-600">🦠 E.coli: {selectedSensor.parameters.microbial.ecoli} CFU/100mL</Text>
                          </View>

                          <Text className="text-xs text-gray-500 mt-3">
                            Last updated: {new Date(selectedSensor.lastUpdated).toLocaleString()}
                          </Text>
                        </CardContent>
                      </Card>
                    ) : (
                      // Sensor Stations List
                      <View>
                        <Text className="text-lg font-bold text-gray-800 mb-3">Sensor Stations</Text>
                        <FlatList
                          data={mockSensorStations}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              onPress={() => setSelectedSensor(item)}
                            >
                              <Card className="mb-3">
                                <CardContent className="p-3">
                                  <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                      <Text className="font-medium text-gray-800">{item.name}</Text>
                                      <Text className="text-sm text-gray-600 mt-1">
                                        WQI: {item.waterQualityIndex} ({getWQIStatus(item.waterQualityIndex)})
                                      </Text>
                                    </View>
                                    <View
                                      className="w-8 h-8 rounded-full items-center justify-center"
                                      style={{ backgroundColor: getWQIColor(item.waterQualityIndex) }}
                                    >
                                      <Text className="text-white text-xs font-bold">{item.waterQualityIndex}</Text>
                                    </View>
                                  </View>
                                </CardContent>
                              </Card>
                            </TouchableOpacity>
                          )}
                          scrollEnabled={false}
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  // Temporal Data
                  <View>
                    {/* Temporal Data Type Toggle */}
                    <View className="flex-row bg-gray-100 rounded-lg mb-4 overflow-hidden">
                      <TouchableOpacity
                        className={`flex-1 py-2 px-3 ${temporalDataType === "sensor" ? "bg-waterbase-500" : "bg-transparent"}`}
                        onPress={() => setTemporalDataType("sensor")}
                      >
                        <Text className={`text-center text-sm font-medium ${temporalDataType === "sensor" ? "text-white" : "text-gray-700"}`}>
                          Sensor Data
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`flex-1 py-2 px-3 ${temporalDataType === "cleanup" ? "bg-waterbase-500" : "bg-transparent"}`}
                        onPress={() => setTemporalDataType("cleanup")}
                      >
                        <Text className={`text-center text-sm font-medium ${temporalDataType === "cleanup" ? "text-white" : "text-gray-700"}`}>
                          Cleanup Efforts
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Year Slider */}
                    <Card className="mb-4">
                      <CardContent className="p-3">
                        <Text className="text-sm font-medium text-gray-800 mb-2">Year: {selectedYear}</Text>
                        <View className="flex-row items-center space-x-2">
                          <TouchableOpacity onPress={() => setSelectedYear(prev => Math.max(2020, prev - 1))}>
                            <Ionicons name="remove-circle" size={24} color="#0ea5e9" />
                          </TouchableOpacity>
                          <View className="flex-1 bg-gray-200 h-1 rounded-full">
                            <View
                              className="bg-waterbase-500 h-1 rounded-full"
                              style={{ width: `${((selectedYear - 2020) / 4) * 100}%` }}
                            />
                          </View>
                          <TouchableOpacity onPress={() => setSelectedYear(prev => Math.min(2024, prev + 1))}>
                            <Ionicons name="add-circle" size={24} color="#0ea5e9" />
                          </TouchableOpacity>
                        </View>
                        <View className="flex-row justify-between mt-2">
                          <Text className="text-xs text-gray-500">2020</Text>
                          <Text className="text-xs text-gray-500">2024</Text>
                        </View>
                      </CardContent>
                    </Card>

                    {/* Parameter Filters */}
                    <Card>
                      <CardContent className="p-3">
                        <Text className="text-sm font-medium text-gray-800 mb-2">Parameters</Text>
                        <View className="flex-row flex-wrap gap-2">
                          {["ph", "temperature", "dissolvedOxygen", "cod", "ecoli"].map((param) => (
                            <TouchableOpacity
                              key={param}
                              className={`px-3 py-1 rounded-full border ${selectedParameters.includes(param)
                                  ? "bg-waterbase-500 border-waterbase-500"
                                  : "bg-white border-gray-300"
                                }`}
                              onPress={() => {
                                setSelectedParameters(prev =>
                                  prev.includes(param)
                                    ? prev.filter(p => p !== param)
                                    : [...prev, param]
                                );
                              }}
                            >
                              <Text className={`text-xs ${selectedParameters.includes(param) ? "text-white" : "text-gray-700"
                                }`}>
                                {param}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </CardContent>
                    </Card>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Filters Modal */}
        <Modal
          visible={showFilters}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilters(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-96">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-800">Filters</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Pollution Type Filter */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Pollution Type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-2">
                      {["all", "industrial", "plastic", "sewage", "chemical", "trash", "oil", "algae"].map((type) => (
                        <TouchableOpacity
                          key={type}
                          className={`px-3 py-2 rounded-full border ${filterType === type
                              ? "bg-waterbase-500 border-waterbase-500"
                              : "bg-white border-gray-300"
                            }`}
                          onPress={() => setFilterType(type)}
                        >
                          <Text className={`text-xs ${filterType === type ? "text-white" : "text-gray-700"
                            }`}>
                            {type === "all" ? "All Types" : type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Status Filter */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Status</Text>
                  <View className="flex-row space-x-2">
                    {["all", "verified", "pending", "declined"].map((status) => (
                      <TouchableOpacity
                        key={status}
                        className={`flex-1 px-3 py-2 rounded-lg border ${filterStatus === status
                            ? "bg-waterbase-500 border-waterbase-500"
                            : "bg-white border-gray-300"
                          }`}
                        onPress={() => setFilterStatus(status)}
                      >
                        <Text className={`text-center text-xs ${filterStatus === status ? "text-white" : "text-gray-700"
                          }`}>
                          {status === "all" ? "All Status" : status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Clear Filters */}
                <Button
                  title="Clear All Filters"
                  onPress={() => {
                    setFilterType("all");
                    setFilterStatus("all");
                    setSearchQuery("");
                    setShowFilters(false);
                  }}
                  variant="outline"
                  className="mt-4"
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default MapViewScreen;
