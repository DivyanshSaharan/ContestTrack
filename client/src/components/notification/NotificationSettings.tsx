import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NotificationTiming } from "@shared/schema";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation } from "@tanstack/react-query";

// Define interface for notification preferences
interface NotificationPreference {
  id: number | null;
  userId: number;
  emailEnabled: boolean;
  emailAddress: string;
  notifyBefore: string[];
  favoriteContestsOnly: boolean;
}

// Define notification timing options
const timingOptions: Record<NotificationTiming, string> = {
  "1hour": "1 Hour Before",
  "3hours": "3 Hours Before",
  "1day": "1 Day Before"
};

export default function NotificationSettings() {
  const { toast } = useToast();

  // Fetch notification preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["/api/notification-preferences"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/notification-preferences");
      return response.json();
    },
  });

  // Local state for form
  const [formState, setFormState] = useState<NotificationPreference>({
    id: null,
    userId: 0,
    emailEnabled: true,
    emailAddress: "",
    notifyBefore: ["1day"],
    favoriteContestsOnly: false
  });

  // Update form state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      const prefs = preferences as unknown as NotificationPreference;
      setFormState(prefs);
    }
  }, [preferences]);

  // Define mutation for saving preferences
  const savePreferences = useMutation({
    mutationFn: async (data: Partial<NotificationPreference>) => {
      const response = await apiRequest("PUT", "/api/notification-preferences", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
      // Invalidate query to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive",
      });
      console.error("Save preferences error:", error);
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    savePreferences.mutate({
      emailEnabled: formState.emailEnabled,
      notifyBefore: formState.notifyBefore,
      favoriteContestsOnly: formState.favoriteContestsOnly
    });
  };

  // Handle email toggle
  const handleEmailToggle = (checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      emailEnabled: checked
    }));
  };

  // Handle timing selection
  const toggleNotificationTiming = (timing: NotificationTiming) => {
    setFormState(prev => {
      const timings = [...prev.notifyBefore];
      
      if (timings.includes(timing)) {
        return {
          ...prev,
          notifyBefore: timings.filter(t => t !== timing)
        };
      } else {
        return {
          ...prev,
          notifyBefore: [...timings, timing]
        };
      }
    });
  };

  // Handle favorite contests only toggle
  const handleFavoriteOnlyToggle = (checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      favoriteContestsOnly: checked
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading notification settings...</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Choose when and how you want to be notified about upcoming contests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for upcoming contests
              </p>
            </div>
            <Switch 
              checked={formState.emailEnabled} 
              onCheckedChange={handleEmailToggle} 
              id="email-notifications"
            />
          </div>

          {formState.emailEnabled && (
            <div className="space-y-4 mt-4 pl-2 border-l-2 border-primary/20 py-2">
              <div>
                <Label className="text-base">When to notify?</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {Object.entries(timingOptions).map(([timing, label]) => (
                    <div key={timing} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`timing-${timing}`} 
                        checked={formState.notifyBefore.includes(timing)} 
                        onCheckedChange={() => toggleNotificationTiming(timing as NotificationTiming)} 
                      />
                      <Label htmlFor={`timing-${timing}`}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="favorite-only" 
                  checked={formState.favoriteContestsOnly} 
                  onCheckedChange={handleFavoriteOnlyToggle} 
                />
                <Label htmlFor="favorite-only">Only notify for favorite contests</Label>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={savePreferences.isPending}
        >
          {savePreferences.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
}