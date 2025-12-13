// backend/utils/helpers.js
import { Notification, User } from "../models/index.js";
import { MAX_RECIPIENTS_PER_NOTIFICATION } from "./constants.js";
import CustomError from "../errorHandler/CustomError.js";
import emailService from "../services/emailService.js";
import emailTemplates from "../templates/emailTemplates.js";

// Capitalize first letter
export const capitalize = (str) => {
  if (!str || typeof str !== "string") return str || "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ==================== FIXED DATE UTILITY FUNCTIONS ====================

/**
 * Get date without time component to avoid timezone issues
 * Uses UTC methods to ensure consistent date-only comparison
 * @param {Date|string} date - Date to normalize
 * @returns {Date} Date with time set to 00:00:00.000 in UTC
 */
export const getDateOnly = (date) => {
  if (!date) return null;

  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  // Use UTC methods to get consistent date-only representation
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
};

/**
 * Get current date without time component in UTC
 * @returns {Date} Today's date at 00:00:00.000 UTC
 */
export const getTodayDateOnly = () => {
  const today = new Date();
  return new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
};

/**
 * Compare two dates ignoring time components using UTC for timezone safety
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export const compareDatesOnly = (date1, date2) => {
  const d1 = getDateOnly(date1);
  const d2 = getDateOnly(date2);
  if (!d1 || !d2) return null;

  const time1 = d1.getTime();
  const time2 = d2.getTime();

  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
};

/**
 * Check if a date is in the future (date-only comparison using UTC)
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isDateInFuture = (date) => {
  if (!date) return false;
  return compareDatesOnly(date, new Date()) > 0;
};

/**
 * Check if a date is in the past (date-only comparison using UTC)
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isDateInPast = (date) => {
  if (!date) return false;
  return compareDatesOnly(date, new Date()) < 0;
};

/**
 * Check if a date is today (date-only comparison using UTC)
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isDateToday = (date) => {
  if (!date) return false;
  return compareDatesOnly(date, new Date()) === 0;
};

/**
 * Validate that a date is not in the future (for birth dates, join dates, etc.)
 * @param {Date} date - Date to validate
 * @returns {boolean} True if date is not in the future
 */
export const isDateNotInFuture = (date) => {
  if (!date) return true;
  return compareDatesOnly(date, new Date()) <= 0;
};

/**
 * Validate that start date is before or equal to due date
 * @param {Date} startDate - Start date
 * @param {Date} dueDate - Due date
 * @returns {boolean} True if startDate <= dueDate
 */
export const isStartDateBeforeDueDate = (startDate, dueDate) => {
  if (!startDate || !dueDate) return false;
  return compareDatesOnly(startDate, dueDate) <= 0;
};

/**
 * Validate that start date is today or in the future (for task scheduling)
 * @param {Date} startDate - Start date to validate
 * @returns {boolean} True if startDate is today or in the future
 */
export const isStartDateTodayOrFuture = (startDate) => {
  if (!startDate) return false;
  return compareDatesOnly(startDate, new Date()) >= 0;
};

/**
 * Generate an array of date strings for a given date range
 * Used for dashboard charts and analytics
 * @param {Date} startDate - Start date of the range
 * @param {Date} endDate - End date of the range
 * @returns {string[]} Array of date strings in YYYY-MM-DD format
 */
export const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split("T")[0]); // YYYY-MM-DD format
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

/**
 * Get date ranges for dashboard analytics (current and previous periods)
 * Returns 30-day periods for comparison
 * @returns {Object} Object containing current and previous date ranges
 */
export const getDateRanges = () => {
  const today = new Date();
  const currentEndDate = new Date(today);
  const currentStartDate = new Date(today);
  currentStartDate.setDate(today.getDate() - 30); // Last 30 days

  const previousEndDate = new Date(currentStartDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1); // Day before current period
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousEndDate.getDate() - 30); // Previous 30 days

  return {
    currentStartDate,
    currentEndDate,
    previousStartDate,
    previousEndDate,
  };
};

/**
 * Generate month range for six-month analytics
 * @param {number} months - Number of months to generate (default: 6)
 * @returns {string[]} Array of month strings in YYYY-MM format
 */
