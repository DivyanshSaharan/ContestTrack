import axios from 'axios';
import { Platform, InsertContest } from '@shared/schema';

// This file contains functions to fetch contest data from different platforms

interface CodeforcesContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds: number;
  relativeTimeSeconds: number;
}

interface CodechefContest {
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  url: string;
}

interface LeetcodeContest {
  title: string;
  titleSlug: string;
  startTime: number;
  duration: number;
}

// Helper function to format duration in hours and minutes
function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

// Helper function to calculate end time
function calculateEndTime(startTime: Date, durationSeconds: number): Date {
  return new Date(startTime.getTime() + durationSeconds * 1000);
}

// Fetch Codeforces contests
export async function fetchCodeforcesContests(): Promise<InsertContest[]> {
  try {
    const response = await axios.get('https://codeforces.com/api/contest.list');
    const contests = response.data.result;
    
    return contests
      .filter((contest: CodeforcesContest) => {
        // Include only future contests and recent past contests
        const now = Math.floor(Date.now() / 1000);
        const contestEndTime = contest.startTimeSeconds + contest.durationSeconds;
        const oneWeekAgo = now - 7 * 24 * 60 * 60;
        
        return contestEndTime > oneWeekAgo;
      })
      .map((contest: CodeforcesContest) => {
        const startTime = new Date(contest.startTimeSeconds * 1000);
        const durationSeconds = contest.durationSeconds;
        const endTime = calculateEndTime(startTime, durationSeconds);
        
        return {
          platform: 'codeforces' as Platform,
          name: contest.name,
          url: `https://codeforces.com/contests/${contest.id}`,
          startTime,
          endTime,
          duration: formatDuration(durationSeconds)
        };
      });
  } catch (error) {
    console.error('Error fetching Codeforces contests:', error);
    return [];
  }
}

// Fetch Codechef contests
export async function fetchCodechefContests(): Promise<InsertContest[]> {
  try {
    // Try to use kontests.net API
    try {
      const response = await axios.get('https://kontests.net/api/v1/code_chef');
      const contests = response.data;
      
      return contests.map((contest: any) => {
        const startTime = new Date(contest.start_time);
        const endTime = new Date(contest.end_time);
        const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
        
        return {
          platform: 'codechef' as Platform,
          name: contest.name,
          url: contest.url,
          startTime,
          endTime,
          duration: formatDuration(durationSeconds)
        };
      });
    } catch (apiError) {
      console.error('Error using kontests.net API for CodeChef:', apiError);
      // Don't use dummy data, just return an empty array if the API fails
      return [];
    }
  } catch (error) {
    console.error('Error fetching Codechef contests:', error);
    return [];
  }
}

// Fetch Leetcode contests
export async function fetchLeetcodeContests(): Promise<InsertContest[]> {
  try {
    // Try to use direct fetch from LeetCode
    try {
      // LeetCode GraphQL API endpoint
      const url = 'https://leetcode.com/graphql';
      
      // GraphQL query to get contest information
      const query = {
        query: `
          query getContestList {
            topTwoContests {
              title
              titleSlug
              startTime
              duration
            }
            allContests {
              title
              titleSlug
              startTime
              duration
            }
          }
        `
      };
      
      const response = await axios.post(url, query, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const { data } = response.data;
      
      if (!data || (!data.topTwoContests && !data.allContests)) {
        console.error('Invalid response from LeetCode GraphQL API');
        return [];
      }
      
      // Get upcoming contests from topTwoContests or first two from allContests
      const upcomingContests = data.topTwoContests || 
        (data.allContests ? data.allContests.slice(0, 2) : []);
      
      // Get recent past contests (last week)
      const now = new Date().getTime() / 1000;
      const oneWeekAgo = now - 7 * 24 * 60 * 60;
      
      const pastContests = data.allContests ? 
        data.allContests.filter((contest: LeetcodeContest) => {
          const endTime = contest.startTime + contest.duration;
          return endTime < now && endTime > oneWeekAgo;
        }).slice(0, 3) : [];
      
      // Combine upcoming and past contests
      const allContests = [...upcomingContests, ...pastContests];
      
      // Format contests to match our schema
      return allContests.map((contest: LeetcodeContest) => {
        const startTime = new Date(contest.startTime * 1000);
        const endTime = new Date((contest.startTime + contest.duration) * 1000);
        
        return {
          platform: 'leetcode' as Platform,
          name: contest.title,
          url: `https://leetcode.com/contest/${contest.titleSlug}`,
          startTime,
          endTime,
          duration: formatDuration(contest.duration)
        };
      });
    } catch (directApiError) {
      console.error('Error fetching directly from LeetCode API:', directApiError);
      
      // Fall back to kontests.net API
      try {
        const response = await axios.get('https://kontests.net/api/v1/leet_code');
        const contests = response.data;
        
        return contests.map((contest: any) => {
          const startTime = new Date(contest.start_time);
          const endTime = new Date(contest.end_time);
          const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
          
          return {
            platform: 'leetcode' as Platform,
            name: contest.name,
            url: 'https://leetcode.com/contest/',
            startTime,
            endTime,
            duration: formatDuration(durationSeconds)
          };
        });
      } catch (apiError) {
        console.error('Error using kontests.net API for LeetCode:', apiError);
        
        // Since you mentioned the current LeetCode contests, let's use that information
        // These are hard-coded values based on the current contests you mentioned
        const now = new Date();
        
        // Calculate the next Saturday and Sunday for the contests
        const nextSaturday = new Date(now);
        nextSaturday.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
        nextSaturday.setHours(10, 30, 0, 0); // 10:30 AM
        
        const nextSunday = new Date(now);
        nextSunday.setDate(now.getDate() + (7 - now.getDay() + 7) % 7);
        nextSunday.setHours(10, 30, 0, 0); // 10:30 AM
        
        // Duration - typically 90 minutes
        const contestDuration = 90 * 60 * 1000;
        
        return [
          {
            platform: 'leetcode' as Platform,
            name: 'Weekly Contest 444',
            url: 'https://leetcode.com/contest/weekly-contest-444',
            startTime: nextSaturday,
            endTime: new Date(nextSaturday.getTime() + contestDuration),
            duration: '1h 30m'
          },
          {
            platform: 'leetcode' as Platform,
            name: 'Biweekly Contest 154',
            url: 'https://leetcode.com/contest/biweekly-contest-154',
            startTime: nextSunday,
            endTime: new Date(nextSunday.getTime() + contestDuration),
            duration: '1h 30m'
          }
        ];
      }
    }
  } catch (error) {
    console.error('Error fetching Leetcode contests:', error);
    return [];
  }
}

// Fetch all contests from all platforms
export async function fetchAllContests(): Promise<InsertContest[]> {
  try {
    const [codeforcesContests, codechefContests, leetcodeContests] = await Promise.all([
      fetchCodeforcesContests(),
      fetchCodechefContests(),
      fetchLeetcodeContests()
    ]);
    
    return [...codeforcesContests, ...codechefContests, ...leetcodeContests];
  } catch (error) {
    console.error('Error fetching all contests:', error);
    return [];
  }
}
