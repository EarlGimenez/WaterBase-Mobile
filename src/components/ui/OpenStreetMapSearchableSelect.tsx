import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDisplayName, type NominatimResult } from "../../utils/location";

interface OpenStreetMapSearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onCoordinatesChange?: (coordinates: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface SearchOption {
  value: string;
  label: string;
  coordinates: { latitude: number; longitude: number };
  type: string;
}

export function OpenStreetMapSearchableSelect({
  value,
  onValueChange,
  onCoordinatesChange,
  placeholder = "Search for an address or location...",
  disabled = false,
  className,
}: OpenStreetMapSearchableSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to search through OpenStreetMap Nominatim API
  const searchLocations = async (query: string): Promise<SearchOption[]> => {
    if (!query || query.length < 3) {
      return [];
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WaterBase-Mobile/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NominatimResult[] = await response.json();
      
      return data.map((result) => ({
        value: formatDisplayName(result),
        label: formatDisplayName(result),
        coordinates: {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        },
        type: result.address?.city ? 'City' : 
              result.address?.municipality ? 'Municipality' : 
              result.address?.village ? 'Village' : 
              result.address?.county ? 'County' : 'Location'
      }));
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  };

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current !== null) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (!searchValue || searchValue.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set searching state
    setIsSearching(true);

    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(searchValue);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms delay for API calls

    // Cleanup timeout on component unmount
    return () => {
      if (searchTimeoutRef.current !== null) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue]);

  const handleInputChange = (text: string) => {
    setSearchValue(text);
  };

  const handleSelectOption = (option: SearchOption) => {
    onValueChange(option.value);
    if (onCoordinatesChange) {
      onCoordinatesChange(option.coordinates);
    }
    setModalVisible(false);
    setSearchValue("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handleOpenModal = () => {
    if (!disabled) {
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSearchValue("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'City': return 'bg-blue-100 text-blue-800';
      case 'Municipality': return 'bg-green-100 text-green-800';
      case 'Village': return 'bg-orange-100 text-orange-800';
      case 'County': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderItem = ({ item }: { item: SearchOption }) => (
    <TouchableOpacity
      onPress={() => handleSelectOption(item)}
      className="border-b border-gray-100 py-3 px-4 flex-row items-center"
    >
      <View className="flex-row items-center flex-1">
        <View className={`px-2 py-1 rounded-full mr-3 ${getTypeColor(item.type)}`}>
          <Text className="text-xs font-medium">{item.type}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-waterbase-900 text-base" numberOfLines={2}>
            {item.label}
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            {item.coordinates.latitude.toFixed(6)}, {item.coordinates.longitude.toFixed(6)}
          </Text>
        </View>
      </View>
      {value === item.value && (
        <Ionicons name="checkmark" size={20} color="#0ea5e9" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        onPress={handleOpenModal}
        disabled={disabled}
        className={`border border-gray-300 rounded-lg px-3 py-3 bg-white flex-row items-center justify-between ${
          disabled ? 'opacity-50' : ''
        } ${className || ''}`}
      >
        <View className="flex-1">
          {value ? (
            <Text className="text-waterbase-900 text-base" numberOfLines={2}>
              {value}
            </Text>
          ) : (
            <Text className="text-gray-500 text-base">
              {placeholder}
            </Text>
          )}
        </View>
        <Ionicons 
          name="location" 
          size={20} 
          color={disabled ? "#9CA3AF" : "#6B7280"} 
        />
      </TouchableOpacity>

      {/* Search Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-waterbase-950">
              Search Location
            </Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="px-4 py-3 border-b border-gray-200">
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                value={searchValue}
                onChangeText={handleInputChange}
                placeholder="Type at least 3 characters to search..."
                className="flex-1 py-3 px-3 text-waterbase-900"
                style={{ fontSize: 16 }}
                autoFocus
              />
              {isSearching && (
                <ActivityIndicator size="small" color="#0ea5e9" />
              )}
            </View>
          </View>

          {/* Results */}
          <View className="flex-1">
            {searchValue.length < 3 ? (
              <View className="flex-1 items-center justify-center px-8">
                <Ionicons name="location-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-center mt-4">
                  Type at least 3 characters to start searching for addresses and locations
                </Text>
              </View>
            ) : isSearching ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text className="text-gray-500 mt-2">Searching locations...</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8">
                <Ionicons name="location-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-center mt-4">
                  No locations found for "{searchValue}"
                </Text>
                <Text className="text-gray-400 text-center mt-2 text-sm">
                  Try searching for a different address or location
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
