import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from '@react-navigation/native';

type DashboardStats = {
  totalReports?: number;
  verifiedReports?: number;
  activeUsers?: number;
  totalUsers?: number;
  activeEvents?: number;
  totalCleanups?: number;
  pendingValidation?: number;
  rejectedReports?: number;
};

type RecentReport = {
  id: number;
  title: string;
  address?: string;
  pollutionType?: string;
  severityByUser?: string;
  status?: string;
  created_at?: string;
  reporter?: string;
  location?: string;
  type?: string;
  severity?: string;
  time?: string;
};

type TrendPoint = {
  month: string;
  reports?: number;
  total_reports?: number;
  verified_reports?: number;
  pending_reports?: number;
};

type RegionPoint = {
  area_of_responsibility: string;
  count: number;
};

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<TrendPoint[]>([]);
  const [reportsByRegion, setReportsByRegion] = useState<RegionPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statsCards = useMemo(() => [
    {
      title: "Total Reports",
      value: stats?.totalReports ?? 0,
      change: stats ? `${stats.pendingValidation ?? 0} pending` : "Loading",
      icon: "document-text",
      color: "#0ea5e9",
    },
    {
      title: "Verified Reports",
      value: stats?.verifiedReports ?? 0,
      change: stats ? `${stats.rejectedReports ?? 0} declined` : "Loading",
      icon: "shield-checkmark",
      color: "#22c55e",
    },
    {
      title: "Active Users",
      value: stats?.activeUsers ?? stats?.totalUsers ?? 0,
      change: stats?.totalUsers ? `${stats.totalUsers} total` : "Loading",
      icon: "people",
      color: "#0ea5e9",
    },
    {
      title: "Active Events",
      value: stats?.activeEvents ?? 0,
      change: stats ? `${stats.totalCleanups ?? 0} cleanup drives` : "Loading",
      icon: "location",
      color: "#22c55e",
    },
  ], [stats]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [statsResponse, recentReportsResponse, trendsResponse] = await Promise.all([
          apiRequest(`${API_ENDPOINTS.DASHBOARD}/stats`, { method: "GET" }),
          apiRequest(`${API_ENDPOINTS.DASHBOARD}/recent-reports`, { method: "GET" }),
          apiRequest(`${API_ENDPOINTS.DASHBOARD}/monthly-trends`, { method: "GET" }),
        ]);

        const regionsResponse = await apiRequest(`${API_ENDPOINTS.DASHBOARD}/reports-by-region`, { method: "GET" });

        const statsPayload = await statsResponse.json();
        const recentReportsPayload = await recentReportsResponse.json();
        const trendsPayload = await trendsResponse.json();
        const regionsPayload = await regionsResponse.json();

        setStats(statsPayload);
        setRecentReports(Array.isArray(recentReportsPayload) ? recentReportsPayload : []);
        setMonthlyTrends(Array.isArray(trendsPayload) ? trendsPayload : []);
        setReportsByRegion(Array.isArray(regionsPayload) ? regionsPayload : []);
      } catch (fetchError) {
        console.error("Failed to fetch dashboard data", fetchError);
        setError("Live dashboard data is temporarily unavailable.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const cleanupProjects = useMemo(() => {
    if (monthlyTrends.length === 0) {
      return [
        {
          project: "Loading cleanup data",
          organization: "WaterBase",
          progress: 35,
          status: "Loading",
        },
      ];
    }

    return monthlyTrends.slice(-4).map((trend, index) => ({
      project: `${trend.month} cleanup snapshot`,
      organization: "Live backend trend",
      progress: Math.min(
        100,
        Math.round((((trend.verified_reports ?? trend.reports ?? 0) as number) / Math.max(1, trend.total_reports ?? trend.reports ?? 1)) * 100)
      ),
      status: index === monthlyTrends.length - 1 ? "Latest" : "Trend",
    }));
  }, [monthlyTrends]);

  const topRegions = useMemo(() => {
    const max = Math.max(1, ...reportsByRegion.map((region) => region.count || 0));
    return reportsByRegion.slice(0, 5).map((region) => ({
      ...region,
      percent: Math.round(((region.count || 0) / max) * 100),
    }));
  }, [reportsByRegion]);

  const trendBars = useMemo(() => {
    const normalized = monthlyTrends.slice(-6).map((trend) => ({
      month: trend.month,
      value: trend.total_reports ?? trend.reports ?? 0,
    }));
    const max = Math.max(1, ...normalized.map((item) => item.value));
    return normalized.map((item) => ({
      ...item,
      percent: Math.round((item.value / max) * 100),
    }));
  }, [monthlyTrends]);

  const formatReportSeverity = (severity?: string) => {
    switch ((severity || "").toLowerCase()) {
      case "critical":
        return { label: "Critical", color: "#ef4444" };
      case "high":
        return { label: "High", color: "#f59e0b" };
      case "medium":
        return { label: "Medium", color: "#f97316" };
      default:
        return { label: "Low", color: "#22c55e" };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Dashboard" showBackButton={true} />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-waterbase-950 mb-2">
              Environmental Dashboard
            </Text>
            <Text className="text-waterbase-700">
              Monitor water pollution reports, track cleanup progress, and
              analyze environmental data.
            </Text>
          </View>

          {/* Quick Stats */}
          <View className="mb-6">
            <View className="flex-row flex-wrap -mx-2">
              {statsCards.map((stat, index) => (
                <View key={index} className="w-1/2 px-2 mb-4">
                  <Card className="border-waterbase-200">
                    <CardContent className="p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-medium text-gray-600">
                          {stat.title}
                        </Text>
                        <Ionicons
                          name={stat.icon as any}
                          size={16}
                          color={stat.color}
                        />
                      </View>
                      <Text className="text-xl font-bold text-waterbase-950 mb-1">
                        {isLoading ? "--" : stat.value}
                      </Text>
                      <Text className="text-xs text-waterbase-600">
                        <Text className="text-enviro-600">{stat.change}</Text>{" "}
                        from web dashboard
                      </Text>
                    </CardContent>
                  </Card>
                </View>
              ))}
            </View>
          </View>

          <Card className="border-waterbase-200 mb-6">
            <CardHeader>
              <CardTitle className="text-waterbase-950">Device Pairing</CardTitle>
              <CardDescription className="text-waterbase-600">
                Discover unpaired ESP32-S3 nodes and assign station IDs from the phone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TouchableOpacity
                className="flex-row items-center justify-between rounded-2xl bg-waterbase-600 px-4 py-4"
                onPress={() => navigation.navigate('DevicePairing')}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-white font-semibold text-base">Open pairing console</Text>
                  <Text className="text-waterbase-100 text-xs mt-1">
                    HTTP-first device discovery and pairing over Laravel.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card className="border-waterbase-200 mb-6">
            <CardHeader>
              <CardTitle className="text-waterbase-950">
                Recent Reports
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Latest pollution reports submitted to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                {isLoading ? (
                  <View className="py-8 items-center justify-center">
                    <ActivityIndicator size="small" color="#0369a1" />
                  </View>
                ) : recentReports.length === 0 ? (
                  <Text className="text-waterbase-600">
                    No recent reports returned by the backend.
                  </Text>
                ) : (
                  recentReports.map((report, index) => {
                    const severity = formatReportSeverity(report.severityByUser || report.severity);

                    return (
                      <View key={report.id ?? index} className="p-3 bg-waterbase-50 rounded-lg mb-3">
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1 pr-2">
                            <Text className="font-medium text-sm text-waterbase-950">
                              {report.location || report.address || report.title}
                            </Text>
                            <Text className="text-xs text-waterbase-600 mt-1">
                              {report.type || report.pollutionType || "Report"}
                            </Text>
                            {report.reporter && (
                              <Text className="text-xs text-waterbase-500 mt-1">
                                Reporter: {report.reporter}
                              </Text>
                            )}
                          </View>
                          <View
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: severity.color + "20" }}
                          >
                            <Text
                              className="text-xs font-medium"
                              style={{ color: severity.color }}
                            >
                              {severity.label}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row justify-between items-center pt-2 border-t border-waterbase-200">
                          <Text className="text-xs text-waterbase-600">
                            Status: {report.status || "Pending"}
                          </Text>
                          <Text className="text-xs text-waterbase-600">
                            {report.time || (report.created_at ? new Date(report.created_at).toLocaleString() : "Recent")}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </CardContent>
          </Card>

          {/* Cleanup Progress */}
          <Card className="border-waterbase-200 mb-6">
            <CardHeader>
              <CardTitle className="text-waterbase-950">
                Cleanup Progress
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Active cleanup initiatives and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="space-y-4">
                {cleanupProjects.map((project, index) => (
                  <View key={index} className="p-3 bg-enviro-50 rounded-lg">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="font-medium text-sm text-waterbase-950 flex-1">
                        {project.project}
                      </Text>
                      <View className="px-2 py-1 bg-white rounded-full border border-gray-200">
                        <Text className="text-xs text-gray-600">
                          {project.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-waterbase-600 mb-2">
                      {project.organization}
                    </Text>
                    <View className="w-full bg-waterbase-200 rounded-full h-2 mb-1">
                      <View
                        className="bg-enviro-500 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </View>
                    <Text className="text-xs text-waterbase-600">
                      {project.progress}% complete
                    </Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Charts and Analytics */}
          <View className="space-y-4 mb-6">
            <Card className="border-waterbase-200">
              <CardHeader>
                <CardTitle className="text-waterbase-950">
                  Reports by Region
                </CardTitle>
                <CardDescription className="text-waterbase-600">
                  Geographic distribution of pollution reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topRegions.length === 0 ? (
                  <View className="h-32 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-lg items-center justify-center">
                    <Ionicons name="bar-chart" size={32} color="#0ea5e9" />
                    <Text className="text-waterbase-600 mt-2 text-sm">No regional data yet</Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {topRegions.map((region) => (
                      <View key={region.area_of_responsibility || `region-${region.count}`}>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-xs text-waterbase-800" numberOfLines={1}>{region.area_of_responsibility || "Unspecified"}</Text>
                          <Text className="text-xs text-waterbase-600">{region.count}</Text>
                        </View>
                        <View className="h-2 bg-waterbase-100 rounded-full">
                          <View className="h-2 bg-waterbase-500 rounded-full" style={{ width: `${region.percent}%` }} />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>

            <Card className="border-waterbase-200">
              <CardHeader>
                <CardTitle className="text-waterbase-950">
                  Pollution Trends
                </CardTitle>
                <CardDescription className="text-waterbase-600">
                  Monthly trends in pollution reporting and cleanup
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trendBars.length === 0 ? (
                  <View className="h-32 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-lg items-center justify-center">
                    <Ionicons name="trending-up" size={32} color="#22c55e" />
                    <Text className="text-waterbase-600 mt-2 text-sm">No monthly trends yet</Text>
                  </View>
                ) : (
                  <View className="flex-row items-end justify-between h-32 px-1">
                    {trendBars.map((bar) => (
                      <View key={bar.month} className="items-center flex-1 mx-1">
                        <View className="w-full bg-enviro-100 rounded-t" style={{ height: `${Math.max(10, bar.percent)}%` }} />
                        <Text className="text-[10px] text-waterbase-700 mt-1" numberOfLines={1}>{bar.month.split(" ")[0]}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>
          </View>

          <View className="mb-6">
            <Text className="text-waterbase-600 text-sm text-center">
              Dashboard metrics and trend snapshots are pulled from the shared backend so mobile and web stay aligned.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
