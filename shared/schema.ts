import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

// Notification preferences table schema
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  notificationTiming: text("notification_timing").notNull().default("1hour"),
  notifyCodeforces: boolean("notify_codeforces").notNull().default(true),
  notifyCodechef: boolean("notify_codechef").notNull().default(true),
  notifyLeetcode: boolean("notify_leetcode").notNull().default(true),
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).pick({
  userId: true,
  emailNotifications: true,
  notificationTiming: true,
  notifyCodeforces: true,
  notifyCodechef: true,
  notifyLeetcode: true,
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
});

export const insertContestSchema = createInsertSchema(contests).pick({
  platform: true,
  name: true,
  url: true,
  startTime: true,
  endTime: true,
  duration: true,
});

// Contest reminders table schema
export const contestReminders = pgTable("contest_reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contestId: integer("contest_id").notNull(),
  reminded: boolean("reminded").notNull().default(false),
});

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

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
