import { API_ENDPOINTS, API_CONFIG, apiRequest } from '../config/api';

export interface DeviceTelemetry {
  id: number;
  device_id?: number;
  recorded_at?: string;
  received_at?: string;
  latency_ms?: number | null;
  temperature_celsius?: number | string | null;
  ph?: number | string | null;
  turbidity_ntu?: number | string | null;
  tds_mg_l?: number | string | null;
  water_level_cm?: number | string | null;
  dissolved_oxygen_mg_l?: number | string | null;
  conductivity_us_cm?: number | string | null;
  raw_payload?: Record<string, unknown> | null;
}

export interface DeviceSummary {
  id: number;
  mac_address: string;
  station_id?: string | null;
  name?: string | null;
  status?: string;
  discovery_last_seen_at?: string | null;
  last_seen_at?: string | null;
  paired_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  telemetry_count?: number;
  latest_telemetry?: DeviceTelemetry | null;
  maintenance_schedule?: MaintenanceSchedule | null;
  anomaly_flags?: Array<{ reasons: string[]; recorded_at: string }> | null;
}

export interface MaintenanceSchedule {
  id: number;
  device_id: number;
  calibration_interval_days: number;
  reminder_days_before: number;
  last_calibrated_at: string | null;
  next_due_at: string | null;
  reminder_sent_at: string | null;
}

export interface MaintenanceLog {
  id: number;
  device_id: number;
  performed_by_user_id: number | null;
  maintenance_type: string;
  notes: string | null;
  performed_at: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  device_id: number;
  user_id: number | null;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

export interface MapSensor {
  id: number;
  station_id: string | null;
  name: string | null;
  latitude: number;
  longitude: number;
  status: string;
  last_seen_at: string | null;
  latest_telemetry: DeviceTelemetry | null;
}

export interface DailyMetrics {
  id: number;
  device_id: number;
  date: string;
  avg_ph: number | null;
  avg_tds_mg_l: number | null;
  avg_turbidity_ntu: number | null;
  avg_temp_celsius: number | null;
  min_ph: number | null;
  max_ph: number | null;
  min_tds_mg_l: number | null;
  max_tds_mg_l: number | null;
  min_turbidity_ntu: number | null;
  max_turbidity_ntu: number | null;
  reading_count: number;
}

export interface MonthlyMetrics {
  id: number;
  device_id: number;
  year_month: string;
  avg_ph: number | null;
  avg_tds_mg_l: number | null;
  avg_turbidity_ntu: number | null;
  avg_temp_celsius: number | null;
  min_ph: number | null;
  max_ph: number | null;
  min_tds_mg_l: number | null;
  max_tds_mg_l: number | null;
  min_turbidity_ntu: number | null;
  max_turbidity_ntu: number | null;
  reading_count: number;
}

export interface LatencyMetrics {
  device_id: number;
  station_id: string | null;
  message_count: number;
  average_latency_ms: number | null;
  min_latency_ms: number | null;
  max_latency_ms: number | null;
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  p99_latency_ms: number | null;
  std_dev_ms: number | null;
  period: {
    from: string | null;
    to: string | null;
  };
}

export interface HourlyTrend {
  hour: string;
  message_count: number;
  average_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
}

export interface DeliveryMetrics {
  period: {
    from: string;
    to: string;
    days: number;
  };
  expected_messages: number;
  actual_messages: number;
  delivery_rate_percent: number;
  missing_messages: number;
}

export interface PerformanceReport {
  device: {
    id: number;
    mac_address: string;
    station_id: string | null;
    status: string;
    paired_at: string | null;
  };
  period: {
    from: string;
    to: string;
    duration_days: number;
  };
  latency_metrics: LatencyMetrics;
  delivery_metrics: DeliveryMetrics;
  hourly_trends: HourlyTrend[];
  generated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export const deviceService = {
  async listDevices(page = 1, perPage = 20, status?: string): Promise<PaginatedResponse<DeviceSummary>> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await apiRequest(`${API_ENDPOINTS.DEVICES}?${params.toString()}`, { method: 'GET' });
    return response.json();
  },

