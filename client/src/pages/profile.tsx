import { useAuth } from "@/components/auth/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContestPreferences from "@/components/preferences/ContestPreferences";
import NotificationSettings from "@/components/notification/NotificationSettings";
import PlatformConnections from "@/components/profile/PlatformConnections";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-48">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to home");
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // If user is not authenticated, show message instead of redirecting immediately
  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center h-48">
          <p className="text-xl font-medium mb-2">Please log in to view your profile</p>
          <button 
            onClick={() => setLocation("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Username</p>
                <p className="text-lg">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="mb-6 grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="preferences">Contest Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="connections">Platforms</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preferences">
          <ContestPreferences />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="connections">
          <PlatformConnections userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}