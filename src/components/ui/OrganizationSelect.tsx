import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_ENDPOINTS } from "../../config/api";

interface OrganizationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const OrganizationSelect: React.FC<OrganizationSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select an organization",
  disabled = false,
  className = "",
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<string[]>([]);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_ENDPOINTS.ORGANIZATIONS, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to load organizations (${response.status})`);
        }

        const result = await response.json();
        const options = Array.isArray(result?.data) ? result.data : [];

        const unique = Array.from(
          new Set(
            options
              .map((name: string) => (name || "").trim())
              .filter((name: string) => !!name)
          )
        ).sort((a, b) => a.localeCompare(b));

        setOrganizations(unique);
      } catch (error) {
        console.error("Failed to load organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const filteredOrganizations = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return organizations;
    return organizations.filter((item) => item.toLowerCase().includes(query));
  }, [organizations, searchValue]);

  const query = searchValue.trim();
  const hasExactMatch = organizations.some(
    (item) => item.toLowerCase() === query.toLowerCase()
  );
  const showNewOption = query && !hasExactMatch;

  const canOpen = !disabled && !isLoading && organizations.length > 0;

  return (
    <>
      <TouchableOpacity
        onPress={() => canOpen && setModalVisible(true)}
        disabled={!canOpen}
        className={`border border-gray-300 rounded-lg px-3 py-3 bg-white flex-row items-center justify-between ${
          !canOpen ? "opacity-50" : ""
        } ${className}`}
      >
        <Text className={value ? "text-waterbase-900" : "text-gray-500"} numberOfLines={1}>
          {value || (isLoading ? "Loading organizations..." : placeholder)}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-white">
          <View className="border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-waterbase-950">Select Organization</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="px-4 py-3 border-b border-gray-200">
            <View className="flex-row items-center border border-gray-300 rounded-lg px-3">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder="Search organization..."
                className="flex-1 py-3 px-3 text-waterbase-900"
                style={{ fontSize: 16 }}
                autoFocus
              />
            </View>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text className="text-gray-500 mt-2">Loading organizations...</Text>
            </View>
          ) : filteredOrganizations.length === 0 && !showNewOption ? (
            <View className="flex-1 items-center justify-center px-8">
              <Ionicons name="business-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 text-center mt-4">No organizations found</Text>
              <Text className="text-gray-400 text-center mt-2 text-sm">
                Try another search term
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrganizations}
              keyExtractor={(item) => item}
              ListHeaderComponent={
                showNewOption ? (
                  <TouchableOpacity
                    onPress={() => {
                      onValueChange(query);
                      setModalVisible(false);
                      setSearchValue("");
                    }}
                    className="border-b border-gray-100 py-3 px-4 flex-row items-center justify-between bg-waterbase-50"
                  >
                    <Text className="text-waterbase-900 text-base flex-1" numberOfLines={2}>
                      Use "{query}"
                    </Text>
                    <Ionicons name="add-circle-outline" size={20} color="#0ea5e9" />
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onValueChange(item);
                    setModalVisible(false);
                    setSearchValue("");
                  }}
                  className="border-b border-gray-100 py-3 px-4 flex-row items-center justify-between"
                >
                  <Text className="text-waterbase-900 text-base flex-1" numberOfLines={2}>
                    {item}
                  </Text>
                  {value === item && <Ionicons name="checkmark" size={20} color="#0ea5e9" />}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
};
