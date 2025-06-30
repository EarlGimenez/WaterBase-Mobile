import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import {
User,
Settings,
Camera,
MapPin,
Award,
BarChart3,
Bell,
Shield,
Edit,
} from "lucide-react";

const Profile = () => {
const [isEditing, setIsEditing] = useState(false);
const [profileData, setProfileData] = useState({
    firstName: "Maria",
    lastName: "Santos",
    email: "maria.santos@example.com",
    phone: "+63 912 345 6789",
    organization: "Environmental Watch PH",
    bio: "Environmental advocate passionate about protecting Philippine waterways.",
    location: "Quezon City, Metro Manila",
});

const userStats = {
    reportsSubmitted: 23,
    reportsVerified: 21,
    communityRank: "Environmental Champion",
    joinDate: "January 2024",
};

const recentActivity = [
    {
    type: "report",
    description: "Submitted pollution report for Pasig River",
    date: "2 days ago",
    status: "verified",
    },
    {
    type: "cleanup",
    description: "Participated in Manila Bay cleanup event",
    date: "1 week ago",
    status: "completed",
    },
    {
    type: "achievement",
    description: "Earned 'Water Guardian' badge",
    date: "2 weeks ago",
    status: "achieved",
    },
];

return (
    <div className="min-h-screen bg-gradient-to-br from-waterbase-50 to-enviro-50">
    <Navigation />

    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="border-waterbase-200 mb-6">
        <CardContent className="p-6">
            <div className="flex items-start space-x-6">
            <div className="relative">
                <Avatar className="w-24 h-24">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-waterbase-100 text-waterbase-700 text-xl">
                    {profileData.firstName[0]}
                    {profileData.lastName[0]}
                </AvatarFallback>
                </Avatar>
                <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                >
                <Camera className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-waterbase-950">
                    {profileData.firstName} {profileData.lastName}
                </h1>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-waterbase-600 mb-3">
                <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profileData.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{profileData.organization}</span>
                </div>
                </div>

                <p className="text-waterbase-700 mb-4">{profileData.bio}</p>

                <div className="flex items-center space-x-3">
                <Badge className="bg-enviro-100 text-enviro-800">
                    <Award className="w-3 h-3 mr-1" />
                    {userStats.communityRank}
                </Badge>
                <Badge variant="outline">
                    Member since {userStats.joinDate}
                </Badge>
                </div>
            </div>
            </div>
        </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-waterbase-200">
            <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-waterbase-950">
                {userStats.reportsSubmitted}
            </div>
            <div className="text-sm text-waterbase-600">
                Reports Submitted
            </div>
            </CardContent>
        </Card>

        <Card className="border-waterbase-200">
            <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-enviro-700">
                {userStats.reportsVerified}
            </div>
            <div className="text-sm text-waterbase-600">Reports Verified</div>
            </CardContent>
        </Card>

        <Card className="border-waterbase-200">
            <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-waterbase-950">91%</div>
            <div className="text-sm text-waterbase-600">Accuracy Rate</div>
            </CardContent>
        </Card>

        <Card className="border-waterbase-200">
            <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-enviro-700">156</div>
            <div className="text-sm text-waterbase-600">Community Points</div>
            </CardContent>
        </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="settings">Account Settings</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
            <Card className="border-waterbase-200">
            <CardHeader>
                <CardTitle className="text-waterbase-950">
                Recent Activity
                </CardTitle>
                <CardDescription className="text-waterbase-600">
                Your latest contributions to the WaterBase community
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                    <div
                    key={index}
                    className="flex items-center space-x-4 p-3 bg-waterbase-50 rounded-lg"
                    >
                    <div className="w-10 h-10 bg-waterbase-100 rounded-full flex items-center justify-center">
                        {activity.type === "report" && (
                        <Camera className="w-5 h-5 text-waterbase-600" />
                        )}
                        {activity.type === "cleanup" && (
                        <MapPin className="w-5 h-5 text-enviro-600" />
                        )}
                        {activity.type === "achievement" && (
                        <Award className="w-5 h-5 text-yellow-600" />
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-waterbase-950">
                        {activity.description}
                        </p>
                        <p className="text-xs text-waterbase-600">
                        {activity.date}
                        </p>
                    </div>
                    <Badge
                        variant={
                        activity.status === "verified" ||
                        activity.status === "completed" ||
                        activity.status === "achieved"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                    >
                        {activity.status}
                    </Badge>
                    </div>
                ))}
                </div>
            </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="settings">
            <Card className="border-waterbase-200">
            <CardHeader>
                <CardTitle className="text-waterbase-950">
                Account Settings
                </CardTitle>
                <CardDescription className="text-waterbase-600">
                Update your profile information and preferences
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                    id="firstName"
                    value={profileData.firstName}
                    disabled={!isEditing}
                    onChange={(e) =>
                        setProfileData({
                        ...profileData,
                        firstName: e.target.value,
                        })
                    }
                    />
                </div>
                <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                    id="lastName"
                    value={profileData.lastName}
                    disabled={!isEditing}
                    onChange={(e) =>
                        setProfileData({
                        ...profileData,
                        lastName: e.target.value,
                        })
                    }
                    />
                </div>
                </div>

                <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled={!isEditing}
                    onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                    }
                />
                </div>

                <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    value={profileData.bio}
                    disabled={!isEditing}
                    onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                    }
                />
                </div>

                {isEditing && (
                <div className="flex space-x-2">
                    <Button className="bg-waterbase-500 hover:bg-waterbase-600">
                    Save Changes
                    </Button>
                    <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    >
                    Cancel
                    </Button>
                </div>
                )}
            </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="notifications">
            <Card className="border-waterbase-200">
            <CardHeader>
                <CardTitle className="text-waterbase-950">
                Notification Settings
                </CardTitle>
                <CardDescription className="text-waterbase-600">
                Manage how you receive updates and alerts
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                <div className="p-4 bg-waterbase-50 rounded-lg">
                    <Bell className="w-6 h-6 text-waterbase-600 mb-2" />
                    <h4 className="font-medium text-waterbase-950 mb-2">
                    Notification preferences coming soon
                    </h4>
                    <p className="text-sm text-waterbase-600">
                    You'll be able to customize email alerts, push
                    notifications, and SMS updates for report status changes,
                    community events, and cleanup initiatives.
                    </p>
                </div>
                </div>
            </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="privacy">
            <Card className="border-waterbase-200">
            <CardHeader>
                <CardTitle className="text-waterbase-950">
                Privacy & Security
                </CardTitle>
                <CardDescription className="text-waterbase-600">
                Control your data and account security
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                <div className="p-4 bg-waterbase-50 rounded-lg">
                    <Shield className="w-6 h-6 text-waterbase-600 mb-2" />
                    <h4 className="font-medium text-waterbase-950 mb-2">
                    Privacy controls coming soon
                    </h4>
                    <p className="text-sm text-waterbase-600">
                    Advanced privacy settings including data export, account
                    deletion, visibility controls, and two-factor
                    authentication will be available here.
                    </p>
                </div>
                </div>
            </CardContent>
            </Card>
        </TabsContent>
        </Tabs>
    </div>
    </div>
);
};

export default Profile;
