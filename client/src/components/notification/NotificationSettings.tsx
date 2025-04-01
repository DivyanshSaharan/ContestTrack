import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../auth/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";

export default function NotificationSettings() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // State for notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationTiming, setNotificationTiming] = useState("1hour");
  const [notifyPlatforms, setNotifyPlatforms] = useState({
    codeforces: true,
    codechef: true,
    leetcode: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Query to fetch user's notification preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/notification-preferences'],
    enabled: isAuthenticated,
  });

  // Update local state when preferences data is loaded
  useEffect(() => {
    if (preferences) {
      setEmailNotifications(preferences.emailNotifications);
      setNotificationTiming(preferences.notificationTiming);
      setNotifyPlatforms({
        codeforces: preferences.notifyCodeforces,
        codechef: preferences.notifyCodechef,
        leetcode: preferences.notifyLeetcode,
      });
    }
  }, [preferences]);

  // Mutation for saving notification preferences
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', '/api/notification-preferences', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "An error occurred while saving your preferences",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const saveSettings = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to save notification settings",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await savePreferencesMutation.mutateAsync({
        emailNotifications,
        notificationTiming,
        notifyCodeforces: notifyPlatforms.codeforces,
        notifyCodechef: notifyPlatforms.codechef,
        notifyLeetcode: notifyPlatforms.leetcode,
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="mt-8 bg-white rounded-lg shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-800">Notification Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive emails about upcoming contests</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
              <Label htmlFor="email-notifications" className="sr-only">
                Email Notifications
              </Label>
            </div>
          </div>
          
          {emailNotifications && (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Notification Timing</h3>
                <p className="text-sm text-gray-500">When to receive notifications before contests</p>
              </div>
              <Select
                value={notificationTiming}
                onValueChange={setNotificationTiming}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1hour">1 hour before</SelectItem>
                  <SelectItem value="3hours">3 hours before</SelectItem>
                  <SelectItem value="1day">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Separator className="my-4" />
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Platform Notifications</h3>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="platform-codeforces"
                  checked={notifyPlatforms.codeforces}
                  onCheckedChange={(checked) => 
                    setNotifyPlatforms((prev) => ({ ...prev, codeforces: !!checked }))
                  }
                />
                <Label htmlFor="platform-codeforces" className="text-sm font-medium text-gray-700">
                  Codeforces
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="platform-codechef"
                  checked={notifyPlatforms.codechef}
                  onCheckedChange={(checked) => 
                    setNotifyPlatforms((prev) => ({ ...prev, codechef: !!checked }))
                  }
                />
                <Label htmlFor="platform-codechef" className="text-sm font-medium text-gray-700">
                  CodeChef
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="platform-leetcode"
                  checked={notifyPlatforms.leetcode}
                  onCheckedChange={(checked) => 
                    setNotifyPlatforms((prev) => ({ ...prev, leetcode: !!checked }))
                  }
                />
                <Label htmlFor="platform-leetcode" className="text-sm font-medium text-gray-700">
                  LeetCode
                </Label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button
              onClick={saveSettings}
              disabled={isSaving || isLoading}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
