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
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";
import { User, Mail, Lock, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export const Register = () => {
const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    organization: "",
    userType: "",
    agreeToTerms: false,
});

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registration data:", formData);
};

return (
    <div className="min-h-screen bg-gradient-to-br from-waterbase-50 to-enviro-50">
    <Navigation />

    <div className="max-w-md mx-auto py-12 px-4">
        <Card className="border-waterbase-200 shadow-lg">
        <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-waterbase-950">
            Join WaterBase
            </CardTitle>
            <CardDescription className="text-waterbase-600">
            Create your account to start reporting and monitoring water
            pollution
            </CardDescription>
        </CardHeader>

        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                    id="firstName"
                    placeholder="Maria"
                    value={formData.firstName}
                    onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                    }
                />
                </div>
                <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                    id="lastName"
                    placeholder="Santos"
                    value={formData.lastName}
                    onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                    }
                />
                </div>
            </div>

            <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    id="email"
                    type="email"
                    placeholder="maria@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                    }
                />
                </div>
            </div>

            <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    id="phone"
                    type="tel"
                    placeholder="+63 912 345 6789"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                    }
                />
                </div>
            </div>

            <div>
                <Label htmlFor="userType">User Type</Label>
                <Select
                value={formData.userType}
                onValueChange={(value) =>
                    setFormData({ ...formData, userType: value })
                }
                >
                <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="citizen">Concerned Citizen</SelectItem>
                    <SelectItem value="ngo">NGO Representative</SelectItem>
                    <SelectItem value="lgu">LGU Official</SelectItem>
                    <SelectItem value="researcher">Researcher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="organization">Organization (Optional)</Label>
                <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    id="organization"
                    placeholder="Environmental Watch PH"
                    className="pl-10"
                    value={formData.organization}
                    onChange={(e) =>
                    setFormData({ ...formData, organization: e.target.value })
                    }
                />
                </div>
            </div>

            <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                    }
                />
                </div>
            </div>

            <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                    setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                    })
                    }
                />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) =>
                    setFormData({
                    ...formData,
                    agreeToTerms: checked as boolean,
                    })
                }
                />
                <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link
                    to="/terms"
                    className="text-waterbase-600 hover:underline"
                >
                    Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                    to="/privacy"
                    className="text-waterbase-600 hover:underline"
                >
                    Privacy Policy
                </Link>
                </Label>
            </div>

            <Button
                type="submit"
                className="w-full bg-waterbase-500 hover:bg-waterbase-600"
                disabled={!formData.agreeToTerms}
            >
                Create Account
            </Button>

            <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                to="/login"
                className="text-waterbase-600 hover:underline font-medium"
                >
                Sign in
                </Link>
            </div>
            </form>
        </CardContent>
        </Card>
    </div>
    </div>
);
};