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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table";
import {
Dialog,
DialogContent,
DialogDescription,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import {
BarChart3,
Users,
FileText,
MapPin,
Shield,
Eye,
Edit,
Trash2,
Plus,
Search,
Filter,
CheckCircle,
XCircle,
Clock,
AlertTriangle,
Settings,
Download,
RefreshCw,
Calendar,
Camera,
Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock admin statistics
const adminStats = {
totalUsers: 2450,
totalReports: 1234,
pendingValidation: 89,
activeVolunteers: 156,
activeEvents: 12,
verifiedReports: 987,
rejectedReports: 158,
monthlyGrowth: 18,
};

// Mock pending reports for validation
const pendingReports = [
{
    id: 1,
    title: "Industrial Waste in Pasig River",
    location: "Pasig River, Metro Manila",
    submittedBy: "Maria Santos",
    submittedAt: "2024-01-15 14:30",
    type: "Industrial Waste",
    severity: "High",
    photos: 3,
    aiConfidence: 0.94,
    description: "Heavy oil contamination with visible plastic debris",
    coordinates: { lat: 14.5995, lng: 121.0008 },
    status: "pending",
},
{
    id: 2,
    title: "Plastic Pollution in Manila Bay",
    location: "Manila Bay, Manila",
    submittedBy: "Juan dela Cruz",
    submittedAt: "2024-01-15 13:45",
    type: "Plastic Pollution",
    severity: "Medium",
    photos: 5,
    aiConfidence: 0.87,
    description: "Large amount of plastic bottles floating",
    coordinates: { lat: 14.5794, lng: 120.9647 },
    status: "pending",
},
];

// Mock user management data
const systemUsers = [
{
    id: 1,
    name: "Maria Santos",
    email: "maria@example.com",
    role: "Volunteer",
    joinDate: "2024-01-10",
    status: "Active",
    reportsSubmitted: 23,
    eventsJoined: 8,
    points: 450,
},
{
    id: 2,
    name: "Manila Bay Coalition",
    email: "admin@manilabay.org",
    role: "NGO",
    joinDate: "2023-12-15",
    status: "Active",
    reportsSubmitted: 0,
    eventsJoined: 0,
    eventsOrganized: 12,
},
{
    id: 3,
    name: "Juan dela Cruz",
    email: "juan@email.com",
    role: "Volunteer",
    joinDate: "2024-01-05",
    status: "Suspended",
    reportsSubmitted: 5,
    eventsJoined: 2,
    points: 150,
},
];

// Mock volunteer tasks
const volunteerTasks = [
{
    id: 1,
    taskName: "Manila Bay Cleanup",
    assignedTo: "Maria Santos",
    assignedBy: "Manila Bay Coalition",
    dueDate: "2024-02-15",
    status: "In Progress",
    priority: "High",
    description: "Lead volunteer coordination for beach cleanup",
},
{
    id: 2,
    taskName: "Water Quality Data Collection",
    assignedTo: "Environmental Team",
    assignedBy: "Admin",
    dueDate: "2024-02-20",
    status: "Pending",
    priority: "Medium",
    description: "Collect water samples from 5 monitoring stations",
},
];

export const AdminDashboard = () => {
const [activeTab, setActiveTab] = useState("overview");
const [selectedReport, setSelectedReport] = useState<any>(null);
const [showReportDialog, setShowReportDialog] = useState(false);
const [showUserDialog, setShowUserDialog] = useState(false);
const [showTaskDialog, setShowTaskDialog] = useState(false);

const handleReportAction = (reportId: number, action: string) => {
    console.log(`${action} report ${reportId}`);
    setShowReportDialog(false);
};

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
    case "active":
        return "bg-green-100 text-green-800";
    case "pending":
        return "bg-yellow-100 text-yellow-800";
    case "suspended":
        return "bg-red-100 text-red-800";
    case "completed":
        return "bg-blue-100 text-blue-800";
    case "in progress":
        return "bg-purple-100 text-purple-800";
    default:
        return "bg-gray-100 text-gray-800";
    }
};

const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
    case "high":
        return "bg-red-500 text-white";
    case "medium":
        return "bg-yellow-500 text-black";
    case "low":
        return "bg-green-500 text-white";
    default:
        return "bg-gray-500 text-white";
    }
};

