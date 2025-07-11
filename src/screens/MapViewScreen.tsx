import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Navigation from "../components/Navigation";

const MapViewScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Live Map" showBackButton={true} />

      <View className="flex-1 px-4 py-6">
        {/* Map Placeholder */}
        <View className="flex-1 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-2xl items-center justify-center border border-waterbase-200">
          <Ionicons name="map" size={64} color="#0ea5e9" />
          <Text className="text-xl font-semibold text-waterbase-950 mt-4 mb-2">
            Interactive Map
          </Text>
          <Text className="text-waterbase-600 text-center text-sm max-w-xs">
            Real-time pollution monitoring across the Philippines. Map
            integration coming soon.
          </Text>
        </View>

        {/* Map Controls */}
        <View className="mt-4 space-y-3">
          <View className="flex-row space-x-3">
            <TouchableOpacity className="flex-1 bg-white border border-waterbase-200 rounded-lg p-3 flex-row items-center justify-center">
              <Ionicons name="layers" size={20} color="#0ea5e9" />
              <Text className="ml-2 text-waterbase-700 font-medium">
                Layers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white border border-waterbase-200 rounded-lg p-3 flex-row items-center justify-center">
              <Ionicons name="filter" size={20} color="#0ea5e9" />
              <Text className="ml-2 text-waterbase-700 font-medium">
                Filter
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="bg-waterbase-500 rounded-lg p-3 flex-row items-center justify-center">
            <Ionicons name="locate" size={20} color="white" />
            <Text className="ml-2 text-white font-medium">
              Find My Location
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View className="mt-4 bg-white border border-waterbase-200 rounded-lg p-4">
          <Text className="font-semibold text-waterbase-950 mb-3">
            Map Legend
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-red-500 rounded-full mr-3" />
              <Text className="text-sm text-gray-700">Critical Pollution</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-orange-500 rounded-full mr-3" />
              <Text className="text-sm text-gray-700">High Pollution</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-yellow-500 rounded-full mr-3" />
              <Text className="text-sm text-gray-700">Medium Pollution</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-green-500 rounded-full mr-3" />
              <Text className="text-sm text-gray-700">Cleanup Complete</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MapViewScreen;
