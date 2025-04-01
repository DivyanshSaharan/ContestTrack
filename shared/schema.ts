import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  notificationPreferences: one(notificationPreferences, {
    fields: [users.id],
    references: [notificationPreferences.userId],
  }),
  contestPreferences: one(contestPreferences, {
    fields: [users.id],
    references: [contestPreferences.userId],
  }),
  contestReminders: many(contestReminders),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Notification preferences table schema
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  notificationTiming: text("notification_timing").notNull().default("1hour"),
  notifyCodeforces: boolean("notify_codeforces").notNull().default(true),
  notifyCodechef: boolean("notify_codechef").notNull().default(true),
  notifyLeetcode: boolean("notify_leetcode").notNull().default(true),
});

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).pick({
  userId: true,
  emailNotifications: true,
  notificationTiming: true,
  notifyCodeforces: true,
  notifyCodechef: true,
  notifyLeetcode: true,
});

// Contest preferences table schema
export const contestPreferences = pgTable("contest_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Difficulty levels for each platform
  codeforcesMinRating: integer("codeforces_min_rating").default(0),
  codeforcesMaxRating: integer("codeforces_max_rating").default(4000),
  
  // Contest types for each platform (e.g., Div1, Div2, Educational, etc. for Codeforces)
  codeforcesTypes: text("codeforces_types").array().default([]),
  codechefTypes: text("codechef_types").array().default([]),
  leetcodeTypes: text("leetcode_types").array().default([]),
  
  // Duration preferences
  minDurationMinutes: integer("min_duration_minutes").default(0),
  maxDurationMinutes: integer("max_duration_minutes").default(1440), // 24 hours as default max
  
  // Favorite or bookmarked contests
  favoriteContestIds: integer("favorite_contest_ids").array().default([]),
});

export const contestPreferencesRelations = relations(contestPreferences, ({ one }) => ({
  user: one(users, {
    fields: [contestPreferences.userId],
    references: [users.id],
  }),
}));

export const insertContestPreferenceSchema = createInsertSchema(contestPreferences).pick({
  userId: true,
  codeforcesMinRating: true,
  codeforcesMaxRating: true,
  codeforcesTypes: true,
  codechefTypes: true,
  leetcodeTypes: true,
  minDurationMinutes: true,
  maxDurationMinutes: true,
  favoriteContestIds: true,
});

// Contests table schema
export const contests = pgTable("contests", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // 'codeforces', 'codechef', 'leetcode'
  name: text("name").notNull(),
  url: text("url").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: text("duration").notNull(), // Duration in human-readable format
  
  // Adding new fields for difficulty and type
  difficulty: text("difficulty"), // store difficulty level or rating range
  contestType: text("contest_type"), // e.g., Div1, Div2, Educational, Challenge, etc.
  durationMinutes: integer("duration_minutes"), // duration in minutes for filtering
});

export const contestsRelations = relations(contests, ({ many }) => ({
  contestReminders: many(contestReminders),
}));

export const insertContestSchema = createInsertSchema(contests).pick({
  platform: true,
  name: true,
  url: true,
  startTime: true,
  endTime: true,
  duration: true,
  difficulty: true,
  contestType: true,
  durationMinutes: true,
});

// Contest reminders table schema
export const contestReminders = pgTable("contest_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contestId: integer("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  reminded: boolean("reminded").notNull().default(false),
});

export const contestRemindersRelations = relations(contestReminders, ({ one }) => ({
  user: one(users, {
    fields: [contestReminders.userId],
    references: [users.id],
  }),
  contest: one(contests, {
    fields: [contestReminders.contestId],
    references: [contests.id],
  }),
}));

export const insertContestReminderSchema = createInsertSchema(contestReminders).pick({
  userId: true,
  contestId: true,
  reminded: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

export type ContestPreference = typeof contestPreferences.$inferSelect;
export type InsertContestPreference = z.infer<typeof insertContestPreferenceSchema>;

export type Contest = typeof contests.$inferSelect;
export type InsertContest = z.infer<typeof insertContestSchema>;

export type ContestReminder = typeof contestReminders.$inferSelect;
export type InsertContestReminder = z.infer<typeof insertContestReminderSchema>;

// Platform enum
export const PlatformEnum = z.enum(['codeforces', 'codechef', 'leetcode']);
export type Platform = z.infer<typeof PlatformEnum>;

// Notification timing enum
export const NotificationTimingEnum = z.enum(['1hour', '3hours', '1day']);
export type NotificationTiming = z.infer<typeof NotificationTimingEnum>;

// Contest type enums for each platform
export const CodeforcesTypeEnum = z.enum(['div1', 'div2', 'div3', 'div4', 'educational', 'global', 'other']);
export type CodeforcesType = z.infer<typeof CodeforcesTypeEnum>;

export const CodechefTypeEnum = z.enum(['long', 'cookoff', 'lunchtime', 'starters', 'other']);
export type CodechefType = z.infer<typeof CodechefTypeEnum>;

export const LeetcodeTypeEnum = z.enum(['weekly', 'biweekly', 'other']);
export type LeetcodeType = z.infer<typeof LeetcodeTypeEnum>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
