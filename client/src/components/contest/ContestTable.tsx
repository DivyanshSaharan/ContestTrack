import { useState, useEffect } from "react";
import { Contest } from "@shared/schema";
import { formatDate } from "@/lib/utils/formatters";
import { useAuth } from "../auth/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import Codeforces from "@/assets/Codeforces.png";
interface ContestTableProps {
  contests: Contest[];
  type: "upcoming" | "past";
}

export default function ContestTable({ contests, type }: ContestTableProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [remindingContestId, setRemindingContestId] = useState<number | null>(null);
  const [reminderStatuses, setReminderStatuses] = useState<Record<number, boolean>>({});

  // Fetch reminder statuses for contests
  useEffect(() => {
    if (isAuthenticated && user && type === "upcoming") {
      const fetchReminderStatuses = async () => {
        try {
          const results = await Promise.all(
            contests.map(async (contest) => {
              try {
                const response = await apiRequest('GET', `/api/contest-reminders/check/${contest.id}`);
                const data = await response.json();
                return { contestId: contest.id, hasReminder: data.hasReminder };
              } catch (error) {
                console.error(`Error fetching reminder status for contest ${contest.id}:`, error);
                return { contestId: contest.id, hasReminder: false };
              }
            })
          );
          
          const statusMap: Record<number, boolean> = {};
          results.forEach(({contestId, hasReminder}) => {
            statusMap[contestId] = hasReminder;
          });
          
          setReminderStatuses(statusMap);
        } catch (error) {
          console.error("Error fetching reminder statuses:", error);
        }
      };
      
      fetchReminderStatuses();
    }
  }, [isAuthenticated, user, contests, type]);

  // Get platform icon URL
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'codeforces':
        return Codeforces;
      case 'codechef':
        return 'https://www.codechef.com/favicon.ico';
      case 'leetcode':
        return 'https://assets.leetcode.com/static_assets/public/icons/favicon-32x32.png';
      default:
        return '';
    }
  };

  // Format time remaining or time since
  const formatTimeRemaining = (contest: Contest) => {
    const now = new Date();
    const targetTime = type === "upcoming" 
      ? new Date(contest.startTime)
      : new Date(contest.endTime);
    
    const diffMs = Math.abs(targetTime.getTime() - now.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} days, ${diffHours} hours`;
    } else {
      return `${diffHours} hours`;
    }
  };

  // Toggle reminder for contest
  const toggleReminder = async (contestId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to set reminders",
        variant: "destructive",
      });
      return;
    }
    
    const hasReminder = reminderStatuses[contestId];
    
    try {
      setRemindingContestId(contestId);
      
      if (hasReminder) {
        // Remove reminder
        await apiRequest('DELETE', `/api/contest-reminders/${contestId}`);
        setReminderStatuses(prev => ({
          ...prev,
          [contestId]: false
        }));
        toast({
          title: "Reminder removed",
          description: "You won't be notified for this contest",
          variant: "default",
        });
      } else {
        // Add reminder
        await apiRequest('POST', '/api/contest-reminders', { contestId });
        setReminderStatuses(prev => ({
          ...prev,
          [contestId]: true
        }));
        toast({
          title: "Reminder set",
          description: "You'll be notified before the contest starts",
          variant: "default",
        });
      }
      
      // Refresh the reminders list
      queryClient.invalidateQueries({ queryKey: ['/api/contest-reminders'] });
    } catch (error) {
      toast({
        title: hasReminder ? "Failed to remove reminder" : "Failed to set reminder",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
      console.error("Error toggling reminder:", error);
    } finally {
      setRemindingContestId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contest Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {type === "upcoming" ? "Start Date" : "Date"}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {type === "upcoming" ? "Time Until Start" : "Time Since End"}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contests.map((contest) => (
              <tr key={contest.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-6 w-6 mr-2">
                      <img src={getPlatformIcon(contest.platform)} alt={contest.platform} className="h-6 w-6 rounded" />
                    </div>
                    <span className="text-sm text-gray-900">{contest.platform.charAt(0).toUpperCase() + contest.platform.slice(1)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contest.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{formatDate(contest.startTime, true)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contest.duration}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${type === "upcoming" ? "text-blue-600" : "text-gray-600"} font-mono`}>
                    {formatTimeRemaining(contest)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {type === "upcoming" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${isAuthenticated && reminderStatuses[contest.id] ? 'text-primary-700' : 'text-gray-500'} hover:text-primary-700 mr-4`}
                      onClick={() => toggleReminder(contest.id)}
                      disabled={remindingContestId === contest.id}
                      title={reminderStatuses[contest.id] ? "Remove reminder" : "Set reminder"}
                    >
                      {isAuthenticated && reminderStatuses[contest.id] ? (
                        <Bell className="h-5 w-5 fill-primary-500" />
                      ) : (
                        <BellOff className="h-5 w-5" />
                      )}
                    </Button>
                  )}
                  <a
                    href={contest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    {type === "upcoming" ? "Details" : "View Results"}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