  async listDiscoveredDevices(page = 1, perPage = 20): Promise<PaginatedResponse<DeviceSummary>> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });

    const response = await apiRequest(`${API_ENDPOINTS.DEVICES_DISCOVERED}?${params.toString()}`, { method: 'GET' });
    return response.json();
  },

  async getDiscoveredDevices(): Promise<DeviceSummary[]> {
    const response = await apiRequest(API_ENDPOINTS.DEVICES_DISCOVERED, { method: 'GET' });
    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  },

  async getPairedDevices(): Promise<DeviceSummary[]> {
    const response = await apiRequest(API_ENDPOINTS.DEVICES, { method: 'GET' });
    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  },

  async getDevice(deviceId: number): Promise<DeviceSummary> {
    const response = await apiRequest(API_ENDPOINTS.DEVICE(deviceId), { method: 'GET' });
    const payload = await response.json();
    return payload.device;
  },

  async pairDevice(deviceId: number, stationId: string, name?: string, latitude?: number, longitude?: number): Promise<DeviceSummary> {
    const response = await apiRequest(API_ENDPOINTS.DEVICE_PAIR(deviceId), {
      method: 'POST',
      body: JSON.stringify({
        station_id: stationId,
        name,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      }),
    });

    const payload = await response.json();
    return payload.device;
  },

  async updateLocation(deviceId: number, latitude: number, longitude: number): Promise<DeviceSummary> {
    const response = await apiRequest(API_ENDPOINTS.DEVICE_LOCATION(deviceId), {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
    const payload = await response.json();
    return payload.device;
  },

  async calibrate(deviceId: number, notes?: string): Promise<{ log: MaintenanceLog; schedule: MaintenanceSchedule }> {
    const response = await apiRequest(API_ENDPOINTS.DEVICE_CALIBRATE(deviceId), {
      method: 'POST',
      body: JSON.stringify({ notes: notes || null }),
    });
    return response.json();
  },

  async getMaintenance(deviceId: number): Promise<{ schedule: MaintenanceSchedule | null; logs: MaintenanceLog[] }> {
    const response = await apiRequest(API_ENDPOINTS.DEVICE_MAINTENANCE(deviceId), { method: 'GET' });
    return response.json();
  },

  async updateMaintenanceSchedule(deviceId: number, intervalDays: number, reminderDays: number): Promise<MaintenanceSchedule> {
    const response = await apiRequest(API_ENDPOINTS.DEVICE_MAINTENANCE_SCHEDULE(deviceId), {
      method: 'PUT',
      body: JSON.stringify({
        calibration_interval_days: intervalDays,
        reminder_days_before: reminderDays,
      }),
    });
    const payload = await response.json();
    return payload.schedule;
  },

  async deleteDevice(deviceId: number): Promise<void> {
    await apiRequest(API_ENDPOINTS.DEVICE(deviceId), { method: 'DELETE' });
  },

  async getActivityLogs(deviceId: number, page = 1, perPage = 20): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiRequest(`${API_ENDPOINTS.DEVICE_ACTIVITY_LOGS(deviceId)}?page=${page}&per_page=${perPage}`, { method: 'GET' });
    return response.json();
  },

  async getOverdueDevices(): Promise<{ devices: DeviceSummary[] }> {
    const response = await apiRequest(API_ENDPOINTS.DEVICES_MAINTENANCE_OVERDUE, { method: 'GET' });
    return response.json();
  },

  async getUpcomingDevices(days = 14): Promise<{ devices: DeviceSummary[] }> {
    const response = await apiRequest(`${API_ENDPOINTS.DEVICES_MAINTENANCE_UPCOMING}?days=${days}`, { method: 'GET' });
    return response.json();
  },

  async getLatestTelemetry(deviceId: number): Promise<DeviceTelemetry | null> {
    const response = await apiRequest(API_ENDPOINTS.DEVICE_TELEMETRY_LATEST(deviceId), { method: 'GET' });
    const payload = await response.json();
    return payload?.latest_telemetry ?? null;
  },

  async getTelemetryHistory(deviceId: number, page = 1, perPage = 50): Promise<PaginatedResponse<DeviceTelemetry>> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    const response = await apiRequest(`${API_ENDPOINTS.DEVICE_TELEMETRY_HISTORY(deviceId)}?${params.toString()}`, { method: 'GET' });
    return response.json();
  },

  async getDailyMetrics(deviceId: number, from?: string, to?: string): Promise<DailyMetrics[]> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    const response = await apiRequest(`${API_ENDPOINTS.DEVICE_METRICS_DAILY(deviceId)}${query ? `?${query}` : ''}`, { method: 'GET' });
    return response.json();
  },

  async getMonthlyMetrics(deviceId: number, from?: string, to?: string): Promise<MonthlyMetrics[]> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    const response = await apiRequest(`${API_ENDPOINTS.DEVICE_METRICS_MONTHLY(deviceId)}${query ? `?${query}` : ''}`, { method: 'GET' });
    return response.json();
  },

  async triggerCommand(deviceId: number, commandType: 'pairing_confirmation' | 'live_read', payload: Record<string, unknown> = {}): Promise<void> {
    await apiRequest(API_ENDPOINTS.DEVICE_COMMANDS(deviceId), {
      method: 'POST',
      body: JSON.stringify({
        command_type: commandType,
        payload,
      }),
    });
  },

  async requestLiveRead(deviceId: number): Promise<void> {
    await apiRequest(API_ENDPOINTS.DEVICE_LIVE_READ(deviceId), { method: 'POST' });
  },

  async getMapSensors(): Promise<MapSensor[]> {
    const response = await apiRequest(API_ENDPOINTS.DEVICES_MAP, { method: 'GET' });
    return response.json();
  },

  async getPerformanceMetrics(deviceId: number, from?: string, to?: string): Promise<LatencyMetrics> {
    const params = new URLSearchParams({ report_type: 'metrics' });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const response = await apiRequest(`${API_CONFIG.BASE_URL}/devices/${deviceId}/performance?${params.toString()}`, { method: 'GET' });
    return response.json();
  },

  async getPerformanceTrends(deviceId: number, from?: string, to?: string): Promise<HourlyTrend[]> {
    const params = new URLSearchParams({ report_type: 'trends' });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const response = await apiRequest(`${API_CONFIG.BASE_URL}/devices/${deviceId}/performance?${params.toString()}`, { method: 'GET' });
    return response.json();
  },

  async getDeliveryMetrics(deviceId: number, from?: string, to?: string): Promise<DeliveryMetrics> {
    const params = new URLSearchParams({ report_type: 'delivery' });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const response = await apiRequest(`${API_CONFIG.BASE_URL}/devices/${deviceId}/performance?${params.toString()}`, { method: 'GET' });
    return response.json();
  },

  async getFullPerformanceReport(deviceId: number, from?: string, to?: string): Promise<PerformanceReport> {
    const params = new URLSearchParams({ report_type: 'full' });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const response = await apiRequest(`${API_CONFIG.BASE_URL}/devices/${deviceId}/performance?${params.toString()}`, { method: 'GET' });
    return response.json();
  },
};
