import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import Navigation from '../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { deviceService, DeviceSummary } from '../services/deviceService';
import { useAuth } from '../contexts/AuthContext';
import LeafletMap from '../components/LeafletMap';

const statusStyles: Record<string, { label: string; background: string; color: string }> = {
  awaiting_pair: { label: 'Awaiting pair', background: '#FEF3C7', color: '#92400E' },
  paired: { label: 'Paired', background: '#DCFCE7', color: '#166534' },
  online: { label: 'Online', background: '#DBEAFE', color: '#1D4ED8' },
  offline: { label: 'Offline', background: '#FEE2E2', color: '#B91C1C' },
};

const DevicePairingScreen = () => {
  const { requireAuth } = useAuth();
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stationIds, setStationIds] = useState<Record<number, string>>({});
  const [selectedLocations, setSelectedLocations] = useState<Record<number, { latitude: number; longitude: number }>>({});

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const discovered = await deviceService.getDiscoveredDevices();
      const paired = await deviceService.getPairedDevices();
      const merged = [...discovered, ...paired].reduce<DeviceSummary[]>((accumulator, device) => {
        if (!accumulator.some((item) => item.id === device.id)) {
          accumulator.push(device);
        }
        return accumulator;
      }, []);

      merged.sort((a, b) => {
        const aTime = new Date(a.discovery_last_seen_at || a.last_seen_at || 0).getTime();
        const bTime = new Date(b.discovery_last_seen_at || b.last_seen_at || 0).getTime();
        return bTime - aTime;
      });

      setDevices(merged);
    } catch (error) {
      console.error('Failed to load devices:', error);
      Alert.alert('Device list unavailable', 'Unable to fetch device discovery data right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      const pairedDevice = await deviceService.pairDevice(
        device.id,
        stationId,
        device.name || undefined,
        location?.latitude,
        location?.longitude
      );
      setDevices((current) => current.map((item) => (item.id === pairedDevice.id ? pairedDevice : item)));
      Alert.alert('Device paired', `Assigned ${stationId} to ${device.mac_address}.`);
    } catch (error) {
      console.error('Pairing failed:', error);
      Alert.alert('Pairing failed', 'Laravel could not pair the selected device.');
    }
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
                              />
                            </View>
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
                                onPress={() => {
                                  // In a real implementation, this would use expo-location
                                  setSelectedLocations((current) => ({
                                    ...current,
                                    [device.id]: { latitude: 14.5995 + (Math.random() - 0.5) * 0.1, longitude: 120.9842 + (Math.random() - 0.5) * 0.1 },
                                  }));
                                }}
                              >
                                <Text className="text-xs text-waterbase-700 font-semibold">Pick Random Nearby</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            className="flex-1 items-center justify-center rounded-xl bg-waterbase-600 px-4 py-3"
                            onPress={() => handlePair(device)}
                          >
                            <Text className="text-white font-semibold">Pair device</Text>
                          </TouchableOpacity>

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
                        </View>
                      </View>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
};

export default DevicePairingScreen;
