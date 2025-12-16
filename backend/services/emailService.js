// backend/services/emailService.js
import nodemailer from "nodemailer";
import CustomError from "../errorHandler/CustomError.js";

/**
 * Email Service - Handles email sending functionality using nodemailer
 * Provides email templates and queue system for reliable delivery
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Initialize email transporter with SMTP configuration
   */
  async initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates in development
        },
      });

      // Verify connection configuration
      await this.transporter.verify();
      console.log("Email service initialized successfully");
    } catch (error) {
      console.error("Email service initialization failed:", error);
      throw CustomError.internal("Failed to initialize email service", {
        errorMessage: error.message,
        errorName: error.name,
      });
    }
  }

  /**
   * Add email to queue for processing
   * @param {Object} emailData - Email data object
   * @param {string} emailData.to - Recipient email address
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.html - HTML content
   * @param {string} emailData.text - Plain text content
   * @param {Object} emailData.context - Additional context for tracking
   */
  async queueEmail(emailData) {
    const emailItem = {
      id: Date.now() + Math.random(),
      ...emailData,
      attempts: 0,
      createdAt: new Date(),
    };

    this.emailQueue.push(emailItem);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return emailItem.id;
  }

  /**
   * Process email queue with retry mechanism
   */
  async processQueue() {
    if (this.isProcessing || this.emailQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.emailQueue.length > 0) {
      const emailItem = this.emailQueue.shift();

      try {
        await this.sendEmail(emailItem);
        console.log(`Email sent successfully to ${emailItem.to}`);
      } catch (error) {
        emailItem.attempts++;

        if (emailItem.attempts < this.retryAttempts) {
          console.log(
            `Email failed, retrying (${emailItem.attempts}/${this.retryAttempts}):`,
            error.message
          );

          // Add back to queue with delay
          setTimeout(() => {
            this.emailQueue.push(emailItem);
          }, this.retryDelay);
        } else {
          console.error(
            `Email failed permanently after ${this.retryAttempts} attempts:`,
            error
          );
          // Could implement dead letter queue or notification here
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Send individual email
   * @param {Object} emailData - Email data object
   */
  async sendEmail(emailData) {
    if (!this.transporter) {
      throw CustomError.internal("Email service not initialized", {
        reason: "Transporter not configured",
      });
    }

    const mailOptions = {
      from:
        process.env.EMAIL_FROM || `${process.env.APP_NAME} <${process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    };

    const result = await this.transporter.sendMail(mailOptions);
    return result;
  }

  /**
   * Send welcome email to new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.firstName - User first name
   * @param {string} userData.organizationName - Organization name
   */
  async sendWelcomeEmail(userData) {
    const { email, firstName, organizationName } = userData;

    const subject = `Welcome to ${process.env.APP_NAME}!`;
    const html = this.getWelcomeEmailTemplate(firstName, organizationName);
    const text = this.getWelcomeEmailText(firstName, organizationName);

    return await this.queueEmail({
      to: email,
      subject,
      html,
      text,
      context: { type: "welcome", userId: userData.id },
    });
  }

  /**
   * Send task notification email
   * @param {Object} notificationData - Notification data
   */
  async sendTaskNotificationEmail(notificationData) {
    const {
      email,
      firstName,
      title,
      message,
      taskTitle,
      taskType,
      organizationName,
    } = notificationData;

    const subject = `${title} - ${process.env.APP_NAME}`;
    const html = this.getTaskNotificationTemplate(
      firstName,
      title,
      message,
      taskTitle,
      taskType,
      organizationName
    );
    const text = this.getTaskNotificationText(
      firstName,
      title,
      message,
      taskTitle,
      taskType
    );

    return await this.queueEmail({
      to: email,
      subject,
      html,
      text,
      context: {
        type: "task_notification",
        userId: notificationData.userId,
        taskId: notificationData.taskId,
      },
    });
  }

  /**
   * Send announcement email
   * @param {Object} announcementData - Announcement data
   */
  async sendAnnouncementEmail(announcementData) {
    const { email, firstName, title, message, organizationName, senderName } =
      announcementData;

    const subject = `Announcement: ${title} - ${process.env.APP_NAME}`;
    const html = this.getAnnouncementTemplate(
      firstName,
      title,
      message,
      organizationName,
      senderName
    );
    const text = this.getAnnouncementText(
      firstName,
      title,
      message,
      senderName
    );

    return await this.queueEmail({
      to: email,
      subject,
      html,
      text,
      context: {
        type: "announcement",
        userId: announcementData.userId,
        organizationId: announcementData.organizationId,
      },
    });
  }

  /**
   * Send password reset email
   * @param {Object} resetData - Password reset data
   */
  async sendPasswordResetEmail(resetData) {
    const { email, firstName, resetToken, organizationName } = resetData;

    const subject = `Password Reset - ${process.env.APP_NAME}`;
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const html = this.getPasswordResetTemplate(
      firstName,
      resetUrl,
      organizationName
    );
    const text = this.getPasswordResetText(firstName, resetUrl);

    return await this.queueEmail({
      to: email,
      subject,
      html,
      text,
      context: {
        type: "password_reset",
        userId: resetData.userId,
      },
    });
  }

  /**
   * Get welcome email HTML template
   */
  getWelcomeEmailTemplate(firstName, organizationName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${process.env.APP_NAME}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${process.env.APP_NAME}!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Welcome to <strong>${organizationName}</strong> on ${
      process.env.APP_NAME
    }. We're excited to have you on board!</p>
            <p>You can now:</p>
            <ul>
              <li>Manage and track your tasks</li>
              <li>Collaborate with your team members</li>
              <li>Stay updated with real-time notifications</li>
              <li>Monitor project progress and deadlines</li>
            </ul>
            <p>Get started by logging into your account:</p>
            <p style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/login" class="button">Login to Your Account</a>
            </p>
            <p>If you have any questions, feel free to reach out to your administrator.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${
      process.env.APP_NAME
    }. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get welcome email plain text
   */
  getWelcomeEmailText(firstName, organizationName) {
    return `
Welcome to ${process.env.APP_NAME}!

Hello ${firstName}!

Welcome to ${organizationName} on ${
      process.env.APP_NAME
    }. We're excited to have you on board!

You can now:
- Manage and track your tasks
- Collaborate with your team members
- Stay updated with real-time notifications
- Monitor project progress and deadlines

Get started by logging into your account: ${process.env.CLIENT_URL}/login

If you have any questions, feel free to reach out to your administrator.

© ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.
    `;
  }

  /**
   * Get task notification email HTML template
   */
  getTaskNotificationTemplate(
    firstName,
    title,
    message,
    taskTitle,
    taskType,
    organizationName
  ) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - ${process.env.APP_NAME}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .task-info { background-color: white; padding: 15px; border-left: 4px solid #1976d2; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${process.env.APP_NAME} Notification</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p><strong>${title}</strong></p>
            <p>${message}</p>
            <div class="task-info">
              <h3>Task Details:</h3>
              <p><strong>Task:</strong> ${taskTitle}</p>
              <p><strong>Type:</strong> ${taskType}</p>
              <p><strong>Organization:</strong> ${organizationName}</p>
            </div>
            <p style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/tasks" class="button">View Tasks</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${
      process.env.APP_NAME
    }. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get task notification plain text
   */
  getTaskNotificationText(firstName, title, message, taskTitle, taskType) {
    return `
${process.env.APP_NAME} Notification

Hello ${firstName}!

${title}

${message}

Task Details:
- Task: ${taskTitle}
- Type: ${taskType}

View your tasks: ${process.env.CLIENT_URL}/tasks

© ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.
    `;
  }

  /**
   * Get announcement email HTML template
   */
  getAnnouncementTemplate(
    firstName,
    title,
    message,
    organizationName,
    senderName
  ) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Announcement: ${title} - ${process.env.APP_NAME}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .announcement { background-color: white; padding: 20px; border-left: 4px solid #ff9800; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #ff9800; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Announcement</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>You have received a new announcement from <strong>${organizationName}</strong>:</p>
            <div class="announcement">
              <h3>${title}</h3>
              <p>${message}</p>
              <p><em>- ${senderName}</em></p>
            </div>
            <p style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/dashboard" class="button">View Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${
      process.env.APP_NAME
    }. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get announcement plain text
   */
  getAnnouncementText(firstName, title, message, senderName) {
    return `
📢 Announcement - ${process.env.APP_NAME}

Hello ${firstName}!

You have received a new announcement:

${title}

${message}

- ${senderName}

View your dashboard: ${process.env.CLIENT_URL}/dashboard

© ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.
    `;
  }

  /**
   * Get password reset email HTML template
   */
  getPasswordResetTemplate(firstName, resetUrl, organizationName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ${process.env.APP_NAME}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background-color: #f44336; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>You have requested to reset your password for your ${
              process.env.APP_NAME
            } account at <strong>${organizationName}</strong>.</p>
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong> If you did not request this password reset, please ignore this email and contact your administrator immediately.</p>
            </div>
            <p>To reset your password, click the button below:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${
      process.env.APP_NAME
    }. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get password reset plain text
   */
  getPasswordResetText(firstName, resetUrl) {
    return `
🔐 Password Reset - ${process.env.APP_NAME}

Hello ${firstName}!

You have requested to reset your password for your ${
      process.env.APP_NAME
    } account.

⚠️ Security Notice: If you did not request this password reset, please ignore this email and contact your administrator immediately.

To reset your password, visit this link: ${resetUrl}

This link will expire in 1 hour for security reasons.

© ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.
    `;
  }

  /**
   * Check if email service is initialized
   */
  isInitialized() {
    return !!this.transporter;
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus() {
    return {
      queueLength: this.emailQueue.length,
      isProcessing: this.isProcessing,
      isInitialized: this.isInitialized(),
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
