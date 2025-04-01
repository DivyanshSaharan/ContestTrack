import { useState } from "react";
import { Platform } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ContestFilterProps {
  selectedPlatforms: Platform[];
  onPlatformsChange: (platforms: Platform[]) => void;
  activeTab: 'upcoming' | 'past';
  onTabChange: (tab: 'upcoming' | 'past') => void;
}

export default function ContestFilter({
  selectedPlatforms,
  onPlatformsChange,
  activeTab,
  onTabChange
}: ContestFilterProps) {
  
  // Helper function to check if a platform is selected
  const isPlatformSelected = (platform: Platform) => {
    return selectedPlatforms.includes(platform);
  };

  // Helper function to check if all platforms are selected
  const isAllSelected = () => {
    return selectedPlatforms.length === 3; // codeforces, codechef, leetcode
  };

  // Toggle a platform selection
  const togglePlatform = (platform: Platform) => {
    if (isPlatformSelected(platform)) {
      // If platform is already selected, remove it
      onPlatformsChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      // If platform is not selected, add it
      onPlatformsChange([...selectedPlatforms, platform]);
    }
  };

  // Select all platforms
  const selectAllPlatforms = () => {
    onPlatformsChange(['codeforces', 'codechef', 'leetcode']);
  };

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-4 sm:mb-0">Programming Contests</h1>
        
        {/* Platform Filter */}
        <div className="inline-flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium border-r border-gray-200",
              isAllSelected() ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50"
            )}
            onClick={selectAllPlatforms}>
            All
          </button>
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium border-r border-gray-200",
              isPlatformSelected('codeforces') 
                ? "bg-platform-codeforces bg-opacity-10 text-platform-codeforces" 
                : "text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => togglePlatform('codeforces')}>
            Codeforces
          </button>
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium border-r border-gray-200",
              isPlatformSelected('codechef') 
                ? "bg-platform-codechef bg-opacity-10 text-platform-codechef" 
                : "text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => togglePlatform('codechef')}>
            CodeChef
          </button>
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium",
              isPlatformSelected('leetcode') 
                ? "bg-platform-leetcode bg-opacity-10 text-platform-leetcode" 
                : "text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => togglePlatform('leetcode')}>
            LeetCode
          </button>
        </div>
      </div>

      {/* Contest Type Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button 
            className={cn(
              "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm",
              activeTab === 'upcoming' 
                ? "border-primary-500 text-primary-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
            onClick={() => onTabChange('upcoming')}>
            Upcoming Contests
          </button>
          <button 
            className={cn(
              "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm",
              activeTab === 'past' 
                ? "border-primary-500 text-primary-600" 
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
            onClick={() => onTabChange('past')}>
            Past Contests
          </button>
        </nav>
      </div>
    </section>
  );
}
