import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import {
  MapPin,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Camera,
  Calendar,
  User,
  X,
  Plus,
  BarChart3,
  Eye,
  Target,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

// Mock data for pollution reports
const mockReports = [
  {
    id: 1,
    location: "Pasig River, Metro Manila",
    address: "Brgy. Kapitolyo, Pasig City, Metro Manila",
    coordinates: { lat: 14.5995, lng: 121.0008 },
    type: "Industrial Waste",
    severity: "High",
    status: "Verified",
    reportedBy: "Maria Santos",
    reportedAt: "2024-01-15",
    description:
      "Heavy oil contamination with visible plastic debris along the riverbank",
    images: 3,
    verificationScore: 0.94,
    priority: "high",
  },
  {
    id: 2,
    location: "Marikina River, Quezon City",
    address: "Brgy. Bagumbayan, Quezon City",
    coordinates: { lat: 14.6349, lng: 121.1076 },
    type: "Plastic Pollution",
    severity: "Medium",
    status: "Under Review",
    reportedBy: "Juan dela Cruz",
    reportedAt: "2024-01-14",
    description:
      "Large amount of plastic bottles and containers floating downstream",
    images: 5,
    verificationScore: 0.87,
    priority: "medium",
  },
  {
    id: 3,
    location: "Laguna Lake, Laguna",
    address: "Brgy. San Pedro, Bay, Laguna",
    coordinates: { lat: 14.3591, lng: 121.2663 },
    type: "Sewage Discharge",
    severity: "High",
    status: "Cleanup Initiated",
    reportedBy: "Environmental Watch PH",
    reportedAt: "2024-01-13",
    description:
      "Raw sewage discharge affecting local fish population and water quality",
    images: 7,
    verificationScore: 0.91,
    priority: "high",
  },
  {
    id: 4,
    location: "Manila Bay, Manila",
    address: "Roxas Boulevard, Manila",
    coordinates: { lat: 14.5794, lng: 120.9647 },
    type: "Chemical Pollution",
    severity: "Critical",
    status: "Verified",
    reportedBy: "Bay Area Coalition",
    reportedAt: "2024-01-12",
    description:
      "Chemical runoff causing visible water discoloration and fish deaths",
    images: 4,
    verificationScore: 0.96,
    priority: "critical",
  },
];

// Priority zones for visualization
const priorityZones = [
  {
    name: "Manila Bay Industrial Zone",
    severity: "critical",
    coordinates: { lat: 14.5794, lng: 120.9647 },
  },
  {
    name: "Pasig River Central",
    severity: "high",
    coordinates: { lat: 14.5995, lng: 121.0008 },
  },
  {
    name: "Laguna Lake East",
    severity: "high",
    coordinates: { lat: 14.3591, lng: 121.2663 },
  },
];

export const MapView = () => {
  const [selectedReport, setSelectedReport] = useState<
    (typeof mockReports)[0] | null
  >(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredReports, setFilteredReports] = useState(mockReports);
  const [viewMode, setViewMode] = useState<"standard" | "priority">("standard");

  useEffect(() => {
    let filtered = mockReports;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((report) =>
        report.type.toLowerCase().includes(filterType.toLowerCase()),
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((report) =>
        report.status.toLowerCase().includes(filterStatus.toLowerCase()),
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (report) =>
          report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          report.reportedBy.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredReports(filtered);
  }, [filterType, filterStatus, searchQuery]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Add this function before the component
  const createPollutionIcon = (report: typeof mockReports[0]) => {
    const dropletHtml = renderToStaticMarkup(
      <div className={cn(
        "w-8 h-8 flex items-center justify-center rounded-full border-2 shadow-lg bg-white",
        getSeverityColor(report.severity)
      )}>
        <Droplets className="w-5 h-5 text-white" />
      </div>
    );

    return L.divIcon({
      html: dropletHtml,
      className: 'custom-droplet-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  const getPriorityZoneColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500/20 border-red-500";
      case "high":
        return "bg-orange-500/20 border-orange-500";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500";
      default:
        return "bg-gray-500/20 border-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "verified":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "under review":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "cleanup initiated":
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Enhanced Sidebar */}
        <div className="w-full lg:w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Header with View Toggle */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-waterbase-950">
                Pollution Reports
              </h2>
              <div className="flex space-x-1">
                <Button
                  variant={viewMode === "standard" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("standard")}
                  className="text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Standard
                </Button>
                <Button
                  variant={viewMode === "priority" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("priority")}
                  className="text-xs"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Priority
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              <Link to="/report">
                <Button className="w-full bg-waterbase-500 hover:bg-waterbase-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Submit New Report
                </Button>
              </Link>
              <Link to="/research-map">
                <Button
                  variant="outline"
                  className="w-full border-enviro-300 text-enviro-700 hover:bg-enviro-50"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Research Analysis
                </Button>
              </Link>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search locations, descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Type
                </label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="industrial">Industrial Waste</SelectItem>
                    <SelectItem value="plastic">Plastic Pollution</SelectItem>
                    <SelectItem value="sewage">Sewage Discharge</SelectItem>
                    <SelectItem value="chemical">Chemical Pollution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Status
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="under review">Under Review</SelectItem>
                    <SelectItem value="cleanup initiated">
                      Cleanup Initiated
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Priority Zone Highlights */}
          {viewMode === "priority" && (
            <div className="p-4 border-b border-gray-200 bg-red-50">
              <h3 className="text-sm font-semibold text-red-900 mb-3">
                High-Priority Zones
              </h3>
              <div className="space-y-2">
                {priorityZones.map((zone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-red-800">{zone.name}</span>
                    <Badge variant="destructive" className="text-xs">
                      {zone.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports list */}
          <div className="flex-1 overflow-y-auto">
            {filteredReports.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No reports match your filters</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredReports.map((report) => (
                  <Card
                    key={report.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedReport?.id === report.id
                        ? "ring-2 ring-waterbase-500"
                        : "",
                      viewMode === "priority" && report.priority === "critical"
                        ? "border-red-300 bg-red-50"
                        : viewMode === "priority" && report.priority === "high"
                          ? "border-orange-300 bg-orange-50"
                          : "",
                    )}
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium text-waterbase-950">
                            {report.location}
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-600 mt-1">
                            {report.type}
                          </CardDescription>
                          <CardDescription className="text-xs text-gray-500 mt-1">
                            {report.address}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-1">
                          {viewMode === "priority" && (
                            <Badge
                              variant={
                                report.priority === "critical"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {report.priority}
                            </Badge>
                          )}
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              getSeverityColor(report.severity),
                            )}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(report.status)}
                          <span>{report.status}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Camera className="w-3 h-3" />
                          <span>{report.images}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {report.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Map area */}
        <div className="flex-1 relative bg-gradient-to-br from-waterbase-100 to-enviro-100">
          {/* Map placeholder with enhanced visualization */}
          <div className="absolute inset-0">
            {/* Background map simulation */}
            <div className="w-full h-full relative overflow-hidden">
              {/* Simulated map background */}
              <MapContainer 
                center={[14.4793, 120.9106]} 
                zoom={10} 
                className="w-full h-full"
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Pollution report markers */}
                {filteredReports.map((report) => (
                  <Marker 
                    key={report.id}
                    position={[report.coordinates.lat, report.coordinates.lng]}
                    icon={createPollutionIcon(report)}
                    eventHandlers={{
                      click: () => setSelectedReport(report),
                    }}
                  >
                    <Popup>
                      <div className="text-center min-w-[200px]">
                        <div className="flex items-center justify-center mb-2">
                          <Droplets className="w-4 h-4 mr-1 text-waterbase-600" />
                          <span className="font-semibold">{report.location}</span>
                        </div>
                        <div className={cn("p-2 rounded mb-2", getSeverityColor(report.severity))}>
                          <div className="text-sm font-bold text-white">{report.type}</div>
                          <div className="text-xs text-white">{report.severity} Severity</div>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            {getStatusIcon(report.status)}
                            <span>{report.status}</span>
                          </div>
                          <div>Reported by: {report.reportedBy}</div>
                          <div>Date: {report.reportedAt}</div>
                        </div>
                        <p className="text-xs text-gray-700">{report.description}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Selected report details overlay */}
          {selectedReport && (
            <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20" style={{ zIndex: 10000 }}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-waterbase-950">
                    Report Details
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedReport(null)}
                    className="h-6 w-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="w-4 h-4 text-waterbase-600" />
                      <span className="font-medium text-sm">
                        {selectedReport.location}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6 mb-2">
                      {selectedReport.address}
                    </p>
                    <p className="text-sm text-gray-600 ml-6">
                      {selectedReport.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {selectedReport.type}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          getSeverityColor(selectedReport.severity),
                        )}
                      />
                      <span className="text-xs text-gray-600">
                        {selectedReport.severity}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    <strong>Coordinates:</strong>{" "}
                    {selectedReport.coordinates.lat},{" "}
                    {selectedReport.coordinates.lng}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{selectedReport.reportedBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{selectedReport.reportedAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(selectedReport.status)}
                      <span className="text-sm font-medium">
                        {selectedReport.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Camera className="w-3 h-3" />
                      <span>{selectedReport.images} photos</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    AI Verification:{" "}
                    {Math.round(selectedReport.verificationScore * 100)}%
                    confidence
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
