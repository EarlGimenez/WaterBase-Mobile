import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  getPerformanceMetricsSnapshot,
  isPerformanceMetricsEnabled,
  subscribePerformanceMetrics,
} from '../utils/performanceMetrics';

const formatMs = (value: number | null | undefined) => (
  typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}ms` : 'n/a'
);

const PerformanceReadout: React.FC = () => {
  const route = useRoute();
  const [enabled, setEnabled] = useState(isPerformanceMetricsEnabled());
  const [screenMs, setScreenMs] = useState<number | null>(null);
  const [metricsVersion, setMetricsVersion] = useState(0);

  useEffect(() => {
    return subscribePerformanceMetrics(() => {
      setEnabled(isPerformanceMetricsEnabled());
      setMetricsVersion((value) => value + 1);
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setScreenMs(null);
      return;
    }

    const startedAt = Date.now();
    const timeoutId = setTimeout(() => {
      setScreenMs(Date.now() - startedAt);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [enabled, route.name]);

  const latestMetric = useMemo(() => {
    void metricsVersion;
    return getPerformanceMetricsSnapshot()[0] ?? null;
  }, [metricsVersion]);

  if (!enabled) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      className="absolute left-3 right-3 rounded-lg border border-waterbase-200 bg-white/95 px-3 py-2"
      style={{ bottom: 112 }}
    >
      <Text className="text-xs font-semibold text-waterbase-950">Performance testing</Text>
      <Text className="text-[11px] text-gray-700">Screen loaded: {formatMs(screenMs)}</Text>
      <Text className="text-[11px] text-gray-700">
        Objects taken: {latestMetric?.objectCount ?? 'n/a'} in {formatMs(latestMetric?.durationMs)}
      </Text>
      {latestMetric && (
        <Text className="text-[10px] text-gray-500" numberOfLines={1}>
          {latestMetric.method} {latestMetric.path} ({latestMetric.status}) | DB {formatMs(latestMetric.backendDbMs)}
          {typeof latestMetric.backendDbQueries === 'number' ? `, ${latestMetric.backendDbQueries} queries` : ''}
        </Text>
      )}
    </View>
  );
};

export default PerformanceReadout;
