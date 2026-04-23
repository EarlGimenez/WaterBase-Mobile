import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";
import ProtectedContent from "../components/ProtectedContent";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationReadState,
  type NotificationItem,
} from "../services/notifications";

const NotificationsScreen = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read_at).length, [notifications]);

  const loadNotifications = async (read?: boolean) => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const page = await fetchNotifications(token, read);
      setNotifications(page.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [token]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report_status_changed':
        return 'document-text';
      case 'event_created':
      case 'event_ongoing':
      case 'event_completed':
        return 'calendar';
      case 'report_processing_failed':
        return 'warning';
      default:
        return 'settings';
    }
  };

  const getNotificationColor = (type: string, severity: string) => {
    if (severity === 'error') return '#ef4444';
    if (severity === 'warning') return '#f59e0b';
    
    switch (type) {
      case 'report_status_changed':
        return '#0ea5e9';
      case 'event_created':
      case 'event_ongoing':
      case 'event_completed':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const markAsRead = async (id: number) => {
    if (!token) return;

    try {
      const target = notifications.find((notification) => notification.id === id);
      await markNotificationReadState(token, id, !(target?.read_at));
      await loadNotifications(selectedFilter === 'unread' ? false : undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;

    try {
      await markAllNotificationsRead(token);
      await loadNotifications(selectedFilter === 'unread' ? false : undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark all as read');
    }
  };

  const filterTypes = ['all', 'unread', 'event_created', 'event_ongoing', 'event_completed', 'report_status_changed', 'report_processing_failed'];

  const filteredNotifications = selectedFilter === 'all'
    ? notifications
    : selectedFilter === 'unread'
      ? notifications.filter((notification) => !notification.read_at)
      : notifications.filter((notification) => notification.type === selectedFilter);

  const isRead = (notification: NotificationItem) => !!notification.read_at;

  return (
    <ProtectedContent>
      <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
        <Navigation title="Notifications" showBackButton={true} />

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <View className="py-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-2xl font-bold text-waterbase-950 mb-1">
                  Notifications
                </Text>
                <Text className="text-waterbase-600">
                  {unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up!'}
                </Text>
              </View>
              
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={markAllAsRead}
                  className="bg-waterbase-100 px-4 py-2 rounded-full"
                >
                  <Text className="text-waterbase-700 font-medium text-sm">
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {error && (
              <View className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                <Text className="text-red-700 text-sm">{error}</Text>
              </View>
            )}

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row space-x-2">
                {filterTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedFilter(type)}
                    className={`px-4 py-2 rounded-full ${selectedFilter === type ? 'bg-waterbase-500' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-sm font-medium ${selectedFilter === type ? 'text-white' : 'text-gray-700'}`}>
                      {type === 'all' ? 'All' : type === 'unread' ? 'Unread' : getTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Notifications List */}
            <View className="space-y-3">
              {loading ? (
                <View className="py-8">
                  <Text className="text-center text-waterbase-600">Loading notifications...</Text>
                </View>
              ) : filteredNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => markAsRead(notification.id)}
                >
                  <Card className={`border-waterbase-200 ${!isRead(notification) ? 'bg-waterbase-25' : 'bg-white'}`}>
                    <CardContent className="p-4">
                      <View className="flex-row">
                        <View className="mr-4">
                          <View 
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${getNotificationColor(notification.type, notification.severity)}20` }}
                          >
                            <Ionicons
                              name={getNotificationIcon(notification.type) as any}
                              size={24}
                              color={getNotificationColor(notification.type, notification.severity)}
                            />
                          </View>
                        </View>
                        
                        <View className="flex-1">
                          <View className="flex-row justify-between items-start mb-2">
                            <Text className={`text-base font-semibold ${!isRead(notification) ? 'text-waterbase-950' : 'text-waterbase-800'}`}>
                              {notification.title}
                            </Text>
                            
                            <View className="flex-row items-center ml-2">
                              {notification.severity === 'error' && (
                                <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                              )}
                              <Text className="text-xs text-waterbase-500">
                                {formatTime(notification.created_at)}
                              </Text>
                            </View>
                          </View>
                          
                          <Text className={`text-sm leading-relaxed ${!isRead(notification) ? 'text-waterbase-700' : 'text-waterbase-600'}`}>
                            {notification.message}
                          </Text>
                          
                          {!isRead(notification) && (
                            <View className="w-2 h-2 bg-waterbase-500 rounded-full absolute -left-1 top-1" />
                          )}
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>

            {/* Empty State */}
            {!loading && filteredNotifications.length === 0 && (
              <Card className="border-waterbase-200">
                <CardContent className="p-8 text-center">
                  <View className="w-16 h-16 bg-waterbase-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ionicons name="notifications-outline" size={32} color="#0369a1" />
                  </View>
                  <Text className="text-lg font-semibold text-waterbase-950 mb-2">
                    No notifications yet
                  </Text>
                  <Text className="text-waterbase-600 leading-relaxed">
                    You'll receive notifications here when there are updates about your reports, events, and achievements.
                  </Text>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            <View className="mt-8">
              <Card className="border-waterbase-200">
                <CardHeader>
                  <CardTitle className="text-lg text-waterbase-950">
                    Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <View className="space-y-4">
                    <TouchableOpacity className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Ionicons name="document-text-outline" size={20} color="#0369a1" />
                        <Text className="ml-3 text-waterbase-900 text-base">Report Updates</Text>
                      </View>
                      <View className="w-12 h-6 bg-waterbase-500 rounded-full p-1">
                        <View className="w-4 h-4 bg-white rounded-full ml-auto" />
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={20} color="#0369a1" />
                        <Text className="ml-3 text-waterbase-900 text-base">Event Reminders</Text>
                      </View>
                      <View className="w-12 h-6 bg-waterbase-500 rounded-full p-1">
                        <View className="w-4 h-4 bg-white rounded-full ml-auto" />
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center">
                        <Ionicons name="trophy-outline" size={20} color="#0369a1" />
                        <Text className="ml-3 text-waterbase-900 text-base">Achievements</Text>
                      </View>
                      <View className="w-12 h-6 bg-gray-300 rounded-full p-1">
                        <View className="w-4 h-4 bg-white rounded-full" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </CardContent>
              </Card>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedContent>
  );
};

export default NotificationsScreen;
