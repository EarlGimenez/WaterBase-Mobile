# 📱 WaterBase Mobile - Screen Descriptions

## 🏠 **HomeScreen.tsx**
The main landing screen featuring smart reporting capabilities, live mapping, and community engagement features. Users can access core functionality like pollution reporting, map visualization, and environmental monitoring tools through an intuitive interface with feature cards.

## 📊 **DashboardScreen.tsx**
A comprehensive analytics dashboard displaying environmental statistics, report metrics, and user performance data. Shows total reports, verified incidents, active users, and trending pollution data with visual charts and progress indicators.

## 🤝 **CommunityScreen.tsx**
A social platform for environmental community engagement featuring cleanup events, discussion posts, and collaborative initiatives. Users can join cleanup drives, share environmental concerns, and connect with local environmental groups and volunteers.

## 👤 **ProfileScreen.tsx**
User profile management screen displaying personal statistics, achievements, and role-specific metrics. Shows user activity including reports submitted, events joined, badges earned, and allows profile customization based on user roles (volunteer, NGO, LGU, researcher).

## 🗺️ **MapViewScreen.tsx**
Interactive map interface with Leaflet integration showing real-time pollution hotspots and incident locations. Features a draggable bottom sheet for detailed report viewing, filtering options, and geographic visualization of environmental data across the Philippines.

## 🗺️ **MapViewScreen_new.tsx**
Enhanced map screen using Google Maps with improved performance and native mobile integration. Includes advanced filtering, clustering of nearby incidents, and optimized marker rendering for better user experience on mobile devices.

## 🔐 **LoginScreen.tsx**
User authentication screen with email/password login and guest mode option. Features secure login functionality with form validation, error handling, and navigation to registration for new users.

## 📝 **RegisterScreen.tsx**
Comprehensive user registration form with role-based field customization and Philippine location selection. Supports multiple user types (volunteer, NGO, LGU, researcher) with appropriate area-of-responsibility selection using searchable location components.

## 📸 **ReportPollutionScreen.tsx**
Advanced pollution reporting interface with AI-powered image analysis and water body validation. Features camera integration, automatic location detection, OpenStreetMap address search, and comprehensive form validation with multi-level water detection warnings.

## ❓ **HowItWorksScreen.tsx**
Educational onboarding screen explaining the app's functionality through step-by-step instructions. Guides users through the process of capturing pollution photos, AI analysis, reporting workflow, and community engagement features.

## 🔔 **NotificationScreen.tsx**
Simple notification display screen showing pollution alerts, community updates, and system notifications. Features categorized notifications with read/unread status and appropriate icons for different notification types.

## 🔔 **NotificationsScreen.tsx**
Enhanced notifications management screen with advanced filtering and categorization options. Provides comprehensive notification history, priority levels, and detailed notification management with mark-as-read functionality and notification preferences.

---

## 📱 **Screen Categories:**

### **Core Functionality:**
- HomeScreen, DashboardScreen, ReportPollutionScreen

### **Navigation & Discovery:**
- MapViewScreen, MapViewScreen_new, HowItWorksScreen

### **User Management:**
- LoginScreen, RegisterScreen, ProfileScreen

### **Social & Communication:**
- CommunityScreen, NotificationScreen, NotificationsScreen

### **Authentication Status:**
- **Protected Screens:** DashboardScreen, CommunityScreen, ProfileScreen, ReportPollutionScreen, NotificationsScreen
- **Public Screens:** HomeScreen, LoginScreen, RegisterScreen, HowItWorksScreen, MapViewScreen, NotificationScreen
