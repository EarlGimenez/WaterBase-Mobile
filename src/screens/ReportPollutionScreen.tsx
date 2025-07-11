import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";

const ReportPollutionScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    location: "",
    description: "",
    pollutionType: "",
    severity: "",
  });

  const pollutionTypes = [
    "Industrial Waste",
    "Chemical Pollution",
    "Plastic Pollution",
    "Sewage Discharge",
    "Oil Spill",
    "Other",
  ];
  const severityLevels = ["Low", "Medium", "High", "Critical"];

  const handleSubmit = () => {
    console.log("Report data:", formData);
    // Navigate back or show success message
    navigation.goBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Report Pollution" showBackButton={true} />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          <Card className="border-waterbase-200">
            <CardHeader>
              <View className="items-center mb-4">
                <View className="w-16 h-16 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-full items-center justify-center mb-3">
                  <Ionicons name="camera" size={32} color="white" />
                </View>
                <CardTitle className="text-xl text-waterbase-950 text-center">
                  Report Water Pollution
                </CardTitle>
                <Text className="text-waterbase-600 text-center text-sm">
                  Help protect our water sources by reporting pollution
                  incidents
                </Text>
              </View>
            </CardHeader>

            <CardContent>
              <View className="space-y-6">
                {/* Camera Section */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-3">
                    Photo Evidence
                  </Text>
                  <TouchableOpacity className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center bg-gray-50">
                    <Ionicons name="camera" size={32} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-2 text-center">
                      Tap to capture photo
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1 text-center">
                      Location will be automatically detected
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Location */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Location
                  </Text>
                  <View className="relative">
                    <View className="absolute left-3 top-3 z-10">
                      <Ionicons name="location" size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                      placeholder="Enter location or use GPS"
                      value={formData.location}
                      onChangeText={(text) =>
                        setFormData({ ...formData, location: text })
                      }
                      className="border border-gray-300 rounded-lg px-10 py-3 text-gray-900 bg-white"
                    />
                  </View>
                </View>

                {/* Pollution Type */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-3">
                    Pollution Type
                  </Text>
                  <View className="flex-row flex-wrap -mx-1">
                    {pollutionTypes.map((type, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() =>
                          setFormData({ ...formData, pollutionType: type })
                        }
                        className={`mx-1 mb-2 px-3 py-2 rounded-full border ${
                          formData.pollutionType === type
                            ? "bg-waterbase-500 border-waterbase-500"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            formData.pollutionType === type
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Severity */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-3">
                    Severity Level
                  </Text>
                  <View className="flex-row -mx-1">
                    {severityLevels.map((level, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() =>
                          setFormData({ ...formData, severity: level })
                        }
                        className={`flex-1 mx-1 px-3 py-3 rounded-lg border ${
                          formData.severity === level
                            ? "bg-waterbase-500 border-waterbase-500"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <Text
                          className={`text-center text-sm font-medium ${
                            formData.severity === level
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Description */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </Text>
                  <TextInput
                    placeholder="Describe what you observed..."
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData({ ...formData, description: text })
                    }
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="border border-gray-300 rounded-lg p-3 text-gray-900 bg-white"
                  />
                </View>

                {/* Submit Button */}
                <Button
                  title="Submit Report"
                  onPress={handleSubmit}
                  size="lg"
                  icon={<Ionicons name="send" size={20} color="white" />}
                  className="w-full mt-4"
                />

                {/* Info Section */}
                <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <View className="flex-row items-start">
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#3B82F6"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-medium text-blue-900 mb-1">
                        AI Verification
                      </Text>
                      <Text className="text-xs text-blue-700">
                        Your photo will be analyzed using AI to verify pollution
                        type and severity. This helps ensure report accuracy.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportPollutionScreen;
