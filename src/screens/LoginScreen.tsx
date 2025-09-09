import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
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
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS, apiRequest } from "../config/api";

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, setGuestMode } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Make actual API call to WaterBase backend using mobile-compatible URL
      console.log("Login data:", formData);
      
      const response = await apiRequest(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Login failed (${response.status})`);
      }

      const data = await response.json();
      console.log("Login successful:", data);
      
      // Use AuthContext login method with real backend data
      await login(data.access_token, data.user);
      
      // Navigate to dashboard after successful login
      navigation.navigate("Dashboard" as never);
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          setError("Cannot connect to server. Please check if the Laravel backend is running and accessible from your mobile device.");
        } else {
          setError("Login failed. Please check your credentials and try again.");
        }
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    Alert.alert(
      "Continue as Guest",
      "You'll have limited access to features. You can view reports and the map, but cannot access community features or submit reports.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue as Guest",
          onPress: async () => {
            await setGuestMode();
            navigation.navigate("Home" as never);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Sign In" showBackButton={true} />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-8">
          <Card className="border-waterbase-200 shadow-lg">
            <CardHeader className="items-center">
              <LinearGradient
                colors={['#0ea5e9', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
              >
                <Ionicons name="log-in" size={32} color="white" />
              </LinearGradient>
              <CardTitle className="text-2xl text-waterbase-950 text-center">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-waterbase-600 text-center">
                Sign in to your WaterBase account to continue monitoring and reporting water pollution
              </CardDescription>
            </CardHeader>

            <CardContent>
              <View className="space-y-4">
                {/* Error Alert */}
                {error ? (
                  <View className="bg-red-50 border border-red-200 rounded-lg p-4 flex-row items-start">
                    <Ionicons name="alert-circle" size={20} color="#dc2626" />
                    <Text className="ml-3 text-red-700 text-sm flex-1">{error}</Text>
                  </View>
                ) : null}

                {/* Email Input */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </Text>
                  <View className="relative">
                    <View className="absolute left-3 top-3 z-10">
                      <Ionicons name="mail" size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                      placeholder="maria@example.com"
                      value={formData.email}
                      onChangeText={(text) =>
                        setFormData({ ...formData, email: text })
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-10 py-3 text-gray-900 bg-white"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Password
                  </Text>
                  <View className="relative">
                    <View className="absolute left-3 top-3 z-10">
                      <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                    </View>
                    <TextInput
                      placeholder="••••••••"
                      value={formData.password}
                      onChangeText={(text) =>
                        setFormData({ ...formData, password: text })
                      }
                      secureTextEntry
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-10 py-3 text-gray-900 bg-white"
                    />
                  </View>
                </View>

                {/* Remember Me & Forgot Password */}
                <View className="flex-row items-center justify-between mt-4">
                  <TouchableOpacity
                    onPress={() =>
                      setFormData({ ...formData, rememberMe: !formData.rememberMe })
                    }
                    className="flex-row items-center"
                    disabled={isLoading}
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                        formData.rememberMe
                          ? "bg-waterbase-500 border-waterbase-500"
                          : "border-gray-300"
                      }`}
                    >
                      {formData.rememberMe && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                    <Text className="text-sm text-gray-700">Remember me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity disabled={isLoading}>
                    <Text className="text-sm text-waterbase-600">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <Button
                  title={isLoading ? "Signing In..." : "Sign In"}
                  onPress={handleSubmit}
                  size="lg"
                  disabled={isLoading}
                  icon={
                    isLoading ? (
                      <View className="w-5 h-5 mr-2">
                        <Ionicons name="refresh" size={20} color="white" />
                      </View>
                    ) : (
                      <Ionicons name="log-in" size={20} color="white" />
                    )
                  }
                  className="w-full mt-8"
                />

                {/* Divider */}
                <View className="relative my-6">
                  <View className="absolute inset-0 flex items-center">
                    <View className="w-full border-t border-gray-300" />
                  </View>
                  <View className="relative flex justify-center">
                    <Text className="bg-white px-4 text-xs uppercase text-gray-500 text-center">
                      Or continue with
                    </Text>
                  </View>
                </View>

                {/* Social Login Buttons */}
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="flex-1 border border-gray-300 rounded-lg p-3 flex-row items-center justify-center bg-white"
                    disabled
                  >
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                    <Text className="ml-2 text-gray-700 font-medium">Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 border border-gray-300 rounded-lg p-3 flex-row items-center justify-center bg-white"
                    disabled
                  >
                    <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                    <Text className="ml-2 text-gray-700 font-medium">Facebook</Text>
                  </TouchableOpacity>
                </View>

                {/* Continue as Guest Button */}
                <TouchableOpacity
                  onPress={handleGuestMode}
                  className="w-full border-2 border-dashed border-waterbase-300 rounded-lg p-4 items-center mt-4"
                  disabled={isLoading}
                >
                  <Ionicons name="eye" size={24} color="#0ea5e9" />
                  <Text className="text-waterbase-600 font-semibold mt-2">
                    Continue as Guest
                  </Text>
                  <Text className="text-waterbase-500 text-xs text-center mt-1">
                    Limited access to view reports and map
                  </Text>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View className="text-center mt-6">
                  <View className="flex-row justify-center items-center">
                    <Text className="text-sm text-gray-600">
                      Don't have an account?{" "}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate("Register" as never)}
                      disabled={isLoading}
                    >
                      <Text className="text-waterbase-600 font-medium text-sm underline">
                        Sign up
                      </Text>
                    </TouchableOpacity>
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

export default LoginScreen;
