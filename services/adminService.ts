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