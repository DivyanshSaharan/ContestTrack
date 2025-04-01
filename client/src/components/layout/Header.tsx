import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "../auth/useAuth";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import AuthModals from "../auth/AuthModals";
import { ProfileMenu } from "../auth/ProfileMenu";
import { ThemeToggle } from "../theme/ThemeToggle";

export default function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

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
    <header className="bg-background shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex-shrink-0 flex items-center cursor-pointer">
                <svg
                  className="h-8 w-8 text-primary"
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
                <span className="ml-2 text-primary font-semibold text-lg">
                  CodeContestTracker
                </span>
              </div>
            </Link>
          </div>

          {/* Authentication UI */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground focus:outline-none">
                    <Bell className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </div>

                {/* Theme toggle for non-mobile screens */}
                <div className="hidden sm:block">
                  <ThemeToggle />
                </div>

                <ProfileMenu user={user} />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                
                <Button
                  variant="ghost"
                  className="text-primary hover:text-primary/90 text-sm font-medium"
                  onClick={openLoginModal}
                >
                  Login
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
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
