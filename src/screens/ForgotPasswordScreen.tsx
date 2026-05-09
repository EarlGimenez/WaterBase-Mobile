import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Navigation from "../components/Navigation";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { API_ENDPOINTS, apiRequest } from "../config/api";

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-waterbase-50">
      <Navigation title="Reset Password" showBackButton={true} />
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-8">
          <Card className="border-waterbase-200 shadow-lg">
            <CardHeader className="items-center">
              <CardTitle className="text-2xl text-waterbase-950 text-center">Reset Password</CardTitle>
              <CardDescription className="text-waterbase-600 text-center">
                Enter your registered email and we will send a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="space-y-4">
                {message ? (
                  <View className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <Text className="text-green-700 text-sm">{message}</Text>
                  </View>
                ) : null}
                {error ? (
                  <View className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <Text className="text-red-700 text-sm">{error}</Text>
                  </View>
                ) : null}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
                  <View className="relative">
                    <View className="absolute left-3 top-3 z-10">
                      <Ionicons name="mail" size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                      placeholder="maria@example.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-10 py-3 text-gray-900 bg-white"
                    />
                  </View>
                </View>
                <Button
                  title={isLoading ? "Sending..." : "Send Reset Link"}
                  onPress={handleSubmit}
                  size="lg"
                  disabled={isLoading}
                  icon={<Ionicons name="mail" size={20} color="white" />}
                  className="w-full mt-4"
                />
                <TouchableOpacity onPress={() => navigation.navigate("Login" as never)} className="items-center mt-2">
                  <Text className="text-waterbase-600 text-sm">Back to sign in</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
