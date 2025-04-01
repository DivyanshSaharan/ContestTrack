import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "../auth/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import AuthModals from "../auth/AuthModals";

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

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

  const openLoginModal = () => {
    setIsLoginOpen(true);
    setIsSignupOpen(false);
  };

  const openSignupModal = () => {
    setIsSignupOpen(true);
    setIsLoginOpen(false);
  };

  const switchToSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const switchToLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex-shrink-0 flex items-center cursor-pointer">
                <svg
                  className="h-8 w-8 text-primary-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="ml-2 text-primary-700 font-semibold text-lg">
                  CodeContestTracker
                </span>
              </div>
            </Link>
          </div>

          {/* Authentication UI */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700 focus:outline-none">
                    <Bell className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </div>

                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">{user?.username}</span>
                  <Button
                    variant="ghost"
                    className="p-0"
                    onClick={handleLogout}
                  >
                    <Avatar className="h-8 w-8 bg-gray-200">
                      <AvatarFallback className="text-sm font-medium text-neutral-700">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  onClick={openLoginModal}
                >
                  Login
                </Button>
                <Button
                  className="bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium"
                  onClick={openSignupModal}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modals */}
      <AuthModals
        isLoginOpen={isLoginOpen}
        isSignupOpen={isSignupOpen}
        onCloseLogin={() => setIsLoginOpen(false)}
        onCloseSignup={() => setIsSignupOpen(false)}
        onSwitchToSignup={switchToSignup}
        onSwitchToLogin={switchToLogin}
      />
    </header>
  );
}
