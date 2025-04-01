import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Platform, Contest } from "@shared/schema";
import ContestFilter from "./ContestFilter";
import ContestCard from "./ContestCard";
import ContestTable from "./ContestTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContestList() {
  // State for selected platforms and active tab
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["codeforces", "codechef", "leetcode"]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // Query for getting all contests
  const { data: allContests, isLoading: isLoadingAll } = useQuery({
    queryKey: ['/api/contests'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // State for filtered contests
  const [currentContests, setCurrentContests] = useState<Contest[]>([]);
  const [upcomingSoonContests, setUpcomingSoonContests] = useState<Contest[]>([]);
  const [upcomingContests, setUpcomingContests] = useState<Contest[]>([]);
  const [pastContests, setPastContests] = useState<Contest[]>([]);

  // Update filtered contests when selectedPlatforms or allContests change
  useEffect(() => {
    if (!allContests) return;

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Filter contests by selected platforms
    const filteredContests = allContests.filter((contest: Contest) => 
      selectedPlatforms.includes(contest.platform as Platform)
    );

    // Current contests (happening now)
    const current = filteredContests.filter((contest: Contest) => 
      new Date(contest.startTime) <= now && new Date(contest.endTime) >= now
    );
    setCurrentContests(current);

    // Upcoming soon contests (within next 24 hours)
    const upcomingSoon = filteredContests.filter((contest: Contest) => 
      new Date(contest.startTime) > now && new Date(contest.startTime) <= in24Hours
    ).sort((a: Contest, b: Contest) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    setUpcomingSoonContests(upcomingSoon);

    // Other upcoming contests (beyond 24 hours)
    const upcoming = filteredContests.filter((contest: Contest) => 
      new Date(contest.startTime) > in24Hours
    ).sort((a: Contest, b: Contest) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    setUpcomingContests(upcoming);

    // Past contests (within last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const past = filteredContests.filter((contest: Contest) => 
      new Date(contest.endTime) < now && new Date(contest.endTime) >= sevenDaysAgo
    ).sort((a: Contest, b: Contest) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );
    setPastContests(past);
  }, [selectedPlatforms, allContests]);

  // Loading skeleton
  if (isLoadingAll) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-80" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-52 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Contest Filter Section */}
      <ContestFilter
        selectedPlatforms={selectedPlatforms}
        onPlatformsChange={setSelectedPlatforms}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Upcoming Contests Section */}
      {activeTab === "upcoming" && (
        <section className="space-y-6">
          {/* Happening Now Contests */}
          {currentContests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Happening Now
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentContests.map((contest) => (
                  <ContestCard
                    key={contest.id}
                    contest={contest}
                    status="live"
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Starting Soon Contests */}
          {upcomingSoonContests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                Starting Soon (Next 24 hours)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSoonContests.map((contest) => (
                  <ContestCard
                    key={contest.id}
                    contest={contest}
                    status="soon"
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Upcoming Contests */}
          {upcomingContests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                Upcoming Contests
              </h2>
              
              <ContestTable contests={upcomingContests} type="upcoming" />
            </div>
          )}

          {/* No contests message */}
          {currentContests.length === 0 && upcomingSoonContests.length === 0 && upcomingContests.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming contests found</h3>
              <p className="text-gray-500">Try selecting different platforms or check back later.</p>
            </div>
          )}
        </section>
      )}
      
      {/* Past Contests Section */}
      {activeTab === "past" && (
        <section>
          {pastContests.length > 0 ? (
            <ContestTable contests={pastContests} type="past" />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No past contests found</h3>
              <p className="text-gray-500">Try selecting different platforms or check back later.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
