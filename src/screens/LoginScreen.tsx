import React, { useEffect, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
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

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessRibbon, setShowSuccessRibbon] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "waterbase",
    path: "auth/google",
  });
  const [googleRequest, googleResponse, promptGoogleAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ["openid", "profile", "email"],
    },
    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    }
  );

  useEffect(() => {
    if (googleResponse?.type !== "success") {
      return;
    }

    const idToken = googleResponse.params.id_token;
    if (!idToken) {
      setError("Google sign-in did not return an identity token.");
      return;
    }

    handleGoogleToken(idToken);
  }, [googleResponse]);

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

      const data = await response.json();
      console.log("Login successful:", data);
      
      // Use AuthContext login method with real backend data
      await login(data.access_token, data.user);

      // Show success ribbon
      setSuccessMessage("Login successful! Welcome back.");
      setShowSuccessRibbon(true);
      // Auto navigate after 1.5 seconds
      setTimeout(() => {
        setShowSuccessRibbon(false);
        navigation.navigate("Dashboard" as never);
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          setError("Cannot connect to server. Please check if the Laravel backend is running and accessible from your mobile device.");
        } else if (error.message.toLowerCase().includes('approval') || error.message.toLowerCase().includes('review')) {
          setError(error.message);
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

  const handleGoogleToken = async (idToken: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest(API_ENDPOINTS.GOOGLE_MOBILE, {
        method: "POST",
        body: JSON.stringify({ id_token: idToken }),
      });
      const data = await response.json();
      await login(data.access_token, data.user);

      if (data.user?.profile_completed === false) {
        navigation.navigate("CompleteProfile" as never);
        return;
      }

      navigation.navigate("Dashboard" as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleClientId) {
      setError("Google sign-in is not configured for this app.");
      return;
    }

    await promptGoogleAsync();
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Sign In" showBackButton={true} />

      {/* Success Ribbon */}
      {showSuccessRibbon && (
        <View className="bg-green-500 px-4 py-3">
          <Text className="text-white text-center">{successMessage}</Text>
        </View>
      )}

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
                Sign in to your WaterbasePH account to continue monitoring and reporting water pollution
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
                <View className="flex-row items-center justify-between mt-4 mb-2">
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
                  <TouchableOpacity disabled={isLoading} onPress={() => navigation.navigate("ForgotPassword" as never)}>
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
                  className="w-full mt-4"
                />

                {/* Divider */}
                <View className="relative mt-6 mb-1">
                  <View className="absolute inset-0 flex items-center">
                    <View className="w-full border-t border-gray-300" />
                  </View>
                  <View className="relative flex justify-center">
                    <Text className="bg-white px-4 text-xs uppercase text-gray-500 text-center">
                      Or continue with
                    </Text>
                  </View>
                </View>

                {/* Social Login Button */}
                <View>
                  <TouchableOpacity
                    className="w-full border border-gray-300 rounded-lg p-3 flex-row items-center justify-center bg-white"
                    onPress={handleGoogleSignIn}
                    disabled={isLoading || !googleRequest}
                  >
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                    <Text className="ml-2 text-gray-700 font-medium">Google</Text>
                  </TouchableOpacity>
                  <Text className="text-gray-500 text-xs text-center mt-2">
                    Google sign-in creates volunteer accounts only. Organizations should sign up with email.
                  </Text>
                </View>

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
