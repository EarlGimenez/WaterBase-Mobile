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
import API_CONFIG from "../../config/api";

interface SearchableLocationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface AreaOption {
  value: string;
  label: string;
  type: 'Region' | 'Province' | 'Municipality/City' | 'Barangay';
}

interface PhilippineData {
  [regionCode: string]: {
    region_name: string;
    province_list: {
      [provinceName: string]: {
        municipality_list: {
          [municipalityName: string]: {
            barangay_list?: string[];
          };
        };
      };
    };
  };
}

export function SearchableLocationSelect({
  value,
  onValueChange,
  placeholder = "Search for region, province, city, or barangay...",
  disabled = false,
  className,
}: SearchableLocationSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<AreaOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [philippineData, setPhilippineData] = useState<PhilippineData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Philippine data once when component mounts
  useEffect(() => {
    const loadPhilippineData = async () => {
      try {
        // Import the JSON file directly from assets
        const philippineAreas = require('../../../assets/data/philippine_areas.json');
        setPhilippineData(philippineAreas);
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading Philippine data from assets:', error);
        // Fallback: try to fetch from Laravel backend
        try {
          const backendUrl = API_CONFIG.BASE_URL.replace('/api', '/philippine_areas_of_responsibilities.json');
          const response = await fetch(backendUrl);
          if (!response.ok) {
            throw new Error(`Failed to load Philippine areas data from backend: ${response.status}`);
          }
          const data: PhilippineData = await response.json();
          setPhilippineData(data);
          setDataLoaded(true);
          console.log('Successfully loaded Philippine data from backend');
        } catch (backendError) {
          console.error('Error loading Philippine data from backend:', backendError);
          setDataLoaded(true); // Set to true even on error to stop loading state
        }
      }
    };

    loadPhilippineData();
  }, []);

  // Function to search through the Philippine data
  const searchAreas = (query: string): AreaOption[] => {
    if (!philippineData || !query || query.length < 2) {
      return [];
    }

    try {
      const results: AreaOption[] = [];
      const lowerQuery = query.toLowerCase();
      const maxResults = 50; // Limit results for performance

      // Search through all levels
      Object.entries(philippineData).forEach(([, regionData]) => {
        if (results.length >= maxResults) return;

        // Ensure regionData exists and has required properties
        if (!regionData || !regionData.region_name) return;

        // Search regions
        if (regionData.region_name.toLowerCase().includes(lowerQuery)) {
          results.push({
            value: regionData.region_name,
            label: regionData.region_name,
            type: 'Region'
          });
        }

        // Search provinces
        if (regionData.province_list) {
          Object.entries(regionData.province_list).forEach(([provinceName, provinceData]) => {
            if (results.length >= maxResults) return;

            // Ensure province name exists
            if (!provinceName) return;

            if (provinceName.toLowerCase().includes(lowerQuery)) {
              results.push({
                value: `${provinceName}, ${regionData.region_name}`,
                label: `${provinceName}`,
                type: 'Province'
              });
            }

            // Search municipalities/cities
            if (provinceData && provinceData.municipality_list) {
              Object.entries(provinceData.municipality_list).forEach(([municipalityName, municipalityData]) => {
                if (results.length >= maxResults) return;

                // Ensure municipality name exists
                if (!municipalityName) return;

                if (municipalityName.toLowerCase().includes(lowerQuery)) {
                  results.push({
                    value: `${municipalityName}, ${provinceName}, ${regionData.region_name}`,
                    label: `${municipalityName}`,
                    type: 'Municipality/City'
                  });
                }

                // Search barangays
                if (municipalityData && municipalityData.barangay_list && Array.isArray(municipalityData.barangay_list)) {
                  municipalityData.barangay_list.forEach((barangayName) => {
                    if (results.length >= maxResults) return;

                    // Ensure barangay name exists and is a string
                    if (!barangayName || typeof barangayName !== 'string') return;

                    if (barangayName.toLowerCase().includes(lowerQuery)) {
                      results.push({
                        value: `${barangayName}, ${municipalityName}, ${provinceName}, ${regionData.region_name}`,
                        label: `${barangayName}`,
                        type: 'Barangay'
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });

      // Sort results by relevance and type
      return results.sort((a, b) => {
        // Exact matches first
        const aExact = a.label.toLowerCase() === lowerQuery;
        const bExact = b.label.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Then by type priority
        const typeOrder = { 'Region': 1, 'Province': 2, 'Municipality/City': 3, 'Barangay': 4 };
        const aOrder = typeOrder[a.type];
        const bOrder = typeOrder[b.type];
        if (aOrder !== bOrder) return aOrder - bOrder;

        // Finally by name
        return a.label.localeCompare(b.label);
      });
    } catch (error) {
      console.error('Error searching areas:', error);
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
    if (!searchValue || searchValue.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set searching state
    setIsSearching(true);

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      if (philippineData) {
        const results = searchAreas(searchValue);
        setSearchResults(results);
      }
      setIsSearching(false);
    }, 300); // 300ms delay for mobile

    // Cleanup timeout on component unmount
    return () => {
      if (searchTimeoutRef.current !== null) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, philippineData]);

  // Find selected option for display
  const selectedOption = searchResults.find((option) => option.value === value);
  const displayValue = value && !selectedOption ?
    { label: value.split(',')[0], type: 'Selected' as const, value } :
    selectedOption;

  const handleInputChange = (text: string) => {
    setSearchValue(text);
  };

  const handleSelectOption = (optionValue: string) => {
    onValueChange(optionValue);
    setModalVisible(false);
    setSearchValue("");
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handleOpenModal = () => {
    if (!disabled && dataLoaded) {
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
      case 'Region': return 'bg-blue-100 text-blue-800';
      case 'Province': return 'bg-green-100 text-green-800';
      case 'Municipality/City': return 'bg-orange-100 text-orange-800';
      case 'Barangay': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderItem = ({ item }: { item: AreaOption }) => (
    <TouchableOpacity
      onPress={() => handleSelectOption(item.value)}
      className="border-b border-gray-100 py-3 px-4 flex-row items-center"
    >
      <View className="flex-row items-center flex-1">
        <View className={`px-2 py-1 rounded-full mr-3 ${getTypeColor(item.type)}`}>
          <Text className="text-xs font-medium">{item.type}</Text>
        </View>
        <Text className="text-waterbase-900 text-base flex-1" numberOfLines={2}>
          {item.label}
        </Text>
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
        disabled={disabled || !dataLoaded}
        className={`border border-gray-300 rounded-lg px-3 py-3 bg-white flex-row items-center justify-between ${
          disabled || !dataLoaded ? 'opacity-50' : ''
        } ${className || ''}`}
      >
        <View className="flex-1">
          {displayValue ? (
            <View className="flex-row items-center">
              <View className={`px-2 py-1 rounded-full mr-2 ${getTypeColor(displayValue.type)}`}>
                <Text className="text-xs font-medium">{displayValue.type}</Text>
              </View>
              <Text className="text-waterbase-900 text-base flex-1" numberOfLines={1}>
                {displayValue.label}
              </Text>
            </View>
          ) : (
            <Text className="text-gray-500 text-base">
              {dataLoaded ? placeholder : "Loading areas..."}
            </Text>
          )}
        </View>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled || !dataLoaded ? "#9CA3AF" : "#6B7280"} 
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
              Select Location
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
                placeholder="Type at least 2 characters to search..."
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
            {!dataLoaded ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text className="text-gray-500 mt-2">Loading Philippine areas...</Text>
              </View>
            ) : searchValue.length < 2 ? (
              <View className="flex-1 items-center justify-center px-8">
                <Ionicons name="search" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-center mt-4">
                  Type at least 2 characters to start searching for regions, provinces, cities, or barangays
                </Text>
              </View>
            ) : isSearching ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text className="text-gray-500 mt-2">Searching...</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8">
                <Ionicons name="location-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-center mt-4">
                  No areas found for "{searchValue}"
                </Text>
                <Text className="text-gray-400 text-center mt-2 text-sm">
                  Try searching for a different region, province, city, or barangay
                </Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  searchResults.length === 50 ? (
                    <View className="py-4 px-4 border-t border-gray-200">
                      <Text className="text-xs text-gray-500 text-center">
                        Showing first 50 results. Type more characters for better results.
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
