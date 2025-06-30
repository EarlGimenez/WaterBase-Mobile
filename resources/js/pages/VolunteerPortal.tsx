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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import {
Calendar,
MapPin,
Users,
Award,
Clock,
Star,
Gift,
Target,
Search,
Filter,
CheckCircle,
Heart,
Camera,
MessageSquare,
TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock available cleanup events
const availableEvents = [
{
    id: 1,
    title: "Manila Bay Restoration Drive",
    organizer: "Manila Bay Coalition",
    organizerType: "NGO",
    organizerRating: 4.8,
    location: "Manila Bay, Manila",
    coordinates: { lat: 14.5794, lng: 120.9647 },
    date: "2024-02-15",
    time: "07:00 AM",
    duration: "4 hours",
    maxVolunteers: 50,
    currentVolunteers: 32,
    spotsLeft: 18,
    difficulty: "Medium",
    rewards: {
    points: 100,
    certificate: "Environmental Champion",
    additional: "Meal provided, Transportation allowance",
    badge: "Ocean Guardian",
    },
    description:
    "Large-scale cleanup focusing on plastic waste removal and water quality improvement. Perfect for first-time volunteers.",
    requirements: [
    "Bring water bottle",
    "Wear comfortable clothes",
    "Sun protection",
    ],
    pollutionLevel: "High",
    urgency: "Critical",
    tags: ["Plastic Cleanup", "Water Quality", "Community"],
},
{
    id: 2,
    title: "Pasig River Community Clean",
    organizer: "Pasig River Watch",
    organizerType: "NGO",
    organizerRating: 4.6,
    location: "Pasig River, Metro Manila",
    coordinates: { lat: 14.5995, lng: 121.0008 },
    date: "2024-02-20",
    time: "06:30 AM",
    duration: "3 hours",
    maxVolunteers: 30,
    currentVolunteers: 12,
    spotsLeft: 18,
    difficulty: "Easy",
    rewards: {
    points: 75,
    certificate: "River Guardian",
    additional: "Snacks provided, WaterBase t-shirt",
    badge: "River Protector",
    },
    description:
    "Community-driven initiative to remove industrial waste and restore riverbank vegetation.",
    requirements: [
    "Basic swimming ability recommended",
    "Bring gloves",
    "Early arrival",
    ],
    pollutionLevel: "Medium",
    urgency: "High",
    tags: ["Industrial Waste", "Riverbank", "Community"],
},
{
    id: 3,
    title: "Laguna Lake Cleanup Initiative",
    organizer: "Laguna Provincial Government",
    organizerType: "LGU",
    organizerRating: 4.9,
    location: "Laguna Lake, Laguna",
    coordinates: { lat: 14.3591, lng: 121.2663 },
    date: "2024-02-25",
    time: "08:00 AM",
    duration: "2 hours",
    maxVolunteers: 25,
    currentVolunteers: 8,
    spotsLeft: 17,
    difficulty: "Easy",
    rewards: {
    points: 50,
    certificate: "Lake Guardian",
    additional: "Official recognition certificate, Local delicacies",
    badge: "Lake Protector",
    },
    description:
    "Family-friendly cleanup event focusing on shoreline restoration and fish habitat protection.",
    requirements: [
    "Family-friendly",
    "No special skills needed",
    "Photography encouraged",
    ],
    pollutionLevel: "Low",
    urgency: "Medium",
    tags: ["Family Event", "Shoreline", "Habitat"],
},
];

// Mock user volunteer history
const volunteerHistory = [
{
    id: 1,
    event: "Manila Bay Coastal Cleanup",
    date: "2024-01-10",
    organizer: "Manila Bay Coalition",
    pointsEarned: 100,
    status: "Completed",
    rating: 5,
    badge: "Ocean Guardian",
},
{
    id: 2,
    event: "Pasig River Restoration",
    date: "2024-01-05",
    organizer: "MMDA Environmental",
    pointsEarned: 75,
    status: "Completed",
    rating: 4,
    badge: "River Protector",
},
];

// Mock volunteer profile stats
const volunteerStats = {
totalPoints: 875,
eventsJoined: 12,
hoursVolunteered: 36,
badgesEarned: 8,
currentLevel: "Environmental Champion",
nextLevel: "Eco Warrior",
pointsToNext: 125,
};

const VolunteerPortal = () => {
const [activeTab, setActiveTab] = useState("events");
const [searchQuery, setSearchQuery] = useState("");
const [selectedEvent, setSelectedEvent] = useState<any>(null);
const [showJoinDialog, setShowJoinDialog] = useState(false);

const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
    case "easy":
        return "bg-green-100 text-green-800";
    case "medium":
        return "bg-yellow-100 text-yellow-800";
    case "hard":
        return "bg-red-100 text-red-800";
    default:
        return "bg-gray-100 text-gray-800";
    }
};

