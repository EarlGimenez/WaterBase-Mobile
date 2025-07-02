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
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import {
Calendar,
MapPin,
Users,
Plus,
Award,
AlertTriangle,
CheckCircle,
Clock,
Target,
Gift,
Camera,
Edit,
Trash2,
MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for areas with sufficient reports
const eligibleAreas = [
{
    id: 1,
    location: "Pasig River, Metro Manila",
    coordinates: { lat: 14.5995, lng: 121.0008 },
    reportCount: 23,
    severityLevel: "High",
    lastReported: "2024-01-15",
    description: "Heavy industrial waste and plastic pollution along riverbank",
    estimatedCleanupEffort: "Large",
    priority: "critical",
},
{
    id: 2,
    location: "Manila Bay, Manila",
    coordinates: { lat: 14.5794, lng: 120.9647 },
    reportCount: 18,
    severityLevel: "Critical",
    lastReported: "2024-01-14",
    description: "Chemical runoff and visible water discoloration",
    estimatedCleanupEffort: "Medium",
    priority: "high",
},
{
    id: 3,
    location: "Marikina River, Quezon City",
    coordinates: { lat: 14.6349, lng: 121.1076 },
    reportCount: 15,
    severityLevel: "Medium",
    lastReported: "2024-01-13",
    description: "Plastic bottles and containers floating downstream",
    estimatedCleanupEffort: "Small",
    priority: "medium",
},
];

// Mock existing cleanup events
const existingEvents = [
{
    id: 1,
    title: "Manila Bay Restoration Drive",
    location: "Manila Bay, Manila",
    date: "2024-02-15",
    time: "07:00 AM",
    duration: "4 hours",
    maxVolunteers: 50,
    currentVolunteers: 32,
    status: "active",
    rewards: {
    type: "Points & Certificate",
    points: 100,
    certificate: "Environmental Champion",
    additional: "Meal provided",
    },
    organizer: "Manila Bay Coalition",
    description:
    "Large-scale cleanup focusing on plastic waste removal and water quality improvement.",
},
{
    id: 2,
    title: "Pasig River Community Clean",
    location: "Pasig River, Metro Manila",
    date: "2024-02-20",
    time: "06:30 AM",
    duration: "3 hours",
    maxVolunteers: 30,
    currentVolunteers: 12,
    status: "recruiting",
    rewards: {
    type: "Environmental Badge",
    points: 75,
    certificate: "River Guardian",
    additional: "Transportation allowance",
    },
    organizer: "Pasig River Watch",
    description:
    "Community-driven initiative to remove industrial waste and restore riverbank vegetation.",
},
];

export const OrganizerPortal = () => {
const [activeTab, setActiveTab] = useState("areas");
const [showCreateEvent, setShowCreateEvent] = useState(false);
const [selectedArea, setSelectedArea] = useState<any>(null);
const [newEvent, setNewEvent] = useState({
    title: "",
    area: "",
    date: "",
    time: "",
    duration: "",
    maxVolunteers: "",
    description: "",
    rewardType: "",
    rewardPoints: "",
    rewardCertificate: "",
    rewardAdditional: "",
});

const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
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

const getStatusColor = (status: string) => {
    switch (status) {
    case "active":
        return "bg-green-100 text-green-800";
    case "recruiting":
        return "bg-blue-100 text-blue-800";
    case "completed":
        return "bg-gray-100 text-gray-800";
    default:
        return "bg-gray-100 text-gray-800";
    }
};

const handleCreateEvent = () => {
    console.log("Creating cleanup event:", newEvent);
    setShowCreateEvent(false);
    setNewEvent({
    title: "",
    area: "",
    date: "",
    time: "",
    duration: "",
    maxVolunteers: "",
    description: "",
    rewardType: "",
    rewardPoints: "",
    rewardCertificate: "",
    rewardAdditional: "",
    });
};

return (
    <div className="min-h-screen bg-gradient-to-br from-waterbase-50 to-enviro-50">
    <Navigation />

    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
        <h1 className="text-3xl font-bold text-waterbase-950 mb-2">
            Organizer Portal
        </h1>
        <p className="text-waterbase-700 mb-4">
            Manage cleanup events and coordinate with volunteers for water
            pollution areas
        </p>
        <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-enviro-50 text-enviro-700">
            LGU/NGO Access
            </Badge>
            <Badge
            variant="outline"
            className="bg-waterbase-50 text-waterbase-700"
            >
            Manila Bay Coalition
            </Badge>
        </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="areas" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Eligible Areas</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>My Events</span>
            </TabsTrigger>
            <TabsTrigger
            value="volunteers"
            className="flex items-center space-x-2"
            >
            <Users className="w-4 h-4" />
            <span>Volunteer Management</span>
            </TabsTrigger>
        </TabsList>

        <TabsContent value="areas">
            <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-waterbase-950">
                Areas with Sufficient Reports
                </h2>
                <Badge className="bg-waterbase-500 text-white">
                {eligibleAreas.length} locations eligible
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {eligibleAreas.map((area) => (
                <Card
                    key={area.id}
                    className="border-waterbase-200 hover:shadow-lg transition-shadow"
                >
                    <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                        <CardTitle className="text-lg text-waterbase-950">
                            {area.location}
                        </CardTitle>
                        <CardDescription className="mt-2">
                            {area.description}
                        </CardDescription>
                        </div>
                        <Badge
                        className={cn(
                            "text-xs",
                            getSeverityColor(area.severityLevel),
                        )}
                        >
                        {area.severityLevel}
                        </Badge>
                    </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                        <span className="text-gray-600">Reports:</span>
                        <div className="font-semibold text-waterbase-950">
                            {area.reportCount} verified
                        </div>
                        </div>
                        <div>
                        <span className="text-gray-600">Effort:</span>
                        <div className="font-semibold text-waterbase-950">
                            {area.estimatedCleanupEffort}
                        </div>
                        </div>
                        <div>
                        <span className="text-gray-600">Last Report:</span>
                        <div className="font-semibold text-waterbase-950">
                            {area.lastReported}
                        </div>
                        </div>
                        <div>
                        <span className="text-gray-600">Priority:</span>
                        <div className="font-semibold capitalize text-waterbase-950">
                            {area.priority}
                        </div>
                        </div>
                    </div>

                    <Dialog
                        open={showCreateEvent && selectedArea?.id === area.id}
                        onOpenChange={setShowCreateEvent}
                    >
                        <DialogTrigger asChild>
                        <Button
                            className="w-full bg-waterbase-500 hover:bg-waterbase-600"
                            onClick={() => setSelectedArea(area)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Cleanup Event
                        </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Cleanup Event</DialogTitle>
                            <DialogDescription>
                            Organize a cleanup event for{" "}
                            {selectedArea?.location}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Manila Bay Restoration Drive"
                                value={newEvent.title}
                                onChange={(e) =>
                                setNewEvent({
                                    ...newEvent,
                                    title: e.target.value,
                                })
                                }
                            />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input
                                id="date"
                                type="date"
                                value={newEvent.date}
                                onChange={(e) =>
                                    setNewEvent({
                                    ...newEvent,
                                    date: e.target.value,
                                    })
                                }
                                />
                            </div>
                            <div>
                                <Label htmlFor="time">Time</Label>
                                <Input
                                id="time"
                                type="time"
                                value={newEvent.time}
                                onChange={(e) =>
                                    setNewEvent({
                                    ...newEvent,
                                    time: e.target.value,
                                    })
                                }
                                />
                            </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="duration">Duration</Label>
                                <Select
                                value={newEvent.duration}
                                onValueChange={(value) =>
                                    setNewEvent({
                                    ...newEvent,
                                    duration: value,
                                    })
                                }
                                >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2 hours">
                                    2 hours
                                    </SelectItem>
                                    <SelectItem value="3 hours">
                                    3 hours
                                    </SelectItem>
                                    <SelectItem value="4 hours">
                                    4 hours
                                    </SelectItem>
                                    <SelectItem value="Half day">
                                    Half day
                                    </SelectItem>
                                    <SelectItem value="Full day">
                                    Full day
                                    </SelectItem>
                                </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="maxVolunteers">
                                Max Volunteers
                                </Label>
                                <Input
                                id="maxVolunteers"
                                type="number"
                                placeholder="50"
                                value={newEvent.maxVolunteers}
                                onChange={(e) =>
                                    setNewEvent({
                                    ...newEvent,
                                    maxVolunteers: e.target.value,
                                    })
                                }
                                />
                            </div>
                            </div>

                            <div>
                            <Label htmlFor="description">
                                Event Description
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the cleanup objectives, what volunteers should bring, meeting point, etc."
                                value={newEvent.description}
                                onChange={(e) =>
                                setNewEvent({
                                    ...newEvent,
                                    description: e.target.value,
                                })
                                }
                                rows={3}
                            />
                            </div>

                            {/* Rewards Section */}
                            <div className="space-y-4 border-t pt-4">
                            <h4 className="font-semibold text-waterbase-950 flex items-center">
                                <Gift className="w-4 h-4 mr-2" />
                                Volunteer Rewards
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                <Label htmlFor="rewardPoints">Points</Label>
                                <Input
                                    id="rewardPoints"
                                    type="number"
                                    placeholder="100"
                                    value={newEvent.rewardPoints}
                                    onChange={(e) =>
                                    setNewEvent({
                                        ...newEvent,
                                        rewardPoints: e.target.value,
                                    })
                                    }
                                />
                                </div>
                                <div>
                                <Label htmlFor="rewardType">
                                    Reward Type
                                </Label>
                                <Select
                                    value={newEvent.rewardType}
                                    onValueChange={(value) =>
                                    setNewEvent({
                                        ...newEvent,
                                        rewardType: value,
                                    })
                                    }
                                >
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select reward type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="certificate">
                                        Certificate Only
                                    </SelectItem>
                                    <SelectItem value="points">
                                        Points & Badge
                                    </SelectItem>
                                    <SelectItem value="premium">
                                        Points, Certificate & Perks
                                    </SelectItem>
                                    </SelectContent>
                                </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="rewardCertificate">
                                Certificate Title
                                </Label>
                                <Input
                                id="rewardCertificate"
                                placeholder="e.g., Environmental Champion, River Guardian"
                                value={newEvent.rewardCertificate}
                                onChange={(e) =>
                                    setNewEvent({
                                    ...newEvent,
                                    rewardCertificate: e.target.value,
                                    })
                                }
                                />
                            </div>

                            <div>
                                <Label htmlFor="rewardAdditional">
                                Additional Rewards
                                </Label>
                                <Input
                                id="rewardAdditional"
                                placeholder="e.g., Meal provided, Transportation allowance, T-shirt"
                                value={newEvent.rewardAdditional}
                                onChange={(e) =>
                                    setNewEvent({
                                    ...newEvent,
                                    rewardAdditional: e.target.value,
                                    })
                                }
                                />
                            </div>
                            </div>

                            <div className="flex space-x-2 pt-4">
                            <Button
                                onClick={handleCreateEvent}
                                className="flex-1 bg-waterbase-500 hover:bg-waterbase-600"
                            >
                                Create Event
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowCreateEvent(false)}
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

        <TabsContent value="events">
            <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-waterbase-950">
                Your Cleanup Events
                </h2>
                <Badge className="bg-enviro-500 text-white">
                {existingEvents.length} active events
                </Badge>
            </div>

            <div className="space-y-4">
                {existingEvents.map((event) => (
                <Card key={event.id} className="border-waterbase-200">
                    <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                        <h3 className="text-lg font-semibold text-waterbase-950 mb-2">
                            {event.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                                {event.date} at {event.time}
                            </span>
                            </div>
                            <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{event.duration}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700">
                            {event.description}
                        </p>
                        </div>
                        <div className="flex items-center space-x-2">
                        <Badge
                            className={cn(
                            "text-xs",
                            getStatusColor(event.status),
                            )}
                        >
                            {event.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                        </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Volunteer Progress */}
                        <Card className="border-gray-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                Volunteers
                            </span>
                            <Users className="w-4 h-4 text-waterbase-600" />
                            </div>
                            <div className="text-2xl font-bold text-waterbase-950 mb-1">
                            {event.currentVolunteers}/{event.maxVolunteers}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-waterbase-500 h-2 rounded-full"
                                style={{
                                width: `${(event.currentVolunteers / event.maxVolunteers) * 100}%`,
                                }}
                            />
                            </div>
                        </CardContent>
                        </Card>

                        {/* Rewards Info */}
                        <Card className="border-gray-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                Rewards
                            </span>
                            <Award className="w-4 h-4 text-enviro-600" />
                            </div>
                            <div className="text-sm space-y-1">
                            <div>
                                <strong>{event.rewards.points}</strong> points
                            </div>
                            <div className="text-xs text-gray-600">
                                {event.rewards.certificate}
                            </div>
                            <div className="text-xs text-gray-600">
                                {event.rewards.additional}
                            </div>
                            </div>
                        </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border-gray-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                Actions
                            </span>
                            <Target className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="space-y-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                            >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Message Volunteers
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                            >
                                <Camera className="w-3 h-3 mr-1" />
                                Event Updates
                            </Button>
                            </div>
                        </CardContent>
                        </Card>
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
            </div>
        </TabsContent>

        <TabsContent value="volunteers">
            <div className="space-y-6">
            <h2 className="text-xl font-semibold text-waterbase-950">
                Volunteer Management
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                    <Users className="w-12 h-12 text-waterbase-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-waterbase-950">
                    127
                    </h3>
                    <p className="text-waterbase-600">Total Volunteers</p>
                </CardContent>
                </Card>

                <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-enviro-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-waterbase-950">
                    89
                    </h3>
                    <p className="text-waterbase-600">Active This Month</p>
                </CardContent>
                </Card>

                <Card className="border-waterbase-200">
                <CardContent className="p-6 text-center">
                    <Award className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-waterbase-950">
                    1,254
                    </h3>
                    <p className="text-waterbase-600">Points Awarded</p>
                </CardContent>
                </Card>
            </div>

            <Card className="border-waterbase-200">
                <CardHeader>
                <CardTitle>Recent Volunteer Activity</CardTitle>
                <CardDescription>
                    Latest volunteers who signed up for your events
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Volunteer management features coming soon</p>
                    <p className="text-sm">
                    You'll be able to view, communicate with, and reward your
                    volunteers here
                    </p>
                </div>
                </CardContent>
            </Card>
            </div>
        </TabsContent>
        </Tabs>
    </div>
    </div>
);
};