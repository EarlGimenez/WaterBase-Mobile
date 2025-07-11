import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  Users,
  MessageSquare,
  Award,
  Calendar,
  Building,
  Heart,
} from "lucide-react";

export const Community = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-waterbase-950 mb-4">
            Community Hub
          </h1>
          <p className="text-lg text-waterbase-700 max-w-3xl mx-auto">
            Connect with environmental advocates, NGOs, and government agencies
            working together to protect our water resources across the
            Philippines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border-waterbase-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-waterbase-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-waterbase-600" />
              </div>
              <CardTitle className="text-waterbase-950">
                Discussion Forums
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Join conversations about water protection, share experiences,
                and collaborate on solutions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-waterbase-500 hover:bg-waterbase-600">
                Join Discussions
              </Button>
            </CardContent>
          </Card>

          <Card className="border-waterbase-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-enviro-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-enviro-600" />
              </div>
              <CardTitle className="text-waterbase-950">
                Volunteer Portal
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Join cleanup events, earn rewards, and help protect Philippine
                waterways as a volunteer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/portal/volunteer">
                <Button className="w-full bg-enviro-500 hover:bg-enviro-600">
                  <Heart className="w-4 h-4 mr-2" />
                  Join as Volunteer
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-waterbase-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-waterbase-100 rounded-lg flex items-center justify-center mb-4">
                <Building className="w-6 h-6 text-waterbase-600" />
              </div>
              <CardTitle className="text-waterbase-950">
                Organizer Portal
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Create cleanup events, manage volunteers, and coordinate
                environmental initiatives for NGOs & LGUs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/portal/organizer">
                <Button
                  variant="outline"
                  className="w-full border-waterbase-300 text-waterbase-700 hover:bg-waterbase-50"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Organize Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Community Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-waterbase-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-waterbase-950 mb-8 text-center">
            Community Impact
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-waterbase-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-waterbase-600" />
              </div>
              <div className="text-3xl font-bold text-waterbase-950 mb-1">
                2,450
              </div>
              <p className="text-waterbase-600 text-sm">Active Members</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-enviro-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-enviro-600" />
              </div>
              <div className="text-3xl font-bold text-waterbase-950 mb-1">
                1,234
              </div>
              <p className="text-waterbase-600 text-sm">Reports Verified</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-waterbase-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-waterbase-600" />
              </div>
              <div className="text-3xl font-bold text-waterbase-950 mb-1">
                87
              </div>
              <p className="text-waterbase-600 text-sm">Cleanup Events</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-enviro-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-enviro-600" />
              </div>
              <div className="text-3xl font-bold text-waterbase-950 mb-1">
                156
              </div>
              <p className="text-waterbase-600 text-sm">Sites Cleaned</p>
            </div>
          </div>
        </div>

        {/* Featured Organizations */}
        <div className="bg-white rounded-lg shadow-sm border border-waterbase-200 p-8">
          <h2 className="text-2xl font-bold text-waterbase-950 mb-8 text-center">
            Partner Organizations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Manila Bay Coalition", type: "NGO", projects: 23 },
              { name: "Quezon City Environment", type: "LGU", projects: 18 },
              { name: "Clean Water Philippines", type: "NGO", projects: 34 },
              { name: "Laguna Provincial Gov", type: "LGU", projects: 12 },
              { name: "Marikina River Watch", type: "NGO", projects: 28 },
              { name: "Environmental Guard PH", type: "NGO", projects: 15 },
            ].map((org, index) => (
              <Card key={index} className="border-waterbase-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-waterbase-950">
                    {org.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-waterbase-600">
                    {org.type} • {org.projects} active projects
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-waterbase-600 text-sm">
            Community features are coming soon. This will include forums, event
            management, organization portals, and collaborative tools for
            environmental protection.
          </p>
        </div>
      </div>
    </div>
  );
};