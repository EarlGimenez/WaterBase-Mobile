import React, { useState, useEffect } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Navigation from "../components/Navigation";
import { API_ENDPOINTS, apiRequest } from "../config/api";

const QRScannerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const deepLinkEventId = route.params?.eventId ? parseInt(route.params.eventId, 10) : null;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    if (deepLinkEventId && !isNaN(deepLinkEventId)) {
      processCheckIn(deepLinkEventId);
    }
  }, [deepLinkEventId]);

  const processCheckIn = async (eventId: number) => {
    if (isProcessing) return;
    setScanned(true);
    setIsProcessing(true);

    try {
      const response = await apiRequest(API_ENDPOINTS.EVENT_QR_SCAN(eventId), {
        method: "POST",
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          "✓ " + data.message,
          data.details || "You have been checked in to the event.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Unable to check in. Please try again.";
        const errorDetails = errorData.details || "An error occurred during check-in.";
        
        Alert.alert(
          "Check-in Failed",
          errorDetails,
          [{ text: "Try Again", onPress: () => setScanned(false) }]
        );
        setScanned(false);
      }
    } catch (error) {
      console.error("QR scan error:", error);
      Alert.alert(
        "Error",
        "Something went wrong while processing the QR code. Please check your internet connection and try again.",
        [{ text: "Try Again", onPress: () => setScanned(false) }]
      );
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;

    const match = data.match(/waterbase:\/\/event\/(\d+)\/attend/);
    if (!match) {
      Alert.alert("Invalid QR Code", "This QR code is not a valid WaterBase event code.");
      return;
    }

    const eventId = parseInt(match[1], 10);
    await processCheckIn(eventId);
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-6">
        <Ionicons name="camera-outline" size={64} color="#ffffff" />
        <Text className="text-white text-lg font-semibold mt-4 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-gray-300 text-sm mt-2 text-center">
          We need access to your camera to scan QR codes for event check-in.
        </Text>
        <TouchableOpacity
          className="bg-waterbase-500 px-6 py-3 rounded-lg mt-6"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Navigation title="Scan QR Code" showBackButton={true} />

      <View className="flex-1 relative">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Overlay */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
          <View style={{ width: 256, height: 256, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 12 }} />
        </View>

        {/* Instructions */}
        <View className="absolute bottom-12 left-0 right-0 items-center px-6">
          <Text className="text-white text-sm text-center bg-black/50 px-4 py-2 rounded-lg">
            Point your camera at the event QR code to check in
          </Text>
          {scanned && (
            <TouchableOpacity
              className="bg-waterbase-500 px-6 py-3 rounded-lg mt-4"
              onPress={() => setScanned(false)}
            >
              <Text className="text-white font-semibold">Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>

        {isProcessing && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center">
            <ActivityIndicator size="large" color="#ffffff" />
            <Text className="text-white mt-4">Processing check-in...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default QRScannerScreen;
