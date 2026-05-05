import { API_ENDPOINTS, API_CONFIG, apiRequest } from '../config/api';

export interface DeviceTelemetry {
  id: number;
  recorded_at?: string;
  received_at?: string;
  latency_ms?: number | null;
  temperature_celsius?: number | string | null;
  ph?: number | string | null;
  turbidity_ntu?: number | string | null;
  tds_mg_l?: number | string | null;
  water_level_cm?: number | string | null;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export const deviceService = {
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
};
