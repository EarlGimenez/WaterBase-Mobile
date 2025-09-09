import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Navigation from "../components/Navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";

const HowItWorksScreen = () => {
  const navigation = useNavigation();

  const steps = [
    {
      id: 1,
      icon: "camera",
      title: "Capture",
      description: "Take photos of pollution using your device's camera with automatic location detection",
      color: "from-waterbase-500 to-waterbase-600",
      iconColor: "#0ea5e9"
    },
    {
      id: 2,
      icon: "cloud-upload",
      title: "Submit",
      description: "Upload your report with description, pollution type, and severity assessment",
      color: "from-enviro-500 to-enviro-600",
      iconColor: "#059669"
    },
    {
      id: 3,
      icon: "shield-checkmark",
      title: "Verify & Map",
      description: "Report is reviewed by AI and experts, then added to the public pollution map",
      color: "from-waterbase-500 to-enviro-500",
      iconColor: "#0ea5e9"
    }
  ];

  const features = [
    {
      icon: "location",
      title: "GPS Integration",
      description: "Automatic location detection for precise pollution mapping"
    },
    {
      icon: "eye",
      title: "AI Verification",
      description: "Advanced AI analyzes photos to verify pollution type and severity"
    },
    {
      icon: "people",
      title: "Community Driven",
      description: "Join thousands of users protecting our water sources together"
    },
    {
      icon: "analytics",
      title: "Real-time Data",
      description: "Track pollution trends and cleanup progress in real-time"
    },
    {
      icon: "leaf",
      title: "Environmental Impact",
      description: "Your reports help authorities take action for cleaner water"
    },
    {
      icon: "notifications",
      title: "Instant Alerts",
      description: "Get notified about pollution incidents in your area"
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="How It Works" showBackButton={true} />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          {/* Header */}
          <Card className="border-waterbase-200 mb-6">
            <CardHeader>
              <View className="items-center mb-4">
                <View className="w-20 h-20 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-full items-center justify-center mb-4">
                  <Ionicons name="water" size={40} color="white" />
                </View>
                <CardTitle className="text-2xl text-waterbase-950 text-center">
                  Protect Our Waters
                </CardTitle>
                <Text className="text-waterbase-600 text-center text-base mt-2">
                  Learn how WaterBase helps you report pollution and protect water sources in your community
                </Text>
              </View>
            </CardHeader>
          </Card>

          {/* Main Steps */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-waterbase-950 mb-4 text-center">
              How It Works
            </Text>
            
            <View className="space-y-4">
              {steps.map((step, index) => (
                <Card key={step.id} className="border-waterbase-200">
                  <CardContent className="p-4">
                    <View className="flex-row items-center">
                      <View className="mr-4">
                        <LinearGradient
                          colors={["#0ea5e9", "#059669"]}
                          className="w-16 h-16 rounded-full items-center justify-center"
                        >
                          <Ionicons name={step.icon as any} size={28} color="white" />
                        </LinearGradient>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <View className="w-6 h-6 bg-waterbase-500 rounded-full items-center justify-center mr-3">
                            <Text className="text-white text-xs font-bold">{step.id}</Text>
                          </View>
                          <Text className="text-lg font-bold text-waterbase-950">
                            {step.title}
                          </Text>
                        </View>
                        <Text className="text-waterbase-600 text-sm leading-relaxed">
                          {step.description}
                        </Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </View>

          {/* Features Grid */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-waterbase-950 mb-4 text-center">
              Key Features
            </Text>
            
            <View className="flex-row flex-wrap -mx-2">
              {features.map((feature, index) => (
                <View key={index} className="w-1/2 px-2 mb-4">
                  <Card className="border-waterbase-200 h-32">
                    <CardContent className="p-3 items-center text-center h-full justify-center">
                      <View className="w-10 h-10 bg-waterbase-100 rounded-full items-center justify-center mb-2">
                        <Ionicons name={feature.icon as any} size={20} color="#0ea5e9" />
                      </View>
                      <Text className="text-sm font-bold text-waterbase-950 mb-1 text-center">
                        {feature.title}
                      </Text>
                      <Text className="text-xs text-waterbase-600 text-center leading-tight">
                        {feature.description}
                      </Text>
                    </CardContent>
                  </Card>
                </View>
              ))}
            </View>
          </View>

          {/* Benefits Section */}
          <Card className="border-waterbase-200 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-waterbase-950 text-center">
                Why Report Pollution?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text className="text-waterbase-600 text-sm flex-1">
                    Help authorities identify and respond to pollution incidents quickly
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text className="text-waterbase-600 text-sm flex-1">
                    Contribute to scientific research and environmental monitoring
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text className="text-waterbase-600 text-sm flex-1">
                    Protect public health by alerting communities to water contamination
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text className="text-waterbase-600 text-sm flex-1">
                    Create accountability for industries and organizations
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text className="text-waterbase-600 text-sm flex-1">
                    Build a comprehensive database for policy making and regulation
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Privacy & Safety */}
          <Card className="border-waterbase-200 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-waterbase-950 text-center">
                Privacy & Safety
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                <View className="flex-row items-start">
                  <Ionicons name="shield-checkmark" size={20} color="#0ea5e9" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text className="text-waterbase-600 text-sm flex-1">
                    Your personal information is protected and never shared without consent
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="shield-checkmark" size={20} color="#0ea5e9" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text className="text-waterbase-600 text-sm flex-1">
                    Reports can be submitted anonymously if desired
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="shield-checkmark" size={20} color="#0ea5e9" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text className="text-waterbase-600 text-sm flex-1">
                    Always prioritize your safety - report from a safe distance
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Ionicons name="shield-checkmark" size={20} color="#0ea5e9" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text className="text-waterbase-600 text-sm flex-1">
                    Data is encrypted and stored securely on our servers
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="border-waterbase-200 mb-6">
            <CardContent className="p-6 items-center">
              <Ionicons name="earth" size={48} color="#0ea5e9" />
              <Text className="text-lg font-bold text-waterbase-950 mt-4 mb-2 text-center">
                Ready to Make a Difference?
              </Text>
              <Text className="text-waterbase-600 text-center mb-4">
                Join our community of environmental guardians and help protect water sources for future generations.
              </Text>
              
              <TouchableOpacity
                className="bg-gradient-to-r from-waterbase-500 to-enviro-500 px-6 py-3 rounded-full flex-row items-center"
                onPress={() => navigation.navigate("ReportPollution" as never)}
              >
                <Ionicons name="camera" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-medium">Report Pollution Now</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>

          <View className="h-4" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HowItWorksScreen;
