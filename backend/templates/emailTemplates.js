// backend/templates/emailTemplates.js
/**
 * Email Templates - Centralized email template management
 * Provides reusable email templates for different notification types
 */

/**
 * Base email styles for consistent branding
 */
export const baseStyles = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
  }
  .header {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    padding: 30px 20px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 300;
  }
  .content {
    padding: 30px 20px;
  }
  .content h2 {
    color: #1976d2;
    margin-top: 0;
  }
  .footer {
    background-color: #f8f9fa;
    padding: 20px;
    text-align: center;
    color: #666;
    font-size: 12px;
    border-top: 1px solid #e9ecef;
  }
  .button {
    display: inline-block;
    padding: 12px 30px;
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    text-decoration: none;
    border-radius: 25px;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(25,118,210,0.3);
  }
  .info-box {
    background-color: #f8f9fa;
    padding: 20px;
    border-left: 4px solid #1976d2;
    margin: 20px 0;
    border-radius: 0 4px 4px 0;
  }
  .warning-box {
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    padding: 15px;
    border-radius: 4px;
    margin: 15px 0;
  }
  .announcement-box {
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
  }
  .task-priority-high {
    border-left-color: #f44336;
  }
  .task-priority-urgent {
    border-left-color: #d32f2f;
    background-color: #ffebee;
  }
  .task-priority-medium {
    border-left-color: #ff9800;
  }
  .task-priority-low {
    border-left-color: #4caf50;
  }
  ul {
    padding-left: 20px;
  }
  li {
    margin-bottom: 8px;
  }
  .text-center {
    text-align: center;
  }
  .mt-20 {
    margin-top: 20px;
  }
  .mb-20 {
    margin-bottom: 20px;
  }
`;

/**
 * Welcome email template
 */
export const welcomeTemplate = {
  subject: (appName) => `Welcome to ${appName}!`,

  html: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${data.appName}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to ${data.appName}!</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.firstName}!</h2>
          <p>Welcome to <strong>${data.organizationName}</strong> on ${data.appName}. We're excited to have you on board!</p>

          <div class="info-box">
            <h3>🚀 What you can do now:</h3>
            <ul>
              <li><strong>Manage Tasks:</strong> Create, assign, and track your tasks efficiently</li>
              <li><strong>Team Collaboration:</strong> Work seamlessly with your team members</li>
              <li><strong>Real-time Updates:</strong> Stay informed with instant notifications</li>
              <li><strong>Progress Monitoring:</strong> Track project progress and meet deadlines</li>
              <li><strong>File Management:</strong> Upload and share task-related documents</li>
            </ul>
          </div>

          <p>Your account details:</p>
          <ul>
            <li><strong>Organization:</strong> ${data.organizationName}</li>
            <li><strong>Department:</strong> ${data.departmentName || 'Not specified'}</li>
            <li><strong>Role:</strong> ${data.role || 'User'}</li>
          </ul>

          <div class="text-center mt-20">
            <a href="${data.clientUrl}/login" class="button">🔐 Login to Your Account</a>
          </div>

          <p class="mt-20">If you have any questions or need assistance, don't hesitate to reach out to your administrator or team lead.</p>

          <p><em>Happy task managing!</em><br>
          The ${data.appName} Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          <p>This email was sent to ${data.email}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: (data) => `
Welcome to ${data.appName}!

Hello ${data.firstName}!

Welcome to ${data.organizationName} on ${data.appName}. We're excited to have you on board!

What you can do now:
- Manage Tasks: Create, assign, and track your tasks efficiently
- Team Collaboration: Work seamlessly with your team members
- Real-time Updates: Stay informed with instant notifications
- Progress Monitoring: Track project progress and meet deadlines
- File Management: Upload and share task-related documents

Your account details:
- Organization: ${data.organizationName}
- Department: ${data.departmentName || 'Not specified'}
- Role: ${data.role || 'User'}

Login to your account: ${data.clientUrl}/login

If you have any questions or need assistance, don't hesitate to reach out to your administrator or team lead.

