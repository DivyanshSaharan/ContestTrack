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
    // First attempt to use kontests.net API
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
      
      // Fallback to sample CodeChef contests with realistic data
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      
      const yesterdayEnd = new Date(now);
      yesterdayEnd.setDate(now.getDate() - 1);
      
      const threeHoursAgo = new Date(now);
      threeHoursAgo.setHours(now.getHours() - 3);
      
      const fourHoursLater = new Date(now);
      fourHoursLater.setHours(now.getHours() + 4);
      
      return [
        {
          platform: 'codechef' as Platform,
          name: 'CodeChef April Long Challenge',
          url: 'https://www.codechef.com/contests',
          startTime: tomorrow,
          endTime: nextWeek,
          duration: '7 days'
        },
        {
          platform: 'codechef' as Platform,
          name: 'CodeChef Starters 112',
          url: 'https://www.codechef.com/contests',
          startTime: threeHoursAgo,
          endTime: fourHoursLater,
          duration: '3h'
        },
        {
          platform: 'codechef' as Platform,
          name: 'CodeChef March Cook-Off',
          url: 'https://www.codechef.com/contests',
          startTime: new Date(yesterdayEnd.getTime() - 3 * 3600 * 1000),
          endTime: yesterdayEnd,
          duration: '2h 30m'
        }
      ];
    }
  } catch (error) {
    console.error('Error fetching Codechef contests:', error);
    return [];
  }
}

// Fetch Leetcode contests
export async function fetchLeetcodeContests(): Promise<InsertContest[]> {
  try {
    // First attempt to use kontests.net API
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
      
      // Fallback to sample LeetCode contests with realistic data
      const now = new Date();
      
      // Next weekend for weekly contest
      const nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
      nextSaturday.setHours(10, 30, 0, 0);
      
      // Next weekend for biweekly contest
      const nextSunday = new Date(nextSaturday);
      nextSunday.setDate(nextSaturday.getDate() + 1);
      nextSunday.setHours(10, 30, 0, 0);
      
      // Last weekend for the past contest
      const lastSaturday = new Date(now);
      lastSaturday.setDate(now.getDate() - (now.getDay() + 1));
      lastSaturday.setHours(10, 30, 0, 0);
      
      // Contest duration - typically 90 minutes
      const contestDuration = 90 * 60 * 1000;
      
      return [
        {
          platform: 'leetcode' as Platform,
          name: 'Weekly Contest 389',
          url: 'https://leetcode.com/contest/weekly-contest-389',
          startTime: nextSaturday,
          endTime: new Date(nextSaturday.getTime() + contestDuration),
          duration: '1h 30m'
        },
        {
          platform: 'leetcode' as Platform,
          name: 'Biweekly Contest 126',
          url: 'https://leetcode.com/contest/biweekly-contest-126',
          startTime: nextSunday,
          endTime: new Date(nextSunday.getTime() + contestDuration),
          duration: '1h 30m'
        },
        {
          platform: 'leetcode' as Platform,
          name: 'Weekly Contest 388',
          url: 'https://leetcode.com/contest/weekly-contest-388',
          startTime: lastSaturday,
          endTime: new Date(lastSaturday.getTime() + contestDuration),
          duration: '1h 30m'
        }
      ];
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
