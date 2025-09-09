import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";

const HomeScreen = () => {
  const navigation = useNavigation();

  const features = [
    {
      icon: "camera-outline",
      title: "Smart Reporting",
      description:
        "Capture geotagged photos of pollution with AI-powered verification for accurate reporting.",
      color: "#0ea5e9",
    },
    {
      icon: "location-outline",
      title: "Live Mapping",
      description:
        "Real-time visualization of pollution hotspots and cleanup progress across the Philippines.",
      color: "#22c55e",
    },
    {
      icon: "people-outline",
      title: "Community Driven",
      description:
        "Connect citizens, NGOs, and local government units for collaborative environmental action.",
      color: "#0ea5e9",
    },
    {
      icon: "bar-chart-outline",
      title: "Data Transparency",
      description:
        "Public dashboards showing environmental impact, cleanup statistics, and progress tracking.",
      color: "#22c55e",
    },
  ];

  const platformFeatures = [
    {
      icon: "phone-portrait-outline",
      title: "Mobile-First Design",
      description:
        "Optimized for smartphones with offline capabilities, enabling reports from remote areas.",
    },
    {
      icon: "shield-checkmark-outline",
      title: "AI-Powered Verification",
      description:
        "Advanced image detection ensures report accuracy and reduces false submissions.",
    },
    {
      icon: "flash-outline",
      title: "Real-Time Updates",
      description:
        "Instant notifications about cleanup progress, appeals, and community campaigns.",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50" edges={['top', 'left', 'right']}>
      <Navigation />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="px-4 py-8">
          <View className="items-center">
            <Text className="text-3xl font-bold text-waterbase-950 mb-4 text-center">
              Transforming Water{" "}
              <Text className="text-waterbase-500">Protection</Text>
              {"\n"}in the Philippines
            </Text>

            <Text className="text-lg text-waterbase-700 mb-6 text-center">
              WaterBase empowers communities to monitor and report water
              pollution through AI-powered verification.
            </Text>

            <View className="w-full">
              <TouchableOpacity 
                onPress={() => navigation.navigate("MapView")}
                className="w-full mb-3 bg-waterbase-500 rounded-lg p-4 flex-row items-center justify-center"
              >
                <Ionicons name="location" size={20} color="white" />
                <Text className="ml-2 text-white font-semibold text-lg">View Live Map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("ReportPollution")}
                className="w-full bg-transparent border border-waterbase-500 rounded-lg p-4 flex-row items-center justify-center"
              >
                <Ionicons name="camera" size={20} color="#0369a1" />
                <Text className="ml-2 text-waterbase-700 font-semibold text-lg">Report Pollution</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Key Features */}
        <View className="px-4 py-8">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-waterbase-950 mb-2 text-center">
              Empowering Environmental Action
            </Text>
            <Text className="text-waterbase-700 text-center">
              Our comprehensive platform brings together citizens, NGOs, and
              government agencies.
            </Text>
          </View>

          <View className="mt-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-waterbase-200 mb-4">
                <CardHeader className="p-4">
                  <View className="flex-row items-start">
                    <View className="w-12 h-12 bg-waterbase-100 rounded-lg items-center justify-center mr-3">
                      <Ionicons
                        name={feature.icon}
                        size={24}
                        color={feature.color}
                      />
                    </View>
                    <View className="flex-1">
                      <CardTitle className="text-waterbase-950 mb-1">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-waterbase-600">
                        {feature.description}
                      </CardDescription>
                    </View>
                  </View>
                </CardHeader>
              </Card>
            ))}
          </View>
        </View>

        {/* Platform Features */}
        <View className="bg-white px-4 py-8">
          <Text className="text-2xl font-bold text-waterbase-950 mb-6 text-center">
            Built for Every Stakeholder
          </Text>

          <View className="mt-4 mb-4">
            {platformFeatures.map((feature, index) => (
              <View key={index} className="flex-row items-start mb-4">
                <View className="w-10 h-10 bg-waterbase-100 rounded-lg items-center justify-center mr-3">
                  <Ionicons name={feature.icon} size={20} color="#0ea5e9" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-waterbase-950 mb-1">
                    {feature.title}
                  </Text>
                  <Text className="text-waterbase-600 text-sm">
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <LinearGradient
            colors={['#e0f2fe', '#dcfce7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-6 items-center"
          >
            <LinearGradient
              colors={['#0ea5e9', '#22c55e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-16 h-16 rounded-full items-center justify-center mb-3"
            >
              <Ionicons name="globe-outline" size={32} color="white" />
            </LinearGradient>
            <Text className="text-waterbase-700 font-medium text-center">
              Interactive Map Visualization
            </Text>
            <Text className="text-sm text-waterbase-600 mt-1 text-center">
              Real-time pollution monitoring across the Philippines
            </Text>
          </LinearGradient>
        </View>

        {/* Call to Action */}
        <LinearGradient
          colors={['#0284C5', '#10B77F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-8"
        >
          <View className="items-center">
            <Text className="text-2xl font-bold text-white mb-4 text-center">
              Join the Movement for Cleaner Waters
            </Text>
            <Text className="text-white mb-6 text-center opacity-90">
              Whether you're a concerned citizen, environmental organization, or
              government agency, WaterBase provides the tools you need.
            </Text>
            <View className="w-full px-4">
              <TouchableOpacity
                onPress={() => navigation.navigate("ReportPollution")}
                className="w-full mb-3 bg-white rounded-lg p-4 flex-row items-center justify-center"
              >
                <Ionicons name="camera" size={20} color="#0ea5e9" />
                <Text className="ml-2 text-waterbase-700 font-semibold text-lg flex-shrink">Start Reporting</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("Community")}
                className="w-full bg-transparent border border-white rounded-lg p-4 flex-row items-center justify-center"
              >
                <Ionicons name="people" size={20} color="white" />
                <Text className="ml-2 text-white font-semibold text-lg flex-shrink">Join Community</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Footer */}
        <View className="bg-waterbase-950 px-4" style={{ paddingTop: 32, paddingBottom: 52 }}>
          <View className="items-center mb-6">
            <View className="flex-row items-center justify-center mb-3">
              <LinearGradient
                colors={['#0284C5', '#10B77F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-8 h-8 rounded-lg items-center justify-center mr-2"
              >
                <Ionicons name="location" size={20} color="white" />
              </LinearGradient>
              <Text className="text-xl font-bold text-white flex-shrink" numberOfLines={1}>WaterBase</Text>
            </View>
            <Text className="text-waterbase-300 text-center text-sm">
              Transforming water protection through community engagement, AI
              verification, and transparent environmental monitoring.
            </Text>
          </View>

          <View className="border-t border-waterbase-800 pt-4">
            <Text className="text-waterbase-400 text-center text-sm">
              © 2024 WaterBase. Environmental protection through technology and
              community.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