Happy task managing!
The ${data.appName} Team

© ${new Date().getFullYear()} ${data.appName}. All rights reserved.
This email was sent to ${data.email}
  `
};

/**
 * Task notification email template
 */
export const taskNotificationTemplate = {
  subject: (data) => `${data.title} - ${data.appName}`,

  html: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title} - ${data.appName}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 ${data.appName} Notification</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.firstName}!</h2>
          <p><strong>${data.title}</strong></p>
          <p>${data.message}</p>

          <div class="info-box task-priority-${(data.priority || 'medium').toLowerCase()}">
            <h3>📝 Task Details:</h3>
            <ul>
              <li><strong>Task:</strong> ${data.taskTitle}</li>
              <li><strong>Type:</strong> ${data.taskType}</li>
              <li><strong>Priority:</strong> ${data.priority || 'Medium'}</li>
              <li><strong>Status:</strong> ${data.status || 'To Do'}</li>
              ${data.dueDate ? `<li><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</li>` : ''}
              <li><strong>Organization:</strong> ${data.organizationName}</li>
            </ul>
          </div>

          ${data.assignedBy ? `<p><em>Assigned by: ${data.assignedBy}</em></p>` : ''}

          <div class="text-center mt-20">
            <a href="${data.clientUrl}/tasks" class="button">📋 View All Tasks</a>
          </div>

          <p class="mt-20"><em>Stay productive!</em><br>
          The ${data.appName} Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          <p>This email was sent to ${data.email}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: (data) => `
${data.appName} Notification

Hello ${data.firstName}!

${data.title}

${data.message}

Task Details:
- Task: ${data.taskTitle}
- Type: ${data.taskType}
- Priority: ${data.priority || 'Medium'}
- Status: ${data.status || 'To Do'}
${data.dueDate ? `- Due Date: ${new Date(data.dueDate).toLocaleDateString()}` : ''}
- Organization: ${data.organizationName}

${data.assignedBy ? `Assigned by: ${data.assignedBy}` : ''}

View all tasks: ${data.clientUrl}/tasks

Stay productive!
The ${data.appName} Team

© ${new Date().getFullYear()} ${data.appName}. All rights reserved.
This email was sent to ${data.email}
  `
};

/**
 * Announcement email template
 */
export const announcementTemplate = {
  subject: (data) => `📢 Announcement: ${data.title} - ${data.appName}`,

  html: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Announcement: ${data.title} - ${data.appName}</title>
      <style>
        ${baseStyles}
        .announcement-header {
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
        }
        .announcement-button {
          background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header announcement-header">
          <h1>📢 Important Announcement</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.firstName}!</h2>
          <p>You have received a new announcement from <strong>${data.organizationName}</strong>:</p>

          <div class="announcement-box">
            <h3>📣 ${data.title}</h3>
            <p style="margin: 15px 0; font-size: 16px; line-height: 1.6;">${data.message}</p>
            <p style="margin-top: 20px; text-align: right;"><em>— ${data.senderName}</em></p>
            ${data.senderPosition ? `<p style="margin: 0; text-align: right; font-size: 14px; opacity: 0.9;"><em>${data.senderPosition}</em></p>` : ''}
          </div>

          <div class="info-box">
            <p><strong>📅 Sent:</strong> ${new Date(data.sentAt || Date.now()).toLocaleString()}</p>
            <p><strong>🏢 Organization:</strong> ${data.organizationName}</p>
            ${data.departmentName ? `<p><strong>🏛️ Department:</strong> ${data.departmentName}</p>` : ''}
          </div>

          <div class="text-center mt-20">
            <a href="${data.clientUrl}/dashboard" class="button announcement-button">📊 View Dashboard</a>
          </div>

          <p class="mt-20"><em>Stay informed!</em><br>
          The ${data.appName} Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          <p>This email was sent to ${data.email}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: (data) => `
📢 Announcement - ${data.appName}

Hello ${data.firstName}!

You have received a new announcement from ${data.organizationName}:

