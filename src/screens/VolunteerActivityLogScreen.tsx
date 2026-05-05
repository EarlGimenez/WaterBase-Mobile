import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, apiRequest } from '@/config/api';
import { eventService, Event } from '@/services/eventService';
import { ChevronLeft, MapPin, Calendar, Clock, Users, AlertCircle, Award } from 'lucide-react-native';

interface Report {
  id: number;
  address: string;
  pollutionType: string;
  status: 'pending' | 'verified' | 'declined' | 'resolved';
  severityByUser: string;
  created_at: string;
}

interface UserStats {
  reportsSubmitted?: number;
  eventsJoined?: number;
  badgesEarned?: number;
  communityPoints?: number;
  badges?: string[];
}

export const VolunteerActivityLogScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');

  // Stats and badges
  const [stats, setStats] = useState<UserStats>({});
  const [badges, setBadges] = useState<string[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'events' | 'badges'>('reports');

  useEffect(() => {
    fetchAllData();
  }, [token]);

  useEffect(() => {
    filterReports();
  }, [reports, reportSearchQuery, reportStatusFilter]);

  useEffect(() => {
    filterEvents();
  }, [events, eventSearchQuery, eventStatusFilter]);

  const fetchAllData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      // Fetch reports
      const reportsRes = await apiRequest(API_ENDPOINTS.REPORTS);
      setReports(await reportsRes.json());

      // Fetch events
      const userEvents = await eventService.getUserEvents();
      const sorted = userEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEvents(sorted);

      // Fetch stats
      const statsRes = await apiRequest(API_ENDPOINTS.USER_STATS);
      const statsData = await statsRes.json();
      setStats(statsData);
      if (statsData.badges) {
        setBadges(statsData.badges);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (reportSearchQuery) {
      filtered = filtered.filter(
        (r) => r.address.toLowerCase().includes(reportSearchQuery.toLowerCase())
      );
    }

    if (reportStatusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === reportStatusFilter);
    }

    setFilteredReports(filtered);
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (eventSearchQuery) {
      filtered = filtered.filter(
        (e) => e.title.toLowerCase().includes(eventSearchQuery.toLowerCase())
      );
    }

    if (eventStatusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === eventStatusFilter);
    }

    setFilteredEvents(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#fef3c7';
      case 'verified':
        return '#dcfce7';
      case 'declined':
        return '#fee2e2';
      case 'resolved':
        return '#dbeafe';
      case 'recruiting':
        return '#fef3c7';
      case 'active':
        return '#dbeafe';
      case 'completed':
        return '#dcfce7';
      case 'cancelled':
        return '#fee2e2';
      default:
        return '#f3f4f6';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPollutionTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderReportsTab = () => (
    <ScrollView className="flex-1">
      {filteredReports.length === 0 ? (
        <View className="py-12 items-center">
          <AlertCircle size={48} className="text-gray-300 mb-4" />
          <Text className="text-gray-600">No reports found</Text>
        </View>
      ) : (
        filteredReports.map((report) => (
          <View key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="font-semibold text-gray-950">
                    {getPollutionTypeLabel(report.pollutionType)}
                  </Text>
                  <View style={{ backgroundColor: getStatusColor(report.status) }} className="px-2 py-1 rounded">
                    <Text className="text-xs font-medium">
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2 mb-1">
                  <MapPin size={16} className="text-gray-600" />
                  <Text className="text-sm text-gray-600">{report.address}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} className="text-gray-600" />
                  <Text className="text-sm text-gray-600">{formatDate(report.created_at)}</Text>
                </View>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderEventsTab = () => (
    <ScrollView className="flex-1">
      {filteredEvents.length === 0 ? (
        <View className="py-12 items-center">
          <AlertCircle size={48} className="text-gray-300 mb-4" />
          <Text className="text-gray-600">No events found</Text>
        </View>
      ) : (
        filteredEvents.map((event) => (
          <View key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="font-semibold text-gray-950">{event.title}</Text>
                  <View style={{ backgroundColor: getStatusColor(event.status) }} className="px-2 py-1 rounded">
                    <Text className="text-xs font-medium">
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <MapPin size={16} className="text-gray-600" />
                    <Text className="text-sm text-gray-600">{event.address}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Calendar size={16} className="text-gray-600" />
                    <Text className="text-sm text-gray-600">{formatDate(event.date)}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View className="flex-row gap-2 pt-3 border-t border-gray-200">
              <View className="flex-1 items-center">
                <View className="flex-row items-center justify-center gap-1 mb-1">
                  <Users size={12} className="text-gray-600" />
                  <Text className="text-xs text-gray-600">Volunteers</Text>
                </View>
                <Text className="font-semibold text-sm">{event.currentVolunteers || 0}/{event.maxVolunteers}</Text>
              </View>
              <View className="flex-1 items-center">
                <View className="flex-row items-center justify-center gap-1 mb-1">
                  <Clock size={12} className="text-gray-600" />
                  <Text className="text-xs text-gray-600">Duration</Text>
                </View>
                <Text className="font-semibold text-sm">{event.duration}h</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderBadgesTab = () => (
    <ScrollView className="flex-1">
      {badges.length === 0 ? (
        <View className="py-12 items-center">
          <Award size={48} className="text-gray-300 mb-4" />
          <Text className="text-gray-600">No badges earned yet</Text>
          <Text className="text-gray-500 text-sm mt-2">Complete reports and events to earn badges</Text>
        </View>
      ) : (
        <View className="bg-white border border-gray-200 rounded-lg p-6">
          <View className="flex-row flex-wrap justify-center gap-4">
            {badges.map((badge, index) => (
              <View key={index} className="items-center">
                <View className="w-16 h-16 items-center justify-center bg-yellow-100 rounded-full border-2 border-yellow-300 mb-2">
                  <Text className="text-2xl">🏅</Text>
                </View>
                  <Text className="text-xs font-medium text-gray-950 text-center max-w-16">{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0369a1" />
        <Text className="text-gray-600 mt-2">Loading activity...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center gap-4 mb-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <ChevronLeft size={24} className="text-gray-950" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-950">My Activity Log</Text>
            <Text className="text-gray-600">View all your reports and events</Text>
          </View>
        </View>

          {/* Stats Cards */}
          <View className="px-4 mb-6">
            <View className="flex-row flex-wrap justify-between gap-3">
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{stats.reportsSubmitted || 0}</Text>
                <Text className="text-sm text-gray-600">Reports Submitted</Text>
              </View>
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{stats.eventsJoined || 0}</Text>
                <Text className="text-sm text-gray-600">Events Joined</Text>
              </View>
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{stats.badgesEarned || 0}</Text>
                <Text className="text-sm text-gray-600">Badges Earned</Text>
              </View>
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{stats.communityPoints || 0}</Text>
                <Text className="text-sm text-gray-600">Community Points</Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row border-b border-gray-200 bg-white px-4">
            {(['reports', 'events', 'badges'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 border-b-2 items-center ${
                  activeTab === tab ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <Text
                  className={`font-medium ${
                    activeTab === tab ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {tab === 'reports' && `Reports (${reports.length})`}
                  {tab === 'events' && `Events (${events.length})`}
                  {tab === 'badges' && `Badges (${badges.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View className="flex-1 px-4 py-4">
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'events' && renderEventsTab()}
            {activeTab === 'badges' && renderBadgesTab()}
          </View>
      </ScrollView>
    </SafeAreaView>
  );
};
