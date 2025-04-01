import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "./useAuth";
import { User as UserIcon, LogOut, Settings, Bell, BellDot } from "lucide-react";
import { Link } from "wouter";
import { MarkedContestsMenu } from "../notification/MarkedContestsMenu";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProfileMenuProps {
  user: { id: number; username: string; email: string } | null;
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const { logout } = useAuth();

  // Fetch contest reminders count
  const { data: reminderCount } = useQuery({
    queryKey: ["/api/contest-reminders/count"],
    queryFn: async () => {
      if (!user) return 0;
      try {
        const response = await apiRequest("GET", "/api/contest-reminders/count");
        const data = await response.json();
        return data.count || 0;
      } catch (error) {
        console.error("Error fetching reminder count:", error);
        return 0;
      }
    },
    enabled: !!user
  });

  // Helper to get user initials
  const getUserInitials = () => {
    if (!user?.username) return "U";
    return user.username.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-2 hidden md:block">{user?.username}</span>
          <Avatar className="h-8 w-8 bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
            <AvatarFallback className="text-sm font-medium text-primary">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            {reminderCount && reminderCount > 0 ? (
              <BellDot className="mr-2 h-4 w-4 text-primary" />
            ) : (
              <Bell className="mr-2 h-4 w-4" />
            )}
            <span>Notifications</span>
            {reminderCount && reminderCount > 0 && (
              <span className="ml-auto bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                {reminderCount}
              </span>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            <MarkedContestsMenu />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}