📣 ${data.title}

${data.message}

— ${data.senderName}
${data.senderPosition ? `${data.senderPosition}` : ''}

Details:
- Sent: ${new Date(data.sentAt || Date.now()).toLocaleString()}
- Organization: ${data.organizationName}
${data.departmentName ? `- Department: ${data.departmentName}` : ''}

View your dashboard: ${data.clientUrl}/dashboard

Stay informed!
The ${data.appName} Team

© ${new Date().getFullYear()} ${data.appName}. All rights reserved.
This email was sent to ${data.email}
  `
};

/**
 * Password reset email template
 */
export const passwordResetTemplate = {
  subject: (data) => `🔐 Password Reset - ${data.appName}`,

  html: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - ${data.appName}</title>
      <style>
        ${baseStyles}
        .reset-header {
          background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
        }
        .reset-button {
          background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header reset-header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.firstName}!</h2>
          <p>You have requested to reset your password for your ${data.appName} account at <strong>${data.organizationName}</strong>.</p>

          <div class="warning-box">
            <p><strong>⚠️ Security Notice:</strong> If you did not request this password reset, please ignore this email and contact your administrator immediately. Your account security is important to us.</p>
          </div>

          <p>To reset your password, click the button below:</p>

          <div class="text-center mt-20 mb-20">
            <a href="${data.resetUrl}" class="button reset-button">🔑 Reset My Password</a>
          </div>

          <div class="info-box">
            <p><strong>⏰ Important:</strong> This password reset link will expire in <strong>1 hour</strong> for security reasons.</p>
            <p><strong>🔒 Security Tip:</strong> After resetting your password, make sure to use a strong, unique password that you haven't used elsewhere.</p>
          </div>

          <p><strong>If the button doesn't work, copy and paste this link into your browser:</strong></p>
          <p style="word-break: break-all; background-color: #f0f0f0; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 14px; border: 1px solid #ddd;">${data.resetUrl}</p>

          <p class="mt-20"><em>Stay secure!</em><br>
          The ${data.appName} Security Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          <p>This email was sent to ${data.email}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: (data) => `
🔐 Password Reset Request - ${data.appName}

Hello ${data.firstName}!

You have requested to reset your password for your ${data.appName} account at ${data.organizationName}.

⚠️ Security Notice: If you did not request this password reset, please ignore this email and contact your administrator immediately.

To reset your password, visit this link: ${data.resetUrl}

⏰ Important: This password reset link will expire in 1 hour for security reasons.

🔒 Security Tip: After resetting your password, make sure to use a strong, unique password that you haven't used elsewhere.

Stay secure!
The ${data.appName} Security Team

© ${new Date().getFullYear()} ${data.appName}. All rights reserved.
This email was sent to ${data.email}
  `
};

/**
 * Task reminder email template
 */
export const taskReminderTemplate = {
  subject: (data) => `⏰ Task Reminder: ${data.taskTitle} - ${data.appName}`,

  html: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Task Reminder - ${data.appName}</title>
      <style>
        ${baseStyles}
        .reminder-header {
          background: linear-gradient(135deg, #ff5722 0%, #d84315 100%);
        }
        .reminder-button {
          background: linear-gradient(135deg, #ff5722 0%, #d84315 100%);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header reminder-header">
          <h1>⏰ Task Reminder</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.firstName}!</h2>
          <p>This is a friendly reminder about an upcoming task deadline:</p>

          <div class="info-box task-priority-${(data.priority || 'medium').toLowerCase()}">
            <h3>📋 Task Details:</h3>
            <ul>
              <li><strong>Task:</strong> ${data.taskTitle}</li>
              <li><strong>Type:</strong> ${data.taskType}</li>
              <li><strong>Priority:</strong> ${data.priority || 'Medium'}</li>
              <li><strong>Status:</strong> ${data.status || 'To Do'}</li>
              <li><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleString()}</li>
              <li><strong>Time Remaining:</strong> ${data.timeRemaining || 'Less than 24 hours'}</li>
            </ul>
          </div>

          ${data.description ? `
          <div class="info-box">
            <h4>📝 Description:</h4>
            <p>${data.description}</p>
          </div>
          ` : ''}

          <div class="text-center mt-20">
            <a href="${data.clientUrl}/tasks/${data.taskId || ''}" class="button reminder-button">📋 View Task</a>
          </div>

          <p class="mt-20"><em>Don't let deadlines slip by!</em><br>
          The ${data.appName} Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          <p>This email was sent to ${data.email}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: (data) => `
