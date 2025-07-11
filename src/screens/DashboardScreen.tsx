import React from "react";
import { ScrollView, View, Text } from "react-native";
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

const DashboardScreen = () => {
  const stats = [
    {
      title: "Total Reports",
      value: "1,234",
      change: "+12%",
      icon: "document-text",
      color: "#0ea5e9",
    },
    {
      title: "Verified Reports",
      value: "987",
      change: "80%",
      icon: "shield-checkmark",
      color: "#22c55e",
    },
    {
      title: "Active Users",
      value: "2,450",
      change: "+18%",
      icon: "people",
      color: "#0ea5e9",
    },
    {
      title: "Sites Cleaned",
      value: "156",
      change: "+7",
      icon: "location",
      color: "#22c55e",
    },
  ];

  const recentReports = [
    {
      location: "Pasig River, Metro Manila",
      type: "Industrial Waste",
      severity: "High",
      time: "2 hours ago",
      severityColor: "#f59e0b",
    },
    {
      location: "Manila Bay, Manila",
      type: "Chemical Pollution",
      severity: "Critical",
      time: "4 hours ago",
      severityColor: "#ef4444",
    },
    {
      location: "Marikina River, QC",
      type: "Plastic Pollution",
      severity: "Medium",
      time: "6 hours ago",
      severityColor: "#f97316",
    },
    {
      location: "Laguna Lake, Laguna",
      type: "Sewage Discharge",
      severity: "High",
      time: "8 hours ago",
      severityColor: "#f59e0b",
    },
  ];

  const cleanupProjects = [
    {
      project: "Manila Bay Restoration",
      organization: "Manila Bay Coalition",
      progress: 75,
      status: "Active",
    },
    {
      project: "Pasig River Cleanup",
      organization: "MMDA",
      progress: 60,
      status: "Active",
    },
    {
      project: "Marikina Riverbank",
      organization: "Marikina LGU",
      progress: 90,
      status: "Completing",
    },
    {
      project: "Laguna Lake Phase 2",
      organization: "LLDA",
      progress: 30,
      status: "Starting",
    },
  ];

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
              {stats.map((stat, index) => (
                <View key={index} className="w-1/2 px-2 mb-4">
                  <Card className="border-waterbase-200">
                    <CardContent className="p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-medium text-gray-600">
                          {stat.title}
                        </Text>
                        <Ionicons
                          name={stat.icon}
                          size={16}
                          color={stat.color}
                        />
                      </View>
                      <Text className="text-xl font-bold text-waterbase-950 mb-1">
                        {stat.value}
                      </Text>
                      <Text className="text-xs text-waterbase-600">
                        <Text className="text-enviro-600">{stat.change}</Text>{" "}
                        from last month
                      </Text>
                    </CardContent>
                  </Card>
                </View>
              ))}
            </View>
          </View>

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
                {recentReports.map((report, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between p-3 bg-waterbase-50 rounded-lg"
                  >
                    <View className="flex-1">
                      <Text className="font-medium text-sm text-waterbase-950 mb-1">
                        {report.location}
                      </Text>
                      <Text className="text-xs text-waterbase-600">
                        {report.type}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View
                        className="px-2 py-1 rounded-full mb-1"
                        style={{ backgroundColor: report.severityColor + "20" }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: report.severityColor }}
                        >
                          {report.severity}
                        </Text>
                      </View>
                      <Text className="text-xs text-waterbase-600">
                        {report.time}
                      </Text>
                    </View>
                  </View>
                ))}
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
                <View className="h-32 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-lg items-center justify-center">
                  <Ionicons name="bar-chart" size={32} color="#0ea5e9" />
                  <Text className="text-waterbase-600 mt-2 text-sm">
                    Chart visualization coming soon
                  </Text>
                </View>
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
                <View className="h-32 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-lg items-center justify-center">
                  <Ionicons name="trending-up" size={32} color="#22c55e" />
                  <Text className="text-waterbase-600 mt-2 text-sm">
                    Trend analysis coming soon
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>

          <View className="mb-6">
            <Text className="text-waterbase-600 text-sm text-center">
              Dashboard features are coming soon. This will include real-time
              analytics, detailed reporting, data visualization, and
              administrative tools.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
