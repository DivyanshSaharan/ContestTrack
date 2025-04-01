import {
  User,
  InsertUser,
  Contest,
  InsertContest,
  NotificationPreference,
  InsertNotificationPreference,
  ContestPreference,
  InsertContestPreference,
  ContestReminder,
  InsertContestReminder,
  Platform,
  users,
  contests,
  notificationPreferences,
  contestPreferences,
  contestReminders
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, lte, gte, desc, asc, inArray, or, sql } from "drizzle-orm";

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
  
  // Contest filtering based on user preferences
  getContestsByPreferences(userId: number, platforms?: Platform[]): Promise<Contest[]>;

  // Notification preferences operations
  getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreference): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: number, preferences: Partial<InsertNotificationPreference>): Promise<NotificationPreference | undefined>;

  // Contest preferences operations
  getContestPreferences(userId: number): Promise<ContestPreference | undefined>;
  createContestPreferences(preferences: InsertContestPreference): Promise<ContestPreference>;
  updateContestPreferences(userId: number, preferences: Partial<InsertContestPreference>): Promise<ContestPreference | undefined>;
  toggleFavoriteContest(userId: number, contestId: number): Promise<ContestPreference | undefined>;
  getFavoriteContests(userId: number): Promise<Contest[]>;

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
    try {
      // First get the existing preferences to ensure they exist
      const [existingPrefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      
      if (!existingPrefs) return undefined;
      
      // Then update the preferences
      const [updatedPreferences] = await db
        .update(notificationPreferences)
        .set(preferencesUpdate)
        .where(eq(notificationPreferences.userId, userId))
        .returning();
      
      return updatedPreferences;
    } catch (error) {
      console.error("Error in updateNotificationPreferences:", error);
      throw error;
    }
  }

  // Contest preferences operations
  async getContestPreferences(userId: number): Promise<ContestPreference | undefined> {
    const [preferences] = await db
      .select()
      .from(contestPreferences)
      .where(eq(contestPreferences.userId, userId));
    
    return preferences;
  }

  async createContestPreferences(insertPreferences: InsertContestPreference): Promise<ContestPreference> {
    const [preferences] = await db
      .insert(contestPreferences)
      .values(insertPreferences)
      .returning();
    
    return preferences;
  }

  async updateContestPreferences(
    userId: number,
    preferencesUpdate: Partial<InsertContestPreference>
  ): Promise<ContestPreference | undefined> {
    const [updatedPreferences] = await db
      .update(contestPreferences)
      .set(preferencesUpdate)
      .where(eq(contestPreferences.userId, userId))
      .returning();
    
    return updatedPreferences;
  }
  
  async toggleFavoriteContest(userId: number, contestId: number): Promise<ContestPreference | undefined> {
    // Get current preferences
    let userPrefs = await this.getContestPreferences(userId);
    
    // If no preferences exist yet, create them first
    if (!userPrefs) {
      userPrefs = await this.createContestPreferences({
        userId,
        favoriteContestIds: [contestId],
      });
      return userPrefs;
    }
    
    // Toggle the contest in favorites
    let favoriteIds = userPrefs.favoriteContestIds || [];
    
    if (favoriteIds.includes(contestId)) {
      // Remove if already favorited
      favoriteIds = favoriteIds.filter(id => id !== contestId);
    } else {
      // Add if not favorited
      favoriteIds.push(contestId);
    }
    
    // Update preferences
    return this.updateContestPreferences(userId, {
      favoriteContestIds: favoriteIds,
    });
  }

  async getFavoriteContests(userId: number): Promise<Contest[]> {
    const userPrefs = await this.getContestPreferences(userId);
    
    if (!userPrefs || !userPrefs.favoriteContestIds || userPrefs.favoriteContestIds.length === 0) {
      return [];
    }
    
    return db.select()
      .from(contests)
      .where(inArray(contests.id, userPrefs.favoriteContestIds))
      .orderBy(asc(contests.startTime));
  }
  
  // Contest filtering based on preferences
  async getContestsByPreferences(userId: number, platforms?: Platform[]): Promise<Contest[]> {
    const userPrefs = await this.getContestPreferences(userId);
    
    if (!userPrefs) {
      // If no preferences exist, return regular contests filtered by platform
      return platforms && platforms.length > 0 
        ? this.getContestsByPlatforms(platforms) 
        : this.getAllContests();
    }
    
    let query = db.select().from(contests);
    
    // Apply platform filter if provided
    if (platforms && platforms.length > 0) {
      query = query.where(eq(contests.platform, platforms[0]));
    }
    
    // Apply duration filter
    if (userPrefs.minDurationMinutes !== null && userPrefs.maxDurationMinutes !== null) {
      query = query.where(
        and(
          gte(contests.durationMinutes, userPrefs.minDurationMinutes),
          lte(contests.durationMinutes, userPrefs.maxDurationMinutes)
        )
      );
    }
    
    // Note: Here we would normally add more complex filtering based on platform-specific
    // preferences like Codeforces rating range and contest types, but we need to first
    // make sure the contest data includes these fields.
    
    return query.orderBy(asc(contests.startTime));
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
