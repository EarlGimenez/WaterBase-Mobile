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
  created_at: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface UserStats {
  eventsCreated?: number;
  eventsCompleted?: number;
  volunteersManaged?: number;
  badgesEarned?: number;
}

export const OrganizerActivityLogScreen = () => {
  const navigation = useNavigation();
  const { token, user } = useAuth();

  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Stats
  const [stats, setStats] = useState<UserStats>({});
  const [badgesIssuedCount, setBadgesIssuedCount] = useState(0);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'reports' | 'badges'>('events');

  useEffect(() => {
    fetchAllData();
  }, [token, user]);

  useEffect(() => {
    filterEvents();
  }, [events, eventSearchQuery, eventStatusFilter]);

  useEffect(() => {
    filterReports();
  }, [reports, reportSearchQuery, reportStatusFilter]);

  const fetchAllData = async () => {
    if (!token || !user) return;

    try {
      setIsLoading(true);

      // Fetch events created by this user
      const allEvents = await eventService.getAllEvents(token);
      const userEvents = allEvents.filter((e) => e.user_id === user.id);
      const sorted = userEvents.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEvents(sorted);

      // Count badges issued
      let badgeCount = 0;
      for (const event of sorted) {
        try {
          const volunteersRes = await fetch(`/api/events/${event.id}/volunteers`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (volunteersRes.ok) {
            const volunteers = await volunteersRes.json();
            badgeCount += volunteers.filter((v: any) => v.badge).length;
          }
        } catch (e) {
          console.error(`Error fetching volunteers for event ${event.id}:`, e);
        }
      }
      setBadgesIssuedCount(badgeCount);

      // Fetch reports from their area
      if (user.areaOfResponsibility) {
        try {
          const reportsRes = await fetch(`/api/reports/area/${encodeURIComponent(user.areaOfResponsibility)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (reportsRes.ok) {
            setReports(await reportsRes.json());
          }
        } catch (e) {
          console.error('Error fetching area reports:', e);
        }
      }

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

  const filterEvents = () => {
    let filtered = [...events];

    if (eventSearchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
          e.address.toLowerCase().includes(eventSearchQuery.toLowerCase())
      );
    }

    if (eventStatusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === eventStatusFilter);
    }

    setFilteredEvents(filtered);
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
                  {event.description && (
                    <Text className="text-gray-600 mt-2 text-sm">{event.description}</Text>
                  )}
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

  const renderReportsTab = () => (
    <ScrollView className="flex-1">
      {filteredReports.length === 0 ? (
        <View className="py-12 items-center">
          <AlertCircle size={48} className="text-gray-300 mb-4" />
          <Text className="text-gray-600">
            {user?.areaOfResponsibility 
              ? "No reports found in your area" 
              : "Set your area of responsibility to see reports"}
          </Text>
        </View>
      ) : (
        filteredReports.map((report) => (
          <View key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <View className="flex-row justify-between items-start gap-4">
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
                {report.user && (
                  <Text className="text-xs text-gray-500 mt-2">
                    Submitted by {report.user.firstName} {report.user.lastName}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderBadgesTab = () => (
    <ScrollView className="flex-1">
      <View className="bg-white border border-gray-200 rounded-lg p-6 items-center">
        <Award size={48} className="text-yellow-500 mb-4" />
        <Text className="text-3xl font-bold text-gray-950">{badgesIssuedCount}</Text>
        <Text className="text-gray-600 mt-2">Badges Issued to Volunteers</Text>
        <Text className="text-sm text-gray-500 mt-4 text-center">
          Volunteers earn badges by completing your events. This count shows how many badges have been issued from your cleanup drives.
        </Text>
      </View>
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
              <Text className="text-gray-600">Manage your events and area</Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View className="px-4 mb-6">
            <View className="flex-row flex-wrap justify-between gap-3">
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{stats.eventsCreated || 0}</Text>
                <Text className="text-sm text-gray-600">Events Created</Text>
              </View>
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{stats.eventsCompleted || 0}</Text>
                <Text className="text-sm text-gray-600">Events Completed</Text>
              </View>
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{stats.volunteersManaged || 0}</Text>
                <Text className="text-sm text-gray-600">Volunteers Managed</Text>
              </View>
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{badgesIssuedCount}</Text>
                <Text className="text-sm text-gray-600">Badges Issued</Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row border-b border-gray-200 bg-white px-4">
            {(['events', 'reports', 'badges'] as const).map((tab) => (
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
                  {tab === 'events' && `Events (${events.length})`}
                  {tab === 'reports' && `Area Reports (${reports.length})`}
                  {tab === 'badges' && 'Badges Issued'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View className="flex-1 px-4 py-4">
            {activeTab === 'events' && renderEventsTab()}
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'badges' && renderBadgesTab()}
          </View>
      </ScrollView>
    </SafeAreaView>
  );
};
