import nodemailer from 'nodemailer';
import { NotificationPreference, Contest, User } from '@shared/schema';
import { storage } from './storage';

// Create a test SMTP service if no email credentials are provided
let transporter: nodemailer.Transporter;

// Initialize nodemailer transporter
export function initializeEmailService() {
  // Use environment variables for email configuration
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');

  if (emailUser && emailPass) {
    // Real email service
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else {
    // For development/testing - create a test account
    console.warn('No email credentials provided. Using ethereal email for testing.');
    nodemailer.createTestAccount().then(account => {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
      console.log('Test email account created:', account.user);
    });
  }
}

// Send notification email for an upcoming contest
export async function sendContestNotificationEmail(
  user: User,
  contest: Contest,
  preferences: NotificationPreference
): Promise<boolean> {
  if (!transporter) {
    console.error('Email transporter not initialized');
    return false;
  }

  try {
    // Format the start time
    const startTime = new Date(contest.startTime);
    const formattedStartTime = startTime.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    if (!user.email) {
      console.error(`User ${user.id} has no email address defined.`);
      return false;
    }
    // Create the email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'CodeContestTracker <noreply@codecontesttracker.com>',
      to: user.email,
      subject: `Reminder: ${contest.name} starts soon`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3f51b5;">Contest Reminder</h2>
          <p>Hello ${user.username},</p>
          <p>This is a reminder that the following programming contest is starting soon:</p>
          
          <div style="border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #424242;">${contest.name}</h3>
            <p><strong>Platform:</strong> ${contest.platform}</p>
            <p><strong>Start Time:</strong> ${formattedStartTime}</p>
            <p><strong>Duration:</strong> ${contest.duration}</p>
            <p><a href="${contest.url}" style="color: #3f51b5; text-decoration: none; font-weight: bold;">View Contest</a></p>
          </div>
          
          <p>Good luck and happy coding!</p>
          <p>- CodeContestTracker Team</p>
          
          <div style="margin-top: 40px; font-size: 12px; color: #757575;">
            <p>If you no longer wish to receive these notifications, you can change your notification settings in your account preferences.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    if (process.env.NODE_ENV !== 'production') {
      // Log preview URL for development environment
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

// Process notifications for upcoming contests
export async function processContestNotifications() {
  const now = new Date();
  
  // Get all upcoming contests
  const upcomingContests = await storage.getUpcomingContests();
  
  // For each contest, find users who should be notified
  for (const contest of upcomingContests) {
    const contestStartTime = new Date(contest.startTime);
    const timeUntilStart = contestStartTime.getTime() - now.getTime();
    
    // Get all users with notification preferences
    const users = Array.from((await storage.getAllUsers()).values());
    
    for (const user of users) {
      try {
        // Get user's notification preferences
        const preferences = await storage.getNotificationPreferences(user.id);
        if (!preferences || !preferences.emailNotifications) continue;
        
        // Check if user wants notifications for this platform
        const platformField = `notify${contest.platform.charAt(0).toUpperCase() + contest.platform.slice(1)}` as keyof NotificationPreference;
        if (!preferences[platformField]) continue;
        
        // Check if notification timing matches
        let shouldNotify = false;
        switch (preferences.notificationTiming) {
          case '1hour':
            shouldNotify = timeUntilStart <= 60 * 60 * 1000 && timeUntilStart > 50 * 60 * 1000;
            break;
          case '3hours':
            shouldNotify = timeUntilStart <= 3 * 60 * 60 * 1000 && timeUntilStart > 170 * 60 * 1000;
            break;
          case '1day':
            shouldNotify = timeUntilStart <= 24 * 60 * 60 * 1000 && timeUntilStart > 23 * 60 * 60 * 1000;
            break;
        }
        
        if (shouldNotify) {
          // Check if user already has a reminder for this contest
          const existingReminder = await storage.getContestReminderByUserAndContest(user.id, contest.id);
          
          if (!existingReminder) {
            // Create a new reminder
            await storage.createContestReminder({
              userId: user.id,
              contestId: contest.id,
              reminded: true
            });
            
            // Send notification email
            await sendContestNotificationEmail(user, contest, preferences);
          } else if (!existingReminder.reminded) {
            // Update existing reminder
            await storage.updateContestReminder(existingReminder.id, true);
            
            // Send notification email
            await sendContestNotificationEmail(user, contest, preferences);
          }
        }
      } catch (error) {
        console.error(`Error processing notifications for user ${user.id}:`, error);
      }
    }
  }
}
