import {
  User,
  InsertUser,
  Contest,
  InsertContest,
  NotificationPreference,
  InsertNotificationPreference,
  ContestReminder,
  InsertContestReminder,
  Platform
} from "@shared/schema";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Contest operations
  getAllContests(): Promise<Contest[]>;
  getContestsByPlatforms(platforms: Platform[]): Promise<Contest[]>;
  getUpcomingContests(platforms?: Platform[]): Promise<Contest[]>;
  getPastContests(daysAgo: number, platforms?: Platform[]): Promise<Contest[]>;
  getCurrentContests(platforms?: Platform[]): Promise<Contest[]>;
  createContest(contest: InsertContest): Promise<Contest>;
  updateContest(id: number, contest: Partial<InsertContest>): Promise<Contest | undefined>;
  getContestById(id: number): Promise<Contest | undefined>;

  // Notification preferences operations
  getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreference): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: number, preferences: Partial<InsertNotificationPreference>): Promise<NotificationPreference | undefined>;

  // Contest reminders operations
  getContestReminders(userId: number): Promise<ContestReminder[]>;
  createContestReminder(reminder: InsertContestReminder): Promise<ContestReminder>;
  updateContestReminder(id: number, reminded: boolean): Promise<ContestReminder | undefined>;
  getContestReminderByUserAndContest(userId: number, contestId: number): Promise<ContestReminder | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contests: Map<number, Contest>;
  private notificationPreferences: Map<number, NotificationPreference>;
  private contestReminders: Map<number, ContestReminder>;
  private currentUserId: number;
  private currentContestId: number;
  private currentNotificationPreferenceId: number;
  private currentContestReminderId: number;

  constructor() {
    this.users = new Map();
    this.contests = new Map();
    this.notificationPreferences = new Map();
    this.contestReminders = new Map();
    this.currentUserId = 1;
    this.currentContestId = 1;
    this.currentNotificationPreferenceId = 1;
    this.currentContestReminderId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Contest operations
  async getAllContests(): Promise<Contest[]> {
    return Array.from(this.contests.values());
  }

  async getContestsByPlatforms(platforms: Platform[]): Promise<Contest[]> {
    return Array.from(this.contests.values()).filter(
      (contest) => platforms.includes(contest.platform as Platform)
    );
  }

  async getUpcomingContests(platforms?: Platform[]): Promise<Contest[]> {
    const now = new Date();
    let contests = Array.from(this.contests.values()).filter(
      (contest) => new Date(contest.startTime) > now
    );

    if (platforms && platforms.length > 0) {
      contests = contests.filter(
        (contest) => platforms.includes(contest.platform as Platform)
      );
    }

    return contests.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  async getPastContests(daysAgo: number, platforms?: Platform[]): Promise<Contest[]> {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - daysAgo);

    let contests = Array.from(this.contests.values()).filter(
      (contest) => new Date(contest.endTime) < now && new Date(contest.endTime) > pastDate
    );

    if (platforms && platforms.length > 0) {
      contests = contests.filter(
        (contest) => platforms.includes(contest.platform as Platform)
      );
    }

    return contests.sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );
  }

  async getCurrentContests(platforms?: Platform[]): Promise<Contest[]> {
    const now = new Date();
    let contests = Array.from(this.contests.values()).filter(
      (contest) => new Date(contest.startTime) <= now && new Date(contest.endTime) >= now
    );

    if (platforms && platforms.length > 0) {
      contests = contests.filter(
        (contest) => platforms.includes(contest.platform as Platform)
      );
    }

    return contests;
  }

  async createContest(insertContest: InsertContest): Promise<Contest> {
    const id = this.currentContestId++;
    const contest: Contest = { ...insertContest, id };
    this.contests.set(id, contest);
    return contest;
  }

  async updateContest(id: number, contestUpdate: Partial<InsertContest>): Promise<Contest | undefined> {
    const contest = this.contests.get(id);
    if (!contest) return undefined;

    const updatedContest = { ...contest, ...contestUpdate };
    this.contests.set(id, updatedContest);
    return updatedContest;
  }

  async getContestById(id: number): Promise<Contest | undefined> {
    return this.contests.get(id);
  }

  // Notification preferences operations
  async getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined> {
    return Array.from(this.notificationPreferences.values()).find(
      (pref) => pref.userId === userId
    );
  }

  async createNotificationPreferences(insertPreferences: InsertNotificationPreference): Promise<NotificationPreference> {
    const id = this.currentNotificationPreferenceId++;
    const preferences: NotificationPreference = { ...insertPreferences, id };
    this.notificationPreferences.set(id, preferences);
    return preferences;
  }

  async updateNotificationPreferences(userId: number, preferencesUpdate: Partial<InsertNotificationPreference>): Promise<NotificationPreference | undefined> {
    const preferences = Array.from(this.notificationPreferences.values()).find(
      (pref) => pref.userId === userId
    );
    
    if (!preferences) return undefined;

    const updatedPreferences = { ...preferences, ...preferencesUpdate };
    this.notificationPreferences.set(preferences.id, updatedPreferences);
    return updatedPreferences;
  }

  // Contest reminders operations
  async getContestReminders(userId: number): Promise<ContestReminder[]> {
    return Array.from(this.contestReminders.values()).filter(
      (reminder) => reminder.userId === userId
    );
  }

  async createContestReminder(insertReminder: InsertContestReminder): Promise<ContestReminder> {
    const id = this.currentContestReminderId++;
    const reminder: ContestReminder = { ...insertReminder, id };
    this.contestReminders.set(id, reminder);
    return reminder;
  }

  async updateContestReminder(id: number, reminded: boolean): Promise<ContestReminder | undefined> {
    const reminder = this.contestReminders.get(id);
    if (!reminder) return undefined;

    const updatedReminder = { ...reminder, reminded };
    this.contestReminders.set(id, updatedReminder);
    return updatedReminder;
  }

  async getContestReminderByUserAndContest(userId: number, contestId: number): Promise<ContestReminder | undefined> {
    return Array.from(this.contestReminders.values()).find(
      (reminder) => reminder.userId === userId && reminder.contestId === contestId
    );
  }
}

export const storage = new MemStorage();
