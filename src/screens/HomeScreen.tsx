import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Navigation from '../components/Navigation';

const HomeScreen = () => {
  const navigation = useNavigation();

  const features = [
    {
      icon: 'camera-outline',
      title: 'Smart Reporting',
      description: 'Capture geotagged photos of pollution with AI-powered verification for accurate reporting.',
      color: '#0ea5e9',
    },
    {
      icon: 'location-outline',
      title: 'Live Mapping',
      description: 'Real-time visualization of pollution hotspots and cleanup progress across the Philippines.',
      color: '#22c55e',
    },
    {
      icon: 'people-outline',
      title: 'Community Driven',
      description: 'Connect citizens, NGOs, and local government units for collaborative environmental action.',
      color: '#0ea5e9',
    },
    {
      icon: 'bar-chart-outline',
      title: 'Data Transparency',
      description: 'Public dashboards showing environmental impact, cleanup statistics, and progress tracking.',
      color: '#22c55e',
    },
  ];

  const platformFeatures = [
    {
      icon: 'phone-portrait-outline',
      title: 'Mobile-First Design',
      description: 'Optimized for smartphones with offline capabilities, enabling reports from remote areas.',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'AI-Powered Verification',
      description: 'Advanced image detection ensures report accuracy and reduces false submissions.',
    },
    {
      icon: 'flash-outline',
      title: 'Real-Time Updates',
      description: 'Instant notifications about cleanup progress, appeals, and community campaigns.',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="px-4 py-8">
          <View className="text-center items-center">
            <Text className="text-3xl font-bold text-waterbase-950 mb-4 text-center">
              Transforming Water{' '}
              <Text className="text-waterbase-500">Protection</Text>
              {'\n'}in the Philippines
            </Text>
            
            <Text className="text-lg text-waterbase-700 mb-6 text-center">
              WaterBase empowers communities to monitor and report water pollution through AI-powered verification.
            </Text>
            
            <View className="w-full space-y-3">
              <Button
                title="View Live Map"
                onPress={() => navigation.navigate('MapView')}
                size="lg"
                icon={<Ionicons name="location" size={20} color="white" />}
                className="w-full"
              />
              <Button
                title="Report Pollution"
                onPress={() => navigation.navigate('ReportPollution')}
                variant="outline"
                size="lg"
                icon={<Ionicons name="camera" size={20} color="#0369a1" />}
                className="w-full"
              />
            </View>
          </div>
        </View>

        {/* Key Features */}
        <View className="px-4 py-8">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-waterbase-950 mb-2 text-center">
              Empowering Environmental Action
            </Text>
            <Text className="text-waterbase-700 text-center">
              Our comprehensive platform brings together citizens, NGOs, and government agencies.
            </Text>
          </View>

          <View className="space-y-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-waterbase-200">
                <CardHeader>
                  <View className="flex-row items-start space-x-3">
                    <View className="w-12 h-12 bg-waterbase-100 rounded-lg items-center justify-center">
                      <Ionicons name={feature.icon} size={24} color={feature.color} />
                    </View>
                    <View className="flex-1">
                      <CardTitle className="text-waterbase-950 mb-1">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-waterbase-600">
                        {feature.description}
                      </CardDescription>
                    </View>
                  </View>
                </CardHeader>
              </Card>
            ))}
          </View>
        </View>

        {/* Platform Features */}
        <View className="bg-white px-4 py-8">
          <Text className="text-2xl font-bold text-waterbase-950 mb-6 text-center">
            Built for Every Stakeholder
          </Text>
          
          <View className="space-y-4 mb-6">
            {platformFeatures.map((feature, index) => (
              <View key={index} className="flex-row items-start space-x-3">
                <View className="w-10 h-10 bg-waterbase-100 rounded-lg items-center justify-center">
                  <Ionicons name={feature.icon} size={20} color="#0ea5e9" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-waterbase-950 mb-1">
                    {feature.title}
                  </Text>
                  <Text className="text-waterbase-600 text-sm">
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-2xl p-6 items-center">
            <View className="w-16 h-16 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-full items-center justify-center mb-3">
              <Ionicons name="globe-outline" size={32} color="white" />
            </View>
            <Text className="text-waterbase-700 font-medium text-center">
              Interactive Map Visualization
            </Text>
            <Text className="text-sm text-waterbase-600 mt-1 text-center">
              Real-time pollution monitoring across the Philippines
            </Text>
          </View>
        </View>

        {/* Call to Action */}
        <LinearGradient
          colors={['#0ea5e9', '#22c55e']}
          className="px-4 py-8"
        >
          <View className="items-center">
            <Text className="text-2xl font-bold text-white mb-4 text-center">
              Join the Movement for Cleaner Waters
            </Text>
            <Text className="text-white mb-6 text-center opacity-90">
              Whether you're a concerned citizen, environmental organization, or government agency, WaterBase provides the tools you need.
            </Text>
            <View className="w-full space-y-3">
              <Button
                title="Start Reporting"
                onPress={() => navigation.navigate('ReportPollution')}
                variant="secondary"
                size="lg"
                className="w-full"
              />
              <Button
                title="Join Community"
                onPress={() => navigation.navigate('Community')}
                variant="outline"
                size="lg"
                className="w-full border-white"
              />
            </View>
          </View>
        </LinearGradient>

        {/* Footer */}
        <View className="bg-waterbase-950 px-4 py-8">
          <View className="items-center mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-lg items-center justify-center mr-2">
                <Ionicons name="location" size={20} color="white" />
              </View>
              <Text className="text-xl font-bold text-white">WaterBase</Text>
            </View>
            <Text className="text-waterbase-300 text-center text-sm">
              Transforming water protection through community engagement, AI verification, and transparent environmental monitoring.
            </Text>
          </View>

          <View className="border-t border-waterbase-800 pt-4">
            <Text className="text-waterbase-400 text-center text-sm">
              © 2024 WaterBase. Environmental protection through technology and community.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;