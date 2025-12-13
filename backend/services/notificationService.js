// backend/services/notificationService.js
import { Notification, User, BaseTask } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import emailService from "./emailService.js";
import { MAX_RECIPIENTS_PER_NOTIFICATION } from "../utils/constants.js";

/**
 * Notification Service - Handles notification creation, recipient determination, and delivery
 * Provides intelligent notification routing based on action types and user preferences
 */

class NotificationService {
  /**
   * Determine recipients based on action type and resource
   * Excludes the actor from receiving notifications about their own actions
   * @param {string} action - Action type (TASK_CREATED, TASK_UPDATED, etc.)
   * @param {Object} resource - Resource document (task, comment, activity, etc.)
   * @param {Object} actor - User who performed the action
   * @param {mongoose.ClientSession} session - Database session for queries
   * @returns {Promise<string[]>} Array of recipient user IDs
   */
  async determineRecipients(action, resource, actor, session = null) {
    const recipients = new Set();
    const actorId = actor._id.toString();

    try {
      switch (action) {
        case "TASK_CREATED":
          // Notify assignees
          if (resource.assignees && Array.isArray(resource.assignees)) {
            resource.assignees.forEach((assignee) => {
              const assigneeId = assignee._id
                ? assignee._id.toString()
                : assignee.toString();
              if (assigneeId !== actorId) {
                recipients.add(assigneeId);
              }
            });
          }
          break;

        case "TASK_ASSIGNED":
          // Notify new assignee(s)
          if (resource.assignees && Array.isArray(resource.assignees)) {
            resource.assignees.forEach((assignee) => {
              const assigneeId = assignee._id
                ? assignee._id.toString()
                : assignee.toString();
              if (assigneeId !== actorId) {
                recipients.add(assigneeId);
              }
            });
          }
          break;

        case "TASK_UPDATED":
          // Notify watchers
          if (resource.watchers && Array.isArray(resource.watchers)) {
            resource.watchers.forEach((watcher) => {
              const watcherId = watcher._id
                ? watcher._id.toString()
                : watcher.toString();
              if (watcherId !== actorId) {
                recipients.add(watcherId);
              }
            });
          }
          break;

        case "TASK_COMPLETED":
          // Notify creator and watchers
          if (resource.createdBy) {
            const creatorId = resource.createdBy._id
              ? resource.createdBy._id.toString()
              : resource.createdBy.toString();
            if (creatorId !== actorId) {
              recipients.add(creatorId);
            }
          }
          if (resource.watchers && Array.isArray(resource.watchers)) {
            resource.watchers.forEach((watcher) => {
              const watcherId = watcher._id
                ? watcher._id.toString()
                : watcher.toString();
              if (watcherId !== actorId) {
                recipients.add(watcherId);
              }
            });
          }
          break;

        case "TASK_DELETED":
        case "TASK_RESTORED":
          // Notify assignees and watchers
          if (resource.assignees && Array.isArray(resource.assignees)) {
            resource.assignees.forEach((assignee) => {
              const assigneeId = assignee._id
                ? assignee._id.toString()
                : assignee.toString();
              if (assigneeId !== actorId) {
                recipients.add(assigneeId);
              }
            });
          }
          if (resource.watchers && Array.isArray(resource.watchers)) {
            resource.watchers.forEach((watcher) => {
              const watcherId = watcher._id
                ? watcher._id.toString()
                : watcher.toString();
              if (watcherId !== actorId) {
                recipients.add(watcherId);
              }
            });
          }
          break;

        case "COMMENT_ADDED":
        case "USER_MENTIONED":
          // Notify mentioned users
          if (resource.mentions && Array.isArray(resource.mentions)) {
            resource.mentions.forEach((mentioned) => {
              const mentionedId = mentioned._id
                ? mentioned._id.toString()
                : mentioned.toString();
              if (mentionedId !== actorId) {
                recipients.add(mentionedId);
              }
            });
          }
          break;

        case "COMMENT_UPDATED":
          // Notify mentioned users
          if (resource.mentions && Array.isArray(resource.mentions)) {
            resource.mentions.forEach((mentioned) => {
              const mentionedId = mentioned._id
                ? mentioned._id.toString()
                : mentioned.toString();
              if (mentionedId !== actorId) {
                recipients.add(mentionedId);
              }
            });
          }
          break;

        case "ACTIVITY_LOGGED":
        case "ACTIVITY_UPDATED":
        case "ACTIVITY_DELETED":
        case "ACTIVITY_RESTORED":
          // Notify task assignees - need to fetch the parent task
          if (resource.task) {
            const taskId = resource.task._id
              ? resource.task._id
              : resource.task;
            const task = await BaseTask.findById(taskId)
              .select("assignees watchers")
              .session(session);

            if (task) {
              if (task.assignees && Array.isArray(task.assignees)) {
                task.assignees.forEach((assignee) => {
                  const assigneeId = assignee._id
                    ? assignee._id.toString()
                    : assignee.toString();
                  if (assigneeId !== actorId) {
                    recipients.add(assigneeId);
                  }
                });
              }
            }
          }
          break;

        case "ANNOUNCEMENT":
          // Recipients should be explicitly provided for announcements
          // This is handled separately in the send method
          break;

        default:
          console.warn(
            `Unknown action type for recipient determination: ${action}`
          );
          break;
      }

      return Array.from(recipients);
    } catch (error) {
      console.error("Error determining recipients:", error);
      throw CustomError.internal(
        "Failed to determine notification recipients",
        {
          action,
          error: error.message,
        }
      );
    }
  }

