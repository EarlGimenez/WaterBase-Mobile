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
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ChevronLeft, MapPin, Calendar, AlertCircle, Award } from 'lucide-react-native';

interface Report {
  id: number;
  address: string;
  pollutionType: string;
  status: 'pending' | 'verified' | 'declined' | 'resolved';
  created_at: string;
}

interface TrendDataPoint {
  month: string;
  count: number;
}

interface RegionDataPoint {
  region: string;
  count: number;
}

interface UserStats {
  dataAnalyzed?: number;
  researchPublished?: number;
  reportsSubmitted?: number;
  badgesEarned?: number;
  badges?: string[];
}

export const ResearcherActivityLogScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Charts data
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [regionData, setRegionData] = useState<RegionDataPoint[]>([]);

  // Stats and badges
  const [stats, setStats] = useState<UserStats>({});
  const [badges, setBadges] = useState<string[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'trends' | 'badges'>('reports');

  useEffect(() => {
    fetchAllData();
  }, [token]);

  useEffect(() => {
    filterReports();
  }, [reports, reportSearchQuery, reportStatusFilter]);

  const fetchAllData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      // Fetch reports
      const reportsRes = await apiRequest(`${API_ENDPOINTS.REPORTS}/all`);
      setReports(await reportsRes.json());

      // Fetch trend data
      try {
        const trendRes = await apiRequest(`${API_ENDPOINTS.DASHBOARD}/monthly-trends`);
        const data = await trendRes.json();
        setTrendData(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching trend data:', e);
      }

      // Fetch region data
      try {
        const regionRes = await apiRequest(`${API_ENDPOINTS.DASHBOARD}/reports-by-region`);
        const data = await regionRes.json();
        setRegionData(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching region data:', e);
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
                <View className="flex-row items-center gap-2">
                  <MapPin size={16} className="text-gray-600" />
                  <Text className="text-sm text-gray-600">{report.address}</Text>
                </View>
                <View className="flex-row items-center gap-2 mt-1">
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

  const renderTrendsTab = () => (
    <ScrollView className="flex-1">
      {trendData.length > 0 && (
        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <Text className="font-semibold text-gray-950 mb-3">Monthly Report Trends</Text>
          <LineChart
            data={{
              labels: trendData.map(d => d.month),
              datasets: [{
                data: trendData.map(d => d.count),
              }],
            }}
            width={300}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: () => '#0369a1',
              labelColor: () => '#666',
              style: {
                borderRadius: 8,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 8,
            }}
          />
        </View>
      )}

      {regionData.length > 0 && (
        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <Text className="font-semibold text-gray-950 mb-3">Reports by Region</Text>
          <BarChart
            data={{
              labels: regionData.map(d => d.region).slice(0, 6),
              datasets: [{
                data: regionData.map(d => d.count).slice(0, 6),
              }],
            }}
            width={300}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: () => '#22c55e',
              labelColor: () => '#666',
              style: {
                borderRadius: 8,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 8,
            }}
          />
        </View>
      )}

      {trendData.length === 0 && regionData.length === 0 && (
        <View className="py-12 items-center">
          <AlertCircle size={48} className="text-gray-300 mb-4" />
          <Text className="text-gray-600">No trend data available</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderBadgesTab = () => (
    <ScrollView className="flex-1">
      {badges.length === 0 ? (
        <View className="py-12 items-center">
          <Award size={48} className="text-gray-300 mb-4" />
          <Text className="text-gray-600">No badges earned yet</Text>
          <Text className="text-gray-500 text-sm mt-2">Complete research and analysis to earn badges</Text>
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
              <Text className="text-2xl font-bold text-gray-950">My Research Activity</Text>
              <Text className="text-gray-600">View your research trends</Text>
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
                <Text className="text-2xl font-bold text-gray-950">{stats.dataAnalyzed || 0}</Text>
                <Text className="text-sm text-gray-600">Data Sets Analyzed</Text>
              </View>
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{stats.researchPublished || 0}</Text>
                <Text className="text-sm text-gray-600">Research Published</Text>
              </View>
              <View className="flex-1 bg-white border border-gray-200 rounded-lg p-4 items-center min-w-24">
                <Text className="text-2xl font-bold text-gray-950">{stats.badgesEarned || 0}</Text>
                <Text className="text-sm text-gray-600">Badges Earned</Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row border-b border-gray-200 bg-white px-4">
            {(['reports', 'trends', 'badges'] as const).map((tab) => (
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
                  {tab === 'trends' && 'Trends'}
                  {tab === 'badges' && `Badges (${badges.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View className="flex-1 px-4 py-4">
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'trends' && renderTrendsTab()}
            {activeTab === 'badges' && renderBadgesTab()}
          </View>
      </ScrollView>
    </SafeAreaView>
  );
};
