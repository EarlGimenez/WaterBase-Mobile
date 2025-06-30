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
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import {
FileText,
Search,
Filter,
Plus,
Edit,
Trash2,
Eye,
Download,
Upload,
MapPin,
Camera,
Calendar,
User,
CheckCircle,
XCircle,
Clock,
AlertTriangle,
BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Extended mock data for all reports
const allReports = [
{
    id: 1,
    title: "Industrial Waste in Pasig River",
    location: "Pasig River, Metro Manila",
    address: "Brgy. Kapitolyo, Pasig City",
    coordinates: { lat: 14.5995, lng: 121.0008 },
    submittedBy: "Maria Santos",
    submittedAt: "2024-01-15 14:30",
    type: "Industrial Waste",
    severity: "High",
    status: "Verified",
    photos: 3,
    aiConfidence: 0.94,
    description:
    "Heavy oil contamination with visible plastic debris along the riverbank",
    adminNotes: "Verified through satellite imagery. Cleanup scheduled.",
    verifiedBy: "Admin",
    verifiedAt: "2024-01-16 09:15",
},
{
    id: 2,
    title: "Plastic Pollution in Manila Bay",
    location: "Manila Bay, Manila",
    address: "Roxas Boulevard, Manila",
    coordinates: { lat: 14.5794, lng: 120.9647 },
    submittedBy: "Juan dela Cruz",
    submittedAt: "2024-01-15 13:45",
    type: "Plastic Pollution",
    severity: "Medium",
    status: "Under Review",
    photos: 5,
    aiConfidence: 0.87,
    description:
    "Large amount of plastic bottles and containers floating downstream",
    adminNotes: "Awaiting field verification team report",
    verifiedBy: null,
    verifiedAt: null,
},
{
    id: 3,
    title: "Chemical Discharge in Laguna Lake",
    location: "Laguna Lake, Laguna",
    address: "Brgy. San Pedro, Bay, Laguna",
    coordinates: { lat: 14.3591, lng: 121.2663 },
    submittedBy: "Environmental Watch PH",
    submittedAt: "2024-01-14 16:20",
    type: "Chemical Pollution",
    severity: "Critical",
    status: "Rejected",
    photos: 4,
    aiConfidence: 0.45,
    description: "Suspicious chemical discharge causing water discoloration",
    adminNotes: "Images determined to be natural algae bloom, not pollution",
    verifiedBy: "Senior Admin",
    verifiedAt: "2024-01-15 11:30",
},
];

const AdminReports = () => {
const [activeTab, setActiveTab] = useState("all");
const [selectedReport, setSelectedReport] = useState<any>(null);
const [showReportDialog, setShowReportDialog] = useState(false);
const [showEditDialog, setShowEditDialog] = useState(false);
const [showCreateDialog, setShowCreateDialog] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [filterStatus, setFilterStatus] = useState("all");
const [filterType, setFilterType] = useState("all");

const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    type: "",
    severity: "",
    status: "",
    adminNotes: "",
});

const [createForm, setCreateForm] = useState({
    title: "",
    location: "",
    address: "",
    latitude: "",
    longitude: "",
    type: "",
    severity: "",
    description: "",
    submittedBy: "",
});

const filteredReports = allReports.filter((report) => {
    const matchesSearch =
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.submittedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
    filterStatus === "all" ||
    report.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesType =
    filterType === "all" ||
    report.type.toLowerCase().includes(filterType.toLowerCase());

    return matchesSearch && matchesStatus && matchesType;
});

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
    case "verified":
        return "bg-green-100 text-green-800";
    case "under review":
        return "bg-yellow-100 text-yellow-800";
    case "rejected":
        return "bg-red-100 text-red-800";
    case "pending":
        return "bg-blue-100 text-blue-800";
    default:
        return "bg-gray-100 text-gray-800";
    }
};