⏰ Task Reminder - ${data.appName}

Hello ${data.firstName}!

This is a friendly reminder about an upcoming task deadline:

Task Details:
- Task: ${data.taskTitle}
- Type: ${data.taskType}
- Priority: ${data.priority || 'Medium'}
- Status: ${data.status || 'To Do'}
- Due Date: ${new Date(data.dueDate).toLocaleString()}
- Time Remaining: ${data.timeRemaining || 'Less than 24 hours'}

${data.description ? `Description: ${data.description}` : ''}

View task: ${data.clientUrl}/tasks/${data.taskId || ''}

Don't let deadlines slip by!
The ${data.appName} Team

© ${new Date().getFullYear()} ${data.appName}. All rights reserved.
This email was sent to ${data.email}
  `
};

/**
 * Mention notification email template
 */
export const mentionTemplate = {
  subject: (data) => `💬 You were mentioned in ${data.entityType} - ${data.appName}`,

  html: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You were mentioned - ${data.appName}</title>
      <style>
        ${baseStyles}
        .mention-header {
          background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
        }
        .mention-button {
          background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header mention-header">
          <h1>💬 You Were Mentioned!</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.firstName}!</h2>
          <p><strong>${data.mentionedBy}</strong> mentioned you in a ${data.entityType.toLowerCase()}:</p>

          <div class="info-box">
            <h3>📝 ${data.entityType} Details:</h3>
            <ul>
              <li><strong>Title:</strong> ${data.entityTitle}</li>
              <li><strong>Type:</strong> ${data.entityType}</li>
              <li><strong>Mentioned by:</strong> ${data.mentionedBy}</li>
              <li><strong>Date:</strong> ${new Date(data.mentionedAt || Date.now()).toLocaleString()}</li>
            </ul>
          </div>

          ${data.content ? `
          <div class="info-box">
            <h4>💬 Content:</h4>
            <p style="font-style: italic; background-color: white; padding: 15px; border-radius: 4px; border-left: 3px solid #9c27b0;">"${data.content}"</p>
          </div>
          ` : ''}

          <div class="text-center mt-20">
            <a href="${data.clientUrl}/${data.entityType.toLowerCase()}s/${data.entityId || ''}" class="button mention-button">💬 View ${data.entityType}</a>
          </div>

          <p class="mt-20"><em>Stay connected with your team!</em><br>
          The ${data.appName} Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
          <p>This email was sent to ${data.email}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  text: (data) => `
💬 You Were Mentioned! - ${data.appName}

Hello ${data.firstName}!

${data.mentionedBy} mentioned you in a ${data.entityType.toLowerCase()}:

${data.entityType} Details:
- Title: ${data.entityTitle}
- Type: ${data.entityType}
- Mentioned by: ${data.mentionedBy}
- Date: ${new Date(data.mentionedAt || Date.now()).toLocaleString()}

${data.content ? `Content: "${data.content}"` : ''}

View ${data.entityType.toLowerCase()}: ${data.clientUrl}/${data.entityType.toLowerCase()}s/${data.entityId || ''}

Stay connected with your team!
The ${data.appName} Team

© ${new Date().getFullYear()} ${data.appName}. All rights reserved.
This email was sent to ${data.email}
  `
};

export default {
  welcome: welcomeTemplate,
  taskNotification: taskNotificationTemplate,
  announcement: announcementTemplate,
  passwordReset: passwordResetTemplate,
  taskReminder: taskReminderTemplate,
  mention: mentionTemplate,
};
