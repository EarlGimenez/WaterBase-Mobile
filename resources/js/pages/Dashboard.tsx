import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  FileText,
  Shield,
  AlertTriangle,
} from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-waterbase-950 mb-2">
            Environmental Dashboard
          </h1>
          <p className="text-waterbase-700">
            Monitor water pollution reports, track cleanup progress, and analyze
            environmental data across the Philippines.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-waterbase-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reports
              </CardTitle>
              <FileText className="h-4 w-4 text-waterbase-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-waterbase-950">1,234</div>
              <p className="text-xs text-waterbase-600">
                <span className="text-enviro-600">+12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-waterbase-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Reports
              </CardTitle>
              <Shield className="h-4 w-4 text-enviro-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-waterbase-950">987</div>
              <p className="text-xs text-waterbase-600">
                <span className="text-enviro-600">80%</span> verification rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-waterbase-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-waterbase-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-waterbase-950">2,450</div>
              <p className="text-xs text-waterbase-600">
                <span className="text-enviro-600">+18%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-waterbase-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sites Cleaned
              </CardTitle>
              <MapPin className="h-4 w-4 text-enviro-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-waterbase-950">156</div>
              <p className="text-xs text-waterbase-600">
                <span className="text-enviro-600">+7</span> this month
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Reports */}
          <Card className="border-waterbase-200">
            <CardHeader>
              <CardTitle className="text-waterbase-950">
                Recent Reports
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Latest pollution reports submitted to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    location: "Pasig River, Metro Manila",
                    type: "Industrial Waste",
                    severity: "High",
                    time: "2 hours ago",
                  },
                  {
                    location: "Manila Bay, Manila",
                    type: "Chemical Pollution",
                    severity: "Critical",
                    time: "4 hours ago",
                  },
                  {
                    location: "Marikina River, QC",
                    type: "Plastic Pollution",
                    severity: "Medium",
                    time: "6 hours ago",
                  },
                  {
                    location: "Laguna Lake, Laguna",
                    type: "Sewage Discharge",
                    severity: "High",
                    time: "8 hours ago",
                  },
                ].map((report, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-waterbase-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-waterbase-950">
                        {report.location}
                      </div>
                      <div className="text-xs text-waterbase-600">
                        {report.type}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          report.severity === "Critical"
                            ? "destructive"
                            : report.severity === "High"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {report.severity}
                      </Badge>
                      <span className="text-xs text-waterbase-600">
                        {report.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cleanup Progress */}
          <Card className="border-waterbase-200">
            <CardHeader>
              <CardTitle className="text-waterbase-950">
                Cleanup Progress
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Active cleanup initiatives and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    project: "Manila Bay Restoration",
                    organization: "Manila Bay Coalition",
                    progress: 75,
                    status: "Active",
                  },
                  {
                    project: "Pasig River Cleanup",
                    organization: "MMDA",
                    progress: 60,
                    status: "Active",
                  },
                  {
                    project: "Marikina Riverbank",
                    organization: "Marikina LGU",
                    progress: 90,
                    status: "Completing",
                  },
                  {
                    project: "Laguna Lake Phase 2",
                    organization: "LLDA",
                    progress: 30,
                    status: "Starting",
                  },
                ].map((project, index) => (
                  <div key={index} className="p-3 bg-enviro-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm text-waterbase-950">
                        {project.project}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-waterbase-600 mb-2">
                      {project.organization}
                    </div>
                    <div className="w-full bg-waterbase-200 rounded-full h-2">
                      <div
                        className="bg-enviro-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-waterbase-600 mt-1">
                      {project.progress}% complete
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-waterbase-200">
            <CardHeader>
              <CardTitle className="text-waterbase-950">
                Reports by Region
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Geographic distribution of pollution reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-waterbase-500 mx-auto mb-4" />
                  <p className="text-waterbase-600">
                    Chart visualization coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-waterbase-200">
            <CardHeader>
              <CardTitle className="text-waterbase-950">
                Pollution Trends
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Monthly trends in pollution reporting and cleanup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-waterbase-100 to-enviro-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-enviro-500 mx-auto mb-4" />
                  <p className="text-waterbase-600">
                    Trend analysis coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-waterbase-600 text-sm">
            Dashboard features are coming soon. This will include real-time
            analytics, detailed reporting, data visualization, and
            administrative tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
