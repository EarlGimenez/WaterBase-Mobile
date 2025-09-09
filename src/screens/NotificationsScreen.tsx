import React, { useState } from "react";
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

interface Notification {
  id: string;
  type: 'report' | 'event' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'report',
      title: 'Report Verified',
      message: 'Your pollution report at Manila Bay has been verified by authorities.',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
      priority: 'medium'
    },
    {
      id: '2',
      type: 'event',
      title: 'Upcoming Cleanup Event',
      message: 'Beach cleanup at Roxas Boulevard scheduled for tomorrow at 8:00 AM.',
      timestamp: '2024-01-14T16:45:00Z',
      read: false,
      priority: 'high'
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Badge Earned',
      message: 'Congratulations! You earned the "Water Guardian" badge.',
      timestamp: '2024-01-13T14:20:00Z',
      read: true,
      priority: 'low'
    },
    {
      id: '4',
      type: 'system',
      title: 'App Update Available',
      message: 'A new version of WaterBase is available with improved features.',
      timestamp: '2024-01-12T09:15:00Z',
      read: true,
      priority: 'low'
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report':
        return 'document-text';
      case 'event':
        return 'calendar';
      case 'achievement':
        return 'trophy';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return '#ef4444';
    
    switch (type) {
      case 'report':
        return '#0ea5e9';
      case 'event':
        return '#22c55e';
      case 'achievement':
        return '#f59e0b';
      case 'system':
        return '#6b7280';
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

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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

            {/* Notifications List */}
            <View className="space-y-3">
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => markAsRead(notification.id)}
                >
                  <Card className={`border-waterbase-200 ${!notification.read ? 'bg-waterbase-25' : 'bg-white'}`}>
                    <CardContent className="p-4">
                      <View className="flex-row">
                        <View className="mr-4">
                          <View 
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${getNotificationColor(notification.type, notification.priority)}20` }}
                          >
                            <Ionicons
                              name={getNotificationIcon(notification.type) as any}
                              size={24}
                              color={getNotificationColor(notification.type, notification.priority)}
                            />
                          </View>
                        </View>
                        
                        <View className="flex-1">
                          <View className="flex-row justify-between items-start mb-2">
                            <Text className={`text-base font-semibold ${!notification.read ? 'text-waterbase-950' : 'text-waterbase-800'}`}>
                              {notification.title}
                            </Text>
                            
                            <View className="flex-row items-center ml-2">
                              {notification.priority === 'high' && (
                                <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                              )}
                              <Text className="text-xs text-waterbase-500">
                                {formatTime(notification.timestamp)}
                              </Text>
                            </View>
                          </View>
                          
                          <Text className={`text-sm leading-relaxed ${!notification.read ? 'text-waterbase-700' : 'text-waterbase-600'}`}>
                            {notification.message}
                          </Text>
                          
                          {!notification.read && (
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
            {notifications.length === 0 && (
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
