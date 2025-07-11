import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/Card";
import Navigation from "../components/Navigation";

const CommunityScreen = () => {
  const communityPosts = [
    {
      author: "Manila Bay Coalition",
      time: "2 hours ago",
      title: "Manila Bay Cleanup Drive - December 15",
      content:
        "Join us for our monthly cleanup drive! We need 100 volunteers to help clean up Manila Bay shoreline.",
      likes: 45,
      comments: 12,
      type: "event",
    },
    {
      author: "Maria Santos",
      time: "4 hours ago",
      title: "Chemical spill in Pasig River",
      content:
        "Just reported a chemical spill near Pasig River bridge. Authorities have been notified.",
      likes: 23,
      comments: 8,
      type: "report",
    },
    {
      author: "Green Warriors PH",
      time: "1 day ago",
      title: "Water Quality Improvement Project",
      content:
        "Our latest project has improved water quality by 40% in 3 barangays. Thank you to all supporters!",
      likes: 78,
      comments: 25,
      type: "update",
    },
  ];

  const getPostIcon = (type: string) => {
    switch (type) {
      case "event":
        return "calendar";
      case "report":
        return "warning";
      case "update":
        return "checkmark-circle";
      default:
        return "chatbubble";
    }
  };

  const getPostColor = (type: string) => {
    switch (type) {
      case "event":
        return "#22c55e";
      case "report":
        return "#f59e0b";
      case "update":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation title="Community" showBackButton={true} />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          {/* Community Stats */}
          <Card className="border-waterbase-200 mb-6">
            <CardContent className="p-4">
              <Text className="text-lg font-semibold text-waterbase-950 mb-3 text-center">
                Community Impact
              </Text>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-waterbase-500">
                    2,450
                  </Text>
                  <Text className="text-xs text-gray-600">Active Members</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-enviro-500">
                    156
                  </Text>
                  <Text className="text-xs text-gray-600">Sites Cleaned</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-waterbase-500">
                    1,234
                  </Text>
                  <Text className="text-xs text-gray-600">Reports Filed</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-waterbase-950 mb-3">
              Quick Actions
            </Text>
            <View className="flex-row space-x-3">
              <TouchableOpacity className="flex-1 bg-waterbase-500 rounded-lg p-4 items-center">
                <Ionicons name="add-circle" size={24} color="white" />
                <Text className="text-white font-medium mt-1 text-sm">
                  New Post
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-enviro-500 rounded-lg p-4 items-center">
                <Ionicons name="calendar" size={24} color="white" />
                <Text className="text-white font-medium mt-1 text-sm">
                  Events
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-white border border-waterbase-200 rounded-lg p-4 items-center">
                <Ionicons name="people" size={24} color="#0ea5e9" />
                <Text className="text-waterbase-700 font-medium mt-1 text-sm">
                  Groups
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Community Feed */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-waterbase-950 mb-3">
              Community Feed
            </Text>
            <View className="space-y-4">
              {communityPosts.map((post, index) => (
                <Card key={index} className="border-waterbase-200">
                  <CardContent className="p-4">
                    <View className="flex-row items-start mb-3">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{
                          backgroundColor: getPostColor(post.type) + "20",
                        }}
                      >
                        <Ionicons
                          name={getPostIcon(post.type)}
                          size={20}
                          color={getPostColor(post.type)}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="font-semibold text-waterbase-950 text-sm">
                            {post.author}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {post.time}
                          </Text>
                        </View>
                        <Text className="text-sm font-medium text-waterbase-950 mt-1">
                          {post.title}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm text-gray-700 mb-3">
                      {post.content}
                    </Text>

                    <View className="flex-row items-center space-x-4 pt-2 border-t border-gray-100">
                      <TouchableOpacity className="flex-row items-center">
                        <Ionicons
                          name="heart-outline"
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="text-xs text-gray-600 ml-1">
                          {post.likes}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="flex-row items-center">
                        <Ionicons
                          name="chatbubble-outline"
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="text-xs text-gray-600 ml-1">
                          {post.comments}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="flex-row items-center">
                        <Ionicons
                          name="share-outline"
                          size={16}
                          color="#6b7280"
                        />
                        <Text className="text-xs text-gray-600 ml-1">
                          Share
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </View>

          {/* Featured Organizations */}
          <Card className="border-waterbase-200 mb-6">
            <CardHeader>
              <CardTitle className="text-waterbase-950">
                Featured Organizations
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Environmental groups making a difference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                {[
                  {
                    name: "Manila Bay Coalition",
                    members: "1,200",
                    focus: "Bay Restoration",
                  },
                  {
                    name: "Green Warriors PH",
                    members: "850",
                    focus: "River Cleanup",
                  },
                  {
                    name: "Ocean Guardians",
                    members: "600",
                    focus: "Marine Protection",
                  },
                ].map((org, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between p-3 bg-waterbase-50 rounded-lg"
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-full items-center justify-center mr-3">
                        <Ionicons name="leaf" size={20} color="white" />
                      </View>
                      <View>
                        <Text className="font-medium text-sm text-waterbase-950">
                          {org.name}
                        </Text>
                        <Text className="text-xs text-waterbase-600">
                          {org.members} members • {org.focus}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity className="bg-waterbase-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-medium">
                        Follow
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CommunityScreen;
