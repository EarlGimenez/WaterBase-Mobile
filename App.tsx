import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Import screens
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ReportPollutionScreen from "./src/screens/ReportPollutionScreen";
import MapViewScreen from "./src/screens/MapViewScreen";
import CommunityScreen from "./src/screens/CommunityScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import HowItWorksScreen from "./src/screens/HowItWorksScreen";

// Import components
import Layout from "./src/components/Layout";

// Import contexts
import { AuthProvider } from "./src/contexts/AuthContext";

const Stack = createNativeStackNavigator();

export default function App() {
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
        <NavigationContainer>
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
            <Stack.Screen name="Profile" component={ScreenWithLayout(ProfileScreen)} />
            <Stack.Screen name="Notifications" component={ScreenWithLayout(NotificationsScreen)} />
            <Stack.Screen name="HowItWorks" component={ScreenWithLayout(HowItWorksScreen)} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
