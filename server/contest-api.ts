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

function formatClistDate(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 16); // "YYYY-MM-DD HH:mm"
}

function toIST(date: Date): Date {
  // IST is UTC + 5 hours 30 minutes = 330 minutes
  const IST_OFFSET = 330;
  return new Date(date.getTime() + IST_OFFSET * 60 * 1000);
}


export async function fetchCodechefContests(): Promise<InsertContest[]> {
  try {
    const username = process.env.CLIST_USERNAME;
    const apiKey = process.env.CLIST_API_KEY;

    const now = new Date();
    const oneWeekAgo = new Date();
    const nextMonth = new Date();

    oneWeekAgo.setDate(now.getDate() - 7);
    nextMonth.setDate(now.getDate() + 30);

    const start = formatClistDate(oneWeekAgo);
    const end = formatClistDate(nextMonth);

    const response = await axios.get('https://clist.by/api/v1/contest/', {
      params: {
        username,
        api_key: apiKey,
        resource__id: 2, // CodeChef
        start__gt: start,
        start__lt: end,
        order_by: 'start',
        duration__lt: 999999,
      },
    });

    const contests = response.data.objects;

    return contests.map((contest: any) => {
      const startTime = toIST(new Date(contest.start));
      const durationSeconds = contest.duration / 1; // sometimes comes as string
      const endTime = calculateEndTime(startTime, durationSeconds);
      const name = contest.event.toLowerCase();

      let contestType: CodechefType = 'other';
      let difficulty: string | undefined;

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

      const durationMinutes = Math.floor(durationSeconds / 60);

      return {
        platform: 'codechef' as Platform,
        name: contest.event,
        url: contest.href,
        startTime,
        endTime,
        duration: formatDuration(durationSeconds),
        durationMinutes,
        contestType,
        difficulty,
      };
    });
  } catch (error) {
    console.error('Error fetching CodeChef contests from CLIST:', error);
    return [];
  }
}


// Fetch Leetcode contests
export async function fetchLeetcodeContests(): Promise<InsertContest[]> {
  try {
    const username = process.env.CLIST_USERNAME;
    const apiKey = process.env.CLIST_API_KEY;

    const now = new Date();
    const oneWeekAgo = new Date();
    const nextMonth = new Date();

    oneWeekAgo.setDate(now.getDate() - 7);
    nextMonth.setDate(now.getDate() + 30);

    const start = formatClistDate(oneWeekAgo);
    const end = formatClistDate(nextMonth);

    const response = await axios.get('https://clist.by/api/v1/contest/', {
      params: {
        username,
        api_key: apiKey,
        resource__id: 102, // LeetCode
        start__gt: start,
        start__lt: end,
        order_by: 'start',
        duration__lt: 999999,
      },
    });

    const contests = response.data.objects;

    return contests.map((contest: any) => {
      const startTime = toIST(new Date(contest.start));
      const durationSeconds = contest.duration;
      const endTime = calculateEndTime(startTime, durationSeconds);
      const name = contest.event.toLowerCase();

      let contestType: LeetcodeType = 'other';
      let difficulty: string | undefined = 'Medium-Hard';

      if (name.includes('weekly')) {
        contestType = 'weekly';
      } else if (name.includes('biweekly')) {
        contestType = 'biweekly';
      }

      const durationMinutes = Math.floor(durationSeconds / 60);

      return {
        platform: 'leetcode' as Platform,
        name: contest.event,
        url: contest.href,
        startTime,
        endTime,
        duration: formatDuration(durationSeconds),
        durationMinutes,
        contestType,
        difficulty,
      };
    });
  } catch (error) {
    console.error('Error fetching Leetcode contests from CLIST:', error);
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
