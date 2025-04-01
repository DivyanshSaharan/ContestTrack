import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiCodeforces, SiCodechef, SiLeetcode } from "react-icons/si";
import { BadgeCheck, CircleX, ExternalLink, AlertCircle } from "lucide-react";

interface PlatformConnection {
  platform: string;
  username: string;
  isLinked: boolean;
  handle?: string;
  rating?: number;
}

interface PlatformConnectionsProps {
  userId: number;
}

export default function PlatformConnections({ userId }: PlatformConnectionsProps) {
  const { toast } = useToast();
  const [handles, setHandles] = useState({
    codeforces: "",
    codechef: "",
    leetcode: ""
  });

  // Fetch platform connections
  const { data: connections, isLoading } = useQuery({
    queryKey: ["/api/platform-connections"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/platform-connections");
        return response.json();
      } catch (error) {
        console.error("Error fetching platform connections:", error);
        return [] as PlatformConnection[];
      }
    },
    enabled: false // Disabled until API is implemented
  });

  // Connect platform mutation
  const connectPlatform = useMutation({
    mutationFn: async ({ platform, username }: { platform: string; username: string }) => {
      // For now, we'll just simulate a successful connection
      // Later this will be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { platform, username, isLinked: true };
    },
    onSuccess: (data) => {
      toast({
        title: "Platform Connected (Demo)",
        description: `Your ${data.platform} account has been linked successfully. (This is a demo, no actual connection is made)`,
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect platform. Please check your username and try again.",
        variant: "destructive",
      });
      console.error("Connect platform error:", error);
    },
  });

  // Disconnect platform mutation
  const disconnectPlatform = useMutation({
    mutationFn: async (platform: string) => {
      // For now, we'll just simulate a successful disconnection
      // Later this will be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Platform Disconnected (Demo)",
        description: "Your platform account has been unlinked. (This is a demo, no actual disconnection is made)",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect platform. Please try again.",
        variant: "destructive",
      });
      console.error("Disconnect platform error:", error);
    },
  });

  const handleChange = (platform: string, value: string) => {
    setHandles(prev => ({
      ...prev,
      [platform]: value
    }));
  };

  const handleConnect = (platform: string) => {
    const username = handles[platform as keyof typeof handles];
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: `Please enter your ${platform} username.`,
        variant: "destructive",
      });
      return;
    }
    connectPlatform.mutate({ platform, username });
  };

  const handleDisconnect = (platform: string) => {
    disconnectPlatform.mutate(platform);
  };

  const resetForm = () => {
    setHandles({
      codeforces: "",
      codechef: "",
      leetcode: ""
    });
  };

  // Get platform icon
  const renderPlatformIcon = (platform: string, size = 5) => {
    switch (platform.toLowerCase()) {
      case 'codeforces':
        return <SiCodeforces className={`h-${size} w-${size} text-red-500`} />;
      case 'codechef':
        return <SiCodechef className={`h-${size} w-${size} text-amber-600`} />;
      case 'leetcode':
        return <SiLeetcode className={`h-${size} w-${size} text-yellow-500`} />;
      default:
        return null;
    }
  };

  // For demonstration/placeholder until backend is implemented
  const platformsData = [
    {
      id: "codeforces",
      name: "Codeforces",
      icon: <SiCodeforces className="h-5 w-5 text-red-500" />,
      description: "Connect your Codeforces account to track your contests and show your rating.",
      url: "https://codeforces.com/",
      color: "text-red-500",
      isConnected: false,
      username: "",
      rating: null
    },
    {
      id: "codechef",
      name: "CodeChef",
      icon: <SiCodechef className="h-5 w-5 text-amber-600" />,
      description: "Connect your CodeChef account to track your contests and show your rating.",
      url: "https://www.codechef.com/",
      color: "text-amber-600",
      isConnected: false,
      username: "",
      rating: null
    },
    {
      id: "leetcode",
      name: "LeetCode",
      icon: <SiLeetcode className="h-5 w-5 text-yellow-500" />,
      description: "Connect your LeetCode account to track your contests and show your stats.",
      url: "https://leetcode.com/",
      color: "text-yellow-500",
      isConnected: false,
      username: "",
      rating: null
    }
  ];

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading platform connections...</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Connected Platforms</CardTitle>
        <CardDescription>
          Connect your competitive programming accounts to track your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Accordion type="single" collapsible className="w-full">
          {platformsData.map((platform) => {
            // In the real implementation, we'd use connections data from the API
            // const connection = connections?.find(c => c.platform === platform.id);
            // const isConnected = !!connection?.isLinked;
            
            // For demo purposes, we'll just use the platform data
            const isConnected = platform.isConnected;
            
            return (
              <AccordionItem key={platform.id} value={platform.id}>
                <AccordionTrigger className="flex items-center">
                  <div className="flex items-center">
                    {platform.icon}
                    <span className="ml-2 mr-2">{platform.name}</span>
                    {isConnected ? (
                      <BadgeCheck className="h-5 w-5 text-green-500 ml-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-muted-foreground ml-2" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-2">
                    <div className="flex items-start mb-4">
                      <div className="ml-2">
                        <p className="text-sm text-muted-foreground">{platform.description}</p>
                        <a 
                          href={platform.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`text-xs flex items-center mt-1 ${platform.color} hover:underline`}
                        >
                          Visit {platform.name} <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                    
                    {isConnected ? (
                      <div className="bg-muted/50 p-4 rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-medium">Connected as:</h4>
                            <p className="text-lg font-bold mt-1">{platform.username}</p>
                            {platform.rating && (
                              <span className="text-sm text-muted-foreground">
                                Rating: {platform.rating}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => handleDisconnect(platform.id)}
                            disabled={disconnectPlatform.isPending}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <CircleX className="h-4 w-4 mr-2" />
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 p-4 rounded-md">
                        <Label htmlFor={`${platform.id}-username`} className="text-sm">
                          {platform.name} Username
                        </Label>
                        <div className="flex space-x-2 mt-1.5">
                          <Input
                            id={`${platform.id}-username`}
                            value={handles[platform.id as keyof typeof handles]}
                            onChange={(e) => handleChange(platform.id, e.target.value)}
                            placeholder={`Enter your ${platform.name} username`}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => handleConnect(platform.id)}
                            disabled={connectPlatform.isPending}
                          >
                            Connect
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t p-4">
        <div className="w-full text-center">
          <p className="mb-1">Note: This is a demonstration feature. No actual connections are being made.</p>
          <p>In a real implementation, this would verify your accounts and fetch your ratings and contest history.</p>
        </div>
      </CardFooter>
    </Card>
  );
}