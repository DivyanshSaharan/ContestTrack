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
    // Codechef doesn't have a public API, so we're using a community API
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
  } catch (error) {
    console.error('Error fetching Codechef contests:', error);
    return [];
  }
}

// Fetch Leetcode contests
export async function fetchLeetcodeContests(): Promise<InsertContest[]> {
  try {
    // LeetCode doesn't have a public API, so we're using a community API
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