const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
    case "critical":
        return "bg-red-500 text-white";
    case "high":
        return "bg-orange-500 text-white";
    case "medium":
        return "bg-yellow-500 text-black";
    default:
        return "bg-gray-500 text-white";
    }
};

const handleJoinEvent = () => {
    console.log("Joining event:", selectedEvent);
    setShowJoinDialog(false);
    setSelectedEvent(null);
};

return (
    <div className="min-h-screen bg-gradient-to-br from-waterbase-50 to-enviro-50">
    <Navigation />

    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-waterbase-950 mb-2">
            Volunteer Portal
        </h1>
        <p className="text-waterbase-700 mb-4">
            Join cleanup events and make a difference in water conservation
        </p>
        <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-enviro-50 text-enviro-700">
            Volunteer Access
            </Badge>
            <Badge
            variant="outline"
            className="bg-waterbase-50 text-waterbase-700"
            >
            Level: {volunteerStats.currentLevel}
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            {volunteerStats.totalPoints} Points
            </Badge>
        </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="events" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Available Events</span>
            </TabsTrigger>
            <TabsTrigger
            value="profile"
            className="flex items-center space-x-2"
            >
            <Award className="w-4 h-4" />
            <span>My Profile</span>
            </TabsTrigger>
            <TabsTrigger
            value="history"
            className="flex items-center space-x-2"
            >
            <Clock className="w-4 h-4" />
            <span>My History</span>
            </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
            <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Search cleanup events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
                </div>
                <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-waterbase-950">
                Upcoming Cleanup Events
                </h2>
                <Badge className="bg-waterbase-500 text-white">
                {availableEvents.length} events available
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableEvents.map((event) => (
                <Card
                    key={event.id}
                    className="border-waterbase-200 hover:shadow-lg transition-shadow"
                >
                    <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                        <CardTitle className="text-lg text-waterbase-950 mb-2">
                            {event.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                            <Badge
                            variant="outline"
                            className="text-xs bg-gray-50"
                            >
                            {event.organizerType}
                            </Badge>
                            <span className="text-sm text-gray-600">
                            {event.organizer}
                            </span>
                            <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">
                                {event.organizerRating}
                            </span>
                            </div>
                        </div>
                        <CardDescription>{event.description}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                        <Badge
                            className={cn(
                            "text-xs",
                            getUrgencyColor(event.urgency),
                            )}
                        >
                            {event.urgency}
                        </Badge>
                        <Badge
                            className={cn(
                            "text-xs",
                            getDifficultyColor(event.difficulty),
                            )}
                        >
                            {event.difficulty}
                        </Badge>
                        </div>
                    </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                    {/* Event Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-waterbase-600" />
                        <span>{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-waterbase-600" />
                        <span>{event.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-waterbase-600" />
                        <span>
                            {event.time} ({event.duration})
                        </span>
                        </div>
                        <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-waterbase-600" />
                        <span>{event.spotsLeft} spots left</span>
                        </div>
                    </div>

                    {/* Volunteer Progress */}
                    <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                        <span>Volunteers</span>
                        <span>
                            {event.currentVolunteers}/{event.maxVolunteers}
                        </span>
                        </div>
                        <Progress
                        value={
                            (event.currentVolunteers / event.maxVolunteers) *
                            100
                        }
                        className="h-2"
                        />
                    </div>

                    {/* Rewards Preview */}
                    <div className="bg-gradient-to-r from-enviro-50 to-waterbase-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center">
                            <Gift className="w-4 h-4 mr-1" />
                            Rewards
                        </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <strong>{event.rewards.points}</strong> points
                        </div>
                        <div>{event.rewards.badge} badge</div>
                        <div className="col-span-2 text-gray-600">
                            {event.rewards.additional}
                        </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                        {event.tags.map((tag, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                        >
                            {tag}
                        </Badge>
                        ))}
                    </div>

                    {/* Join Button */}
                    <Dialog
                        open={showJoinDialog && selectedEvent?.id === event.id}
                        onOpenChange={setShowJoinDialog}
                    >
                        <DialogTrigger asChild>
                        <Button
                            className="w-full bg-waterbase-500 hover:bg-waterbase-600"
                            onClick={() => setSelectedEvent(event)}
                        >
                            <Heart className="w-4 h-4 mr-2" />
                            Join This Cleanup
                        </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Join Cleanup Event</DialogTitle>
                            <DialogDescription>
                            Confirm your participation in{" "}
                            {selectedEvent?.title}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="bg-waterbase-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">
                                Event Details
                            </h4>
                            <div className="space-y-1 text-sm">
                                <div>
                                <strong>Date:</strong> {selectedEvent?.date}
                                </div>
                                <div>
                                <strong>Time:</strong> {selectedEvent?.time}
                                </div>
                                <div>
                                <strong>Duration:</strong>{" "}
                                {selectedEvent?.duration}
                                </div>
                                <div>
                                <strong>Location:</strong>{" "}
                                {selectedEvent?.location}
                                </div>
                            </div>
                            </div>

                            <div className="bg-enviro-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">
                                What to Bring/Know
                            </h4>
                            <ul className="text-sm space-y-1">
                                {selectedEvent?.requirements.map(
                                (req: string, index: number) => (
                                    <li
                                    key={index}
                                    className="flex items-center"
                                    >
                                    <CheckCircle className="w-3 h-3 text-enviro-600 mr-2" />
                                    {req}
                                    </li>
                                ),
                                )}
                            </ul>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">
                                You'll Receive
                            </h4>
                            <div className="space-y-1 text-sm">
                                <div>
                                🏆 {selectedEvent?.rewards.points} points
                                </div>
                                <div>
                                🏅 {selectedEvent?.rewards.badge} badge
                                </div>
                                <div>
                                📜 {selectedEvent?.rewards.certificate}{" "}
                                certificate
                                </div>
                                <div>
                                🎁 {selectedEvent?.rewards.additional}
                                </div>
                            </div>
                            </div>

                            <div className="flex space-x-2">
                            <Button
                                onClick={handleJoinEvent}
                                className="flex-1 bg-waterbase-500 hover:bg-waterbase-600"
                            >
                                Confirm Participation
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowJoinDialog(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            </div>
                        </div>
                        </DialogContent>
                    </Dialog>
                    </CardContent>
                </Card>
                ))}
            </div>
            </div>
        </TabsContent>

        <TabsContent value="profile">
            <div className="space-y-6">
            <h2 className="text-xl font-semibold text-waterbase-950">
                Volunteer Profile
            </h2>

            {/* Profile Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                    <Award className="w-12 h-12 text-waterbase-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-waterbase-950">
                    {volunteerStats.totalPoints}
                    </h3>
                    <p className="text-waterbase-600">Total Points</p>
                </CardContent>
                </Card>

                <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                    <Calendar className="w-12 h-12 text-enviro-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-waterbase-950">
                    {volunteerStats.eventsJoined}
                    </h3>
                    <p className="text-waterbase-600">Events Joined</p>
                </CardContent>
                </Card>

                <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                    <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-waterbase-950">
                    {volunteerStats.hoursVolunteered}
                    </h3>
                    <p className="text-waterbase-600">Hours Volunteered</p>
                </CardContent>
                </Card>

                <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                    <Star className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-waterbase-950">
                    {volunteerStats.badgesEarned}
                    </h3>
                    <p className="text-waterbase-600">Badges Earned</p>
                </CardContent>
                </Card>
            </div>

            {/* Level Progress */}
            <Card className="border-waterbase-200">
                <CardHeader>
                <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Level Progress
                </CardTitle>
                <CardDescription>
                    Your journey to environmental leadership
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-waterbase-950">
                        Current: {volunteerStats.currentLevel}
                        </h3>
                        <p className="text-sm text-gray-600">
                        Next: {volunteerStats.nextLevel}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="font-semibold text-waterbase-950">
                        {volunteerStats.pointsToNext} points to go
                        </div>
                        <div className="text-sm text-gray-600">
                        {volunteerStats.totalPoints}/
                        {volunteerStats.totalPoints +
                            volunteerStats.pointsToNext}
                        </div>
                    </div>
                    </div>
                    <Progress
                    value={
                        (volunteerStats.totalPoints /
                        (volunteerStats.totalPoints +
                            volunteerStats.pointsToNext)) *
                        100
                    }
                    className="h-3"
                    />
                </div>
                </CardContent>
            </Card>

            {/* Badges Showcase */}
            <Card className="border-waterbase-200">
                <CardHeader>
                <CardTitle>Achievement Badges</CardTitle>
                <CardDescription>
                    Badges earned from your environmental contributions
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                    "Ocean Guardian",
                    "River Protector",
                    "Lake Guardian",
                    "Eco Warrior",
                    "Community Leader",
                    "Green Champion",
                    "Water Defender",
                    "Environmental Hero",
                    ].map((badge, index) => (
                    <div
                        key={index}
                        className={cn(
                        "p-4 rounded-lg text-center",
                        index < volunteerStats.badgesEarned
                            ? "bg-gradient-to-br from-enviro-100 to-waterbase-100 border border-enviro-200"
                            : "bg-gray-50 border border-gray-200 opacity-50",
                        )}
                    >
                        <Award
                        className={cn(
                            "w-8 h-8 mx-auto mb-2",
                            index < volunteerStats.badgesEarned
                            ? "text-enviro-600"
                            : "text-gray-400",
                        )}
                        />
                        <div
                        className={cn(
                            "text-xs font-medium",
                            index < volunteerStats.badgesEarned
                            ? "text-enviro-800"
                            : "text-gray-500",
                        )}
                        >
                        {badge}
                        </div>
                    </div>
                    ))}
                </div>
                </CardContent>
            </Card>
            </div>
        </TabsContent>

        <TabsContent value="history">
            <div className="space-y-6">
            <h2 className="text-xl font-semibold text-waterbase-950">
                Volunteer History
            </h2>

            <div className="space-y-4">
                {volunteerHistory.map((activity) => (
                <Card key={activity.id} className="border-waterbase-200">
                    <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                        <h3 className="text-lg font-semibold text-waterbase-950 mb-2">
                            {activity.event}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{activity.date}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{activity.organizer}</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Badge className="bg-enviro-100 text-enviro-800">
                            +{activity.pointsEarned} points
                            </Badge>
                            <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-800"
                            >
                            {activity.badge}
                            </Badge>
                            <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                key={i}
                                className={cn(
                                    "w-4 h-4",
                                    i < activity.rating
                                    ? "text-yellow-500 fill-current"
                                    : "text-gray-300",
                                )}
                                />
                            ))}
                            </div>
                        </div>
                        </div>
                        <Badge className={getUrgencyColor(activity.status)}>
                        {activity.status}
                        </Badge>
                    </div>
                    </CardContent>
                </Card>
                ))}

                {volunteerHistory.length === 0 && (
                <Card className="border-waterbase-200">
                    <CardContent className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        No events yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Join your first cleanup event to start making a
                        difference!
                    </p>
                    <Button
                        onClick={() => setActiveTab("events")}
                        className="bg-waterbase-500 hover:bg-waterbase-600"
                    >
                        Browse Events
                    </Button>
                    </CardContent>
                </Card>
                )}
            </div>
            </div>
        </TabsContent>
        </Tabs>
    </div>
    </div>
);
};

export default VolunteerPortal;
