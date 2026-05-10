import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View, Text, TouchableOpacity } from "react-native";
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

type DashboardStats = {
  totalReports?: number;
  reportsGrowth?: number;
  verifiedReports?: number;
  verificationRate?: number;
  activeUsers?: number;
  userGrowth?: number;
  totalEvents?: number;
  thisMonthEvents?: number;
};

type RecentReport = {
  id: number;
  title?: string;
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

type RegionPoint = {
  area_of_responsibility: string;
  count: number;
};

type ForecastMetric =
  | "report_volume"
  | "severity_mix"
  | "hotspot_recurrence"
  | "cleanup_completion_lead_time";

type ForecastPoint = {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
};

type ForecastResponse = {
  metric: ForecastMetric;
  region: string;
  horizon_days: number;
  evaluation: {
    best_model: string;
    models: Array<{ name: string; mae: number; rmse: number; directional_accuracy: number }>;
  };
  drift: {
    status: string;
    mean_shift: number;
    variance_shift: number;
  };
  forecast: ForecastPoint[];
  model: {
    version: string;
    rollback_version: string;
    retrain_schedule: string;
    generated_at: string;
  };
};

const metricLabels: Record<ForecastMetric, string> = {
  report_volume: "Report Volume",
  severity_mix: "Severity Mix",
  hotspot_recurrence: "Hotspot Recurrence",
  cleanup_completion_lead_time: "Cleanup Lead Time",
};

const DashboardScreen = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [reportsByRegion, setReportsByRegion] = useState<RegionPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastMetric, setForecastMetric] = useState<ForecastMetric>("report_volume");
  const [horizon, setHorizon] = useState<7 | 30 | 90>(30);
  const [cleanupIntensity, setCleanupIntensity] = useState(1);
  const [interventionDelayDays, setInterventionDelayDays] = useState(0);

  const statsCards = useMemo(() => [
    {
      title: "Total Reports",
      value: stats?.totalReports ?? 0,
      change: stats ? `+${stats.reportsGrowth ?? 0}% from last month` : "Loading",
      icon: "document-text",
      color: "#0ea5e9",
    },
    {
      title: "Verified Reports",
      value: stats?.verifiedReports ?? 0,
      change: stats ? `${stats.verificationRate ?? 0}% verification rate` : "Loading",
      icon: "shield-checkmark",
      color: "#22c55e",
    },
    {
      title: "Active Users",
      value: stats?.activeUsers ?? 0,
      change: stats ? `+${stats.userGrowth ?? 0}% from last month` : "Loading",
      icon: "people",
      color: "#0ea5e9",
    },
    {
      title: "Cleanup Events",
      value: stats?.totalEvents ?? 0,
      change: stats ? `+${stats.thisMonthEvents ?? 0} this month` : "Loading",
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
        const [statsResponse, recentReportsResponse, regionsResponse] = await Promise.all([
          apiRequest(`${API_ENDPOINTS.DASHBOARD}/stats`, { method: "GET" }),
          apiRequest(`${API_ENDPOINTS.DASHBOARD}/recent-reports`, { method: "GET" }),
          apiRequest(`${API_ENDPOINTS.DASHBOARD}/reports-by-region`, { method: "GET" }),
        ]);

        const statsPayload = await statsResponse.json();
        const recentReportsPayload = await recentReportsResponse.json();
        const regionsPayload = await regionsResponse.json();

        setStats(statsPayload);
        setRecentReports(Array.isArray(recentReportsPayload) ? recentReportsPayload : []);
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

  useEffect(() => {
    const fetchForecast = async () => {
      if (!token) {
        return;
      }

      setForecastLoading(true);
      try {
        const params = new URLSearchParams({
          metric: forecastMetric,
          horizon: String(horizon),
          cleanup_intensity: String(cleanupIntensity),
          intervention_delay_days: String(interventionDelayDays),
        });

        const response = await apiRequest(`${API_ENDPOINTS.FORECAST}?${params.toString()}`, {
          method: "GET",
        });
        const payload = await response.json();
        setForecast(payload);
      } catch (fetchError) {
        console.error("Failed to fetch forecast", fetchError);
        setForecast(null);
      } finally {
        setForecastLoading(false);
      }
    };

    fetchForecast();
  }, [token, forecastMetric, horizon, cleanupIntensity, interventionDelayDays]);

  const topRegions = useMemo(() => {
    const max = Math.max(1, ...reportsByRegion.map((region) => region.count || 0));
    return reportsByRegion.slice(0, 10).map((region) => ({
      ...region,
      percent: Math.round(((region.count || 0) / max) * 100),
    }));
  }, [reportsByRegion]);

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

  const formatNumber = (value: number | undefined, digits = 1) => {
    return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "0.0";
  };

  const adjustCleanupIntensity = (amount: number) => {
    setCleanupIntensity((current) => Math.min(2, Math.max(0.5, Number((current + amount).toFixed(1)))));
  };

  const adjustInterventionDelay = (amount: number) => {
    setInterventionDelayDays((current) => Math.min(30, Math.max(0, current + amount)));
  };

  const getForecastInterpretation = () => {
    if (!forecast || forecast.forecast.length === 0) {
      return "Forecast data will appear once the backend has enough report history.";
    }

    const first = forecast.forecast[0]?.predicted ?? 0;
    const midpoint = forecast.forecast[Math.floor(forecast.forecast.length / 2)]?.predicted ?? first;
    const trend = midpoint > first ? "increase" : "ease";

    switch (forecast.metric) {
      case "severity_mix":
        return `Severity patterns are expected to ${forecast.drift.status === "stable" ? "remain stable" : "shift"}. Monitor high-severity reports closely.`;
      case "hotspot_recurrence":
        return `Pollution hotspots are expected to ${trend === "increase" ? "recur more often" : "become less recurring"}. Prioritize preventative work at repeat locations.`;
      case "cleanup_completion_lead_time":
        return `Cleanup lead time is expected to ${trend === "increase" ? "increase" : "improve"}. Adjust event scheduling and volunteer coordination.`;
      case "report_volume":
      default:
        return `Reports are expected to ${trend} over the next ${forecast.horizon_days} days. Use this for cleanup resource planning.`;
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
              Monitor water pollution reports, track environmental data, and analyze trends across the Philippines.
            </Text>
          </View>

          {error ? (
            <View className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <Text className="text-sm text-red-700">{error}</Text>
            </View>
          ) : null}

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
                        <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                      </View>
                      <Text className="text-xl font-bold text-waterbase-950 mb-1">
                        {isLoading ? "--" : stat.value.toLocaleString()}
                      </Text>
                      <Text className="text-xs text-waterbase-600">
                        <Text className="text-enviro-600">{stat.change}</Text>
                      </Text>
                    </CardContent>
                  </Card>
                </View>
              ))}
            </View>
          </View>

          <Card className="border-waterbase-200 mb-6">
            <CardHeader>
              <CardTitle className="text-waterbase-950">Recent Reports</CardTitle>
              <CardDescription className="text-waterbase-600">
                Latest pollution reports submitted to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <View className="py-8 items-center justify-center">
                  <ActivityIndicator size="small" color="#0369a1" />
                </View>
              ) : recentReports.length === 0 ? (
                <Text className="text-waterbase-600">No recent reports found.</Text>
              ) : (
                recentReports.map((report, index) => {
                  const severity = formatReportSeverity(report.severityByUser || report.severity);

                  return (
                    <View key={report.id ?? index} className="p-3 bg-waterbase-50 rounded-lg mb-3">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 pr-2">
                          <Text className="font-medium text-sm text-waterbase-950">
                            {report.location || report.address || report.title || "Location not specified"}
                          </Text>
                          <Text className="text-xs text-waterbase-600 mt-1">
                            Type: {report.type || report.pollutionType || "Unknown"}
                          </Text>
                          {report.reporter ? (
                            <Text className="text-xs text-waterbase-500 mt-1">
                              Reported by: {report.reporter}
                            </Text>
                          ) : null}
                        </View>
                        <View className="px-2 py-1 rounded-full" style={{ backgroundColor: `${severity.color}20` }}>
                          <Text className="text-xs font-medium" style={{ color: severity.color }}>
                            {severity.label}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row justify-between items-center pt-2 border-t border-waterbase-200">
                        <Text className="text-xs text-waterbase-600">Status: {report.status || "Pending"}</Text>
                        <Text className="text-xs text-waterbase-600">
                          {report.time || (report.created_at ? new Date(report.created_at).toLocaleString() : "Recent")}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </CardContent>
          </Card>

          <View className="space-y-4 mb-6">
            <Card className="border-waterbase-200">
              <CardHeader>
                <CardTitle className="text-waterbase-950">Reports by Region</CardTitle>
                <CardDescription className="text-waterbase-600">
                  Geographic distribution of pollution reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topRegions.length === 0 ? (
                  <View className="h-32 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-lg items-center justify-center">
                    <Ionicons name="bar-chart" size={32} color="#0ea5e9" />
                    <Text className="text-waterbase-600 mt-2 text-sm">No regional report data yet</Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {topRegions.map((region) => (
                      <View key={region.area_of_responsibility || `region-${region.count}`}>
                        <View className="flex-row justify-between mb-1 gap-2">
                          <Text className="text-xs text-waterbase-800 flex-1" numberOfLines={1}>
                            {region.area_of_responsibility || "Unspecified area"}
                          </Text>
                          <Text className="text-xs text-waterbase-600">{region.count}</Text>
                        </View>
                        <View className="h-2 bg-waterbase-100 rounded-full">
                          <View className="h-2 bg-waterbase-500 rounded-full" style={{ width: `${Math.max(6, region.percent)}%` }} />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>

            <Card className="border-waterbase-200">
              <CardHeader>
                <CardTitle className="text-waterbase-950">Pollution Trends</CardTitle>
                <CardDescription className="text-waterbase-600">
                  Forecast with confidence bands and scenario controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-waterbase-700 mb-2">Metric</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(Object.keys(metricLabels) as ForecastMetric[]).map((metric) => (
                      <TouchableOpacity
                        key={metric}
                        onPress={() => setForecastMetric(metric)}
                        className={`px-3 py-2 rounded-full border ${forecastMetric === metric ? "bg-waterbase-500 border-waterbase-500" : "bg-white border-waterbase-200"}`}
                      >
                        <Text className={`text-xs ${forecastMetric === metric ? "text-white" : "text-waterbase-700"}`}>
                          {metricLabels[metric]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-xs font-semibold text-waterbase-700 mb-2">Horizon</Text>
                  <View className="flex-row gap-2">
                    {([7, 30, 90] as const).map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setHorizon(option)}
                        className={`flex-1 py-2 rounded-lg border ${horizon === option ? "bg-waterbase-500 border-waterbase-500" : "bg-white border-waterbase-200"}`}
                      >
                        <Text className={`text-center text-xs font-medium ${horizon === option ? "text-white" : "text-waterbase-700"}`}>
                          {option} days
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-4 space-y-3">
                  <View className="flex-row items-center justify-between p-3 rounded-lg bg-waterbase-50">
                    <Text className="text-xs text-waterbase-700">Cleanup intensity: {cleanupIntensity.toFixed(1)}x</Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => adjustCleanupIntensity(-0.1)}>
                        <Ionicons name="remove-circle" size={24} color="#0ea5e9" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => adjustCleanupIntensity(0.1)}>
                        <Ionicons name="add-circle" size={24} color="#0ea5e9" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between p-3 rounded-lg bg-waterbase-50">
                    <Text className="text-xs text-waterbase-700">Intervention delay: {interventionDelayDays}d</Text>
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => adjustInterventionDelay(-1)}>
                        <Ionicons name="remove-circle" size={24} color="#0ea5e9" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => adjustInterventionDelay(1)}>
                        <Ionicons name="add-circle" size={24} color="#0ea5e9" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {forecastLoading ? (
                  <View className="h-40 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-lg items-center justify-center">
                    <ActivityIndicator size="small" color="#0369a1" />
                    <Text className="text-waterbase-600 mt-2 text-sm">Generating forecast...</Text>
                  </View>
                ) : forecast && forecast.forecast.length > 0 ? (
                  <View className="space-y-3">
                    <View className="p-3 rounded-lg bg-waterbase-50 border border-waterbase-200">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 pr-2">
                          <Text className="font-semibold text-waterbase-950 text-sm">
                            {metricLabels[forecast.metric]} Forecast
                          </Text>
                          <Text className="text-xs text-waterbase-700 mt-1">
                            {forecast.horizon_days}-day outlook from today
                          </Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${forecast.drift.status === "stable" ? "bg-green-100" : "bg-orange-100"}`}>
                          <Text className={`text-xs font-semibold ${forecast.drift.status === "stable" ? "text-green-800" : "text-orange-800"}`}>
                            {forecast.drift.status === "stable" ? "Stable" : "Drift"}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-waterbase-600">
                        Model: {forecast.evaluation.best_model} | Confidence: {Math.round((forecast.forecast[0]?.confidence || 0) * 100)}%
                      </Text>
                    </View>

                    <View className="space-y-2">
                      {forecast.forecast.slice(0, 14).map((point) => {
                        const upper = Math.max(point.upper, 0.001);
                        const percent = Math.min(100, Math.round((point.predicted / upper) * 100));
                        const confidence = Math.round((point.confidence || 0) * 100);
                        const highConfidence = confidence >= 70;

                        return (
                          <View key={point.date}>
                            <View className="flex-row items-center justify-between mb-1">
                              <Text className="text-xs text-waterbase-700 flex-1">{point.date}</Text>
                              <Text className="text-xs font-mono text-waterbase-800 mr-2">
                                {formatNumber(point.predicted)}
                              </Text>
                              <View className={`px-1 rounded ${highConfidence ? "bg-green-100" : "bg-yellow-100"}`}>
                                <Text className={`text-[10px] ${highConfidence ? "text-green-700" : "text-yellow-700"}`}>
                                  {confidence}% conf
                                </Text>
                              </View>
                            </View>
                            <View className="h-2 bg-waterbase-100 rounded-full">
                              <View className="h-2 bg-enviro-500 rounded-full" style={{ width: `${percent}%` }} />
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    <View className="p-3 rounded-lg bg-enviro-50 border border-enviro-200">
                      <Text className="text-xs font-semibold text-enviro-800 mb-1">What this means:</Text>
                      <Text className="text-xs text-enviro-800">{getForecastInterpretation()}</Text>
                    </View>
                  </View>
                ) : (
                  <View className="h-40 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-lg items-center justify-center">
                    <Ionicons name="trending-up" size={32} color="#22c55e" />
                    <Text className="text-waterbase-600 mt-2 text-sm">No forecast data available yet</Text>
                  </View>
                )}
              </CardContent>
            </Card>
          </View>

          <View className="mb-6">
            <Text className="text-waterbase-600 text-sm text-center">
              Dashboard metrics and forecasts are pulled from the shared backend so mobile and web stay aligned.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
