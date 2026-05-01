import React, { useEffect } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

// Import screens
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ReportPollutionScreen from "./src/screens/ReportPollutionScreen";
import MapViewScreen from "./src/screens/MapViewScreen";
import CommunityScreen from "./src/screens/CommunityScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import OrganizerPortalScreen from "./src/screens/OrganizerPortalScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import HowItWorksScreen from "./src/screens/HowItWorksScreen";
import OrganizationProfileScreen from "./src/screens/OrganizationProfileScreen";
import AdminModerationScreen from "./src/screens/AdminModerationScreen";

// Import components
import Layout from "./src/components/Layout";

// Import contexts
import { AuthProvider } from "./src/contexts/AuthContext";
import { FeedbackProvider } from "./src/contexts/FeedbackContext";

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      // Foreground banner/list rendering is handled by the global Expo notification handler.
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!navigationRef.isReady()) {
        return;
      }

      const data = response.notification.request.content.data as Record<string, unknown>;
      const targetType = typeof data?.target_type === 'string' ? data.target_type : null;

      if (targetType === 'event') {
        navigationRef.navigate('Community');
        return;
      }

      if (targetType === 'report') {
        navigationRef.navigate('MapView');
        return;
      }

      navigationRef.navigate('Notifications');
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  const ScreenWithLayout = (Component: React.ComponentType) => {
    return (props: any) => (
      <Layout>
        <Component {...props} />
      </Layout>
    );
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FeedbackProvider>
          <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="Home" component={ScreenWithLayout(HomeScreen)} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Dashboard" component={ScreenWithLayout(DashboardScreen)} />
              <Stack.Screen name="ReportPollution" component={ScreenWithLayout(ReportPollutionScreen)} />
              <Stack.Screen name="MapView" component={ScreenWithLayout(MapViewScreen)} />
              <Stack.Screen name="Community" component={ScreenWithLayout(CommunityScreen)} />
              <Stack.Screen name="OrganizerPortal" component={ScreenWithLayout(OrganizerPortalScreen)} />
              <Stack.Screen name="Profile" component={ScreenWithLayout(ProfileScreen)} />
              <Stack.Screen name="OrganizationProfile" component={ScreenWithLayout(OrganizationProfileScreen)} />
              <Stack.Screen name="Notifications" component={ScreenWithLayout(NotificationsScreen)} />
              <Stack.Screen name="HowItWorks" component={ScreenWithLayout(HowItWorksScreen)} />
              <Stack.Screen name="AdminModeration" component={ScreenWithLayout(AdminModerationScreen)} />
            </Stack.Navigator>
          </NavigationContainer>
        </FeedbackProvider>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
