import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";
import { API_ENDPOINTS, apiRequest } from "../config/api";

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    organization: "",
    areaOfResponsibility: "",
    role: "volunteer",
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    { value: "volunteer", label: "Volunteer" },
    { value: "ngo", label: "NGO Member" },
    { value: "lgu", label: "LGU Official" },
    { value: "researcher", label: "Researcher" },
  ];

  const shouldShowOrganizationFields = (role: string) => {
    return ['ngo', 'lgu', 'researcher'].includes(role);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions.");
      return;
    }

    // Additional validation for organization fields
    if (shouldShowOrganizationFields(formData.role) && !formData.organization) {
      setError("Organization name is required for this role.");
      return;
    }

    // Phone number validation
    if (!formData.phoneNumber) {
      setError("Phone number is required.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Prepare registration data for backend API
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword, // Laravel expects this field name
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        organization: shouldShowOrganizationFields(formData.role) ? formData.organization : null,
        areaOfResponsibility: shouldShowOrganizationFields(formData.role) ? formData.areaOfResponsibility : null,
      };

      console.log("Registration data:", registrationData);

      // Make actual API call to WaterBase backend using mobile-compatible URL
      const response = await apiRequest(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Backend validation errors:", errorData.errors);
        
        // Handle validation errors specifically
        if (errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
        }
        
        throw new Error(errorData.message || `Registration failed (${response.status})`);
      }

      const data = await response.json();
      console.log("Registration successful:", data);

      Alert.alert(
        "Registration Successful",
        "Your account has been created successfully! Please check your email for verification.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login" as never),
          },
        ]
      );
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          setError("Cannot connect to server. Please check if the Laravel backend is running and accessible from your mobile device.");
        } else {
          setError(error.message);
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Create Account" showBackButton={true} />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          <Card className="border-waterbase-200 shadow-lg">
            <CardHeader className="items-center">
              <LinearGradient
                colors={['#0ea5e9', '#22c55e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
              >
                <Ionicons name="person-add" size={32} color="white" />
              </LinearGradient>
              <CardTitle className="text-2xl text-center text-waterbase-950 mb-2">
                Join WaterBase
              </CardTitle>
              <Text className="text-center text-waterbase-600 px-4 leading-relaxed">
                Create your account to start reporting pollution, participate in cleanups, and help protect our water resources
              </Text>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              {/* Error Alert */}
              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-lg p-4 flex-row items-start mb-6">
                  <Ionicons name="alert-circle" size={20} color="#dc2626" />
                  <Text className="ml-3 text-red-700 text-sm flex-1">{error}</Text>
                </View>
              ) : null}

              {/* Personal Information */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-waterbase-950 mb-4">
                  Personal Information
                </Text>
                
                <View className="flex-row space-x-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">
                      First Name *
                    </Text>
                    <TextInput
                      value={formData.firstName}
                      onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                      placeholder="Enter first name"
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                      style={{ fontSize: 16, lineHeight: 20 }}
                    />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">
                      Last Name *
                    </Text>
                    <TextInput
                      value={formData.lastName}
                      onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                      placeholder="Enter last name"
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                      style={{ fontSize: 16, lineHeight: 20 }}
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-waterbase-700 mb-2">
                    Email Address *
                  </Text>
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                    style={{ fontSize: 16, lineHeight: 20 }}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-waterbase-700 mb-2">
                    Phone Number
                  </Text>
                  <TextInput
                    value={formData.phoneNumber}
                    onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    editable={!isLoading}
                    className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                    style={{ fontSize: 16, lineHeight: 20 }}
                  />
                </View>

                <View className="flex-row space-x-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">
                      Password *
                    </Text>
                    <TextInput
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      placeholder="Enter password"
                      secureTextEntry
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                      style={{ fontSize: 16, lineHeight: 20 }}
                    />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-waterbase-700 mb-2">
                      Confirm Password *
                    </Text>
                    <TextInput
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                      placeholder="Confirm password"
                      secureTextEntry
                      editable={!isLoading}
                      className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                      style={{ fontSize: 16, lineHeight: 20 }}
                    />
                  </View>
                </View>
              </View>

              {/* Role Selection */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-waterbase-950 mb-4">
                  Role Information
                </Text>
                
                <Text className="text-sm font-medium text-waterbase-700 mb-3">
                  I am registering as a: *
                </Text>
                
                <View className="space-y-2 mb-4">
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      onPress={() => setFormData({ ...formData, role: role.value })}
                      disabled={isLoading}
                      className={`border rounded-lg px-4 py-3 flex-row items-center ${
                        formData.role === role.value
                          ? 'border-waterbase-500 bg-waterbase-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <View className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        formData.role === role.value
                          ? 'border-waterbase-500 bg-waterbase-500'
                          : 'border-gray-300'
                      }`}>
                        {formData.role === role.value && (
                          <View className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />
                        )}
                      </View>
                      <Text className="text-waterbase-900 text-base">
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {shouldShowOrganizationFields(formData.role) && (
                  <>
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-waterbase-700 mb-2">
                        Organization/Agency *
                      </Text>
                      <TextInput
                        value={formData.organization}
                        onChangeText={(text) => setFormData({ ...formData, organization: text })}
                        placeholder="Enter organization name"
                        editable={!isLoading}
                        className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                        style={{ fontSize: 16, lineHeight: 20 }}
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-sm font-medium text-waterbase-700 mb-2">
                        Area of Responsibility
                      </Text>
                      <TextInput
                        value={formData.areaOfResponsibility}
                        onChangeText={(text) => setFormData({ ...formData, areaOfResponsibility: text })}
                        placeholder="Enter area of responsibility"
                        editable={!isLoading}
                        className="border border-gray-300 rounded-lg px-3 py-3 text-waterbase-900 bg-white"
                        style={{ fontSize: 16, lineHeight: 20 }}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Terms and Conditions */}
              <View className="mb-6">
                <TouchableOpacity
                  onPress={() => setFormData({ ...formData, agreeToTerms: !formData.agreeToTerms })}
                  disabled={isLoading}
                  className="flex-row items-start"
                >
                  <View className={`w-5 h-5 border-2 rounded mr-3 mt-0.5 ${
                    formData.agreeToTerms ? 'border-waterbase-500 bg-waterbase-500' : 'border-gray-300'
                  }`}>
                    {formData.agreeToTerms && (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    )}
                  </View>
                  <Text className="flex-1 text-sm text-waterbase-700 leading-relaxed">
                    I agree to the{" "}
                    <Text className="text-waterbase-600 underline">Terms of Service</Text>
                    {" "}and{" "}
                    <Text className="text-waterbase-600 underline">Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                className="w-full rounded-lg mb-4"
              >
                <LinearGradient
                  colors={['#0ea5e9', '#22c55e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 rounded-lg flex-row items-center justify-center"
                >
                  {isLoading && (
                    <View className="mr-2">
                      <Ionicons name="refresh" size={20} color="white" />
                    </View>
                  )}
                  <Text className="text-white font-semibold text-center text-base">
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row justify-center">
                <Text className="text-waterbase-600 text-sm">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate("Login" as never)}
                  disabled={isLoading}
                >
                  <Text className="text-waterbase-500 font-semibold text-sm underline">
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
