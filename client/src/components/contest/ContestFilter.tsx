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
  
  // Helper to determine if "All" is active
  const isAllSelected = () => {
    return selectedPlatforms.length === 3; // All 3 platforms selected
  };

  // Helper to determine if a single platform is exclusively selected
  const isOnlyPlatformSelected = (platform: Platform) => {
    return selectedPlatforms.length === 1 && selectedPlatforms.includes(platform);
  };

  // Set platform filters
  const selectAllPlatforms = () => {
    onPlatformsChange(['codeforces', 'codechef', 'leetcode']);
  };

  const selectPlatform = (platform: Platform) => {
    onPlatformsChange([platform]);
  };

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Programming Contests</h1>
        
        {/* Platform Filter - Simplified to act like radio buttons */}
        <div className="inline-flex items-center bg-background border border-border rounded-lg shadow-sm overflow-hidden">
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium border-r border-border",
              isAllSelected() 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted"
            )}
            onClick={selectAllPlatforms}>
            All
          </button>
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium border-r border-border",
              isOnlyPlatformSelected('codeforces') 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted"
            )}
            onClick={() => selectPlatform('codeforces')}>
            Codeforces
          </button>
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium border-r border-border",
              isOnlyPlatformSelected('codechef') 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted"
            )}
            onClick={() => selectPlatform('codechef')}>
            CodeChef
          </button>
          <button 
            className={cn(
              "px-4 py-2 text-sm font-medium",
              isOnlyPlatformSelected('leetcode') 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted"
            )}
            onClick={() => selectPlatform('leetcode')}>
            LeetCode
          </button>
        </div>
      </div>

      {/* Contest Type Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          <button 
            className={cn(
              "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm",
              activeTab === 'upcoming' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:border-border"
            )}
            onClick={() => onTabChange('upcoming')}>
            Upcoming Contests
          </button>
          <button 
            className={cn(
              "whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm",
              activeTab === 'past' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:border-border"
            )}
            onClick={() => onTabChange('past')}>
            Past Contests
          </button>
        </nav>
      </div>
    </section>
  );
}
