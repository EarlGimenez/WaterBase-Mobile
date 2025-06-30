import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, MapPin, Upload, Smartphone } from "lucide-react";

const ReportPollution = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-waterbase-50 to-enviro-50">
      <Navigation />

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-waterbase-950 mb-4">
            Report Water Pollution
          </h1>
          <p className="text-lg text-waterbase-700 max-w-2xl mx-auto">
            Help protect our waterways by reporting pollution incidents in your
            area. Your reports are verified using AI and contribute to
            environmental protection efforts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-waterbase-200">
            <CardHeader>
              <div className="w-12 h-12 bg-waterbase-100 rounded-lg flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-waterbase-600" />
              </div>
              <CardTitle className="text-waterbase-950">
                Quick Photo Report
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Capture and submit photos of water pollution with automatic
                location tagging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-waterbase-500 hover:bg-waterbase-600">
                <Camera className="w-4 h-4 mr-2" />
                Take Photo Report
              </Button>
            </CardContent>
          </Card>

          <Card className="border-waterbase-200">
            <CardHeader>
              <div className="w-12 h-12 bg-enviro-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-enviro-600" />
              </div>
              <CardTitle className="text-waterbase-950">
                Detailed Report
              </CardTitle>
              <CardDescription className="text-waterbase-600">
                Submit a comprehensive report with multiple photos and detailed
                information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full border-enviro-300 text-enviro-700 hover:bg-enviro-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Create Detailed Report
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-sm border border-waterbase-200 p-8">
          <h2 className="text-2xl font-bold text-waterbase-950 mb-6 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-waterbase-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-waterbase-600" />
              </div>
              <h3 className="font-semibold text-waterbase-950 mb-2">
                1. Capture
              </h3>
              <p className="text-waterbase-600 text-sm">
                Take photos of pollution using your smartphone with automatic
                GPS tagging
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-enviro-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-enviro-600" />
              </div>
              <h3 className="font-semibold text-waterbase-950 mb-2">
                2. Submit
              </h3>
              <p className="text-waterbase-600 text-sm">
                Upload your report with description and location details
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-waterbase-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-waterbase-600" />
              </div>
              <h3 className="font-semibold text-waterbase-950 mb-2">
                3. Verify & Map
              </h3>
              <p className="text-waterbase-600 text-sm">
                AI verifies your report and adds it to the public pollution map
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-waterbase-600 text-sm">
            This feature is coming soon. The full reporting system will include
            photo upload, GPS tagging, AI verification, and integration with the
            live map.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportPollution;
