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
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";
import { Mail, Lock, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

export const Login = () => {
const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
});

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login data:", formData);
};

return (
    <div className="min-h-screen bg-gradient-to-br from-waterbase-50 to-enviro-50">
    <Navigation />

    <div className="max-w-md mx-auto py-12 px-4">
        <Card className="border-waterbase-200 shadow-lg">
        <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-waterbase-500 to-enviro-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-waterbase-950">
            Welcome Back
            </CardTitle>
            <CardDescription className="text-waterbase-600">
            Sign in to your WaterBase account to continue monitoring and
            reporting water pollution
            </CardDescription>
        </CardHeader>

        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    required
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
                    required
                />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                    setFormData({
                        ...formData,
                        rememberMe: checked as boolean,
                    })
                    }
                />
                <Label htmlFor="rememberMe" className="text-sm">
                    Remember me
                </Label>
                </div>
                <Link
                to="/forgot-password"
                className="text-sm text-waterbase-600 hover:underline"
                >
                Forgot password?
                </Link>
            </div>

            <Button
                type="submit"
                className="w-full bg-waterbase-500 hover:bg-waterbase-600"
            >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                    Or continue with
                </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" type="button" disabled>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Google
                </Button>
                <Button variant="outline" type="button" disabled>
                <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
                </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                to="/register"
                className="text-waterbase-600 hover:underline font-medium"
                >
                Sign up
                </Link>
            </div>
            </form>
        </CardContent>
        </Card>

        {/* Quick access for demo users */}
        <Card className="border-waterbase-200 mt-6">
        <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-waterbase-950 mb-3">
            Demo Access
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between">
                <span className="text-gray-600">Citizen:</span>
                <span className="font-mono">citizen@waterbase.ph</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">NGO:</span>
                <span className="font-mono">ngo@waterbase.ph</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">LGU:</span>
                <span className="font-mono">lgu@waterbase.ph</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Password:</span>
                <span className="font-mono">waterbase2024</span>
            </div>
            </div>
        </CardContent>
        </Card>
    </div>
    </div>
);
};