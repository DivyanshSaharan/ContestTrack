import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Contest } from "@shared/schema";
import { formatDistanceToNow, parseISO } from "date-fns";
import { 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuLabel 
} from "@/components/ui/dropdown-menu";
import { SiCodeforces, SiCodechef, SiLeetcode } from "react-icons/si";
import { Bell } from "lucide-react";

export function MarkedContestsMenu() {
  // Fetch contests with reminders
  const { data: remindedContests, isLoading } = useQuery({
    queryKey: ["/api/contest-reminders"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contest-reminders");
      return response.json();
    },
  });

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'codeforces':
        return <SiCodeforces className="h-4 w-4 mr-2 text-red-500" />;
      case 'codechef':
        return <SiCodechef className="h-4 w-4 mr-2 text-amber-600" />;
      case 'leetcode':
        return <SiLeetcode className="h-4 w-4 mr-2 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 mr-2" />;
    }
  };

  // Format time remaining
  const formatTimeRemaining = (startTime: string) => {
    try {
      return formatDistanceToNow(parseISO(startTime), { addSuffix: true });
    } catch {
      return "Date unknown";
    }
  };

  if (isLoading) {
    return (
      <>
        <DropdownMenuLabel>Contests with Reminders</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Loading contests...</DropdownMenuItem>
      </>
    );
  }

  if (!remindedContests || remindedContests.length === 0) {
    return (
      <>
        <DropdownMenuLabel>Contests with Reminders</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>No contests marked for reminders</DropdownMenuItem>
      </>
    );
  }

  return (
    <>
      <DropdownMenuLabel>Contests with Reminders</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {remindedContests.slice(0, 5).map((contest: Contest) => (
        <DropdownMenuItem key={contest.id} className="cursor-pointer">
          {getPlatformIcon(contest.platform)}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{contest.name}</span>
            <span className="text-xs text-muted-foreground">
              Starts {formatTimeRemaining(contest.startTime.toString())}
            </span>
          </div>
        </DropdownMenuItem>
      ))}
      {remindedContests.length > 5 && (
        <DropdownMenuItem className="text-xs text-center text-muted-foreground">
          +{remindedContests.length - 5} more contests
        </DropdownMenuItem>
      )}
    </>
  );
}