export const generateMonthRange = (months = 6) => {
  const monthRange = [];
  const currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    monthRange.push(date.toISOString().substring(0, 7)); // YYYY-MM format
  }

  return monthRange;
};

/**
 * Create a notification with proper recipient filtering and limits
 * Enhanced with email notification integration
 * @param {mongoose.ClientSession} session - Database session
 * @param {Object} options - Notification options
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {mongoose.Types.ObjectId} options.entity - Related entity ID
 * @param {string} options.entityModel - Related entity model name
 * @param {mongoose.Types.ObjectId[]} options.recipients - Array of recipient user IDs
 * @param {mongoose.Types.ObjectId} options.organization - Organization ID
 * @param {mongoose.Types.ObjectId} options.department - Department ID
 * @param {mongoose.Types.ObjectId} options.createdBy - Creator user ID
 * @param {Object} options.emailData - Additional data for email notifications (optional)
 * @param {boolean} options.sendEmail - Whether to send email notifications (default: true)
 * @returns {Promise<Notification>} Created notification
 */
export const createNotification = async (
  session,
  {
    type,
    title,
    message,
    entity,
    entityModel,
    recipients,
    organization,
    department,
    createdBy,
    emailData = {},
    sendEmail = true,
  }
) => {
  try {
    // Filter recipients: remove soft-deleted users, users not in same org, and creator
    const validRecipients = await User.find({
      _id: { $in: recipients },
      organization: organization,
      isDeleted: false,
      _id: { $ne: createdBy },
    })
      .populate("organization", "name")
      .populate("department", "name")
      .session(session);

    const recipientIds = validRecipients.map((user) => user._id);

    // Enforce recipient limit
    const limitedRecipients = recipientIds.slice(0, recipients.length);

    if (limitedRecipients.length === 0) {
      return null; // No valid recipients
    }

    if (limitedRecipients.length > MAX_RECIPIENTS_PER_NOTIFICATION)
      throw CustomError.validation(
        `Too many notification recipients, maximum is ${MAX_RECIPIENTS_PER_NOTIFICATION}`,
        {
          recipientCount: limitedRecipients.length,
          maxAllowed: MAX_RECIPIENTS_PER_NOTIFICATION,
        }
      );

    const notification = new Notification({
      type,
      title,
      message,
      entity,
      entityModel,
      recipients: limitedRecipients,
      organization,
      department,
      createdBy,
      sentAt: new Date(),
      emailDelivery: {
        sent: false,
        attempts: 0,
      },
    });

    await notification.save({ session });

    // Send email notifications if enabled
    if (sendEmail) {
      // Process email notifications asynchronously to avoid blocking
      setImmediate(async () => {
        try {
          await sendNotificationEmails(
            notification,
            validRecipients,
            emailData
          );
        } catch (emailError) {
          console.error("Error sending notification emails:", emailError);
          // Update notification with email error
          await Notification.findByIdAndUpdate(notification._id, {
            "emailDelivery.error": emailError.message,
            "emailDelivery.lastAttemptAt": new Date(),
          });
        }
      });
    }

    return notification;
  } catch (error) {
    // console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Send email notifications to users based on notification type and user preferences
 * @param {Notification} notification - The notification document
 * @param {User[]} recipients - Array of recipient user documents
 * @param {Object} emailData - Additional email data
 */
export const sendNotificationEmails = async (
  notification,
  recipients,
  emailData = {}
) => {
  try {
    const emailPromises = [];
    let emailsSent = 0;

    for (const recipient of recipients) {
      // Check if user has email notifications enabled for this type
      if (!shouldSendEmailForNotificationType(recipient, notification.type)) {
        continue;
      }

      const emailPromise = sendEmailForNotificationType(
        notification,
        recipient,
        emailData
      )
        .then(() => {
          emailsSent++;
        })
        .catch((error) => {
          console.error(`Failed to send email to ${recipient.email}:`, error);
        });

      emailPromises.push(emailPromise);
    }

    // Wait for all emails to be queued
    await Promise.allSettled(emailPromises);

    // Update notification with email delivery status
    await Notification.findByIdAndUpdate(notification._id, {
      "emailDelivery.sent": emailsSent > 0,
      "emailDelivery.sentAt": emailsSent > 0 ? new Date() : undefined,
      "emailDelivery.attempts": 1,
      "emailDelivery.lastAttemptAt": new Date(),
    });
  } catch (error) {
    console.error("Error in sendNotificationEmails:", error);
    throw error;
  }
};

/**
 * Check if user should receive email for notification type based on preferences
 * @param {User} user - User document with email preferences
 * @param {string} notificationType - Type of notification
 * @returns {boolean} Whether to send email
 */
export const shouldSendEmailForNotificationType = (user, notificationType) => {
  if (!user.emailPreferences || !user.emailPreferences.enabled) {
    return false;
  }

  const preferences = user.emailPreferences;

  switch (notificationType) {
    case "Created":
    case "Updated":
    case "Deleted":
    case "Restored":
      return preferences.taskNotifications;
    case "Mention":
      return preferences.mentions;
    case "Welcome":
      return preferences.welcomeEmails;
    case "Announcement":
      return preferences.announcements;
    default:
      return preferences.taskNotifications; // Default to task notifications
  }
};

/**
 * Send email for specific notification type
 * @param {Notification} notification - Notification document
 * @param {User} recipient - Recipient user document
 * @param {Object} emailData - Additional email data
 */
export const sendEmailForNotificationType = async (
  notification,
  recipient,
  emailData
) => {
  const baseData = {
    email: recipient.email,
    firstName: recipient.firstName,
    appName: process.env.APP_NAME,
    clientUrl: process.env.CLIENT_URL,
    organizationName: recipient.organization?.name || "Your Organization",
    departmentName: recipient.department?.name,
  };

  switch (notification.type) {
    case "Welcome":
      return await emailService.queueEmail({
        to: recipient.email,
        subject: emailTemplates.welcome.subject(baseData.appName),
        html: emailTemplates.welcome.html({
          ...baseData,
          role: recipient.role,
        }),
        text: emailTemplates.welcome.text({
          ...baseData,
          role: recipient.role,
        }),
        context: {
          type: "welcome",
          userId: recipient._id,
          notificationId: notification._id,
        },
      });

    case "Created":
    case "Updated":
    case "Deleted":
    case "Restored":
      return await emailService.queueEmail({
        to: recipient.email,
        subject: emailTemplates.taskNotification.subject({
          title: notification.title,
          appName: baseData.appName,
        }),
        html: emailTemplates.taskNotification.html({
          ...baseData,
          title: notification.title,
          message: notification.message,
          taskTitle: emailData.taskTitle || "Task",
          taskType: emailData.taskType || notification.entityModel,
          priority: emailData.priority,
          status: emailData.status,
          dueDate: emailData.dueDate,
          assignedBy: emailData.assignedBy,
        }),
        text: emailTemplates.taskNotification.text({
          ...baseData,
          title: notification.title,
          message: notification.message,
          taskTitle: emailData.taskTitle || "Task",
          taskType: emailData.taskType || notification.entityModel,
          priority: emailData.priority,
          status: emailData.status,
          dueDate: emailData.dueDate,
          assignedBy: emailData.assignedBy,
        }),
        context: {
          type: "task_notification",
          userId: recipient._id,
          taskId: notification.entity,
          notificationId: notification._id,
        },
      });

    case "Mention":
      return await emailService.queueEmail({
        to: recipient.email,
        subject: emailTemplates.mention.subject({
          entityType: notification.entityModel,
          appName: baseData.appName,
        }),
        html: emailTemplates.mention.html({
          ...baseData,
          entityType: notification.entityModel,
          entityTitle: emailData.entityTitle || "Item",
          entityId: notification.entity,
          mentionedBy: emailData.mentionedBy || "Someone",
          mentionedAt: notification.sentAt,
          content: emailData.content || notification.message,
        }),
        text: emailTemplates.mention.text({
          ...baseData,
          entityType: notification.entityModel,
          entityTitle: emailData.entityTitle || "Item",
          entityId: notification.entity,
          mentionedBy: emailData.mentionedBy || "Someone",
          mentionedAt: notification.sentAt,
          content: emailData.content || notification.message,
        }),
        context: {
          type: "mention",
          userId: recipient._id,
          entityId: notification.entity,
          notificationId: notification._id,
        },
      });

    case "Announcement":
      return await emailService.queueEmail({
        to: recipient.email,
        subject: emailTemplates.announcement.subject({
          title: notification.title,
          appName: baseData.appName,
        }),
        html: emailTemplates.announcement.html({
          ...baseData,
          title: notification.title,
          message: notification.message,
          senderName: emailData.senderName || "Administrator",
          senderPosition: emailData.senderPosition,
          sentAt: notification.sentAt,
        }),
        text: emailTemplates.announcement.text({
          ...baseData,
          title: notification.title,
          message: notification.message,
          senderName: emailData.senderName || "Administrator",
          senderPosition: emailData.senderPosition,
          sentAt: notification.sentAt,
        }),
        context: {
          type: "announcement",
          userId: recipient._id,
          organizationId: notification.organization,
          notificationId: notification._id,
        },
      });

    default:
      // For other notification types, send as general task notification
      return await emailService.queueEmail({
        to: recipient.email,
        subject: `${notification.title} - ${baseData.appName}`,
        html: emailTemplates.taskNotification.html({
          ...baseData,
          title: notification.title,
          message: notification.message,
          taskTitle: emailData.taskTitle || "Task",
          taskType: emailData.taskType || notification.entityModel,
        }),
        text: emailTemplates.taskNotification.text({
          ...baseData,
          title: notification.title,
          message: notification.message,
          taskTitle: emailData.taskTitle || "Task",
          taskType: emailData.taskType || notification.entityModel,
        }),
        context: {
          type: "general_notification",
          userId: recipient._id,
          notificationId: notification._id,
        },
      });
  }
};

/**
 * Send bulk email notifications for organizational announcements
 * @param {Object} announcementData - Announcement data
 * @param {mongoose.Types.ObjectId[]} recipientIds - Array of recipient user IDs
 * @param {mongoose.Types.ObjectId} organizationId - Organization ID
 * @param {mongoose.ClientSession} session - Database session
 * @returns {Promise<Notification>} Created notification
 */
export const sendBulkAnnouncementEmails = async (
  announcementData,
  recipientIds,
  organizationId,
  session
) => {
  const { title, message, senderName, senderPosition, createdBy, department } =
    announcementData;

  // Create notification for announcement
  const notification = await createNotification(session, {
    type: "Announcement",
    title,
    message,
    recipients: recipientIds,
    organization: organizationId,
    department,
    createdBy,
    emailData: {
      senderName,
      senderPosition,
    },
    sendEmail: true,
  });

  return notification;
};

/**
 * Send task reminder emails for upcoming deadlines
 * @param {Object} taskData - Task data for reminder
 * @param {mongoose.Types.ObjectId[]} recipientIds - Array of recipient user IDs
 * @param {mongoose.ClientSession} session - Database session (optional)
 */
export const sendTaskReminderEmails = async (
  taskData,
  recipientIds,
  session = null
) => {
  try {
    // Get recipients with email preferences
    const recipients = await User.find({
      _id: { $in: recipientIds },
      isDeleted: false,
      "emailPreferences.enabled": true,
      "emailPreferences.taskReminders": true,
    })
      .populate("organization", "name")
      .populate("department", "name")
      .session(session);

    const emailPromises = recipients.map(async (recipient) => {
      const emailData = {
        email: recipient.email,
        firstName: recipient.firstName,
        appName: process.env.APP_NAME,
        clientUrl: process.env.CLIENT_URL,
        taskTitle: taskData.title,
        taskType: taskData.taskType,
        taskId: taskData._id,
        priority: taskData.priority,
        status: taskData.status,
        dueDate: taskData.dueDate,
        description: taskData.description,
        timeRemaining: taskData.timeRemaining,
      };

      return await emailService.queueEmail({
        to: recipient.email,
        subject: emailTemplates.taskReminder.subject(emailData),
        html: emailTemplates.taskReminder.html(emailData),
        text: emailTemplates.taskReminder.text(emailData),
        context: {
          type: "task_reminder",
          userId: recipient._id,
          taskId: taskData._id,
        },
      });
    });

    await Promise.allSettled(emailPromises);
    console.log(
      `Task reminder emails queued for ${recipients.length} recipients`
    );
  } catch (error) {
    console.error("Error sending task reminder emails:", error);
    throw error;
  }
};
