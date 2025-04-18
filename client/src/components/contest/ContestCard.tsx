import { useState, useEffect } from "react";
import { Contest } from "@shared/schema";
import { useAuth } from "../auth/useAuth";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { formatDate } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

type ContestStatus = "live" | "soon" | "upcoming" | "past";

interface ContestCardProps {
  contest: Contest;
  status: ContestStatus;
}

export default function ContestCard({ contest, status }: ContestCardProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [isReminding, setIsReminding] = useState(false);
  // const [hasReminder, setHasReminder] = useState(false);

  // Calculate countdown or time elapsed
  const { timeDisplay, percentComplete } = useCountdown(
    new Date(contest.startTime),
    new Date(contest.endTime)
  );



  // Fetch contest reminder status for this user and contest
  const { data: reminderData, refetch } = useQuery({
    queryKey: ['/api/contest-reminders', contest.id],
    queryFn: async () => {
      if (!isAuthenticated || !user) return null;
      try {
        const response = await apiRequest('GET', `/api/contest-reminders/check/${contest.id}`);
        return response.json();
      } catch (error) {
        console.error("Failed to fetch reminder status:", error);
        return null;
      }
    },
    enabled: isAuthenticated && !!user
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      refetch();
    }
  }, [isAuthenticated, user, refetch]);


  // Update the reminder state when data changes
  // useEffect(() => {
  //   if (reminderData && reminderData.hasReminder) {
  //     setHasReminder(true);
  //   } else {
  //     setHasReminder(false);
  //   }
  // }, [reminderData]);

  // Get platform icon URL
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'codeforces':
        return 'https://codeforces.org/favicon.ico';
      case 'codechef':
        return 'https://www.codechef.com/favicon.ico';
      case 'leetcode':
        return 'https://assets.leetcode.com/static_assets/public/icons/favicon-32x32.png';
      default:
        return '';
    }
  };

  // Get status badge color
  const getStatusBadge = (status: ContestStatus) => {
    switch (status) {
      case 'live':
        return { color: "bg-green-100 text-green-800", text: "Live" };
      case 'soon':
        return { color: "bg-orange-100 text-orange-800", text: "Soon" };
      case 'upcoming':
        return { color: "bg-blue-100 text-blue-800", text: "Upcoming" };
      case 'past':
        return { color: "bg-gray-100 text-gray-800", text: "Ended" };
    }
  };

  // Toggle reminder for contest
  const toggleReminder = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to set reminders",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsReminding(true);

      if (reminderData?.hasReminder) {
        await apiRequest('DELETE', `/api/contest-reminders/${contest.id}`);
        toast({
          title: "Reminder removed",
          description: `You won't be notified for ${contest.name}`,
          variant: "default",
        });
      } else {
        await apiRequest('POST', '/api/contest-reminders', { contestId: contest.id });
        toast({
          title: "Reminder set",
          description: `You'll be notified before ${contest.name} starts`,
          variant: "default",
        });
      }

      // ✅ Refetch from backend to update reminderData
      await refetch();
    } catch (error) {
      toast({
        title: reminderData?.hasReminder ? "Failed to remove reminder" : "Failed to set reminder",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
      console.error("Error toggling reminder:", error);
    } finally {
      setIsReminding(false);
    }
  };


  const badge = getStatusBadge(status);

  return (
    <div className={`bg-white rounded-lg border ${status === 'live' ? 'border-green-200' : status === 'soon' ? 'border-orange-100' : 'border-gray-200'} shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200`}>
      <div className="p-4">
        {/* Platform and Title */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 flex-shrink-0 mr-2">
              <img src={getPlatformIcon(contest.platform)} alt={contest.platform} className="w-full h-full object-contain" />
            </div>
            <h3 className="font-medium text-neutral-800">{contest.name}</h3>
          </div>
          <span className={`${badge.color} text-xs font-medium px-2.5 py-0.5 rounded`}>{badge.text}</span>
        </div>

        {/* Time Information */}
        <div className="mb-3">
          <div className="text-xs text-neutral-500 mb-1">
            {status === 'live' ? 'Started:' : status === 'past' ? 'Ended:' : 'Starts in:'}
          </div>
          <div className={`font-mono text-sm ${status === 'soon' ? 'font-medium text-orange-700' : ''}`}>
            {status === 'live' || status === 'past' ? formatDate(contest.startTime) : timeDisplay}
          </div>
        </div>

        {/* Duration and Progress (for live contests) */}
        {status === 'live' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Duration: {contest.duration}</span>
              <span className="text-green-600 font-medium">{timeDisplay} remaining</span>
            </div>
            <Progress value={percentComplete} className="h-2 bg-gray-200" />
          </div>
        )}

        {/* Date and Duration (for upcoming contests) */}
        {(status === 'soon' || status === 'upcoming') && (
          <div className="flex justify-between mb-4">
            <div>
              <div className="text-xs text-neutral-500 mb-1">Date:</div>
              <div className="text-sm">{formatDate(contest.startTime)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Duration:</div>
              <div className="text-sm">{contest.duration}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          {status !== 'past' && status !== 'live' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleReminder}
              disabled={isReminding}
              title={reminderData?.hasReminder ? "Remove reminder" : "Set reminder"}
              className={`flex items-center p-0 text-sm font-medium hover:text-primary-800 ${isAuthenticated && reminderData?.hasReminder ? 'text-primary-700' : 'text-gray-500'
                }`}
            >
              {isAuthenticated && reminderData?.hasReminder ? (
                <Bell className="h-5 w-5 mr-1 text-primary-700" />
              ) : (
                <BellOff className="h-5 w-5 mr-1 text-gray-500" />
              )}
              {isAuthenticated && reminderData?.hasReminder ? "Notifying" : "Notify me"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium p-0"
            >
              View Details
            </Button>
          )}

          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {status === 'live' ? 'Join Now' : 'View Details'}
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>

      </div>
    </div>
  );
}
