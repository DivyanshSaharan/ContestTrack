import axios from 'axios';
import { Platform, InsertContest, CodeforcesType, CodechefType, LeetcodeType } from '@shared/schema';

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
        
        // Determine contest type and difficulty
        let contestType: CodeforcesType = 'other';
        let difficulty: string | undefined = undefined;
        
        const name = contest.name.toLowerCase();
        
        // Check for Div1, Div2, Div3, Div4
        if (name.includes('div. 1') || name.includes('div.1') || name.includes('div 1')) {
          contestType = 'div1';
          difficulty = '1900+';
        } else if (name.includes('div. 2') || name.includes('div.2') || name.includes('div 2')) {
          contestType = 'div2';
          difficulty = '1600-1899';
        } else if (name.includes('div. 3') || name.includes('div.3') || name.includes('div 3')) {
          contestType = 'div3';
          difficulty = '1300-1599';
        } else if (name.includes('div. 4') || name.includes('div.4') || name.includes('div 4')) {
          contestType = 'div4';
          difficulty = '0-1299';
        } else if (name.includes('educational')) {
          contestType = 'educational';
          difficulty = '1600+';
        } else if (name.includes('global')) {
          contestType = 'global';
          difficulty = 'All levels';
        }
        
        // Calculate duration in minutes for filtering
        const durationMinutes = Math.floor(durationSeconds / 60);
        
        return {
          platform: 'codeforces' as Platform,
          name: contest.name,
          url: `https://codeforces.com/contests/${contest.id}`,
          startTime,
          endTime,
          duration: formatDuration(durationSeconds),
          difficulty,
          contestType,
          durationMinutes
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
        
        // Determine contest type and difficulty
        let contestType: CodechefType = 'other';
        let difficulty: string | undefined = undefined;
        
        const name = contest.name.toLowerCase();
        
        // Check for different Codechef contest types
        if (name.includes('long') || name.includes('challenge')) {
          contestType = 'long';
          difficulty = 'All levels';
        } else if (name.includes('cook') || name.includes('cook-off')) {
          contestType = 'cookoff';
          difficulty = 'Medium-Hard';
        } else if (name.includes('lunch') || name.includes('lunchtime')) {
          contestType = 'lunchtime';
          difficulty = 'Medium';
        } else if (name.includes('starters')) {
          contestType = 'starters';
          difficulty = 'All levels';
        }
        
        // Calculate duration in minutes for filtering
        const durationMinutes = Math.floor(durationSeconds / 60);
        
        return {
          platform: 'codechef' as Platform,
          name: contest.name,
          url: contest.url,
          startTime,
          endTime,
          duration: formatDuration(durationSeconds),
          difficulty,
          contestType,
          durationMinutes
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
        const durationSeconds = contest.duration;
        
        // Determine contest type and difficulty
        let contestType: LeetcodeType = 'other';
        let difficulty: string | undefined = 'Medium-Hard';
        
        const title = contest.title.toLowerCase();
        const titleSlug = contest.titleSlug.toLowerCase();
        
        if (title.includes('weekly') || titleSlug.includes('weekly')) {
          contestType = 'weekly';
        } else if (title.includes('biweekly') || titleSlug.includes('biweekly')) {
          contestType = 'biweekly';
        }
        
        // Calculate duration in minutes for filtering
        const durationMinutes = Math.floor(durationSeconds / 60);
        
        return {
          platform: 'leetcode' as Platform,
          name: contest.title,
          url: `https://leetcode.com/contest/${contest.titleSlug}`,
          startTime,
          endTime,
          duration: formatDuration(durationSeconds),
          difficulty,
          contestType,
          durationMinutes
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
          
          // Determine contest type and difficulty
          let contestType: LeetcodeType = 'other';
          let difficulty: string | undefined = 'Medium-Hard';
          
          const name = contest.name.toLowerCase();
          
          if (name.includes('weekly')) {
            contestType = 'weekly';
          } else if (name.includes('biweekly')) {
            contestType = 'biweekly';
          }
          
          // Calculate duration in minutes for filtering
          const durationMinutes = Math.floor(durationSeconds / 60);
          
          return {
            platform: 'leetcode' as Platform,
            name: contest.name,
            url: 'https://leetcode.com/contest/',
            startTime,
            endTime,
            duration: formatDuration(durationSeconds),
            difficulty,
            contestType,
            durationMinutes
          };
        });
      } catch (apiError) {
        console.error('Error using kontests.net API for LeetCode:', apiError);
        
        // Use current contest numbers as a fallback
        const now = new Date();
        
        // LeetCode Weekly Contest is every Saturday at 10:30 AM (UTC)
        const nextWeeklyDate = new Date(now);
        nextWeeklyDate.setDate(now.getDate() + (6 - now.getDay() + 7) % 7); // Next Saturday
        nextWeeklyDate.setHours(2, 30, 0, 0); // 02:30 AM UTC
        
        // LeetCode Biweekly Contest is every other Saturday at 10:30 AM (UTC)
        // For simplicity, we'll place it the following Saturday
        const nextBiweeklyDate = new Date(now);
        nextBiweeklyDate.setDate(now.getDate() + (6 - now.getDay() + 14) % 14); // Saturday after next
        nextBiweeklyDate.setHours(14, 30, 0, 0); // 2:30 PM UTC
        
        // Base contest numbers as of April 1, 2025
        // Weekly Contest 444 and Biweekly Contest 154
        const baseWeeklyNumber = 444;
        const baseBiweeklyNumber = 154;
        const baseDate = new Date(2025, 3, 1); // April 1, 2025
        
        // Calculate weeks since base date for weekly contests (happens every week)
        const weeksSinceBase = Math.floor((now.getTime() - baseDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const weeklyContestNumber = baseWeeklyNumber + weeksSinceBase;
        
        // Calculate biweekly contests (happens every two weeks)
        const biweeklySinceBase = Math.floor(weeksSinceBase / 2);
        const biweeklyContestNumber = baseBiweeklyNumber + biweeklySinceBase;
        
        // Duration - typically 90 minutes
        const contestDuration = 90 * 60 * 1000;
        
        // Get previous week's contests for recent history
        const prevWeeklyDate = new Date(nextWeeklyDate);
        prevWeeklyDate.setDate(prevWeeklyDate.getDate() - 7);
        
        const prevBiweeklyDate = new Date(now);
        prevBiweeklyDate.setDate(now.getDate() - (now.getDay() + 1)); // Previous Saturday
        prevBiweeklyDate.setHours(14, 30, 0, 0);
        
        return [
          // Upcoming contests
          {
            platform: 'leetcode' as Platform,
            name: `Weekly Contest ${weeklyContestNumber}`,
            url: `https://leetcode.com/contest/weekly-contest-${weeklyContestNumber}`,
            startTime: nextWeeklyDate,
            endTime: new Date(nextWeeklyDate.getTime() + contestDuration),
            duration: '1h 30m',
            difficulty: 'Medium-Hard',
            contestType: 'weekly' as LeetcodeType,
            durationMinutes: 90
          },
          {
            platform: 'leetcode' as Platform,
            name: `Biweekly Contest ${biweeklyContestNumber}`,
            url: `https://leetcode.com/contest/biweekly-contest-${biweeklyContestNumber}`,
            startTime: nextBiweeklyDate,
            endTime: new Date(nextBiweeklyDate.getTime() + contestDuration),
            duration: '1h 30m',
            difficulty: 'Medium-Hard',
            contestType: 'biweekly' as LeetcodeType,
            durationMinutes: 90
          },
          // Previous week's contests
          {
            platform: 'leetcode' as Platform,
            name: `Weekly Contest ${weeklyContestNumber - 1}`,
            url: `https://leetcode.com/contest/weekly-contest-${weeklyContestNumber - 1}`,
            startTime: prevWeeklyDate,
            endTime: new Date(prevWeeklyDate.getTime() + contestDuration),
            duration: '1h 30m',
            difficulty: 'Medium-Hard',
            contestType: 'weekly' as LeetcodeType,
            durationMinutes: 90
          },
          {
            platform: 'leetcode' as Platform,
            name: `Biweekly Contest ${biweeklyContestNumber - 1}`,
            url: `https://leetcode.com/contest/biweekly-contest-${biweeklyContestNumber - 1}`,
            startTime: prevBiweeklyDate,
            endTime: new Date(prevBiweeklyDate.getTime() + contestDuration),
            duration: '1h 30m',
            difficulty: 'Medium-Hard',
            contestType: 'biweekly' as LeetcodeType,
            durationMinutes: 90
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
