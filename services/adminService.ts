/**
 * Admin Notification Service for AudioMax by AppsOrWebs Limited
 * Handles sending notifications to admin@appsorwebs.com for new user signups
 */

import { User } from '../types';

const ADMIN_EMAIL = 'admin@appsorwebs.com';

// Simulated email service (replace with real email service in production)
export const sendAdminNotification = async (user: User, action: 'signup' | 'login'): Promise<void> => {
  try {
    // In a real app, this would send an actual email
    // For now, we'll log to console and store in localStorage for demo
    
    const notification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      user: {
        email: user.email,
        subscription: user.subscription,
        signupTime: new Date().toISOString()
      },
      adminEmail: ADMIN_EMAIL
    };

    // Store notifications in localStorage for demo purposes
    const existingNotifications = JSON.parse(localStorage.getItem('admin-notifications') || '[]');
    existingNotifications.push(notification);
    localStorage.setItem('admin-notifications', JSON.stringify(existingNotifications));

    // Log to console for immediate visibility
    console.log(`📧 Admin Notification Sent to ${ADMIN_EMAIL}:`, {
      subject: `AudioMax - New User ${action === 'signup' ? 'Signup' : 'Login'}`,
      user: user.email,
      subscription: user.subscription,
      time: notification.timestamp
    });

    // In production, you would replace this with actual email sending:
    /*
    await fetch('/api/send-admin-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject: `AudioMax - New User ${action === 'signup' ? 'Signup' : 'Login'}`,
        html: generateEmailTemplate(user, action)
      })
    });
    */

  } catch (error) {
    console.error('Failed to send admin notification:', error);
    // Don't throw error - notification failure shouldn't break user flow
  }
};

// Generate email template for admin notifications
const generateEmailTemplate = (user: User, action: 'signup' | 'login'): string => {
  const actionText = action === 'signup' ? 'signed up' : 'logged in';
  const actionTitle = action === 'signup' ? 'New User Signup' : 'User Login';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .user-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎙️ AudioMax - ${actionTitle}</h1>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          <p>A user has ${actionText} on AudioMax:</p>
          
          <div class="user-info">
            <h3>User Details:</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Subscription:</strong> ${user.subscription}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Action:</strong> ${actionTitle}</p>
          </div>
          
          <p>You can access the admin dashboard to view more details.</p>
        </div>
        <div class="footer">
          <p>© 2025 AppsOrWebs Limited - AudioMax Admin System</p>
          <p>This is an automated notification from AudioMax.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Get all admin notifications (for admin dashboard)
export const getAdminNotifications = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('admin-notifications') || '[]');
  } catch (error) {
    console.error('Failed to get admin notifications:', error);
    return [];
  }
};

// Clear admin notifications
export const clearAdminNotifications = (): void => {
  localStorage.removeItem('admin-notifications');
};