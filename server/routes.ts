import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchAllContests } from "./contest-api";
import { processContestNotifications, initializeEmailService } from "./email";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import bcrypt from "bcryptjs";
import cron from "node-cron";
import { z } from "zod";
import {
  PlatformEnum,
  Platform,
  loginSchema,
  insertUserSchema,
  insertNotificationPreferenceSchema,
  insertContestPreferenceSchema,
  insertContestReminderSchema,
} from "@shared/schema";

// Initialize email service
initializeEmailService();

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup express-session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "contest-tracker-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user to the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication check middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Fetch contests on server startup and schedule periodic updates
  await fetchAndStoreContests();
  // Schedule to update contests every hour
  cron.schedule("0 * * * *", fetchAndStoreContests);
  // Schedule to process notifications every 5 minutes
  cron.schedule("*/5 * * * *", processContestNotifications);

  // Register API routes
  // ==================

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(userData.password);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create default notification preferences
      await storage.createNotificationPreferences({
        userId: user.id,
        emailNotifications: true,
        notificationTiming: "1hour",
        notifyCodeforces: true,
        notifyCodechef: true,
        notifyLeetcode: true,
      });

      // Automatically log in the user after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error during login after registration" });
        }
        return res.status(201).json({ 
          id: user.id, 
          username: user.username,
          email: user.email 
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error | null, user: any | false, info: { message: string }) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message || "Authentication failed" });
        }
        req.login(user, (loginErr: Error) => {
          if (loginErr) {
            return next(loginErr);
          }
          return res.json({ 
            id: user.id, 
            username: user.username,
            email: user.email 
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/current-user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
      });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // Contest routes
  app.get("/api/contests", async (req, res) => {
    try {
      const platformsParam = req.query.platforms as string;
      let platforms: string[] = [];
      
      if (platformsParam) {
        platforms = platformsParam.split(",");
        // Validate platforms
        for (const platform of platforms) {
          try {
            PlatformEnum.parse(platform);
          } catch (error) {
            return res.status(400).json({ message: `Invalid platform: ${platform}` });
          }
        }
      }

      let contests;
      if (platforms.length > 0) {
        contests = await storage.getContestsByPlatforms(platforms as any[]);
      } else {
        contests = await storage.getAllContests();
      }

      res.json(contests);
    } catch (error) {
      console.error("Error fetching contests:", error);
      res.status(500).json({ message: "Server error fetching contests" });
    }
  });

  app.get("/api/contests/upcoming", async (req, res) => {
    try {
      const platformsParam = req.query.platforms as string;
      let platforms: string[] = [];
      
      if (platformsParam) {
        platforms = platformsParam.split(",");
        // Validate platforms
        for (const platform of platforms) {
          try {
            PlatformEnum.parse(platform);
          } catch (error) {
            return res.status(400).json({ message: `Invalid platform: ${platform}` });
          }
        }
      }

      const contests = await storage.getUpcomingContests(platforms as any[]);
      res.json(contests);
    } catch (error) {
      console.error("Error fetching upcoming contests:", error);
      res.status(500).json({ message: "Server error fetching upcoming contests" });
    }
  });

  app.get("/api/contests/past", async (req, res) => {
    try {
      const daysAgo = parseInt(req.query.days as string) || 7;
      const platformsParam = req.query.platforms as string;
      let platforms: string[] = [];
      
      if (platformsParam) {
        platforms = platformsParam.split(",");
        // Validate platforms
        for (const platform of platforms) {
          try {
            PlatformEnum.parse(platform);
          } catch (error) {
            return res.status(400).json({ message: `Invalid platform: ${platform}` });
          }
        }
      }

      const contests = await storage.getPastContests(daysAgo, platforms as any[]);
      res.json(contests);
    } catch (error) {
      console.error("Error fetching past contests:", error);
      res.status(500).json({ message: "Server error fetching past contests" });
    }
  });

  app.get("/api/contests/current", async (req, res) => {
    try {
      const platformsParam = req.query.platforms as string;
      let platforms: string[] = [];
      
      if (platformsParam) {
        platforms = platformsParam.split(",");
        // Validate platforms
        for (const platform of platforms) {
          try {
            PlatformEnum.parse(platform);
          } catch (error) {
            return res.status(400).json({ message: `Invalid platform: ${platform}` });
          }
        }
      }

      const contests = await storage.getCurrentContests(platforms as any[]);
      res.json(contests);
    } catch (error) {
      console.error("Error fetching current contests:", error);
      res.status(500).json({ message: "Server error fetching current contests" });
    }
  });

  // Notification preferences routes
  app.get("/api/notification-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const preferences = await storage.getNotificationPreferences(userId);
      
      if (!preferences) {
        // Create default preferences if none exist
        const defaultPreferences = await storage.createNotificationPreferences({
          userId,
          emailNotifications: true,
          notificationTiming: "1hour",
          notifyCodeforces: true,
          notifyCodechef: true,
          notifyLeetcode: true,
        });
        return res.json(defaultPreferences);
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Server error fetching notification preferences" });
    }
  });

  app.put("/api/notification-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const preferencesData = req.body;
      
      // Validate preferences data
      insertNotificationPreferenceSchema
        .omit({ userId: true })
        .partial()
        .parse(preferencesData);
      
      let preferences = await storage.getNotificationPreferences(userId);
      
      if (!preferences) {
        // Create new preferences if none exist
        preferences = await storage.createNotificationPreferences({
          userId,
          ...preferencesData,
        });
      } else {
        // Update existing preferences
        preferences = await storage.updateNotificationPreferences(userId, preferencesData);
      }
      
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Server error updating notification preferences" });
    }
  });

  // Contest preferences routes
  app.get("/api/contest-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const preferences = await storage.getContestPreferences(userId);
      
      if (!preferences) {
        // Return empty preferences if none exist
        return res.json({
          id: null,
          userId: userId,
          codeforcesMinRating: 0,
          codeforcesMaxRating: 4000,
          codeforcesTypes: [],
          codechefTypes: [],
          leetcodeTypes: [],
          minDurationMinutes: 0,
          maxDurationMinutes: 1440,
          favoriteContestIds: []
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching contest preferences:", error);
      res.status(500).json({ message: "Server error fetching contest preferences" });
    }
  });

  app.put("/api/contest-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const preferencesData = req.body;
      
      // Validate preferences data
      insertContestPreferenceSchema
        .omit({ userId: true })
        .partial()
        .parse(preferencesData);
      
      let preferences = await storage.getContestPreferences(userId);
      
      if (!preferences) {
        // Create new preferences if none exist
        preferences = await storage.createContestPreferences({
          userId,
          ...preferencesData,
        });
      } else {
        // Update existing preferences
        preferences = await storage.updateContestPreferences(userId, preferencesData);
      }
      
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating contest preferences:", error);
      res.status(500).json({ message: "Server error updating contest preferences" });
    }
  });

  // Favorite contests routes
  app.post("/api/favorite-contest/:contestId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const contestId = parseInt(req.params.contestId);
      
      if (isNaN(contestId)) {
        return res.status(400).json({ message: "Invalid contest ID" });
      }
      
      // Check if contest exists
      const contest = await storage.getContestById(contestId);
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      // Toggle favorite status
      const updatedPrefs = await storage.toggleFavoriteContest(userId, contestId);
      res.json(updatedPrefs);
    } catch (error) {
      console.error("Error toggling favorite contest:", error);
      res.status(500).json({ message: "Server error toggling favorite contest" });
    }
  });
  
  app.get("/api/favorite-contests", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const favorites = await storage.getFavoriteContests(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorite contests:", error);
      res.status(500).json({ message: "Server error fetching favorite contests" });
    }
  });
  
  app.get("/api/personalized-contests", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const platformParam = req.query.platform as string | undefined;
      let platforms: Platform[] | undefined;
      
      if (platformParam) {
        try {
          const platform = PlatformEnum.parse(platformParam);
          platforms = [platform];
        } catch (error) {
          return res.status(400).json({ message: `Invalid platform: ${platformParam}` });
        }
      }
      
      const contests = await storage.getContestsByPreferences(userId, platforms);
      res.json(contests);
    } catch (error) {
      console.error("Error fetching personalized contests:", error);
      res.status(500).json({ message: "Server error fetching personalized contests" });
    }
  });

  // Contest reminder routes
  app.post("/api/contest-reminders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { contestId } = insertContestReminderSchema.pick({ contestId: true }).parse(req.body);
      
      // Check if contest exists
      const contest = await storage.getContestById(contestId);
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      // Check if reminder already exists
      const existingReminder = await storage.getContestReminderByUserAndContest(userId, contestId);
      if (existingReminder) {
        return res.status(409).json({ message: "Reminder already exists", reminder: existingReminder });
      }
      
      // Create reminder
      const reminder = await storage.createContestReminder({
        userId,
        contestId,
        reminded: false,
      });
      
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating contest reminder:", error);
      res.status(500).json({ message: "Server error creating contest reminder" });
    }
  });

  app.get("/api/contest-reminders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const reminders = await storage.getContestReminders(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching contest reminders:", error);
      res.status(500).json({ message: "Server error fetching contest reminders" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to fetch and store contests
async function fetchAndStoreContests() {
  try {
    console.log("Fetching contests from platforms...");
    const contests = await fetchAllContests();
    
    // Get all existing contests to check for duplicates
    const existingContests = await storage.getAllContests();
    const existingContestKeys = new Map();
    
    // Create a map of existing contests using a unique key (platform + name + startTime)
    for (const contest of existingContests) {
      const key = `${contest.platform}-${contest.name}-${new Date(contest.startTime).toISOString()}`;
      existingContestKeys.set(key, contest);
    }
    
    let newContestsCount = 0;
    
    // Store all fetched contests, checking for duplicates
    for (const contest of contests) {
      const key = `${contest.platform}-${contest.name}-${new Date(contest.startTime).toISOString()}`;
      
      if (!existingContestKeys.has(key)) {
        // Only create if it doesn't already exist
        await storage.createContest(contest);
        newContestsCount++;
      }
    }
    
    console.log(`Successfully fetched and stored ${newContestsCount} new contests (${contests.length} total)`);
  } catch (error) {
    console.error("Error fetching and storing contests:", error);
  }
}