const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
    case "critical":
        return "bg-red-500 text-white";
    case "high":
        return "bg-orange-500 text-white";
    case "medium":
        return "bg-yellow-500 text-black";
    case "low":
        return "bg-green-500 text-white";
    default:
        return "bg-gray-500 text-white";
    }
};

const handleEditReport = () => {
    console.log("Updating report:", editForm);
    setShowEditDialog(false);
};

const handleCreateReport = () => {
    console.log("Creating new report:", createForm);
    setShowCreateDialog(false);
    setCreateForm({
    title: "",
    location: "",
    address: "",
    latitude: "",
    longitude: "",
    type: "",
    severity: "",
    description: "",
    submittedBy: "",
    });
};

const handleDeleteReport = (reportId: number) => {
    console.log("Deleting report:", reportId);
};

const openEditDialog = (report: any) => {
    setSelectedReport(report);
    setEditForm({
    title: report.title,
    description: report.description,
    type: report.type,
    severity: report.severity,
    status: report.status,
    adminNotes: report.adminNotes || "",
    });
    setShowEditDialog(true);
};

const reportStats = {
    total: allReports.length,
    verified: allReports.filter((r) => r.status === "Verified").length,
    pending: allReports.filter((r) => r.status === "Under Review").length,
    rejected: allReports.filter((r) => r.status === "Rejected").length,
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
                Report Management
            </h1>
            <p className="text-waterbase-700">
                Comprehensive CRUD operations for pollution reports
            </p>
            </div>
            <div className="flex items-center space-x-4">
            <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
            >
                <DialogTrigger asChild>
                <Button className="bg-waterbase-500 hover:bg-waterbase-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Report
                </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Pollution Report</DialogTitle>
                    <DialogDescription>
                    Add a new pollution report to the system
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                    <Label htmlFor="createTitle">Report Title</Label>
                    <Input
                        id="createTitle"
                        placeholder="Brief description of pollution incident"
                        value={createForm.title}
                        onChange={(e) =>
                        setCreateForm({
                            ...createForm,
                            title: e.target.value,
                        })
                        }
                    />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="createLocation">Location</Label>
                        <Input
                        id="createLocation"
                        placeholder="Manila Bay, Manila"
                        value={createForm.location}
                        onChange={(e) =>
                            setCreateForm({
                            ...createForm,
                            location: e.target.value,
                            })
                        }
                        />
                    </div>
                    <div>
                        <Label htmlFor="createAddress">Full Address</Label>
                        <Input
                        id="createAddress"
                        placeholder="Roxas Boulevard, Manila"
                        value={createForm.address}
                        onChange={(e) =>
                            setCreateForm({
                            ...createForm,
                            address: e.target.value,
                            })
                        }
                        />
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="createLat">Latitude</Label>
                        <Input
                        id="createLat"
                        placeholder="14.5794"
                        value={createForm.latitude}
                        onChange={(e) =>
                            setCreateForm({
                            ...createForm,
                            latitude: e.target.value,
                            })
                        }
                        />
                    </div>
                    <div>
                        <Label htmlFor="createLng">Longitude</Label>
                        <Input
                        id="createLng"
                        placeholder="120.9647"
                        value={createForm.longitude}
                        onChange={(e) =>
                            setCreateForm({
                            ...createForm,
                            longitude: e.target.value,
                            })
                        }
                        />
                    </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="createType">Pollution Type</Label>
                        <Select
                        value={createForm.type}
                        onValueChange={(value) =>
                            setCreateForm({ ...createForm, type: value })
                        }
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Industrial Waste">
                            Industrial Waste
                            </SelectItem>
                            <SelectItem value="Plastic Pollution">
                            Plastic Pollution
                            </SelectItem>
                            <SelectItem value="Chemical Pollution">
                            Chemical Pollution
                            </SelectItem>
                            <SelectItem value="Sewage Discharge">
                            Sewage Discharge
                            </SelectItem>
                            <SelectItem value="Oil Spill">Oil Spill</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="createSeverity">Severity Level</Label>
                        <Select
                        value={createForm.severity}
                        onValueChange={(value) =>
                            setCreateForm({ ...createForm, severity: value })
                        }
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    </div>

                    <div>
                    <Label htmlFor="createSubmitter">Submitted By</Label>
                    <Input
                        id="createSubmitter"
                        placeholder="Reporter name or organization"
                        value={createForm.submittedBy}
                        onChange={(e) =>
                        setCreateForm({
                            ...createForm,
                            submittedBy: e.target.value,
                        })
                        }
                    />
                    </div>

                    <div>
                    <Label htmlFor="createDescription">Description</Label>
                    <Textarea
                        id="createDescription"
                        placeholder="Detailed description of the pollution incident..."
                        value={createForm.description}
                        onChange={(e) =>
                        setCreateForm({
                            ...createForm,
                            description: e.target.value,
                        })
                        }
                        rows={3}
                    />
                    </div>

                    <div className="flex space-x-2 pt-4">
                    <Button
                        onClick={handleCreateReport}
                        className="flex-1 bg-waterbase-500 hover:bg-waterbase-600"
                    >
                        Create Report
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    </div>
                </div>
                </DialogContent>
            </Dialog>

            <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
            </Button>
            <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
            </Button>
            </div>
        </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-waterbase-200">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">
                    Total Reports
                </p>
                <p className="text-3xl font-bold text-waterbase-950">
                    {reportStats.total}
                </p>
                </div>
                <FileText className="w-8 h-8 text-waterbase-600" />
            </div>
            </CardContent>
        </Card>

        <Card className="border-waterbase-200">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-3xl font-bold text-green-600">
                    {reportStats.verified}
                </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            </CardContent>
        </Card>

        <Card className="border-waterbase-200">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                    {reportStats.pending}
                </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            </CardContent>
        </Card>

        <Card className="border-waterbase-200">
            <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">
                    {reportStats.rejected}
                </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
            </div>
            </CardContent>
        </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-waterbase-200 mb-6">
        <CardContent className="p-6">
            <div className="flex items-center space-x-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                placeholder="Search reports by title, location, or submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="under review">Under Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="industrial">Industrial Waste</SelectItem>
                <SelectItem value="plastic">Plastic Pollution</SelectItem>
                <SelectItem value="chemical">Chemical Pollution</SelectItem>
                <SelectItem value="sewage">Sewage Discharge</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
            </Button>
            </div>
        </CardContent>
        </Card>

        {/* Reports Table */}
        <Card className="border-waterbase-200">
        <CardHeader>
            <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            All Reports ({filteredReports.length})
            </CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Report Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Type & Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredReports.map((report) => (
                <TableRow key={report.id}>
                    <TableCell>
                    <div>
                        <div className="font-medium text-sm">
                        {report.title}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                        ID: {report.id}
                        </div>
                        <div className="flex items-center mt-1">
                        <Camera className="w-3 h-3 mr-1 text-gray-400" />
                        <span className="text-xs text-gray-600">
                            {report.photos} photos
                        </span>
                        <span className="text-xs text-gray-600 ml-2">
                            AI: {Math.round(report.aiConfidence * 100)}%
                        </span>
                        </div>
                    </div>
                    </TableCell>
                    <TableCell>
                    <div>
                        <div className="text-sm font-medium">
                        {report.location}
                        </div>
                        <div className="text-xs text-gray-600">
                        {report.address}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                        {report.coordinates.lat}, {report.coordinates.lng}
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
                    <Badge
                        className={cn("text-xs", getStatusColor(report.status))}
                    >
                        {report.status}
                    </Badge>
                    {report.verifiedBy && (
                        <div className="text-xs text-gray-600 mt-1">
                        by {report.verifiedBy}
                        </div>
                    )}
                    </TableCell>
                    <TableCell>
                    <div className="text-xs text-gray-600">
                        {report.submittedAt}
                    </div>
                    {report.verifiedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                        Verified: {report.verifiedAt}
                        </div>
                    )}
                    </TableCell>
                    <TableCell>
                    <div className="flex items-center space-x-1">
                        <Dialog
                        open={
                            showReportDialog && selectedReport?.id === report.id
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
                            <DialogTitle>Report Details</DialogTitle>
                            <DialogDescription>
                                Complete information for report #
                                {selectedReport?.id}
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
                                <Label>Status</Label>
                                <Badge
                                    className={getStatusColor(
                                    selectedReport?.status || "",
                                    )}
                                >
                                    {selectedReport?.status}
                                </Badge>
                                </div>
                            </div>
                            <div>
                                <Label>Location</Label>
                                <div className="text-sm">
                                {selectedReport?.location}
                                </div>
                                <div className="text-xs text-gray-600">
                                {selectedReport?.address}
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
                                    (selectedReport?.aiConfidence || 0) * 100,
                                    )}
                                    %
                                </div>
                                </div>
                            </div>
                            {selectedReport?.adminNotes && (
                                <div>
                                <Label>Admin Notes</Label>
                                <div className="text-sm bg-gray-50 p-3 rounded-lg">
                                    {selectedReport.adminNotes}
                                </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                                <div>
                                <Label>Submitted By</Label>
                                <div>{selectedReport?.submittedBy}</div>
                                <div>{selectedReport?.submittedAt}</div>
                                </div>
                                {selectedReport?.verifiedBy && (
                                <div>
                                    <Label>Verified By</Label>
                                    <div>{selectedReport.verifiedBy}</div>
                                    <div>{selectedReport.verifiedAt}</div>
                                </div>
                                )}
                            </div>
                            </div>
                        </DialogContent>
                        </Dialog>

                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(report)}
                        >
                        <Edit className="w-3 h-3" />
                        </Button>

                        <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteReport(report.id)}
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

        {/* Edit Report Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>
                Update report information and validation status
            </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
            <div>
                <Label htmlFor="editTitle">Title</Label>
                <Input
                id="editTitle"
                value={editForm.title}
                onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                }
                />
            </div>
            <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                id="editDescription"
                value={editForm.description}
                onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
                />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                <Label htmlFor="editType">Type</Label>
                <Select
                    value={editForm.type}
                    onValueChange={(value) =>
                    setEditForm({ ...editForm, type: value })
                    }
                >
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Industrial Waste">
                        Industrial Waste
                    </SelectItem>
                    <SelectItem value="Plastic Pollution">
                        Plastic Pollution
                    </SelectItem>
                    <SelectItem value="Chemical Pollution">
                        Chemical Pollution
                    </SelectItem>
                    <SelectItem value="Sewage Discharge">
                        Sewage Discharge
                    </SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div>
                <Label htmlFor="editSeverity">Severity</Label>
                <Select
                    value={editForm.severity}
                    onValueChange={(value) =>
                    setEditForm({ ...editForm, severity: value })
                    }
                >
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select
                    value={editForm.status}
                    onValueChange={(value) =>
                    setEditForm({ ...editForm, status: value })
                    }
                >
                    <SelectTrigger>
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Verified">Verified</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>
            <div>
                <Label htmlFor="editNotes">Admin Notes</Label>
                <Textarea
                id="editNotes"
                placeholder="Internal notes about this report..."
                value={editForm.adminNotes}
                onChange={(e) =>
                    setEditForm({ ...editForm, adminNotes: e.target.value })
                }
                rows={2}
                />
            </div>
            <div className="flex space-x-2 pt-4">
                <Button
                onClick={handleEditReport}
                className="flex-1 bg-waterbase-500 hover:bg-waterbase-600"
                >
                Update Report
                </Button>
                <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
                >
                Cancel
                </Button>
            </div>
            </div>
        </DialogContent>
        </Dialog>
    </div>
    </div>
);
};

export default AdminReports;
