import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_ENDPOINTS, apiRequest } from '../config/api';

const EXPO_PUSH_TOKEN_STORAGE_KEY = 'expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const resolveProjectId = (): string | null => {
  const fromEasConfig = Constants.easConfig?.projectId;
  if (fromEasConfig) {
    return fromEasConfig;
  }

  const fromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
  return typeof fromExpoConfig === 'string' ? fromExpoConfig : null;
};

const resolveAppVersion = (): string | undefined => {
  const version = Constants.expoConfig?.version;
  return typeof version === 'string' && version.length > 0 ? version : undefined;
};

const getCachedToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(EXPO_PUSH_TOKEN_STORAGE_KEY);
};

const setCachedToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(EXPO_PUSH_TOKEN_STORAGE_KEY, token);
};

const clearCachedToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_STORAGE_KEY);
};

const getTokenFromDevice = async (): Promise<string | null> => {
  if (!Constants.isDevice) {
    return null;
  }

  const permissionState = await Notifications.getPermissionsAsync();
  let status = permissionState.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return null;
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data;
};

const registerTokenOnBackend = async (authToken: string, token: string): Promise<void> => {
  await apiRequest(API_ENDPOINTS.USER_PUSH_TOKEN, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      token,
      platform: Platform.OS,
      app_version: resolveAppVersion(),
    }),
  });
};

export const registerPushNotificationsForUser = async (authToken: string): Promise<void> => {
  try {
    const token = await getTokenFromDevice();
    if (!token) {
      return;
    }

    const cachedToken = await getCachedToken();
    if (cachedToken === token) {
      return;
    }

    await registerTokenOnBackend(authToken, token);
    await setCachedToken(token);
  } catch (error) {
    console.error('Push registration failed:', error);
  }
};

export const revokePushNotificationsForUser = async (authToken: string): Promise<void> => {
  try {
    const cachedToken = await getCachedToken();

    await apiRequest(API_ENDPOINTS.USER_PUSH_TOKEN, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token: cachedToken,
      }),
    });
  } catch (error) {
    console.error('Push token revoke failed:', error);
  } finally {
    await clearCachedToken();
  }
};
