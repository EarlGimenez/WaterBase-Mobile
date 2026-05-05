import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';
import { deviceService, DeviceSummary, MaintenanceLog, ActivityLog } from '../services/deviceService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Navigation from '../components/Navigation';
import LeafletMap from '../components/LeafletMap';

interface Props {
  route: { params: { deviceId: number } };
  navigation: any;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  telemetry_received: 'Telemetry Received',
  command_sent: 'Command Sent',
  paired: 'Device Paired',
  calibration_recorded: 'Calibration Recorded',
  anomaly_detected: 'Anomaly Detected',
  status_changed: 'Status Changed',
  location_updated: 'Location Updated',
  maintenance_due: 'Maintenance Due',
  offline_marked: 'Marked Offline',
};

const DeviceDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { deviceId } = route.params;
  const { requireAuth } = useAuth();
  const [device, setDevice] = useState<DeviceSummary | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveReadLoading, setLiveReadLoading] = useState(false);

  // Calibrate modal
  const [calibrateModalOpen, setCalibrateModalOpen] = useState(false);
  const [calibrateNotes, setCalibrateNotes] = useState('');
  const [calibrateLoading, setCalibrateLoading] = useState(false);

  // Schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleInterval, setScheduleInterval] = useState(30);
  const [scheduleReminder, setScheduleReminder] = useState(14);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Telemetry pagination
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [telemetryPage, setTelemetryPage] = useState(1);
  const [telemetryLastPage, setTelemetryLastPage] = useState(1);
  const [telemetryLoading, setTelemetryLoading] = useState(false);

  // Activity logs pagination
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityLastPage, setActivityLastPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchDevice = useCallback(async () => {
    try {
      setLoading(true);
      const d = await deviceService.getDevice(deviceId);
      setDevice(d);
      if (d.maintenance_schedule) {
        setScheduleInterval(d.maintenance_schedule.calibration_interval_days);
        setScheduleReminder(d.maintenance_schedule.reminder_days_before);
      }
      const maintenance = await deviceService.getMaintenance(deviceId);
      setLogs(maintenance.logs);
      await fetchTelemetry(1);
      await fetchActivityLogs(1);
    } catch (error) {
      console.error('Failed to load device:', error);
      Alert.alert('Error', 'Failed to load device details.');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const fetchTelemetry = async (page: number) => {
    try {
      setTelemetryLoading(true);
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/devices/${deviceId}/telemetry?page=${page}&per_page=10`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem('auth_token')}`,
          },
        }
      );
      const data = await response.json();
      setTelemetryData(data.data || []);
      setTelemetryPage(data.current_page || 1);
      setTelemetryLastPage(data.last_page || 1);
    } catch (e) {
      console.error('Failed to load telemetry:', e);
    } finally {
      setTelemetryLoading(false);
    }
  };

  const fetchActivityLogs = async (page: number) => {
    try {
      setActivityLoading(true);
      const data = await deviceService.getActivityLogs(deviceId, page, 10);
      setActivityLogs(data.data);
      setActivityPage(data.current_page);
      setActivityLastPage(data.last_page);
    } catch (e) {
      console.error('Failed to load activity logs:', e);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    if (!requireAuth()) {
      setLoading(false);
      return;
    }
    fetchDevice();
  }, [fetchDevice, requireAuth]);

  const handleLiveRead = async () => {
    try {
      setLiveReadLoading(true);
      await deviceService.requestLiveRead(deviceId);
      Alert.alert('Live Read Requested', 'The device should publish fresh telemetry shortly.');
      setTimeout(() => fetchDevice(), 4000);
    } catch (error) {
      Alert.alert('Error', 'Failed to request live reading.');
    } finally {
      setLiveReadLoading(false);
    }
  };

  const handleCalibrate = async () => {
    try {
      setCalibrateLoading(true);
      await deviceService.calibrate(deviceId, calibrateNotes.trim() || undefined);
      setCalibrateModalOpen(false);
      setCalibrateNotes('');
      fetchDevice();
      Alert.alert('Success', 'Calibration recorded.');
    } catch (error) {
      Alert.alert('Error', 'Failed to record calibration.');
    } finally {
      setCalibrateLoading(false);
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      setScheduleLoading(true);
      await deviceService.updateMaintenanceSchedule(deviceId, scheduleInterval, scheduleReminder);
      setScheduleModalOpen(false);
      fetchDevice();
      Alert.alert('Success', 'Maintenance schedule updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update schedule.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'paired':
      case 'online':
        return '#22c55e';
      case 'offline':
        return '#ef4444';
      default:
        return '#eab308';
    }
  };

  const getCalibrationColor = (nextDueAt?: string | null) => {
    if (!nextDueAt) return '#6b7280';
    const due = new Date(nextDueAt);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return '#ef4444';
    if (diffDays <= 14) return '#eab308';
    return '#22c55e';
  };

  if (loading || !device) {
    return (
      <SafeAreaView className="flex-1 bg-waterbase-50">
        <Navigation title="Device Detail" showBackButton={true} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#0369A1" />
        </View>
      </SafeAreaView>
    );
  }

  const sensors = device.latitude && device.longitude
    ? [{
        id: String(device.id),
        name: device.name || device.station_id || 'Device',
        latitude: device.latitude,
        longitude: device.longitude,
        waterQualityIndex: 0,
      }]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-waterbase-50">
      <Navigation title={device.name || 'Device Detail'} showBackButton={true} />
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          {/* Header */}
          <View className="mb-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-waterbase-950">{device.name || device.station_id || 'Unnamed'}</Text>
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: getStatusColor(device.status) + '20' }}
              >
                <Text className="text-xs font-semibold" style={{ color: getStatusColor(device.status) }}>
                  {device.status}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-waterbase-600 mt-1">Station: {device.station_id || 'N/A'}</Text>
            <Text className="text-sm text-waterbase-600">MAC: {device.mac_address}</Text>
          </View>

          {/* Map */}
          {device.latitude && device.longitude ? (
            <View className="h-48 rounded-xl overflow-hidden mb-4 border border-waterbase-200">
              <LeafletMap
                style={{ flex: 1 }}
                center={{ latitude: device.latitude, longitude: device.longitude }}
                sensors={sensors as any}
                showSensors={true}
              />
            </View>
          ) : null}

          {/* Actions */}
          <View className="flex-row gap-2 mb-4 flex-wrap">
            <TouchableOpacity
              className="flex-1 min-w-[120px] items-center justify-center rounded-xl bg-waterbase-600 px-4 py-3"
              onPress={handleLiveRead}
              disabled={liveReadLoading}
            >
              <Text className="text-white font-semibold">
                {liveReadLoading ? 'Requesting...' : 'Request Live Reading'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 min-w-[120px] items-center justify-center rounded-xl border border-waterbase-200 px-4 py-3"
              onPress={() => setCalibrateModalOpen(true)}
            >
              <Text className="text-waterbase-700 font-semibold">Record Calibration</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 min-w-[120px] items-center justify-center rounded-xl border border-waterbase-200 px-4 py-3"
              onPress={() => setScheduleModalOpen(true)}
            >
              <Text className="text-waterbase-700 font-semibold">Edit Schedule</Text>
            </TouchableOpacity>
          </View>

          {/* Telemetry */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-waterbase-950">Latest Telemetry</CardTitle>
            </CardHeader>
            <CardContent>
              {device.latest_telemetry ? (
                <View className="flex-row flex-wrap gap-3">
                  <View className="flex-1 min-w-[100px] rounded-lg bg-waterbase-50 p-3">
                    <Text className="text-xs text-waterbase-500">Temperature</Text>
                    <Text className="text-lg font-bold text-waterbase-950">
                      {device.latest_telemetry.temperature_celsius ?? '--'}°C
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[100px] rounded-lg bg-waterbase-50 p-3">
                    <Text className="text-xs text-waterbase-500">pH</Text>
                    <Text className="text-lg font-bold text-waterbase-950">
                      {device.latest_telemetry.ph ?? '--'}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[100px] rounded-lg bg-waterbase-50 p-3">
                    <Text className="text-xs text-waterbase-500">Turbidity</Text>
                    <Text className="text-lg font-bold text-waterbase-950">
                      {device.latest_telemetry.turbidity_ntu ?? '--'} NTU
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[100px] rounded-lg bg-waterbase-50 p-3">
                    <Text className="text-xs text-waterbase-500">TDS</Text>
                    <Text className="text-lg font-bold text-waterbase-950">
                      {device.latest_telemetry.tds_mg_l ?? '--'} mg/L
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[100px] rounded-lg bg-waterbase-50 p-3">
                    <Text className="text-xs text-waterbase-500">Latency</Text>
                    <Text className="text-lg font-bold text-waterbase-950">
                      {device.latest_telemetry.latency_ms != null ? `${device.latest_telemetry.latency_ms} ms` : '--'}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text className="text-waterbase-500">No telemetry available.</Text>
              )}
            </CardContent>
          </Card>

          {/* Telemetry History with pagination */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-waterbase-950">Telemetry History</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetryLoading ? (
                <ActivityIndicator size="small" color="#0369A1" />
              ) : telemetryData.length === 0 ? (
                <Text className="text-waterbase-500">No telemetry history.</Text>
              ) : (
                <View>
                  {telemetryData.map((t: any) => (
                    <View key={t.id} className="mb-2 p-2 rounded-lg bg-waterbase-50">
                      <Text className="text-xs text-waterbase-500">
                        Recorded: {new Date(t.recorded_at).toLocaleString()}
                        {t.received_at ? ` · Received: ${new Date(t.received_at).toLocaleString()}` : ''}
                        {t.latency_ms != null ? ` · Latency: ${t.latency_ms}ms` : ''}
                      </Text>
                      <Text className="text-sm text-waterbase-950 mt-1">
                        Temp: {t.temperature_celsius ?? '--'}°C · pH: {t.ph ?? '--'} · Turb: {t.turbidity_ntu ?? '--'} NTU · TDS: {t.tds_mg_l ?? '--'} mg/L
                      </Text>
                    </View>
                  ))}
                  {telemetryLastPage > 1 && (
                    <View className="flex-row justify-center items-center gap-3 mt-3">
                      <TouchableOpacity
                        disabled={telemetryPage <= 1 || telemetryLoading}
                        onPress={() => fetchTelemetry(telemetryPage - 1)}
                        className="px-3 py-2 rounded-lg bg-waterbase-100"
                      >
                        <Text className="text-waterbase-700">Prev</Text>
                      </TouchableOpacity>
                      <Text className="text-sm text-waterbase-600">{telemetryPage} / {telemetryLastPage}</Text>
                      <TouchableOpacity
                        disabled={telemetryPage >= telemetryLastPage || telemetryLoading}
                        onPress={() => fetchTelemetry(telemetryPage + 1)}
                        className="px-3 py-2 rounded-lg bg-waterbase-100"
                      >
                        <Text className="text-waterbase-700">Next</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-waterbase-950">Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="mb-3">
                <Text className="text-sm text-waterbase-600">Next Calibration Due</Text>
                <Text
                  className="text-lg font-bold"
                  style={{ color: getCalibrationColor(device.maintenance_schedule?.next_due_at) }}
                >
                  {device.maintenance_schedule?.next_due_at
                    ? new Date(device.maintenance_schedule.next_due_at).toLocaleDateString()
                    : 'Not scheduled'}
                </Text>
                <Text className="text-xs text-waterbase-500">
                  Interval: {device.maintenance_schedule?.calibration_interval_days ?? 30} days · Reminder: {device.maintenance_schedule?.reminder_days_before ?? 14} days before
                </Text>
              </View>
              <Text className="text-sm font-semibold text-waterbase-950 mb-2">History</Text>
              {logs.length === 0 ? (
                <Text className="text-waterbase-500 text-sm">No records yet.</Text>
              ) : (
                logs.map((log) => (
                  <View key={log.id} className="mb-2 p-2 rounded-lg bg-waterbase-50">
                    <Text className="text-sm font-medium capitalize">{log.maintenance_type}</Text>
                    <Text className="text-xs text-waterbase-500">{new Date(log.performed_at).toLocaleString()}</Text>
                    {log.notes ? <Text className="text-xs text-waterbase-600 mt-1">{log.notes}</Text> : null}
                  </View>
                ))
              )}
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-waterbase-950">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <ActivityIndicator size="small" color="#0369A1" />
              ) : activityLogs.length === 0 ? (
                <Text className="text-waterbase-500">No activity recorded yet.</Text>
              ) : (
                <View>
                  {activityLogs.map((log) => (
                    <View key={log.id} className="mb-2 p-2 rounded-lg bg-waterbase-50">
                      <Text className="text-sm font-medium">
                        {EVENT_TYPE_LABELS[log.event_type] || log.event_type}
                      </Text>
                      <Text className="text-xs text-waterbase-500">
                        {new Date(log.created_at).toLocaleString()}
                      </Text>
                      {log.description ? (
                        <Text className="text-xs text-waterbase-600 mt-1">{log.description}</Text>
                      ) : null}
                    </View>
                  ))}
                  {activityLastPage > 1 && (
                    <View className="flex-row justify-center items-center gap-3 mt-3">
                      <TouchableOpacity
                        disabled={activityPage <= 1 || activityLoading}
                        onPress={() => fetchActivityLogs(activityPage - 1)}
                        className="px-3 py-2 rounded-lg bg-waterbase-100"
                      >
                        <Text className="text-waterbase-700">Prev</Text>
                      </TouchableOpacity>
                      <Text className="text-sm text-waterbase-600">{activityPage} / {activityLastPage}</Text>
                      <TouchableOpacity
                        disabled={activityPage >= activityLastPage || activityLoading}
                        onPress={() => fetchActivityLogs(activityPage + 1)}
                        className="px-3 py-2 rounded-lg bg-waterbase-100"
                      >
                        <Text className="text-waterbase-700">Next</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* Calibrate Modal */}
      <Modal
        visible={calibrateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCalibrateModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-800 mb-4">Record Calibration</Text>
            <TextInput
              placeholder="Notes (optional)"
              value={calibrateNotes}
              onChangeText={setCalibrateNotes}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 mb-4"
              multiline
            />
            <View className="flex-row gap-2">
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setCalibrateModalOpen(false)}
                className="flex-1"
              />
              <Button
                title={calibrateLoading ? 'Saving...' : 'Save'}
                onPress={handleCalibrate}
                disabled={calibrateLoading}
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        visible={scheduleModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-800 mb-4">Edit Maintenance Schedule</Text>

            <Text className="text-sm text-gray-600 mb-2">Calibration Interval</Text>
            {[
              { label: '7 days (Weekly)', value: 7 },
              { label: '14 days (Bi-weekly)', value: 14 },
              { label: '30 days (Monthly)', value: 30 },
              { label: '60 days (Bi-monthly)', value: 60 },
              { label: '90 days (Quarterly)', value: 90 },
              { label: '180 days (Semi-annually)', value: 180 },
              { label: '365 days (Annually)', value: 365 },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setScheduleInterval(opt.value)}
                className={`flex-row items-center justify-between px-4 py-3 rounded-lg mb-2 border ${
                  scheduleInterval === opt.value ? 'bg-waterbase-50 border-waterbase-300' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text className={`text-sm ${scheduleInterval === opt.value ? 'text-waterbase-700 font-semibold' : 'text-gray-700'}`}>
                  {opt.label}
                </Text>
                {scheduleInterval === opt.value && (
                  <Ionicons name="checkmark-circle" size={20} color="#0369A1" />
                )}
              </TouchableOpacity>
            ))}

            <Text className="text-sm text-gray-600 mb-2 mt-4">Reminder Lead Time</Text>
            {[
              { label: '1 day before', value: 1 },
              { label: '3 days before', value: 3 },
              { label: '1 week before', value: 7 },
              { label: '2 weeks before', value: 14 },
              { label: '1 month before', value: 30 },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setScheduleReminder(opt.value)}
                className={`flex-row items-center justify-between px-4 py-3 rounded-lg mb-2 border ${
                  scheduleReminder === opt.value ? 'bg-waterbase-50 border-waterbase-300' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text className={`text-sm ${scheduleReminder === opt.value ? 'text-waterbase-700 font-semibold' : 'text-gray-700'}`}>
                  {opt.label}
                </Text>
                {scheduleReminder === opt.value && (
                  <Ionicons name="checkmark-circle" size={20} color="#0369A1" />
                )}
              </TouchableOpacity>
            ))}

            <View className="flex-row gap-2 mt-4">
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setScheduleModalOpen(false)}
                className="flex-1"
              />
              <Button
                title={scheduleLoading ? 'Saving...' : 'Update'}
                onPress={handleUpdateSchedule}
                disabled={scheduleLoading}
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DeviceDetailScreen;
