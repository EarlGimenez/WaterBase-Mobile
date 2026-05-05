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

interface Report {
  id: number;
  address: string;
  pollutionType: string;
  status: 'pending' | 'verified' | 'declined' | 'resolved';
  severityByUser: string;
  severityByAI?: string;
  ai_confidence?: number;
  image?: string;
  created_at: string;
  updated_at: string;
}

const UserReportHistoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'declined' | 'resolved'>('all');

  useEffect(() => {
    fetchUserReports();
  }, []);

  const fetchUserReports = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest(API_ENDPOINTS.REPORTS, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setReports(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load your reports');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserReports();
    setIsRefreshing(false);
  };

  const getFilteredReports = () => {
    if (filter === 'all') {
      return reports;
    }
    return reports.filter((r) => r.status === filter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#EAB308';
      case 'verified':
        return '#22C55E';
      case 'declined':
        return '#EF4444';
      case 'resolved':
        return '#3B82F6';
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

  const getPollutionTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredReports = getFilteredReports();

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
              My Report History
            </Text>
            <Text className="text-sm text-waterbase-600">
              View all your pollution reports
            </Text>
          </View>

          {/* Filter Tabs */}
          <View className="flex-row px-4 py-4 gap-2 overflow-x-auto">
            {(['all', 'pending', 'verified', 'declined', 'resolved'] as const).map((status) => (
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
                    filter === status
                      ? 'text-white'
                      : 'text-waterbase-700'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </View>
            ))}
          </View>

          {/* Reports List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#0369A1" />
              <Text className="text-waterbase-600 mt-4">Loading your reports...</Text>
            </View>
          ) : filteredReports.length === 0 ? (
            <View className="items-center justify-center py-12 px-4">
              <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
              <Text className="text-waterbase-600 text-lg font-semibold mt-4 text-center">
                No reports found
              </Text>
              <Text className="text-waterbase-500 text-sm mt-2 text-center">
                {reports.length === 0
                  ? "You haven't submitted any reports yet"
                  : 'Try adjusting your filters'}
              </Text>
            </View>
          ) : (
            <View className="px-4 pb-6">
              <Text className="text-xs text-waterbase-600 mb-3">
                Showing {filteredReports.length} of {reports.length} report
                {reports.length !== 1 ? 's' : ''}
              </Text>
              {filteredReports.map((report) => (
                <Card key={report.id} className="mb-4 border-waterbase-200">
                  <CardContent className="p-4">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-waterbase-950 mb-1">
                          {getPollutionTypeLabel(report.pollutionType)}
                        </Text>
                      </View>
                      <View
                        className="px-2 py-1 rounded-full ml-2"
                        style={{
                          backgroundColor: getStatusColor(report.status) + '20',
                        }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: getStatusColor(report.status) }}
                        >
                          {report.status.charAt(0).toUpperCase() +
                            report.status.slice(1)}
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
                          {report.address}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text className="text-xs text-waterbase-600">
                          {formatDate(report.created_at)}
                        </Text>
                      </View>
                    </View>

                    {report.ai_confidence !== undefined && (
                      <View className="mt-3 pt-3 border-t border-waterbase-200">
                        <View className="flex-row justify-between">
                          <View className="flex-1">
                            <Text className="text-xs text-waterbase-600 mb-1">
                              Your Assessment
                            </Text>
                            <Text className="text-sm font-medium text-waterbase-950">
                              {report.severityByUser
                                ? report.severityByUser.charAt(0).toUpperCase() +
                                  report.severityByUser.slice(1)
                                : 'N/A'}
                            </Text>
                          </View>
                          {report.severityByAI && (
                            <View className="flex-1">
                              <Text className="text-xs text-waterbase-600 mb-1">
                                AI Assessment
                              </Text>
                              <Text className="text-sm font-medium text-waterbase-950">
                                {report.severityByAI.charAt(0).toUpperCase() +
                                  report.severityByAI.slice(1)}{' '}
                                <Text className="text-xs text-waterbase-500">
                                  ({Math.round((report.ai_confidence || 0) * 100)}%)
                                </Text>
                              </Text>
                            </View>
                          )}
                        </View>
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

export default UserReportHistoryScreen;
