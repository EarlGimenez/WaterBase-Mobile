import React, { useState } from "react";
import { ScrollView, View, Text, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS, apiRequest } from "../config/api";

const CompleteProfileScreen = () => {
  const navigation = useNavigation();
  const { token, login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phoneNumber) {
      setError("Please enter your phone number.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest(API_ENDPOINTS.COMPLETE_PROFILE, {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await response.json();

      if (token) {
        await login(token, { ...data.user, profile_completed: true });
      }

      navigation.navigate("Dashboard" as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-waterbase-50">
      <Navigation title="Complete Profile" showBackButton={false} />
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-8">
          <Card className="border-waterbase-200 shadow-lg">
            <CardHeader className="items-center">
              <CardTitle className="text-2xl text-waterbase-950 text-center">Complete Your Profile</CardTitle>
              <CardDescription className="text-waterbase-600 text-center">
                Add your phone number to finish setting up your WaterbasePH account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="space-y-4">
                {error ? (
                  <View className="bg-red-50 border border-red-200 rounded-lg p-4 flex-row items-start">
                    <Ionicons name="alert-circle" size={20} color="#dc2626" />
                    <Text className="ml-3 text-red-700 text-sm flex-1">{error}</Text>
                  </View>
                ) : null}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
                  <TextInput
                    placeholder="+63 912 345 6789"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white"
                  />
                </View>
                <Button
                  title={isLoading ? "Saving..." : "Continue"}
                  onPress={handleSubmit}
                  size="lg"
                  disabled={isLoading}
                  icon={<Ionicons name="checkmark-circle" size={20} color="white" />}
                  className="w-full mt-4"
                />
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompleteProfileScreen;
