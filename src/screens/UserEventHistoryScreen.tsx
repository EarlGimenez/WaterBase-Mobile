import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/Card';
import Navigation from '../components/Navigation';
import Layout from '../components/Layout';
import { API_ENDPOINTS, apiRequest } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { eventService, Event } from '../services/eventService';

const UserEventHistoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recruiting' | 'active' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchUserEvents();
  }, []);

  const fetchUserEvents = async () => {
    try {
      setIsLoading(true);
      const userEvents = await eventService.getUserEvents(
        localStorage.getItem('auth_token') || ''
      );
      // Sort by date descending (most recent first)
      const sorted = userEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEvents(sorted);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load your events');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserEvents();
    setIsRefreshing(false);
  };

  const getFilteredEvents = () => {
    if (filter === 'all') {
      return events;
    }
    return events.filter((e) => e.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting':
        return '#EAB308';
      case 'active':
        return '#3B82F6';
      case 'completed':
        return '#22C55E';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredEvents = getFilteredEvents();

  return (
    <Layout>
      <SafeAreaView className="flex-1 bg-waterbase-50">
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View className="px-4 py-6 border-b border-waterbase-200 bg-white">
            <Text className="text-2xl font-bold text-waterbase-950 mb-2">
              My Event History
            </Text>
            <Text className="text-sm text-waterbase-600">
              View all your cleanup drives
            </Text>
          </View>

          {/* Filter Tabs */}
          <View className="flex-row px-4 py-4 gap-2 overflow-x-auto">
            {(['all', 'recruiting', 'active', 'completed', 'cancelled'] as const).map(
              (status) => (
                <View
                  key={status}
                  className={`px-3 py-1 rounded-full ${
                    filter === status
                      ? 'bg-waterbase-500'
                      : 'bg-waterbase-100 border border-waterbase-200'
                  }`}
                >
                  <Text
                    onPress={() => setFilter(status)}
                    className={`text-sm font-medium ${
                      filter === status ? 'text-white' : 'text-waterbase-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </View>
              )
            )}
          </View>

          {/* Events List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#0369A1" />
              <Text className="text-waterbase-600 mt-4">Loading your events...</Text>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View className="items-center justify-center py-12 px-4">
              <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
              <Text className="text-waterbase-600 text-lg font-semibold mt-4 text-center">
                No events found
              </Text>
              <Text className="text-waterbase-500 text-sm mt-2 text-center">
                {events.length === 0
                  ? "You haven't joined any events yet"
                  : 'Try adjusting your filters'}
              </Text>
            </View>
          ) : (
            <View className="px-4 pb-6">
              <Text className="text-xs text-waterbase-600 mb-3">
                Showing {filteredEvents.length} of {events.length} event
                {events.length !== 1 ? 's' : ''}
              </Text>
              {filteredEvents.map((event) => (
                <Card key={event.id} className="mb-4 border-waterbase-200">
                  <CardContent className="p-4">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-waterbase-950 mb-1">
                          {event.title}
                        </Text>
                      </View>
                      <View
                        className="px-2 py-1 rounded-full ml-2"
                        style={{
                          backgroundColor: getStatusColor(event.status) + '20',
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: getStatusColor(event.status) }}
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View className="space-y-2">
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text className="text-xs text-waterbase-600 flex-1">
                          {event.address}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                        <Text className="text-xs text-waterbase-600">
                          {formatDate(event.date)} at {formatTime(event.time)}
                        </Text>
                      </View>
                      {event.description && (
                        <Text className="text-xs text-waterbase-600 mt-2">
                          {event.description}
                        </Text>
                      )}
                    </View>

                    {/* Event Stats */}
                    <View className="mt-3 pt-3 border-t border-waterbase-200">
                      <View className="flex-row gap-4">
                        <View>
                          <Text className="text-xs text-waterbase-600 mb-1">
                            Volunteers
                          </Text>
                          <Text className="text-sm font-medium text-waterbase-950">
                            {event.currentVolunteers || 0}/{event.maxVolunteers}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs text-waterbase-600 mb-1">
                            Points
                          </Text>
                          <Text className="text-sm font-medium text-waterbase-950">
                            {event.points} pts
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs text-waterbase-600 mb-1">
                            Duration
                          </Text>
                          <Text className="text-sm font-medium text-waterbase-950">
                            {event.duration}h
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Creator Info */}
                    {event.creator && (
                      <View className="mt-3 pt-3 border-t border-waterbase-200">
                        <Text className="text-xs text-waterbase-600 mb-1">
                          Organized by
                        </Text>
                        <Text className="text-sm font-medium text-waterbase-950">
                          {event.creator.firstName} {event.creator.lastName}
                          {event.creator.organization &&
                            ` (${event.creator.organization})`}
                        </Text>
                      </View>
                    )}
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
};

export default UserEventHistoryScreen;