  /**
   * Check if user should receive notification based on preferences
   * @param {string} userId - User ID to check
   * @param {string} notificationType - Type of notification
   * @param {string} channel - Notification channel ('email' or 'realtime')
   * @param {mongoose.ClientSession} session - Database session
   * @returns {Promise<boolean>} Whether to send notification
   */
  async shouldNotify(userId, notificationType, channel, session = null) {
    try {
      const user = await User.findById(userId)
        .select("emailPreferences")
        .session(session);

      if (!user) {
        return false;
      }

      // Real-time notifications are always sent (user can ignore in UI)
      if (channel === "realtime") {
        return true;
      }

      // Email notifications require user preferences check
      if (channel === "email") {
        if (!user.emailPreferences || !user.emailPreferences.enabled) {
          return false;
        }

        const preferences = user.emailPreferences;

        switch (notificationType) {
          case "TASK_CREATED":
          case "TASK_ASSIGNED":
          case "TASK_UPDATED":
          case "TASK_COMPLETED":
          case "TASK_DELETED":
          case "TASK_RESTORED":
          case "ACTIVITY_LOGGED":
          case "ACTIVITY_UPDATED":
          case "ACTIVITY_DELETED":
          case "ACTIVITY_RESTORED":
            return preferences.taskNotifications;

          case "COMMENT_ADDED":
          case "COMMENT_UPDATED":
          case "USER_MENTIONED":
            return preferences.mentions;

          case "ANNOUNCEMENT":
            return preferences.announcements;

          case "TASK_REMINDER":
            return preferences.taskReminders;

          default:
            // Default to task notifications for unknown types
            return preferences.taskNotifications;
        }
      }

      return true;
    } catch (error) {
      console.error("Error checking notification preferences:", error);
      // Default to true to avoid blocking notifications on error
      return true;
    }
  }

