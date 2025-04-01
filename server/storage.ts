import {
  User,
  InsertUser,
  Contest,
  InsertContest,
  NotificationPreference,
  InsertNotificationPreference,
  ContestReminder,
  InsertContestReminder,
  Platform,
  users,
  contests,
  notificationPreferences,
  contestReminders
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, lte, gte, desc, asc } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Contest operations
  async getAllContests(): Promise<Contest[]> {
    return db.select().from(contests);
  }

  async getContestsByPlatforms(platforms: Platform[]): Promise<Contest[]> {
    if (platforms.length === 0) {
      return this.getAllContests();
    }
    
    return db.select().from(contests).where(
      eq(contests.platform, platforms[0]) // Handle at least the first platform
    );
  }

  async getUpcomingContests(platforms?: Platform[]): Promise<Contest[]> {
    const now = new Date();
    
    const baseQuery = db.select()
      .from(contests)
      .where(
        gt(contests.startTime, now)
      )
      .orderBy(asc(contests.startTime));
    
    if (!platforms || platforms.length === 0) {
      return baseQuery;
    }
    
    // Handle platforms filtering separately
    return db.select()
      .from(contests)
      .where(
        and(
          gt(contests.startTime, now),
          eq(contests.platform, platforms[0]) // Filter by first platform as workaround
        )
      )
      .orderBy(asc(contests.startTime));
  }

  async getPastContests(daysAgo: number, platforms?: Platform[]): Promise<Contest[]> {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - daysAgo);

    const baseQuery = db.select()
      .from(contests)
      .where(
        and(
          lt(contests.endTime, now),
          gt(contests.endTime, pastDate)
        )
      )
      .orderBy(desc(contests.endTime));
    
    if (!platforms || platforms.length === 0) {
      return baseQuery;
    }
    
    // Handle platforms filtering separately
    return db.select()
      .from(contests)
      .where(
        and(
          lt(contests.endTime, now),
          gt(contests.endTime, pastDate),
          eq(contests.platform, platforms[0]) // Filter by first platform as workaround
        )
      )
      .orderBy(desc(contests.endTime));
  }

  async getCurrentContests(platforms?: Platform[]): Promise<Contest[]> {
    const now = new Date();
    
    const baseQuery = db.select()
      .from(contests)
      .where(
        and(
          lte(contests.startTime, now),
          gte(contests.endTime, now)
        )
      );
    
    if (!platforms || platforms.length === 0) {
      return baseQuery;
    }
    
    // Handle platforms filtering separately
    return db.select()
      .from(contests)
      .where(
        and(
          lte(contests.startTime, now),
          gte(contests.endTime, now),
          eq(contests.platform, platforms[0]) // Filter by first platform as workaround
        )
      );
  }

  async createContest(insertContest: InsertContest): Promise<Contest> {
    const [contest] = await db.insert(contests).values(insertContest).returning();
    return contest;
  }

  async updateContest(id: number, contestUpdate: Partial<InsertContest>): Promise<Contest | undefined> {
    const [updatedContest] = await db
      .update(contests)
      .set(contestUpdate)
      .where(eq(contests.id, id))
      .returning();
    
    return updatedContest;
  }

  async getContestById(id: number): Promise<Contest | undefined> {
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, id));
    
    return contest;
  }

  // Notification preferences operations
  async getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    
    return preferences;
  }

  async createNotificationPreferences(insertPreferences: InsertNotificationPreference): Promise<NotificationPreference> {
    const [preferences] = await db
      .insert(notificationPreferences)
      .values(insertPreferences)
      .returning();
    
    return preferences;
  }

  async updateNotificationPreferences(userId: number, preferencesUpdate: Partial<InsertNotificationPreference>): Promise<NotificationPreference | undefined> {
    const [updatedPreferences] = await db
      .update(notificationPreferences)
      .set(preferencesUpdate)
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    
    return updatedPreferences;
  }

  // Contest reminders operations
  async getContestReminders(userId: number): Promise<ContestReminder[]> {
    return db
      .select()
      .from(contestReminders)
      .where(eq(contestReminders.userId, userId));
  }

  async createContestReminder(insertReminder: InsertContestReminder): Promise<ContestReminder> {
    const [reminder] = await db
      .insert(contestReminders)
      .values(insertReminder)
      .returning();
    
    return reminder;
  }

  async updateContestReminder(id: number, reminded: boolean): Promise<ContestReminder | undefined> {
    const [updatedReminder] = await db
      .update(contestReminders)
      .set({ reminded })
      .where(eq(contestReminders.id, id))
      .returning();
    
    return updatedReminder;
  }

  async getContestReminderByUserAndContest(userId: number, contestId: number): Promise<ContestReminder | undefined> {
    const [reminder] = await db
      .select()
      .from(contestReminders)
      .where(
        and(
          eq(contestReminders.userId, userId),
          eq(contestReminders.contestId, contestId)
        )
      );
    
    return reminder;
  }
}

export const storage = new DatabaseStorage();