return (
    <div className="min-h-screen bg-gray-50">
    <Navigation />

    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-waterbase-950 mb-2">
                Administrator Dashboard
            </h1>
            <p className="text-waterbase-700">
                Comprehensive system management and oversight
            </p>
            </div>
            <div className="flex items-center space-x-4">
            <Badge className="bg-red-600 text-white">
                <Shield className="w-3 h-3 mr-1" />
                Admin Access
            </Badge>
            <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
            </Button>
            </div>
        </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-waterbase-200">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">
                    Total Users
                </p>
                <p className="text-3xl font-bold text-waterbase-950">
                    {adminStats.totalUsers.toLocaleString()}
                </p>
                </div>
                <Users className="w-8 h-8 text-waterbase-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
                +{adminStats.monthlyGrowth}% from last month
            </p>
            </CardContent>
        </Card>

        <Card className="border-waterbase-200">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">
                    Total Reports
                </p>
                <p className="text-3xl font-bold text-waterbase-950">
                    {adminStats.totalReports.toLocaleString()}
                </p>
                </div>
                <FileText className="w-8 h-8 text-enviro-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
                {adminStats.verifiedReports} verified,{" "}
                {adminStats.rejectedReports} rejected
            </p>
            </CardContent>
        </Card>

        <Card className="border-waterbase-200">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">
                    Pending Validation
                </p>
                <p className="text-3xl font-bold text-orange-600">
                    {adminStats.pendingValidation}
                </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
                Requires immediate attention
            </p>
            </CardContent>
        </Card>

        <Card className="border-waterbase-200">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">
                    Active Events
                </p>
                <p className="text-3xl font-bold text-waterbase-950">
                    {adminStats.activeEvents}
                </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
                {adminStats.activeVolunteers} volunteers participating
            </p>
            </CardContent>
        </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">Report Validation</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="volunteers">Volunteer Tasks</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-waterbase-200">
                <CardHeader>
                <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    System Activity
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="h-64 bg-gradient-to-br from-waterbase-50 to-enviro-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-waterbase-500 mx-auto mb-4" />
                    <p className="text-waterbase-600">
                        Activity charts and analytics
                    </p>
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card className="border-waterbase-200">
                <CardHeader>
                <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Recent Alerts
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-800">
                        High Priority Report
                        </span>
                        <Badge variant="destructive" className="text-xs">
                        Critical
                        </Badge>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                        Industrial waste report requires immediate validation
                    </p>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-800">
                        User Account Issue
                        </span>
                        <Badge variant="secondary" className="text-xs">
                        Medium
                        </Badge>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                        Suspicious activity detected on user account
                    </p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">
                        System Update
                        </span>
                        <Badge variant="outline" className="text-xs">
                        Info
                        </Badge>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                        New features deployed successfully
                    </p>
                    </div>
                </div>
                </CardContent>
            </Card>
            </div>
        </TabsContent>

        <TabsContent value="reports">
            <Card className="border-waterbase-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Report Validation Queue
                </CardTitle>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    </Button>
                    <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    </Button>
                </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Report Details</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Type & Severity</TableHead>
                    <TableHead>AI Confidence</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingReports.map((report) => (
                    <TableRow key={report.id}>
                        <TableCell>
                        <div>
                            <div className="font-medium text-sm">
                            {report.title}
                            </div>
                            <div className="text-xs text-gray-600">
                            {report.location}
                            </div>
                            <div className="flex items-center mt-1">
                            <Camera className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="text-xs text-gray-600">
                                {report.photos} photos
                            </span>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                        <div className="text-sm">{report.submittedBy}</div>
                        </TableCell>
                        <TableCell>
                        <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                            {report.type}
                            </Badge>
                            <Badge
                            className={cn(
                                "text-xs",
                                getSeverityColor(report.severity),
                            )}
                            >
                            {report.severity}
                            </Badge>
                        </div>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center">
                            <div className="text-sm font-medium">
                            {Math.round(report.aiConfidence * 100)}%
                            </div>
                            <div
                            className={cn(
                                "ml-2 w-2 h-2 rounded-full",
                                report.aiConfidence > 0.9
                                ? "bg-green-500"
                                : report.aiConfidence > 0.7
                                    ? "bg-yellow-500"
                                    : "bg-red-500",
                            )}
                            />
                        </div>
                        </TableCell>
                        <TableCell>
                        <div className="text-xs text-gray-600">
                            {report.submittedAt}
                        </div>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center space-x-1">
                            <Dialog
                            open={
                                showReportDialog &&
                                selectedReport?.id === report.id
                            }
                            onOpenChange={setShowReportDialog}
                            >
                            <DialogTrigger asChild>
                                <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReport(report)}
                                >
                                <Eye className="w-3 h-3" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                <DialogTitle>Report Validation</DialogTitle>
                                <DialogDescription>
                                    Review and validate pollution report
                                </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                    <Label>Title</Label>
                                    <div className="text-sm font-medium">
                                        {selectedReport?.title}
                                    </div>
                                    </div>
                                    <div>
                                    <Label>Location</Label>
                                    <div className="text-sm">
                                        {selectedReport?.location}
                                    </div>
                                    </div>
                                </div>
                                <div>
                                    <Label>Description</Label>
                                    <div className="text-sm">
                                    {selectedReport?.description}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                    <Label>Type</Label>
                                    <Badge variant="outline">
                                        {selectedReport?.type}
                                    </Badge>
                                    </div>
                                    <div>
                                    <Label>Severity</Label>
                                    <Badge
                                        className={getSeverityColor(
                                        selectedReport?.severity || "",
                                        )}
                                    >
                                        {selectedReport?.severity}
                                    </Badge>
                                    </div>
                                    <div>
                                    <Label>AI Confidence</Label>
                                    <div className="text-sm font-medium">
                                        {Math.round(
                                        (selectedReport?.aiConfidence || 0) *
                                            100,
                                        )}
                                        %
                                    </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2 pt-4">
                                    <Button
                                    onClick={() =>
                                        handleReportAction(
                                        selectedReport?.id,
                                        "approve",
                                        )
                                    }
                                    className="bg-green-600 hover:bg-green-700"
                                    >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve Report
                                    </Button>
                                    <Button
                                    variant="destructive"
                                    onClick={() =>
                                        handleReportAction(
                                        selectedReport?.id,
                                        "reject",
                                        )
                                    }
                                    >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject Report
                                    </Button>
                                    <Button
                                    variant="outline"
                                    onClick={() =>
                                        handleReportAction(
                                        selectedReport?.id,
                                        "request_info",
                                        )
                                    }
                                    >
                                    Request More Info
                                    </Button>
                                </div>
                                </div>
                            </DialogContent>
                            </Dialog>
                        </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="users">
            <Card className="border-waterbase-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    User Management
                </CardTitle>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input placeholder="Search users..." className="pl-10" />
                    </div>
                    <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                    </Button>
                </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>User Details</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {systemUsers.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell>
                        <div>
                            <div className="font-medium text-sm">
                            {user.name}
                            </div>
                            <div className="text-xs text-gray-600">
                            {user.email}
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                        <Badge
                            variant={
                            user.role === "NGO" ? "default" : "outline"
                            }
                        >
                            {user.role}
                        </Badge>
                        </TableCell>
                        <TableCell>
                        <div className="text-xs space-y-1">
                            <div>Reports: {user.reportsSubmitted}</div>
                            <div>Events: {user.eventsJoined}</div>
                            {user.role === "Volunteer" && (
                            <div>Points: {user.points}</div>
                            )}
                        </div>
                        </TableCell>
                        <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                            {user.status}
                        </Badge>
                        </TableCell>
                        <TableCell>
                        <div className="text-xs">{user.joinDate}</div>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center space-x-1">
                            <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            >
                            <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="volunteers">
            <Card className="border-waterbase-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Volunteer Task Management
                </CardTitle>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Task
                </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Task Details</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {volunteerTasks.map((task) => (
                    <TableRow key={task.id}>
                        <TableCell>
                        <div>
                            <div className="font-medium text-sm">
                            {task.taskName}
                            </div>
                            <div className="text-xs text-gray-600">
                            {task.description}
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                        <div className="text-sm">{task.assignedTo}</div>
                        </TableCell>
                        <TableCell>
                        <div className="text-sm">{task.assignedBy}</div>
                        </TableCell>
                        <TableCell>
                        <Badge
                            className={
                            task.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }
                        >
                            {task.priority}
                        </Badge>
                        </TableCell>
                        <TableCell>
                        <div className="text-xs">{task.dueDate}</div>
                        </TableCell>
                        <TableCell>
                        <Badge className={getStatusColor(task.status)}>
                            {task.status}
                        </Badge>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center space-x-1">
                            <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3" />
                            </Button>
                        </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-waterbase-200">
                <CardHeader>
                <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    System Configuration
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div>
                    <Label>AI Validation Threshold</Label>
                    <Select defaultValue="0.8">
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0.7">70% Confidence</SelectItem>
                        <SelectItem value="0.8">80% Confidence</SelectItem>
                        <SelectItem value="0.9">90% Confidence</SelectItem>
                        <SelectItem value="0.95">95% Confidence</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Auto-approve Reports</Label>
                    <Select defaultValue="disabled">
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="high">
                        High Confidence Only
                        </SelectItem>
                        <SelectItem value="all">All Above Threshold</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Email Notifications</Label>
                    <Select defaultValue="enabled">
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="critical">Critical Only</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                </CardContent>
            </Card>

            <Card className="border-waterbase-200">
                <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export System Data
                </Button>
                <Button variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Cache
                </Button>
                <Button variant="outline" className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Reports
                </Button>
                <Button variant="destructive" className="w-full">
                    <Shield className="w-4 h-4 mr-2" />
                    System Backup
                </Button>
                </CardContent>
            </Card>
            </div>
        </TabsContent>
        </Tabs>
    </div>
    </div>
);
};