  /**
   * Send notification with intelligent recipient determination and preference checking
   * @param {string} action - Action type
   * @param {Object} resource - Resource document
   * @param {Object} actor - User who performed the action
   * @param {Object} options - Notification options
   * @param {mongoose.ClientSession} options.session - Database session
   * @param {boolean} options.email - Send email notifications (default: true)
   * @param {boolean} options.realtime - Send real-time notifications (default: true)
   * @param {string} options.title - Custom notification title
   * @param {string} options.message - Custom notification message
   * @param {Object} options.emailData - Additional email data
   * @param {string[]} options.explicitRecipients - Explicit recipient IDs (overrides determination)
   * @returns {Promise<Object>} Notification result with recipients
   */
  async send(action, resource, actor, options = {}) {
    const {
      session = null,
      email = true,
      realtime = true,
      title,
      message,
      emailData = {},
      explicitRecipients = null,
    } = options;

    try {
      // Determine recipients
      let recipientIds;
      if (explicitRecipients && Array.isArray(explicitRecipients)) {
        // Use explicit recipients (for announcements, etc.)
        recipientIds = explicitRecipients.filter(
          (id) => id.toString() !== actor._id.toString()
        );
      } else {
        // Determine recipients based on action and resource
        recipientIds = await this.determineRecipients(
          action,
          resource,
          actor,
          session
        );
      }

      if (recipientIds.length === 0) {
        return { notification: null, recipients: [] };
      }

      // Filter recipients based on preferences for each channel
      const emailRecipients = [];
      const realtimeRecipients = [];

      for (const recipientId of recipientIds) {
        if (
          email &&
          (await this.shouldNotify(recipientId, action, "email", session))
        ) {
          emailRecipients.push(recipientId);
        }
        if (
          realtime &&
          (await this.shouldNotify(recipientId, action, "realtime", session))
        ) {
          realtimeRecipients.push(recipientId);
        }
      }

      // Create notification only if there are recipients for at least one channel
      const allRecipients = [
        ...new Set([...emailRecipients, ...realtimeRecipients]),
      ];

      if (allRecipients.length === 0) {
        return { notification: null, recipients: [] };
      }

      // Enforce recipient limit
      if (allRecipients.length > MAX_RECIPIENTS_PER_NOTIFICATION) {
        throw CustomError.validation(
          `Too many notification recipients, maximum is ${MAX_RECIPIENTS_PER_NOTIFICATION}`,
          { count: allRecipients.length, max: MAX_RECIPIENTS_PER_NOTIFICATION }
        );
      }

      // Validate recipients exist and are in same organization
      const validRecipients = await User.find({
        _id: { $in: allRecipients },
        organization: resource.organization || actor.organization._id,
        isDeleted: false,
      })
        .populate("organization", "name")
        .populate("department", "name")
        .session(session);

      const validRecipientIds = validRecipients.map((user) =>
        user._id.toString()
      );

      if (validRecipientIds.length === 0) {
        return { notification: null, recipients: [] };
      }

      // Determine entity and entityModel
      const entity = resource._id;
      const entityModel = resource.taskType || resource.constructor.modelName;

      // Create notification
      const notification = new Notification({
        type: this.mapActionToNotificationType(action),
        title: title || this.generateTitle(action, resource),
        message: message || this.generateMessage(action, resource, actor),
        entity,
        entityModel,
        recipients: validRecipientIds,
        organization: resource.organization || actor.organization._id,
        department: resource.department || actor.department._id,
        createdBy: actor._id,
        sentAt: new Date(),
        emailDelivery: {
          sent: false,
          attempts: 0,
        },
      });

      await notification.save({ session });

      // Send email notifications asynchronously if enabled
      if (email && emailRecipients.length > 0) {
        setImmediate(async () => {
          try {
            await this.sendEmailNotifications(
              notification,
              validRecipients.filter((u) =>
                emailRecipients.includes(u._id.toString())
              ),
              emailData
            );
          } catch (emailError) {
            console.error("Error sending notification emails:", emailError);
            await Notification.findByIdAndUpdate(notification._id, {
              "emailDelivery.error": emailError.message,
              "emailDelivery.lastAttemptAt": new Date(),
            });
          }
        });
      }

      return {
        notification,
        recipients: validRecipientIds,
        emailRecipients: emailRecipients.filter((id) =>
          validRecipientIds.includes(id)
        ),
        realtimeRecipients: realtimeRecipients.filter((id) =>
          validRecipientIds.includes(id)
        ),
      };
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  /**
   * Map action type to notification type for database storage
   * @param {string} action - Action type
   * @returns {string} Notification type
   */
  mapActionToNotificationType(action) {
    const mapping = {
      TASK_CREATED: "Created",
      TASK_ASSIGNED: "Created",
      TASK_UPDATED: "Updated",
      TASK_COMPLETED: "Updated",
      TASK_DELETED: "Deleted",
      TASK_RESTORED: "Restored",
      COMMENT_ADDED: "Mention",
      COMMENT_UPDATED: "Updated",
      USER_MENTIONED: "Mention",
      ACTIVITY_LOGGED: "Created",
      ACTIVITY_UPDATED: "Updated",
      ACTIVITY_DELETED: "Deleted",
      ACTIVITY_RESTORED: "Restored",
      ANNOUNCEMENT: "Announcement",
      TASK_REMINDER: "Reminder",
    };

    return mapping[action] || "Updated";
  }

  /**
   * Generate notification title based on action
   * @param {string} action - Action type
   * @param {Object} resource - Resource document
   * @returns {string} Notification title
   */
  generateTitle(action, resource) {
    const titles = {
      TASK_CREATED: "Task Created",
      TASK_ASSIGNED: "Task Assigned",
      TASK_UPDATED: "Task Updated",
      TASK_COMPLETED: "Task Completed",
      TASK_DELETED: "Task Deleted",
      TASK_RESTORED: "Task Restored",
      COMMENT_ADDED: "You were mentioned",
      COMMENT_UPDATED: "Comment Updated",
      USER_MENTIONED: "You were mentioned",
      ACTIVITY_LOGGED: "Activity Logged",
      ACTIVITY_UPDATED: "Activity Updated",
      ACTIVITY_DELETED: "Activity Deleted",
      ACTIVITY_RESTORED: "Activity Restored",
      ANNOUNCEMENT: "Announcement",
      TASK_REMINDER: "Task Reminder",
    };

    return titles[action] || "Notification";
  }

  /**
   * Generate notification message based on action
   * @param {string} action - Action type
   * @param {Object} resource - Resource document
   * @param {Object} actor - User who performed the action
   * @returns {string} Notification message
   */
  generateMessage(action, resource, actor) {
    const actorName = actor.fullName || `${actor.firstName} ${actor.lastName}`;
    const resourceTitle = resource.title || resource.comment || "Item";

    const messages = {
      TASK_CREATED: `${actorName} created a new task: ${resourceTitle}`,
      TASK_ASSIGNED: `${actorName} assigned you to task: ${resourceTitle}`,
      TASK_UPDATED: `${actorName} updated task: ${resourceTitle}`,
      TASK_COMPLETED: `${actorName} completed task: ${resourceTitle}`,
      TASK_DELETED: `${actorName} deleted task: ${resourceTitle}`,
      TASK_RESTORED: `${actorName} restored task: ${resourceTitle}`,
      COMMENT_ADDED: `${actorName} mentioned you in a comment`,
      COMMENT_UPDATED: `${actorName} updated a comment where you were mentioned`,
      USER_MENTIONED: `${actorName} mentioned you`,
      ACTIVITY_LOGGED: `${actorName} logged an activity`,
      ACTIVITY_UPDATED: `${actorName} updated an activity`,
      ACTIVITY_DELETED: `${actorName} deleted an activity`,
      ACTIVITY_RESTORED: `${actorName} restored an activity`,
      ANNOUNCEMENT: resource.message || "New announcement",
      TASK_REMINDER: `Reminder: Task "${resourceTitle}" is due soon`,
    };

    return messages[action] || `${actorName} performed an action`;
  }

  /**
   * Send email notifications to users
   * @param {Notification} notification - Notification document
   * @param {User[]} recipients - Array of recipient user documents
   * @param {Object} emailData - Additional email data
   */
  async sendEmailNotifications(notification, recipients, emailData = {}) {
    try {
      const emailPromises = [];
      let emailsSent = 0;

      for (const recipient of recipients) {
        const emailPromise = this.sendEmailForNotificationType(
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

      await Promise.allSettled(emailPromises);

      // Update notification with email delivery status
      await Notification.findByIdAndUpdate(notification._id, {
        "emailDelivery.sent": emailsSent > 0,
        "emailDelivery.sentAt": emailsSent > 0 ? new Date() : undefined,
        "emailDelivery.attempts": 1,
        "emailDelivery.lastAttemptAt": new Date(),
      });
    } catch (error) {
      console.error("Error in sendEmailNotifications:", error);
      throw error;
    }
  }

  /**
   * Send email for specific notification type
   * @param {Notification} notification - Notification document
   * @param {User} recipient - Recipient user document
   * @param {Object} emailData - Additional email data
   */
  async sendEmailForNotificationType(notification, recipient, emailData) {
    const baseData = {
      email: recipient.email,
      firstName: recipient.firstName,
      organizationName: recipient.organization?.name || "Your Organization",
    };

    switch (notification.type) {
      case "Created":
      case "Updated":
      case "Deleted":
      case "Restored":
        return await emailService.sendTaskNotificationEmail({
          ...baseData,
          title: notification.title,
          message: notification.message,
          taskTitle: emailData.taskTitle || "Task",
          taskType: emailData.taskType || notification.entityModel,
          userId: recipient._id,
          taskId: notification.entity,
        });

      case "Mention":
        return await emailService.sendTaskNotificationEmail({
          ...baseData,
          title: notification.title,
          message: notification.message,
          taskTitle: emailData.taskTitle || "Item",
          taskType: emailData.taskType || notification.entityModel,
          userId: recipient._id,
          taskId: notification.entity,
        });

      case "Announcement":
        return await emailService.sendAnnouncementEmail({
          ...baseData,
          title: notification.title,
          message: notification.message,
          senderName: emailData.senderName || "Administrator",
          userId: recipient._id,
          organizationId: notification.organization,
        });

      default:
        return await emailService.sendTaskNotificationEmail({
          ...baseData,
          title: notification.title,
          message: notification.message,
          taskTitle: emailData.taskTitle || "Task",
          taskType: emailData.taskType || notification.entityModel,
          userId: recipient._id,
          taskId: notification.entity,
        });
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
