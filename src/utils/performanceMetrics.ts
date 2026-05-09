import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PerformanceRequestMetric {
  id: number;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  objectCount: number | null;
  backendRequestMs: number | null;
  backendDbMs: number | null;
  backendDbQueries: number | null;
  createdAt: number;
}

type Listener = () => void;

let enabled = false;
let settingLoaded = false;
let nextId = 1;
let metrics: PerformanceRequestMetric[] = [];
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const setPerformanceMetricsEnabled = (value: boolean) => {
  enabled = value;
  if (!value) {
    metrics = [];
  }
  notify();
};

export const isPerformanceMetricsEnabled = () => enabled;

export const subscribePerformanceMetrics = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getPerformanceMetricsSnapshot = () => metrics;

export const recordPerformanceMetric = (metric: Omit<PerformanceRequestMetric, 'id' | 'createdAt'>) => {
  if (!enabled) {
    return;
  }

  metrics = [{
    ...metric,
    id: nextId++,
    createdAt: Date.now(),
  }, ...metrics].slice(0, 8);
  notify();
};

export const countObjects = (payload: unknown): number | null => {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.data)) {
    return record.data.length;
  }

  if (Array.isArray(record.reports)) {
    return record.reports.length;
  }

  if (Array.isArray(record.events)) {
    return record.events.length;
  }

  return Object.keys(record).length;
};

export const readHeaderNumber = (headers: Headers, name: string): number | null => {
  const value = headers.get(name);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const loadPerformanceMetricsSetting = async (settingsUrl: string) => {
  if (settingLoaded) {
    return;
  }

  const token = await AsyncStorage.getItem('auth_token');
  if (!token) {
    setPerformanceMetricsEnabled(false);
    return;
  }

  try {
    const response = await fetch(settingsUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setPerformanceMetricsEnabled(false);
      return;
    }

    const settings = await response.json();
    setPerformanceMetricsEnabled(Boolean(settings?.performance_metrics_enabled));
    settingLoaded = true;
  } catch {
    setPerformanceMetricsEnabled(false);
  }
};
