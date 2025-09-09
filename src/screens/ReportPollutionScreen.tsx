import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Button } from "../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";
import ProtectedContent from "../components/ProtectedContent";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS, apiRequest } from "../config/api";

const ReportPollutionScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    address: "",
    latitude: "",
    longitude: "",
    pollutionType: "",
    severityByUser: "",
    image: null as string | null,
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // AI and verification state
  const [aiScanStatus, setAiScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [showLocationFields, setShowLocationFields] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);

  const pollutionTypes = [
    "Industrial Waste",
    "Chemical Pollution", 
    "Oil Spill",
    "Plastic Pollution",
    "Sewage Discharge",
    "Unnatural Color - AI",
    "Clean",
    "Other",
  ];
  const severityLevels = ["Low", "Medium", "High", "Critical"] as const;

  type SeverityLevel = typeof severityLevels[number];

  // Request permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Please grant camera and location permissions to continue.');
      return false;
    }
    return true;
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const address = await reverseGeocode(location.coords.latitude, location.coords.longitude);
      
      setFormData(prev => ({
        ...prev,
        latitude: location.coords.latitude.toString(),
        longitude: location.coords.longitude.toString(),
        address: address || `${location.coords.latitude}, ${location.coords.longitude}`
      }));
      
      setShowLocationFields(false);
      setVerificationStatus('success');
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Failed to get current location. Please enter manually.');
      setShowLocationFields(true);
      setVerificationStatus('failed');
    }
  };

  // Reverse geocoding
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const response = await fetch(url);
      const data = await response.json();
      return data.display_name || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
      exif: true,
    });

    if (!result.canceled && result.assets[0]) {
      const image = result.assets[0];
      setFormData(prev => ({ ...prev, image: image.uri }));
      
      // Try to get location from EXIF or current location
      if (image.exif && image.exif.GPS) {
        const lat = image.exif.GPS.Latitude;
        const lng = image.exif.GPS.Longitude;
        if (lat && lng) {
          const address = await reverseGeocode(lat, lng);
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
            address: address || `${lat}, ${lng}`
          }));
          setVerificationStatus('success');
        } else {
          await getCurrentLocation();
        }
      } else {
        await getCurrentLocation();
      }
      
      // Run AI analysis
      await runAIAnalysis(image.uri);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
      exif: true,
    });

    if (!result.canceled && result.assets[0]) {
      const image = result.assets[0];
      setFormData(prev => ({ ...prev, image: image.uri }));
      
      // For gallery images, always ask for manual location
      setShowLocationFields(true);
      setVerificationStatus('failed');
      setErrorMessage('Please enter location manually for gallery images.');
      
      // Run AI analysis
      await runAIAnalysis(image.uri);
    }
  };

  // AI Analysis
  const runAIAnalysis = async (imageUri: string) => {
    try {
      setAiScanStatus('scanning');
      
      // Create FormData for AI prediction
      const aiFormData = new FormData();
      aiFormData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'pollution_report.jpg',
      } as any);
      aiFormData.append('severityByUser', formData.severityByUser || 'medium');

      const response = await apiRequest(API_ENDPOINTS.PREDICT, {
        method: 'POST',
        body: aiFormData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const aiData = await response.json();
        console.log('AI Analysis:', aiData);
        
        const pred = aiData[0] || aiData;
        const waterPreds = Array.isArray(pred.water_predictions) ? pred.water_predictions : [];
        const trashPreds = Array.isArray(pred.trash_predictions) ? pred.trash_predictions : [];
        const pollutionPreds = Array.isArray(pred.pollution_predictions) ? pred.pollution_predictions : [];

        // Infer pollution type
        let inferredType = 'Clean';
        const hasWater = waterPreds.length > 0;
        const hasTrash = trashPreds.length > 0;
        const hasUnnatural = pollutionPreds.length > 0;

        if (hasWater && hasTrash && hasUnnatural) inferredType = 'Industrial Waste';
        else if (hasWater && hasTrash) inferredType = 'Plastic Pollution';
        else if (hasWater && hasUnnatural) inferredType = 'Unnatural Color - AI';
        else if (!hasWater && !hasTrash && !hasUnnatural) inferredType = 'Clean';

        // Auto-fill form with AI results
        const aiTitle = `AI-generated report: ${inferredType}`;
        const aiContent = [
          'This report was auto-filled by AI based on the uploaded image.',
          `Water predictions: ${waterPreds.length > 0 ? waterPreds.slice(0, 3).map((p: any) => `${p.class_name} (${Math.round(p.confidence * 100)}%)`).join(', ') : 'none'}`,
          `Trash predictions: ${trashPreds.length > 0 ? trashPreds.slice(0, 3).map((p: any) => `${p.class_name} (${Math.round(p.confidence * 100)}%)`).join(', ') : 'none'}`,
          `Pollution predictions: ${pollutionPreds.length > 0 ? pollutionPreds.slice(0, 3).map((p: any) => `${p.class_name} (${Math.round(p.confidence * 100)}%)`).join(', ') : 'none'}`,
          `Overall confidence: ${pred.overall_confidence}%`,
          `Estimated pollution percentage: ${pred.pollution_percentage}%`,
        ].join('\n\n');

        setFormData(prev => ({
          ...prev,
          title: aiTitle,
          content: aiContent,
          pollutionType: inferredType,
          severityByUser: pred.severity_level || 'medium'
        }));

        setAiResults(pred);
        setAiScanStatus('success');
        
        Alert.alert(
          'AI Analysis Complete',
          `Detected pollution type: ${inferredType}\nSeverity: ${pred.severity_level || 'medium'}\nConfidence: ${pred.overall_confidence}%`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('AI analysis failed');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiScanStatus('error');
      Alert.alert('AI Analysis Error', 'Failed to analyze image. You can still submit the report manually.');
    }
  };

  // Validation
  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.content.trim()) return 'Description is required';
    if (!formData.pollutionType) return 'Pollution type is required';
    if (!formData.severityByUser) return 'Severity level is required';
    if (!formData.latitude || !formData.longitude) return 'Location is required';
    if (!formData.image) return 'Image is required';
    return null;
  };

  // Submit report
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setShowSubmitModal(true);

    try {
      // Create form data for submission
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('content', formData.content);
      submitFormData.append('address', formData.address);
      submitFormData.append('latitude', formData.latitude);
      submitFormData.append('longitude', formData.longitude);
      submitFormData.append('pollution_type', formData.pollutionType);
      submitFormData.append('severity_by_user', formData.severityByUser);
      submitFormData.append('source', 'mobile');
      
      // Include AI results if available
      if (aiResults) {
        submitFormData.append('ai_results', JSON.stringify(aiResults));
        submitFormData.append('ai_confidence', aiResults.overall_confidence?.toString() || '0');
        submitFormData.append('pollution_percentage', aiResults.pollution_percentage?.toString() || '0');
      }

      // Add image
      if (formData.image) {
        submitFormData.append('image', {
          uri: formData.image,
          type: 'image/jpeg',
          name: 'pollution_report.jpg',
        } as any);
      }

      const response = await apiRequest(API_ENDPOINTS.REPORTS, {
        method: 'POST',
        body: submitFormData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          setShowSubmitModal(false);
          navigation.goBack();
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedContent>
      <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Report Pollution" showBackButton={true} />

      <ScrollView className="flex-1 px-4 py-2" showsVerticalScrollIndicator={false}>
        <View className="py-4">
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
                {/* Title Field */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Report Title
                  </Text>
                  <TextInput
                    placeholder="Enter a title for your report"
                    value={formData.title}
                    onChangeText={(text) =>
                      setFormData({ ...formData, title: text })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-3 text-gray-900 bg-white"
                  />
                </View>

                {/* Photo Capture */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Photo Evidence *
                  </Text>
                  
                  {formData.image ? (
                    <View className="relative">
                      <Image
                        source={{ uri: formData.image }}
                        style={{ width: '100%', height: 200, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                        onPress={() => setFormData(prev => ({ ...prev, image: null }))}
                      >
                        <Ionicons name="close" size={16} color="white" />
                      </TouchableOpacity>
                      
                      {/* AI Status Indicator */}
                      {aiScanStatus === 'scanning' && (
                        <View className="absolute inset-0 bg-black/50 rounded-lg justify-center items-center">
                          <ActivityIndicator size="large" color="#ffffff" />
                          <Text className="text-white mt-2">AI Analyzing...</Text>
                        </View>
                      )}
                      
                      {aiScanStatus === 'success' && (
                        <View className="absolute bottom-2 left-2 bg-green-500 rounded-full px-3 py-1">
                          <Text className="text-white text-xs">✓ AI Verified</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center bg-gray-50"
                      onPress={handleCameraCapture}
                    >
                      <Ionicons name="camera" size={32} color="#9CA3AF" />
                      <Text className="text-gray-500 mt-2 text-center">
                        Tap to capture photo
                      </Text>
                      <Text className="text-xs text-gray-400 mt-1 text-center">
                        Location will be automatically detected
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Location Status */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </Text>
                  
                  {verificationStatus === 'verifying' && (
                    <View className="flex-row items-center p-3 bg-blue-50 rounded-lg">
                      <ActivityIndicator size="small" color="#3B82F6" />
                      <Text className="ml-2 text-blue-700">Getting location...</Text>
                    </View>
                  )}
                  
                  {verificationStatus === 'success' && (
                    <View className="flex-row items-center p-3 bg-green-50 rounded-lg">
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text className="ml-2 text-green-700 flex-1">
                        {formData.address || `${formData.latitude}, ${formData.longitude}`}
                      </Text>
                    </View>
                  )}
                  
                  {(verificationStatus === 'failed' || showLocationFields) && (
                    <>
                      <View className="relative mb-3">
                        <View className="absolute left-3 top-3 z-10">
                          <Ionicons name="location" size={20} color="#9CA3AF" />
                        </View>
                        <TextInput
                          placeholder="Enter address"
                          value={formData.address}
                          onChangeText={(text) =>
                            setFormData({ ...formData, address: text })
                          }
                          className="border border-gray-300 rounded-lg px-10 py-3 text-gray-900 bg-white"
                        />
                      </View>
                      
                      <View className="flex-row space-x-2">
                        <TextInput
                          placeholder="Latitude"
                          value={formData.latitude}
                          onChangeText={(text) =>
                            setFormData({ ...formData, latitude: text })
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-3 text-gray-900 bg-white"
                          keyboardType="numeric"
                        />
                        <TextInput
                          placeholder="Longitude"
                          value={formData.longitude}
                          onChangeText={(text) =>
                            setFormData({ ...formData, longitude: text })
                          }
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-3 text-gray-900 bg-white"
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <TouchableOpacity
                        className="mt-2 bg-blue-500 rounded-lg py-2 px-4 self-start"
                        onPress={getCurrentLocation}
                      >
                        <Text className="text-white text-sm">Use Current Location</Text>
                      </TouchableOpacity>
                    </>
                  )}
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
                    {severityLevels.map((level, index) => {
                      const isSelected = formData.severityByUser === level;
                      const getSeverityColor = (lvl: string) => {
                        switch (lvl) {
                          case "Low": return "#22c55e";
                          case "Medium": return "#eab308";
                          case "High": return "#f97316";
                          case "Critical": return "#ef4444";
                          default: return "#6B7280";
                        }
                      };
                      
                      const color = getSeverityColor(level);
                      
                      return (
                        <TouchableOpacity
                          key={index}
                          onPress={() =>
                            setFormData({ ...formData, severityByUser: level })
                          }
                          className={`flex-1 mx-1 px-3 py-3 rounded-lg border-2 ${
                            isSelected
                              ? "border-2"
                              : "bg-white border-gray-300"
                          }`}
                          style={isSelected ? { 
                            backgroundColor: color,
                            borderColor: color
                          } : {}}
                        >
                          <Text
                            className={`text-center text-sm font-medium ${
                              isSelected
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {level}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Description */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </Text>
                  <TextInput
                    placeholder="Describe what you observed..."
                    value={formData.content}
                    onChangeText={(text) =>
                      setFormData({ ...formData, content: text })
                    }
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="border border-gray-300 rounded-lg p-3 text-gray-900 bg-white"
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  className={`w-full mt-6 mb-4 rounded-lg py-4 px-6 flex-row items-center justify-center ${
                    isSubmitting ? 'bg-gray-400' : 'bg-waterbase-500'
                  }`}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="white" />
                      <Text className="text-white font-medium ml-2">Submit Report</Text>
                    </>
                  )}
                </TouchableOpacity>

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

      {/* Submit Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            {submitStatus === 'idle' && (
              <>
                <ActivityIndicator size="large" color="#0369A1" />
                <Text className="text-center mt-4 text-gray-900 font-medium">
                  Submitting Report...
                </Text>
                <Text className="text-center mt-2 text-gray-600 text-sm">
                  Please wait while we process your report
                </Text>
              </>
            )}
            
            {submitStatus === 'success' && (
              <>
                <View className="items-center">
                  <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                  <Text className="text-center mt-4 text-gray-900 font-medium">
                    Report Submitted!
                  </Text>
                  <Text className="text-center mt-2 text-gray-600 text-sm">
                    Thank you for helping protect our water sources
                  </Text>
                </View>
              </>
            )}
            
            {submitStatus === 'error' && (
              <>
                <View className="items-center">
                  <Ionicons name="close-circle" size={48} color="#EF4444" />
                  <Text className="text-center mt-4 text-gray-900 font-medium">
                    Submission Failed
                  </Text>
                  <Text className="text-center mt-2 text-gray-600 text-sm">
                    {errorMessage}
                  </Text>
                  <TouchableOpacity
                    className="mt-4 bg-blue-500 rounded-lg py-2 px-4"
                    onPress={() => setShowSubmitModal(false)}
                  >
                    <Text className="text-white text-center">Try Again</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </ProtectedContent>
  );
};

export default ReportPollutionScreen;
