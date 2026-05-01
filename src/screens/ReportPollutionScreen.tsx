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
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Button } from "../components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import { OpenStreetMapSearchableSelect } from "../components/ui/OpenStreetMapSearchableSelect";
import Navigation from "../components/Navigation";
import ProtectedContent from "../components/ProtectedContent";
import { useAuth } from "../contexts/AuthContext";
import { useFeedback } from "../contexts/FeedbackContext";
import { API_ENDPOINTS, apiRequest } from "../config/api";
import { 
  getCurrentLocation, 
  fetchAddressFromCoordinates, 
  validateCoordinates, 
  formatCoordinates 
} from "../utils/location";

const ReportPollutionScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showLoading, showProcessing, showSuccess, showError, hideFeedback } = useFeedback();
  
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
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success'>('idle');
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  
  // AI and verification state
  const [aiScanStatus, setAiScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [showLocationFields, setShowLocationFields] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [reportMode, setReportMode] = useState<'ai' | 'manual'>('ai');
  const [csvFile, setCsvFile] = useState<any>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    imported: number;
    errors: Array<{ row: number; field: string; message: string }>;
    total_rows: number;
    auto_approved: boolean;
  } | null>(null);

  const showManualOption = ['ngo', 'lgu', 'admin'].includes(user?.role || '');

  const extractErrorMessage = (raw: string) => {
    try {
      // Handle "HTTP XXX: {...}" format from apiRequest errors
      const httpMatch = raw.match(/^HTTP \d+: (.+)$/);
      const jsonString = httpMatch ? httpMatch[1] : raw;

      const parsed = JSON.parse(jsonString);

      // Check for user-friendly message first
      if (typeof parsed?.message === 'string' && parsed.message.trim()) {
        const message = parsed.message.toLowerCase();

        // Filter out technical/database errors and provide user-friendly alternatives
        if (message.includes('column not found') || message.includes('unknown column') ||
            message.includes('sqlstate') || message.includes('syntax error') ||
            message.includes('constraint violation') || message.includes('foreign key')) {
          return 'A system error occurred while processing your report. Please try again later or contact support.';
        }

        if (message.includes('validation failed') || message.includes('required')) {
          return 'Please fill in all required fields before submitting.';
        }

        if (message.includes('unauthorized') || message.includes('authentication')) {
          return 'Your session has expired. Please log in again.';
        }

        if (message.includes('network') || message.includes('connection')) {
          return 'Network connection error. Please check your internet connection and try again.';
        }

        // Return the parsed message if it's user-friendly
        return parsed.message;
      }

      // Handle validation errors
      if (parsed?.errors && typeof parsed.errors === 'object') {
        const firstField = Object.values(parsed.errors)[0] as unknown;
        if (Array.isArray(firstField) && firstField[0]) {
          return String(firstField[0]);
        }
      }
    } catch (_err) {
      // Ignore JSON parse errors and fall back to generic message
    }

    // Fallback for any unhandled errors
    return 'An unexpected error occurred while submitting your report. Please try again or contact support if the problem persists.';
  };

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
  const severityLevels = ["low", "medium", "high", "critical"] as const;

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

  // Get current location using mobile location utilities
  const handleGetCurrentLocation = async () => {
    try {
      setVerificationStatus('verifying');
      const location = await getCurrentLocation();
      const address = await fetchAddressFromCoordinates(location.latitude, location.longitude);
      
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        address: address || formatCoordinates(location.latitude, location.longitude)
      }));
      
      setShowLocationFields(false);
      setVerificationStatus('success');
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', error instanceof Error ? error.message : 'Failed to get current location. Please enter manually.');
      setShowLocationFields(true);
      setVerificationStatus('failed');
    }
  };

  // Handle location selection from OpenStreetMap search
  const handleLocationSelect = (address: string) => {
    setFormData(prev => ({ ...prev, address }));
    setVerificationStatus('success');
    setShowLocationFields(false);
  };

  // Handle coordinates change from OpenStreetMap search
  const handleCoordinatesChange = (coordinates: { latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      latitude: coordinates.latitude.toString(),
      longitude: coordinates.longitude.toString()
    }));
  };

  // Get current location
  const getCurrentLocationOld = async () => {
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

      // Reset AI state for new image
      setAiScanStatus('idle');
      setAiResults(null);

      // Run AI analysis immediately
      await runAIAnalysis(image.uri);

      // Try to get location from EXIF or current location (after AI analysis)
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
          await handleGetCurrentLocation();
        }
      } else {
        await handleGetCurrentLocation();
      }
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

      // Reset AI state for new image
      setAiScanStatus('idle');
      setAiResults(null);

      // Run AI analysis immediately
      await runAIAnalysis(image.uri);

      // For gallery images, always ask for manual location
      setShowLocationFields(true);
      setVerificationStatus('failed');
    }
  };

  // AI Analysis
  const runAIAnalysis = async (imageUri: string) => {
    try {
      console.log('🚀 Starting AI analysis for image:', imageUri);
      setAiScanStatus('scanning'); // Show loading immediately

      // Create FormData for AI prediction
      const aiFormData = new FormData();
      aiFormData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'pollution_report.jpg',
      } as any);
      aiFormData.append('severityByUser', formData.severityByUser || 'medium');

      console.log('📤 Sending AI analysis request with severityByUser:', formData.severityByUser || 'medium');

      const response = await apiRequest(API_ENDPOINTS.PREDICT, {
        method: 'POST',
        body: aiFormData,
        // Don't set Content-Type header for FormData - let the browser set it with boundary
      });

      console.log('📥 AI analysis response status:', response.status);

      if (response.ok) {
        const aiData = await response.json();
        console.log('AI Analysis Response:', aiData);

        // Handle the response format: { predictions: {...}, ai_verified: boolean }
        const pred = aiData.predictions;
        const aiVerified = aiData.ai_verified;

        console.log('Parsed predictions:', pred);
        console.log('AI verified:', aiVerified);

        const waterPreds = Array.isArray(pred?.water_predictions) ? pred.water_predictions : [];
        const trashPreds = Array.isArray(pred?.trash_predictions) ? pred.trash_predictions : [];
        const pollutionPreds = Array.isArray(pred?.pollution_predictions) ? pred.pollution_predictions : [];

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
          `Overall confidence: ${pred?.overall_confidence ? Math.round(pred.overall_confidence) : 'N/A'}%`,
          `Estimated pollution percentage: ${pred?.pollution_percentage ? Math.round(pred.pollution_percentage) : 'N/A'}%`,
          `AI verification: ${aiVerified ? 'Verified' : 'Not verified'}`,
        ].join('\n\n');

        setFormData(prev => ({
          ...prev,
          title: aiTitle,
          content: aiContent,
          pollutionType: inferredType,
          severityByUser: pred?.severity_level || 'medium'
        }));

        setAiResults(pred);
        setAiScanStatus('success');
        
        // Check if water was detected and show appropriate alert
        if (!hasWater) {
          Alert.alert(
            '⚠️ No Water Bodies Detected',
            `AI analysis completed but no water was found in this image.\n\nDetected: ${inferredType}\nConfidence: ${pred.overall_confidence}%\n\n⚠️ Warning: Reports without water bodies may be rejected during submission.`,
            [
              { 
                text: 'Retake Photo', 
                onPress: () => {
                  setFormData(prev => ({ ...prev, image: '' }));
                  setAiResults(null);
                  setAiScanStatus('idle');
                  handleCameraCapture();
                }
              },
              { text: 'Continue Anyway', style: 'destructive' }
            ]
          );
        } else {
          Alert.alert(
            '✅ AI Analysis Complete',
            `Detected pollution type: ${inferredType}\nSeverity: ${pred.severity_level || 'medium'}\nConfidence: ${pred.overall_confidence}%\n\nWater detected: ${waterPreds.length} area(s)`,
            [{ text: 'OK' }]
          );
        }
      } else {
        const errorText = await response.text();
        console.error('❌ AI analysis failed with status:', response.status, 'Response:', errorText);
        throw new Error(`AI analysis failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      setAiScanStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('AI Analysis Error', `Failed to analyze image: ${errorMessage}. You can still submit the report manually.`);
    }
  };

  // Water body validation
  const validateWaterPresence = (): { hasWater: boolean; message: string } => {
    if (!aiResults) {
      return {
        hasWater: false,
        message: 'AI analysis is required to verify water presence. Please wait for analysis to complete or retake the photo.'
      };
    }

    const waterPreds = Array.isArray(aiResults.water_predictions) ? aiResults.water_predictions : [];
    const hasWater = waterPreds.length > 0;

    if (!hasWater) {
      return {
        hasWater: false,
        message: 'No water bodies detected in this image. Water pollution reports must contain visible water sources. Please take a photo that clearly shows a water body (river, lake, ocean, etc.).'
      };
    }

    return { hasWater: true, message: '' };
  };

  // Submit report
  const handleSubmit = async () => {
    // Basic validation first
    const basicValidation = validateBasicForm();
    if (basicValidation) {
      showError('Validation Error', basicValidation);
      return;
    }

    if (!user?.id) {
      showError('Authentication Error', 'Please log in to submit a report');
      return;
    }

    // Check for water presence with detailed warning
    const waterValidation = validateWaterPresence();
    if (!waterValidation.hasWater) {
      Alert.alert(
        'No Water Bodies Detected',
        waterValidation.message + '\n\nWould you like to:',
        [
          {
            text: 'Retake Photo',
            style: 'default',
            onPress: () => {
              // Clear current image and AI results
              setFormData(prev => ({ ...prev, image: '' }));
              setAiResults(null);
              setAiScanStatus('idle');
              // Trigger camera/gallery selection
              handleCameraCapture();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Submit Anyway',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Warning: Invalid Report',
                'Submitting a report without water bodies may result in report rejection and could affect your account standing. Are you sure you want to proceed?',
                [
                  { text: 'No, Go Back', style: 'cancel' },
                  { 
                    text: 'Yes, Submit', 
                    style: 'destructive',
                    onPress: () => proceedWithSubmission()
                  }
                ]
              );
            }
          }
        ],
        { cancelable: false }
      );
      return;
    }

    // If water is detected, proceed normally
    showLoading('Submitting Report', 'Please wait while we process and verify your report...');
    await proceedWithSubmission();
  };

  // Separate basic validation (excluding water validation)
  const validateBasicForm = (): string | null => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.content.trim()) return 'Description is required';
    if (!formData.pollutionType) return 'Pollution type is required';
    if (!formData.severityByUser) return 'Severity level is required';
    if (!formData.latitude || !formData.longitude) return 'Location is required';
    if (!formData.image) return 'Image is required';
    
    // Validate coordinates using utility function
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng) || !validateCoordinates(lat, lng)) {
      return 'Please provide valid coordinates';
    }
    
    return null;
  };

  // Actual submission logic
  const proceedWithSubmission = async () => {

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setShowSubmitModal(true);
    showProcessing('Submitting Report', 'Please wait while we process and verify your report...');

    try {
      // Create form data for submission according to backend schema
      const submitFormData = new FormData();

      // Required fields according to ReportController validation
      submitFormData.append('title', formData.title);
      submitFormData.append('content', formData.content);
      submitFormData.append('address', formData.address);
      submitFormData.append('latitude', formData.latitude);
      submitFormData.append('longitude', formData.longitude);
      submitFormData.append('pollutionType', formData.pollutionType); // Note: backend expects 'pollutionType', not 'pollution_type'
      submitFormData.append('severityByUser', formData.severityByUser); // Note: backend expects 'severityByUser', not 'severity_by_user'
      submitFormData.append('user_id', user!.id.toString());
      submitFormData.append('status', 'pending'); // Default status

      // AI Analysis fields - map from AI results or use defaults
      if (aiResults) {
        // Map AI analysis to backend expected format
        const severityByAI = aiResults.severity_level || 'low';
        const aiConfidence = aiResults.overall_confidence || 0;
        const pollutionPercentage = aiResults.pollution_percentage || 0;
        const hasValidPollution = (aiResults.trash_predictions && aiResults.trash_predictions.length > 0) ||
                                  (aiResults.pollution_predictions && aiResults.pollution_predictions.length > 0);

        submitFormData.append('severityByAI', severityByAI);
        submitFormData.append('ai_confidence', aiConfidence.toString());
        submitFormData.append('severityPercentage', pollutionPercentage.toString());
        submitFormData.append('ai_verified', hasValidPollution ? '1' : '0');
      } else {
        // Default AI values when no AI analysis is available
        submitFormData.append('severityByAI', formData.severityByUser || 'low');
        submitFormData.append('ai_confidence', '0');
        submitFormData.append('severityPercentage', '0');
        submitFormData.append('ai_verified', '0');
      }

      // Add image
      if (formData.image) {
        submitFormData.append('image', {
          uri: formData.image,
          type: 'image/jpeg',
          name: 'pollution_report.jpg',
        } as any);
      }

      console.log('🚀 Submitting report with data:', {
        title: formData.title,
        user_id: user!.id,
        pollutionType: formData.pollutionType,
        severityByUser: formData.severityByUser,
        hasAI: !!aiResults,
        aiResults: aiResults ? {
          severity_level: aiResults.severity_level,
          overall_confidence: aiResults.overall_confidence,
          pollution_percentage: aiResults.pollution_percentage
        } : null
      });

      const response = await apiRequest(API_ENDPOINTS.REPORTS, {
        method: 'POST',
        body: submitFormData,
        // Don't set Content-Type header for FormData - let the browser set it with boundary
      });

      const responseData = await response.json();
      console.log('✅ Report submitted successfully:', responseData);
      setSubmitStatus('success');
      showSuccess('Report Submitted', responseData?.message || 'Your submission is being processed.');
      setTimeout(() => {
        setShowSubmitModal(false);
        navigation.goBack();
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit report';
      setShowSubmitModal(false);
      showError('Submission Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      const headers = 'title,content,address,latitude,longitude,pollutionType,severityByUser,water_body_name,temperature_celsius,ph_level,turbidity_ntu,total_dissolved_solids_mgl,sampling_date';
      const sampleRow1 = 'Pasig River Sample,Observed murky water near bridge,Pasig Blvd Barangay Pineda,14.5995,121.0008,Industrial Waste,medium,Pasig River,29.5,6.8,25.3,180.5,2024-01-15';
      const sampleRow2 = 'Laguna Lake Monitoring,Clean water observed at sampling point,Laguna Blvd Calamba,14.2035,121.1653,Clean,low,Laguna Lake,28.2,7.1,12.5,95.8,2024-01-16';
      const csvContent = `${headers}\n${sampleRow1}\n${sampleRow2}`;
      const fileUri = FileSystem.cacheDirectory + 'waterbase_report_template.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
    } catch (error) {
      console.error('Error downloading CSV template:', error);
      Alert.alert('Error', 'Failed to download CSV template. Please try again.');
    }
  };

  const pickCsvFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setCsvFile(result.assets[0]);
        setCsvResult(null);
      }
    } catch (err) {
      console.error('Error picking CSV:', err);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvResult(null);

    try {
      const formData = new FormData();
      formData.append('csv_file', {
        uri: csvFile.uri,
        type: 'text/csv',
        name: csvFile.name || 'upload.csv',
      } as any);

      const response = await apiRequest(API_ENDPOINTS.REPORTS_BULK_UPLOAD, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setCsvResult({
          imported: data.imported || 0,
          errors: data.errors || [],
          total_rows: data.total_rows || 0,
          auto_approved: false,
        });
        showError('CSV Upload', data.message || 'Upload failed');
      } else {
        setCsvResult({
          imported: data.imported,
          errors: [],
          total_rows: data.total_rows,
          auto_approved: data.auto_approved || false,
        });
        showSuccess('CSV Upload', `Successfully imported ${data.imported} of ${data.total_rows} rows.${data.auto_approved ? ' Reports were auto-verified.' : ''}`);
      }
    } catch (error) {
      showError('CSV Upload', error instanceof Error ? error.message : 'Failed to upload CSV');
    } finally {
      setCsvUploading(false);
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
              {showManualOption && (
                <View className="flex-row bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <TouchableOpacity
                    className={`flex-1 py-3 px-4 ${reportMode === 'ai' ? 'bg-waterbase-500' : 'bg-transparent'}`}
                    onPress={() => setReportMode('ai')}
                  >
                    <Text className={`text-center text-sm font-medium ${reportMode === 'ai' ? 'text-white' : 'text-gray-700'}`}>
                      AI Report
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 px-4 ${reportMode === 'manual' ? 'bg-waterbase-500' : 'bg-transparent'}`}
                    onPress={() => setReportMode('manual')}
                  >
                    <Text className={`text-center text-sm font-medium ${reportMode === 'manual' ? 'text-white' : 'text-gray-700'}`}>
                      Manual Report
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {reportMode === 'manual' ? (
                <View className="space-y-4">
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex-row items-center justify-center flex-1"
                      onPress={downloadTemplate}
                    >
                      <Ionicons name="download" size={20} color="#0369A1" />
                      <Text className="text-waterbase-700 ml-2 font-medium">Download CSV Template</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 items-center justify-center w-16"
                      onPress={() => setShowCsvHelp(true)}
                    >
                      <Ionicons name="information-circle" size={24} color="#0369A1" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 items-center"
                    onPress={pickCsvFile}
                  >
                    <Ionicons name="document-text" size={28} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-2 text-center font-medium">
                      {csvFile ? csvFile.name : 'Select CSV File'}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1 text-center">
                      Tap to pick a .csv file
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`w-full rounded-lg py-4 px-6 flex-row items-center justify-center ${!csvFile || csvUploading ? 'bg-gray-400' : 'bg-waterbase-500'}`}
                    onPress={handleCsvUpload}
                    disabled={!csvFile || csvUploading}
                  >
                    {csvUploading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload" size={20} color="white" />
                        <Text className="text-white font-medium ml-2">Upload CSV</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {csvResult && (
                    <View className="space-y-3">
                      <View className={`p-3 rounded-lg ${csvResult.errors.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                        {csvResult.errors.length === 0 ? (
                          <>
                            <View className="flex-row items-center">
                              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                              <Text className="text-green-700 font-medium ml-2">
                                Imported {csvResult.imported} of {csvResult.total_rows} rows
                              </Text>
                            </View>
                            {csvResult.auto_approved && (
                              <Text className="text-green-600 text-sm mt-1">Reports were auto-verified.</Text>
                            )}
                          </>
                        ) : (
                          <View className="flex-row items-center">
                            <Ionicons name="warning" size={20} color="#f59e0b" />
                            <Text className="text-yellow-700 font-medium ml-2">
                              Imported {csvResult.imported} rows with {csvResult.errors.length} errors
                            </Text>
                          </View>
                        )}
                      </View>

                      {csvResult.errors.length > 0 && (
                        <View className="max-h-48">
                          <FlatList
                            data={csvResult.errors}
                            keyExtractor={(_, i) => i.toString()}
                            renderItem={({ item }) => (
                              <View className="flex-row p-2 border-b border-gray-100">
                                <Text className="text-xs w-12 font-medium">Row {item.row}</Text>
                                <Text className="text-xs w-24 text-gray-600">{item.field}</Text>
                                <Text className="text-xs flex-1 text-red-600">{item.message}</Text>
                              </View>
                            )}
                          />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : (
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
                        onPress={() => {
                          setFormData(prev => ({ ...prev, image: null }));
                          setAiScanStatus('idle');
                          setAiResults(null);
                        }}
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
                        <View className="absolute bottom-2 left-2">
                          {(() => {
                            const waterValidation = validateWaterPresence();
                            const hasWater = waterValidation.hasWater;
                            return (
                              <View className={`rounded-full px-3 py-1 ${hasWater ? 'bg-green-500' : 'bg-orange-500'}`}>
                                <Text className="text-white text-xs">
                                  {hasWater ? '✓ Water Detected' : '⚠️ No Water'}
                                </Text>
                              </View>
                            );
                          })()}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View className="space-y-3">
                      <TouchableOpacity
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center bg-gray-50"
                        onPress={async () => {
                          console.log('Camera button pressed');
                          try {
                            const hasPermissions = await requestPermissions();
                            console.log('Permissions result:', hasPermissions);
                            if (hasPermissions) {
                              console.log('Opening camera...');
                              await openCamera();
                            }
                          } catch (error) {
                            console.error('Error opening camera:', error);
                            Alert.alert('Error', 'Failed to open camera. Please try again.');
                          }
                        }}
                      >
                        <Ionicons name="camera" size={28} color="#9CA3AF" />
                        <Text className="text-gray-500 mt-2 text-center font-medium">
                          Take Photo
                        </Text>
                        <Text className="text-xs text-gray-400 mt-1 text-center">
                          Capture new image
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center bg-gray-50"
                        onPress={async () => {
                          console.log('Gallery button pressed');
                          try {
                            const hasPermissions = await requestPermissions();
                            console.log('Permissions result:', hasPermissions);
                            if (hasPermissions) {
                              console.log('Opening gallery...');
                              await openGallery();
                            }
                          } catch (error) {
                            console.error('Error opening gallery:', error);
                            Alert.alert('Error', 'Failed to open gallery. Please try again.');
                          }
                        }}
                      >
                        <Ionicons name="images" size={28} color="#9CA3AF" />
                        <Text className="text-gray-500 mt-2 text-center font-medium">
                          Choose from Gallery
                        </Text>
                        <Text className="text-xs text-gray-400 mt-1 text-center">
                          Select existing photo
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Location */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </Text>
                  
                  {verificationStatus === 'verifying' && (
                    <View className="flex-row items-center p-3 bg-blue-50 rounded-lg mb-3">
                      <ActivityIndicator size="small" color="#3B82F6" />
                      <Text className="ml-2 text-blue-700">Getting location...</Text>
                    </View>
                  )}
                  
                  {verificationStatus === 'success' && formData.address && (
                    <View className="flex-row items-center p-3 bg-green-50 rounded-lg mb-3">
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <View className="ml-2 flex-1">
                        <Text className="text-green-700 font-medium">
                          {formData.address}
                        </Text>
                        {formData.latitude && formData.longitude && (
                          <Text className="text-green-600 text-xs mt-1">
                            {formatCoordinates(parseFloat(formData.latitude), parseFloat(formData.longitude))}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  
                  {/* OpenStreetMap Address Search */}
                  <View className="mb-3">
                    <Text className="text-xs text-gray-500 mb-2">
                      Search for address or location:
                    </Text>
                    <OpenStreetMapSearchableSelect
                      value={formData.address}
                      onValueChange={handleLocationSelect}
                      onCoordinatesChange={handleCoordinatesChange}
                      placeholder="Search for address, city, or landmark..."
                      className="w-full"
                    />
                  </View>
                  
                  {/* Current Location Button */}
                  <TouchableOpacity
                    className="bg-blue-500 rounded-lg py-3 px-4 flex-row items-center justify-center mb-3"
                    onPress={handleGetCurrentLocation}
                    disabled={verificationStatus === 'verifying'}
                  >
                    <Ionicons 
                      name="location" 
                      size={16} 
                      color="white" 
                    />
                    <Text className="text-white font-medium ml-2">
                      Use Current Location
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Manual Coordinates Input */}
                  <View>
                    <Text className="text-xs text-gray-500 mb-2">
                      Or enter coordinates manually:
                    </Text>
                    <View className="flex-row space-x-2">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-600 mb-1">Latitude</Text>
                        <TextInput
                          placeholder="14.5995"
                          value={formData.latitude}
                          onChangeText={(text) => {
                            setFormData({ ...formData, latitude: text });
                            // Validate coordinates when both are provided
                            if (text && formData.longitude) {
                              const lat = parseFloat(text);
                              const lng = parseFloat(formData.longitude);
                              if (validateCoordinates(lat, lng)) {
                                setVerificationStatus('success');
                              }
                            }
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white text-sm"
                          keyboardType="numeric"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-600 mb-1">Longitude</Text>
                        <TextInput
                          placeholder="121.0008"
                          value={formData.longitude}
                          onChangeText={(text) => {
                            setFormData({ ...formData, longitude: text });
                            // Validate coordinates when both are provided
                            if (formData.latitude && text) {
                              const lat = parseFloat(formData.latitude);
                              const lng = parseFloat(text);
                              if (validateCoordinates(lat, lng)) {
                                setVerificationStatus('success');
                              }
                            }
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white text-sm"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
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
                    {severityLevels.map((level, index) => {
                      const isSelected = formData.severityByUser === level;
                      const getSeverityColor = (lvl: string) => {
                        switch (lvl) {
                          case "low": return "#22c55e";
                          case "medium": return "#eab308";
                          case "high": return "#f97316";
                          case "critical": return "#ef4444";
                          default: return "#6B7280";
                        }
                      };
                      
                      const getSeverityLabel = (lvl: string) => {
                        switch (lvl) {
                          case "low": return "Low";
                          case "medium": return "Med";
                          case "high": return "High";
                          case "critical": return "Critical";
                          default: return lvl;
                        }
                      };
                      
                      const color = getSeverityColor(level);
                      const label = getSeverityLabel(level);
                      
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
                            {label}
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

                {/* Water Detection Warning */}
                {aiResults && !validateWaterPresence().hasWater && (
                  <View className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="warning" size={20} color="#f97316" />
                      <Text className="text-orange-700 font-medium ml-2">No Water Bodies Detected</Text>
                    </View>
                    <Text className="text-orange-600 text-sm">
                      AI analysis did not detect any water bodies in your image. Water pollution reports should contain visible water sources (rivers, lakes, oceans, etc.). Consider retaking the photo or you may proceed but your report may be rejected.
                    </Text>
                  </View>
                )}

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
                        AI Verification & Location
                      </Text>
                      <Text className="text-xs text-blue-700">
                        • Photos are analyzed using AI to verify pollution type and severity{'\n'}
                        • Location is automatically detected from camera photos{'\n'}
                        • You can search for addresses using OpenStreetMap{'\n'}
                        • All reports help improve water quality monitoring
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              )}
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
                    Submission Received
                  </Text>
                  <Text className="text-center mt-2 text-gray-600 text-sm">
                    Your submission is being processed. You will be notified once verification is complete.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* CSV Help Modal */}
      <Modal
        visible={showCsvHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCsvHelp(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4 py-6">
          <View className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[85%] flex-1">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">CSV Upload Guidelines</Text>
              <TouchableOpacity onPress={() => setShowCsvHelp(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="space-y-4">
                  <View>
                    <Text className="font-medium text-gray-900 mb-2">Required Columns:</Text>
                    <Text className="text-sm text-gray-700 mb-1">• title - Report title</Text>
                    <Text className="text-sm text-gray-700 mb-1">• content - Description of the observation</Text>
                    <Text className="text-sm text-gray-700 mb-1">• address - Location address</Text>
                    <Text className="text-sm text-gray-700 mb-1">• latitude - Number between -90 and 90</Text>
                    <Text className="text-sm text-gray-700 mb-1">• longitude - Number between -180 and 180</Text>
                    <Text className="text-sm text-gray-700 mb-1">• pollutionType - One of: Industrial Waste, Chemical Pollution, Oil Spill, Plastic Pollution, Sewage Discharge, Unnatural Color, Clean, Other</Text>
                    <Text className="text-sm text-gray-700">• severityByUser - One of: low, medium, high, critical</Text>
                  </View>

                  <View>
                    <Text className="font-medium text-gray-900 mb-2">Optional Columns:</Text>
                    <Text className="text-sm text-gray-700 mb-1">• water_body_name - Name of the water body</Text>
                    <Text className="text-sm text-gray-700 mb-1">• temperature_celsius - Water temperature (number)</Text>
                    <Text className="text-sm text-gray-700 mb-1">• ph_level - pH level (number)</Text>
                    <Text className="text-sm text-gray-700 mb-1">• turbidity_ntu - Turbidity in NTU (number)</Text>
                    <Text className="text-sm text-gray-700 mb-1">• total_dissolved_solids_mgl - TDS in mg/L (number)</Text>
                    <Text className="text-sm text-gray-700">• sampling_date - Date in YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY format</Text>
                  </View>

                  <View>
                    <Text className="font-medium text-gray-900 mb-2">Important Notes:</Text>
                    <Text className="text-sm text-gray-700 mb-1">• All required fields must be filled</Text>
                    <Text className="text-sm text-gray-700 mb-1">• Pollution types are case-insensitive but will be normalized</Text>
                    <Text className="text-sm text-gray-700 mb-1">• Latitude/Longitude must be valid coordinates</Text>
                    <Text className="text-sm text-gray-700 mb-1">• Optional numeric fields must be numbers if provided</Text>
                    <Text className="text-sm text-gray-700">• Download the template for examples with valid data</Text>
                  </View>
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity
              className="mt-6 bg-waterbase-500 rounded-lg py-3 px-4 items-center"
              onPress={() => setShowCsvHelp(false)}
            >
              <Text className="text-white font-medium">Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </ProtectedContent>
  );
};

export default ReportPollutionScreen;
