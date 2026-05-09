import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Layout from '../components/Layout';
import Navigation from '../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { deviceService, DeviceSummary } from '../services/deviceService';
import { useAuth } from '../contexts/AuthContext';
import LeafletMap from '../components/LeafletMap';
import { getCurrentLocation } from '../utils/location';

const statusStyles: Record<string, { label: string; background: string; color: string }> = {
  awaiting_pair: { label: 'Awaiting pair', background: '#FEF3C7', color: '#92400E' },
  paired: { label: 'Paired', background: '#DCFCE7', color: '#166534' },
  online: { label: 'Online', background: '#DBEAFE', color: '#1D4ED8' },
  offline: { label: 'Offline', background: '#FEE2E2', color: '#B91C1C' },
};

const DevicePairingScreen = () => {
  const navigation = useNavigation<any>();
  const { requireAuth, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stationIds, setStationIds] = useState<Record<number, string>>({});
  const [deviceNames, setDeviceNames] = useState<Record<number, string>>({});
  const [selectedLocations, setSelectedLocations] = useState<Record<number, { latitude: number; longitude: number }>>({});
  const [filter, setFilter] = useState<'all' | 'discovered' | 'paired'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionDeviceId, setActionDeviceId] = useState<number | null>(null);

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = filter === 'discovered'
        ? await deviceService.listDiscoveredDevices(page, 20)
        : await deviceService.listDevices(page, 20, filter === 'paired' ? 'paired' : undefined);

      setDevices(response.data || []);
      setTotalPages(response.last_page || 1);
    } catch (error) {
      console.error('Failed to load devices:', error);
      Alert.alert('Device list unavailable', 'Unable to fetch device discovery data right now.');
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    if (!requireAuth()) {
      setIsLoading(false);
      return;
    }

    loadDevices();
  }, [loadDevices, requireAuth]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDevices();
    setIsRefreshing(false);
  }, [loadDevices]);

  const discoveredCount = useMemo(() => devices.filter((device) => device.status === 'awaiting_pair').length, [devices]);

  const handlePair = async (device: DeviceSummary) => {
    const stationId = stationIds[device.id]?.trim();

    if (!stationId) {
      Alert.alert('Station ID required', 'Enter a station ID before pairing this device.');
      return;
    }

    const location = selectedLocations[device.id];

    try {
      setActionDeviceId(device.id);
      const pairedDevice = await deviceService.pairDevice(
        device.id,
        stationId,
        deviceNames[device.id]?.trim() || device.name || undefined,
        location?.latitude,
        location?.longitude
      );
      setDevices((current) => current.map((item) => (item.id === pairedDevice.id ? pairedDevice : item)));
      Alert.alert('Device paired', `Assigned ${stationId} to ${device.mac_address}.`);
    } catch (error) {
      console.error('Pairing failed:', error);
      Alert.alert('Pairing failed', 'Laravel could not pair the selected device.');
    } finally {
      setActionDeviceId(null);
    }
  };

  const handleUseCurrentLocation = async (deviceId: number) => {
    try {
      const location = await getCurrentLocation();
      setSelectedLocations((current) => ({
        ...current,
        [deviceId]: location,
      }));
    } catch (error) {
      Alert.alert('Location unavailable', error instanceof Error ? error.message : 'Unable to get your current location.');
    }
  };

  const handleDelete = (device: DeviceSummary) => {
    Alert.alert(
      'Delete Device',
      `Delete ${device.station_id || device.mac_address}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionDeviceId(device.id);
              await deviceService.deleteDevice(device.id);
              setDevices((current) => current.filter((item) => item.id !== device.id));
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Delete failed', 'Could not remove this device.');
            } finally {
              setActionDeviceId(null);
            }
          },
        },
      ]
    );
  };

  const getMapSensors = (device: DeviceSummary) => {
    const loc = selectedLocations[device.id];
    if (!loc) return [];
    return [{
      id: String(device.id),
      name: device.name || stationIds[device.id] || 'New Sensor',
      latitude: loc.latitude,
      longitude: loc.longitude,
      waterQualityIndex: 0,
    }];
  };

  return (
    <Layout>
      <SafeAreaView className="flex-1 bg-waterbase-50">
        <Navigation title="Device Pairing" showBackButton={true} />

        {!isAdmin ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="lock-closed" size={48} color="#94A3B8" />
            <Text className="text-lg font-semibold text-waterbase-950 mt-4 mb-2">Admin Only</Text>
            <Text className="text-waterbase-700 text-center">Device pairing is restricted to administrators.</Text>
          </View>
        ) : (
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          <View className="px-4 py-6">
            <Text className="text-2xl font-bold text-waterbase-950 mb-2">
              Pair ESP32-S3 devices
            </Text>
            <Text className="text-sm text-waterbase-600 mb-4">
              Discover unpaired nodes over HTTP, then assign a station ID and location before the device switches to production mode.
            </Text>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 rounded-2xl bg-white border border-waterbase-200 p-4">
                <Text className="text-xs uppercase tracking-wide text-waterbase-500 mb-1">Discovered</Text>
                <Text className="text-2xl font-bold text-waterbase-950">{devices.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white border border-waterbase-200 p-4">
                <Text className="text-xs uppercase tracking-wide text-waterbase-500 mb-1">Awaiting pair</Text>
                <Text className="text-2xl font-bold text-enviro-700">{discoveredCount}</Text>
              </View>
            </View>

            <View className="flex-row gap-2 mb-4">
              {[
                { key: 'all', label: 'All' },
                { key: 'discovered', label: 'Discovered' },
                { key: 'paired', label: 'Paired' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  className={`flex-1 rounded-xl px-3 py-2 items-center ${filter === item.key ? 'bg-waterbase-600' : 'bg-white border border-waterbase-200'}`}
                  onPress={() => {
                    setFilter(item.key as 'all' | 'discovered' | 'paired');
                    setPage(1);
                  }}
                >
                  <Text className={`text-sm font-semibold ${filter === item.key ? 'text-white' : 'text-waterbase-700'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Card className="border-waterbase-200 mb-4">
              <CardHeader>
                <CardTitle className="text-waterbase-950">Discovery queue</CardTitle>
                <CardDescription className="text-waterbase-600">
                  Devices reported by Laravel through the HiveMQ-backed bridge.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <View className="py-10 items-center justify-center">
                    <ActivityIndicator size="small" color="#0369A1" />
                    <Text className="text-waterbase-600 mt-3">Loading devices...</Text>
                  </View>
                ) : devices.length === 0 ? (
                  <View className="py-8 items-center justify-center">
                    <Ionicons name="hardware-chip-outline" size={40} color="#94A3B8" />
                    <Text className="text-waterbase-700 font-semibold mt-3">No devices yet</Text>
                    <Text className="text-waterbase-500 text-center mt-2">
                      Wait for the ESP32-S3 to publish discovery, then pull to refresh.
                    </Text>
                  </View>
                ) : (
                  devices.map((device) => {
                    const status = statusStyles[device.status || 'offline'] || statusStyles.offline;
                    const mapSensors = getMapSensors(device);
                    const hasLocation = !!selectedLocations[device.id];

                    return (
                      <View key={device.id} className="mb-4 rounded-2xl border border-waterbase-200 bg-white p-4">
                        <View className="flex-row items-start justify-between gap-3 mb-3">
                          <View className="flex-1">
                            <Text className="text-base font-semibold text-waterbase-950">
                              {device.name || 'Unnamed device'}
                            </Text>
                            <Text className="text-xs text-waterbase-500 mt-1">
                              {device.mac_address}
                            </Text>
                          </View>

                          <View
                            className="rounded-full px-3 py-1"
                            style={{ backgroundColor: status.background }}
                          >
                            <Text className="text-xs font-semibold" style={{ color: status.color }}>
                              {status.label}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row gap-3 mb-3">
                          <View className="flex-1">
                            <Text className="text-xs text-waterbase-500 mb-1">Station ID</Text>
                            <TextInput
                              className="rounded-xl border border-waterbase-200 bg-waterbase-50 px-3 py-3 text-waterbase-950"
                              placeholder="station-demo-01"
                              placeholderTextColor="#94A3B8"
                              value={stationIds[device.id] ?? device.station_id ?? ''}
                              onChangeText={(value) => setStationIds((current) => ({ ...current, [device.id]: value }))}
                              autoCapitalize="none"
                              autoCorrect={false}
                            />
                          </View>
                        </View>

                        {device.status === 'awaiting_pair' && (
                          <View className="mb-3">
                            <Text className="text-xs text-waterbase-500 mb-1">Device Name (Optional)</Text>
                            <TextInput
                              className="rounded-xl border border-waterbase-200 bg-waterbase-50 px-3 py-3 text-waterbase-950"
                              placeholder="River Monitoring Station Alpha"
                              placeholderTextColor="#94A3B8"
                              value={deviceNames[device.id] ?? device.name ?? ''}
                              onChangeText={(value) => setDeviceNames((current) => ({ ...current, [device.id]: value }))}
                            />
                          </View>
                        )}

                        {/* Map picker for location */}
                        {device.status === 'awaiting_pair' && (
                          <View className="mb-3">
                            <Text className="text-xs text-waterbase-500 mb-1">
                              Sensor Location {hasLocation ? '(selected)' : '(tap map to set)'}
                            </Text>
                            <View className="h-40 rounded-xl overflow-hidden border border-waterbase-200">
                              <LeafletMap
                                style={{ flex: 1 }}
                                center={{ latitude: 14.5995, longitude: 120.9842 }}
                                sensors={mapSensors as any}
                                showSensors={true}
                                onSensorPress={() => {}}
                                onMapPress={(coordinate) => {
                                  setSelectedLocations((current) => ({
                                    ...current,
                                    [device.id]: coordinate,
                                  }));
                                }}
                              />
                            </View>
                            {hasLocation && (
                              <Text className="text-xs text-waterbase-500 mt-2">
                                Lat: {selectedLocations[device.id].latitude.toFixed(5)}, Lng: {selectedLocations[device.id].longitude.toFixed(5)}
                              </Text>
                            )}
                            <View className="flex-row gap-2 mt-2">
                              <TouchableOpacity
                                className="flex-1 items-center justify-center rounded-xl bg-waterbase-100 px-3 py-2"
                                onPress={() => {
                                  setSelectedLocations((current) => ({
                                    ...current,
                                    [device.id]: { latitude: 14.5995, longitude: 120.9842 },
                                  }));
                                }}
                              >
                                <Text className="text-xs text-waterbase-700 font-semibold">Set Default Location</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="flex-1 items-center justify-center rounded-xl bg-waterbase-100 px-3 py-2"
                                onPress={() => handleUseCurrentLocation(device.id)}
                              >
                                <Text className="text-xs text-waterbase-700 font-semibold">Use Current Location</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        <View className="flex-row gap-2">
                          {device.status === 'awaiting_pair' ? (
                            <TouchableOpacity
                              className="flex-1 items-center justify-center rounded-xl bg-waterbase-600 px-4 py-3"
                              onPress={() => handlePair(device)}
                              disabled={actionDeviceId === device.id}
                            >
                              <Text className="text-white font-semibold">
                                {actionDeviceId === device.id ? 'Working...' : 'Pair device'}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              className="flex-1 items-center justify-center rounded-xl bg-waterbase-600 px-4 py-3"
                              onPress={() => navigation.navigate('DeviceDetail', { deviceId: device.id })}
                            >
                              <Text className="text-white font-semibold">View</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            className="items-center justify-center rounded-xl border border-waterbase-200 px-4 py-3"
                            onPress={async () => {
                              try {
                                const latestTelemetry = await deviceService.getLatestTelemetry(device.id);
                                Alert.alert(
                                  'Latest telemetry',
                                  latestTelemetry
                                    ? `Temp: ${latestTelemetry.temperature_celsius ?? '--'}\nPH: ${latestTelemetry.ph ?? '--'}\nTurbidity: ${latestTelemetry.turbidity_ntu ?? '--'}`
                                    : 'No telemetry has been recorded yet.'
                                );
                              } catch (error) {
                                console.error('Failed to load latest telemetry:', error);
                                Alert.alert('Telemetry unavailable', 'Could not fetch the latest reading.');
                              }
                            }}
                          >
                            <Text className="text-waterbase-700 font-semibold">Latest</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            className="items-center justify-center rounded-xl bg-red-50 border border-red-200 px-4 py-3"
                            onPress={() => handleDelete(device)}
                            disabled={actionDeviceId === device.id}
                          >
                            <Text className="text-red-700 font-semibold">Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
                {totalPages > 1 && (
                  <View className="flex-row justify-center items-center gap-3 mt-2">
                    <TouchableOpacity
                      disabled={page <= 1 || isLoading}
                      onPress={() => setPage((current) => Math.max(1, current - 1))}
                      className="px-3 py-2 rounded-lg bg-waterbase-100"
                    >
                      <Text className="text-waterbase-700">Prev</Text>
                    </TouchableOpacity>
                    <Text className="text-sm text-waterbase-600">{page} / {totalPages}</Text>
                    <TouchableOpacity
                      disabled={page >= totalPages || isLoading}
                      onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                      className="px-3 py-2 rounded-lg bg-waterbase-100"
                    >
                      <Text className="text-waterbase-700">Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </CardContent>
            </Card>
          </View>
        </ScrollView>
        )}
      </SafeAreaView>
    </Layout>
  );
};

export default DevicePairingScreen;
