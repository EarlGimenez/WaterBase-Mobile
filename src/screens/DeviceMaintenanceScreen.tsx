import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { deviceService, DeviceSummary } from '../services/deviceService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Navigation from '../components/Navigation';

interface Props {
  navigation: any;
}

const DeviceMaintenanceScreen: React.FC<Props> = ({ navigation }) => {
  const { requireAuth } = useAuth();
  const [overdueDevices, setOverdueDevices] = useState<DeviceSummary[]>([]);
  const [upcomingDevices, setUpcomingDevices] = useState<DeviceSummary[]>([]);
  const [allDevices, setAllDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [overdue, upcoming] = await Promise.all([
        deviceService.getOverdueDevices(),
        deviceService.getUpcomingDevices(14),
      ]);
      setOverdueDevices(overdue.devices);
      setUpcomingDevices(upcoming.devices);

      const paired = await deviceService.getPairedDevices();
      setAllDevices(paired);
    } catch (error) {
      console.error('Failed to load maintenance data:', error);
      Alert.alert('Error', 'Failed to load maintenance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!requireAuth()) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, requireAuth]);

  const getHealthColor = (device: DeviceSummary): string => {
    if (device.status === 'offline') return '#ef4444';
    const nextDue = device.maintenance_schedule?.next_due_at;
    if (nextDue) {
      const diffDays = Math.ceil((new Date(nextDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return '#ef4444';
      if (diffDays <= 14) return '#eab308';
    }
    if (device.anomaly_flags && device.anomaly_flags.length > 0) return '#eab308';
    return '#22c55e';
  };

  const getHealthLabel = (device: DeviceSummary): string => {
    if (device.status === 'offline') return 'Offline';
    const nextDue = device.maintenance_schedule?.next_due_at;
    if (nextDue) {
      const diffDays = Math.ceil((new Date(nextDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'Overdue';
      if (diffDays <= 14) return 'Due Soon';
    }
    if (device.anomaly_flags && device.anomaly_flags.length > 0) return 'Anomaly';
    return 'Healthy';
  };

  const renderAlertCard = (device: DeviceSummary, type: 'time' | 'anomaly') => (
    <TouchableOpacity
      key={device.id}
      onPress={() => navigation.navigate('DeviceDetail', { deviceId: device.id })}
    >
      <Card className="mb-3">
        <CardContent className="p-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: getHealthColor(device) }}
              />
              <View className="flex-1">
                <Text className="font-medium text-gray-800">{device.name || device.station_id}</Text>
                <Text className="text-xs text-gray-500">
                  {type === 'time' && device.maintenance_schedule?.next_due_at
                    ? `Due: ${new Date(device.maintenance_schedule.next_due_at).toLocaleDateString()}`
                    : device.anomaly_flags && device.anomaly_flags.length > 0
                      ? `Anomaly: ${device.anomaly_flags[device.anomaly_flags.length - 1].reasons.join(', ')}`
                      : 'Issue detected'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-waterbase-50">
        <Navigation title="Maintenance" showBackButton={true} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#0369A1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-waterbase-50">
      <Navigation title="Device Maintenance" showBackButton={true} />
      <ScrollView className="flex-1 px-4 py-6">
        {/* Summary cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 rounded-2xl bg-white border border-waterbase-200 p-4">
            <Text className="text-xs uppercase tracking-wide text-waterbase-500 mb-1">Overdue</Text>
            <Text className="text-2xl font-bold text-red-600">{overdueDevices.length}</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white border border-waterbase-200 p-4">
            <Text className="text-xs uppercase tracking-wide text-waterbase-500 mb-1">Due Soon</Text>
            <Text className="text-2xl font-bold text-yellow-600">{upcomingDevices.length}</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white border border-waterbase-200 p-4">
            <Text className="text-xs uppercase tracking-wide text-waterbase-500 mb-1">Healthy</Text>
            <Text className="text-2xl font-bold text-green-600">
              {allDevices.filter((d) => !overdueDevices.some((o) => o.id === d.id) && !upcomingDevices.some((u) => u.id === d.id)).length}
            </Text>
          </View>
        </View>

        {/* Calibration Alerts */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Calibration Alerts</Text>
        {[...overdueDevices, ...upcomingDevices].length === 0 ? (
          <Text className="text-sm text-gray-500 mb-6">No calibration alerts.</Text>
        ) : (
          [...overdueDevices, ...upcomingDevices].map((d) => renderAlertCard(d, 'time'))
        )}

        {/* Anomaly Alerts */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Anomaly Alerts</Text>
        {allDevices.filter((d) => d.anomaly_flags && d.anomaly_flags.length > 0 && !overdueDevices.some((o) => o.id === d.id)).length === 0 ? (
          <Text className="text-sm text-gray-500">No anomaly alerts.</Text>
        ) : (
          allDevices
            .filter((d) => d.anomaly_flags && d.anomaly_flags.length > 0 && !overdueDevices.some((o) => o.id === d.id))
            .map((d) => renderAlertCard(d, 'anomaly'))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeviceMaintenanceScreen;
