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
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = () => {
    console.log("Login data:", formData);
    // Navigate to dashboard after login
    navigation.navigate("Dashboard");
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Login" showBackButton={true} />

      <ScrollView className="flex-1 px-4">
        <View className="py-8">
          <Card className="border-waterbase-200 shadow-lg">
            <CardHeader className="items-center">
              <View className="w-16 h-16 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-full items-center justify-center mb-4">
                <Ionicons name="log-in" size={32} color="white" />
              </View>
              <CardTitle className="text-2xl text-waterbase-950 text-center">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-waterbase-600 text-center">
                Sign in to your WaterBase account to continue monitoring and
                reporting water pollution
              </CardDescription>
            </CardHeader>

            <CardContent>
              <View className="space-y-4">
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
                      className="border border-gray-300 rounded-lg px-10 py-3 text-gray-900 bg-white"
                    />
                  </View>
                </View>

                {/* Remember Me and Forgot Password */}
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() =>
                      setFormData({
                        ...formData,
                        rememberMe: !formData.rememberMe,
                      })
                    }
                  >
                    <View
                      className={`w-5 h-5 border border-gray-300 rounded mr-2 items-center justify-center ${formData.rememberMe ? "bg-waterbase-500 border-waterbase-500" : "bg-white"}`}
                    >
                      {formData.rememberMe && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <Text className="text-sm text-gray-700">Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity>
                    <Text className="text-sm text-waterbase-600">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <Button
                  title="Sign In"
                  onPress={handleSubmit}
                  size="lg"
                  icon={<Ionicons name="log-in" size={20} color="white" />}
                  className="w-full mt-4"
                />

                {/* Divider */}
                <View className="relative my-6">
                  <View className="absolute inset-0 flex items-center">
                    <View className="w-full border-t border-gray-300" />
                  </View>
                  <View className="relative flex justify-center">
                    <Text className="bg-white px-2 text-xs uppercase text-gray-500">
                      Or continue with
                    </Text>
                  </View>
                </View>

                {/* Social Login Buttons */}
                <View className="flex-row space-x-3">
                  <TouchableOpacity className="flex-1 border border-gray-300 rounded-lg p-3 flex-row items-center justify-center bg-white">
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                    <Text className="ml-2 text-gray-700 font-medium">
                      Google
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-1 border border-gray-300 rounded-lg p-3 flex-row items-center justify-center bg-white">
                    <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                    <Text className="ml-2 text-gray-700 font-medium">
                      Facebook
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign Up Link */}
                <View className="mt-6">
                  <Text className="text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Text className="text-waterbase-600 font-medium">
                      Sign up
                    </Text>
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Demo Access */}
          <Card className="border-waterbase-200 mt-6">
            <CardContent className="p-4">
              <Text className="text-sm font-semibold text-waterbase-950 mb-3">
                Demo Access
              </Text>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Citizen:</Text>
                  <Text className="text-xs font-mono">
                    citizen@waterbase.ph
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">NGO:</Text>
                  <Text className="text-xs font-mono">ngo@waterbase.ph</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">LGU:</Text>
                  <Text className="text-xs font-mono">lgu@waterbase.ph</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Password:</Text>
                  <Text className="text-xs font-mono">waterbase2024</Text>
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
