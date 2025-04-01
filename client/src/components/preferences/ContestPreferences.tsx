import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Platform, CodeforcesType, CodechefType, LeetcodeType } from "@shared/schema";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";

// Define interface for contest preferences
interface ContestPreference {
  id: number | null;
  userId: number;
  codeforcesMinRating: number;
  codeforcesMaxRating: number;
  codeforcesTypes: string[];
  codechefTypes: string[];
  leetcodeTypes: string[];
  minDurationMinutes: number;
  maxDurationMinutes: number;
  favoriteContestIds: number[];
}

// Define labels for each contest type
const codeforcesTypeLabels: Record<CodeforcesType, string> = {
  div1: "Division 1 (Expert+)",
  div2: "Division 2 (Specialist)",
  div3: "Division 3 (Pupil)",
  div4: "Division 4 (Newbie)",
  educational: "Educational",
  global: "Global",
  other: "Other",
};

const codechefTypeLabels: Record<CodechefType, string> = {
  long: "Long Challenge",
  cookoff: "Cook-off",
  lunchtime: "Lunchtime",
  starters: "Starters",
  other: "Other",
};

const leetcodeTypeLabels: Record<LeetcodeType, string> = {
  weekly: "Weekly Contest",
  biweekly: "Biweekly Contest",
  other: "Other",
};

export default function ContestPreferences() {
  const { toast } = useToast();

  // Fetch user's contest preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["/api/contest-preferences"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contest-preferences");
      return response.json();
    },
  });

  // Set up local state for form
  const [formState, setFormState] = useState<ContestPreference>({
    id: null,
    userId: 0,
    codeforcesMinRating: 0,
    codeforcesMaxRating: 4000,
    codeforcesTypes: [],
    codechefTypes: [],
    leetcodeTypes: [],
    minDurationMinutes: 0,
    maxDurationMinutes: 1440, // 24 hours
    favoriteContestIds: [],
  });

  const [durationRange, setDurationRange] = useState<[number, number]>([0, 1440]);

  // Update form state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      const prefs = preferences as unknown as ContestPreference;
      setFormState(prefs);
      setDurationRange([
        prefs.minDurationMinutes || 0,
        prefs.maxDurationMinutes || 1440,
      ]);
    }
  }, [preferences]);

  // Define mutation for saving preferences
  const savePreferences = useMutation({
    mutationFn: async (data: Partial<ContestPreference>) => {
      const response = await apiRequest("PUT", "/api/contest-preferences", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your contest preferences have been updated successfully.",
      });
      // Invalidate query to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/contest-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personalized-contests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
      console.error("Save preferences error:", error);
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    savePreferences.mutate({
      codeforcesMinRating: formState.codeforcesMinRating,
      codeforcesMaxRating: formState.codeforcesMaxRating,
      codeforcesTypes: formState.codeforcesTypes,
      codechefTypes: formState.codechefTypes,
      leetcodeTypes: formState.leetcodeTypes,
      minDurationMinutes: durationRange[0],
      maxDurationMinutes: durationRange[1],
    });
  };

  // Helper for checking if a type is selected
  const isTypeSelected = (
    type: string,
    typeArray: string[]
  ) => {
    return typeArray.includes(type);
  };

  // Handle checkbox changes for contest types
  const toggleContestType = (
    type: string,
    platform: "codeforces" | "codechef" | "leetcode"
  ) => {
    setFormState((prev) => {
      const typeArray = platform === "codeforces" 
        ? prev.codeforcesTypes 
        : platform === "codechef" 
          ? prev.codechefTypes 
          : prev.leetcodeTypes;
      
      const updatedArray = isTypeSelected(type, typeArray)
        ? typeArray.filter(t => t !== type)
        : [...typeArray, type];
      
      return {
        ...prev,
        [platform === "codeforces" 
          ? "codeforcesTypes" 
          : platform === "codechef" 
            ? "codechefTypes" 
            : "leetcodeTypes"]: updatedArray,
      };
    });
  };

  // Handle Codeforces rating range changes
  const handleRatingChange = (values: number[]) => {
    setFormState((prev) => ({
      ...prev,
      codeforcesMinRating: values[0],
      codeforcesMaxRating: values[1],
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading preferences...</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Contest Preferences</CardTitle>
        <CardDescription>
          Customize which contests you want to see and get notifications for
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="codeforces" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="codeforces">Codeforces</TabsTrigger>
            <TabsTrigger value="codechef">CodeChef</TabsTrigger>
            <TabsTrigger value="leetcode">LeetCode</TabsTrigger>
          </TabsList>

          {/* Codeforces Preferences */}
          <TabsContent value="codeforces">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Rating Range</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the rating range for Codeforces contests you want to participate in
                </p>
                <div className="px-4">
                  <Slider
                    defaultValue={[
                      formState.codeforcesMinRating,
                      formState.codeforcesMaxRating,
                    ]}
                    min={0}
                    max={4000}
                    step={100}
                    value={[
                      formState.codeforcesMinRating,
                      formState.codeforcesMaxRating,
                    ]}
                    onValueChange={handleRatingChange}
                    className="mt-6"
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span>{formState.codeforcesMinRating}</span>
                    <span>{formState.codeforcesMaxRating}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Contest Types</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the types of Codeforces contests you're interested in
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(codeforcesTypeLabels).map(([type, label]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cf-${type}`} 
                        checked={isTypeSelected(type, formState.codeforcesTypes)} 
                        onCheckedChange={() => toggleContestType(type, "codeforces")} 
                      />
                      <Label htmlFor={`cf-${type}`}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* CodeChef Preferences */}
          <TabsContent value="codechef">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Contest Types</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the types of CodeChef contests you're interested in
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(codechefTypeLabels).map(([type, label]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cc-${type}`} 
                        checked={isTypeSelected(type, formState.codechefTypes)} 
                        onCheckedChange={() => toggleContestType(type, "codechef")} 
                      />
                      <Label htmlFor={`cc-${type}`}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* LeetCode Preferences */}
          <TabsContent value="leetcode">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Contest Types</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the types of LeetCode contests you're interested in
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(leetcodeTypeLabels).map(([type, label]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`lc-${type}`} 
                        checked={isTypeSelected(type, formState.leetcodeTypes)} 
                        onCheckedChange={() => toggleContestType(type, "leetcode")} 
                      />
                      <Label htmlFor={`lc-${type}`}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Contest Duration Preferences */}
        <div className="mt-8">
          <h3 className="text-lg font-medium">Contest Duration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select your preferred contest duration range (in minutes)
          </p>
          <div className="px-4">
            <Slider
              defaultValue={durationRange}
              min={0}
              max={1440}
              step={30}
              value={durationRange}
              onValueChange={(values) => setDurationRange(values as [number, number])}
              className="mt-6"
            />
            <div className="flex justify-between mt-2 text-sm">
              <span>
                {durationRange[0] < 60
                  ? `${durationRange[0]}m`
                  : `${Math.floor(durationRange[0] / 60)}h ${durationRange[0] % 60}m`}
              </span>
              <span>
                {durationRange[1] < 60
                  ? `${durationRange[1]}m`
                  : `${Math.floor(durationRange[1] / 60)}h ${durationRange[1] % 60}m`}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={savePreferences.isPending}
        >
          {savePreferences.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}