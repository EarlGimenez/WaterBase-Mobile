import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Navigation from '../components/Navigation';

interface Notification {
  id: string;
  type: 'pollution' | 'community' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
  color: string;
}

const NotificationScreen: React.FC = () => {
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'pollution',
      title: 'New Pollution Report',
      message: 'A new water pollution incident has been reported in your area. Tap to view details.',
      timestamp: '2 hours ago',
      read: false,
      icon: 'warning',
      color: '#ef4444'
    },
    {
      id: '2',
      type: 'community',
      title: 'Community Cleanup Event',
      message: 'Join the beach cleanup this Saturday at Marina Bay. 50+ volunteers already signed up!',
      timestamp: '4 hours ago',
      read: false,
      icon: 'people',
      color: '#22c55e'
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: 'Congratulations! You\'ve earned the "Water Guardian" badge for reporting 10 pollution incidents.',
      timestamp: '1 day ago',
      read: true,
      icon: 'trophy',
      color: '#f59e0b'
    },
    {
      id: '4',
      type: 'system',
      title: 'Water Quality Update',
      message: 'The water quality in your monitored area has improved to "Good" status.',
      timestamp: '2 days ago',
      read: true,
      icon: 'checkmark-circle',
      color: '#0ea5e9'
    },
    {
      id: '5',
      type: 'community',
      title: 'Research Study Invitation',
      message: 'You\'ve been invited to participate in a water quality research study. Compensation provided.',
      timestamp: '3 days ago',
      read: true,
      icon: 'flask',
      color: '#8b5cf6'
    },
    {
      id: '6',
      type: 'pollution',
      title: 'Report Follow-up',
      message: 'Your pollution report #WB-2024-0123 has been reviewed and forwarded to local authorities.',
      timestamp: '1 week ago',
      read: true,
      icon: 'document-text',
      color: '#0ea5e9'
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      className={`p-4 border-b border-gray-100 ${
        !notification.read ? 'bg-waterbase-50' : 'bg-white'
      }`}
    >
      <View className="flex-row items-start">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3 mt-1"
          style={{ backgroundColor: notification.color + '20' }}
        >
          <Ionicons
            name={notification.icon as any}
            size={20}
            color={notification.color}
          />
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className={`font-semibold text-waterbase-950 ${
                !notification.read ? 'text-waterbase-950' : 'text-gray-700'
              }`}
            >
              {notification.title}
            </Text>
            {!notification.read && (
              <View className="w-2 h-2 bg-waterbase-500 rounded-full" />
            )}
          </View>
          
          <Text
            className={`text-sm mb-2 ${
              !notification.read ? 'text-waterbase-700' : 'text-gray-600'
            }`}
          >
            {notification.message}
          </Text>
          
          <Text className="text-xs text-gray-500">
            {notification.timestamp}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pollution': return 'Pollution Reports';
      case 'community': return 'Community';
      case 'achievement': return 'Achievements';
      case 'system': return 'System Updates';
      default: return 'All';
    }
  };

  const filterTypes = ['all', 'pollution', 'community', 'achievement', 'system'];
  const [selectedFilter, setSelectedFilter] = React.useState('all');

  const filteredNotifications = selectedFilter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === selectedFilter);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Navigation title="Notifications" showBackButton={true} />

      {/* Header Stats */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-waterbase-950">
            Your Notifications
          </Text>
          {unreadCount > 0 && (
            <View className="bg-waterbase-500 rounded-full px-3 py-1">
              <Text className="text-white text-sm font-medium">
                {unreadCount} new
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white px-4 py-3">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {filterTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedFilter(type)}
              className={`mr-4 px-4 py-2 rounded-full ${
                selectedFilter === type
                  ? 'bg-waterbase-500'
                  : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedFilter === type
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
              >
                {type === 'all' ? 'All' : getTypeLabel(type)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(renderNotification)
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="notifications-off" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg font-medium mt-4">
              No notifications
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2 px-8">
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {filteredNotifications.length > 0 && (
        <View className="bg-white border-t border-gray-200 p-4">
          <View className="flex-row space-x-3">
            <TouchableOpacity className="flex-1 bg-gray-100 rounded-lg py-3">
              <Text className="text-center text-gray-700 font-medium">
                Mark All Read
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-waterbase-500 rounded-lg py-3">
              <Text className="text-center text-white font-medium">
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
