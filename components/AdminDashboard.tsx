import React, { useState, useEffect } from 'react';
import { getAdminNotifications, clearAdminNotifications } from '../services/adminService';

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setNotifications(getAdminNotifications());
    }
  }, [isAuthenticated]);

  const handleAdminLogin = () => {
    // Simple admin authentication (in production, use proper authentication)
    if (adminPassword === 'appsorwebs2025') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid admin password');
    }
  };

  const handleClearNotifications = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      clearAdminNotifications();
      setNotifications([]);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Admin Access</h2>
          <input
            type="password"
            placeholder="Admin Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md mb-4 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
          />
          <div className="flex space-x-3">
            <button
              onClick={handleAdminLogin}
              className="flex-1 bg-sky-500 text-white py-2 rounded-md hover:bg-sky-600 transition-colors"
            >
              Login
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-500 text-white py-2 rounded-md hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Admin Dashboard - User Notifications
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <p className="text-slate-600 dark:text-slate-400">
            Total Notifications: {notifications.length}
          </p>
          <button
            onClick={handleClearNotifications}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            Clear All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.reverse().map((notification) => (
                <div
                  key={notification.id}
                  className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      notification.action === 'signup' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {notification.action === 'signup' ? '🎉 New Signup' : '👋 Login'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <p><strong>Email:</strong> {notification.user.email}</p>
                    <p><strong>Plan:</strong> {notification.user.subscription}</p>
                    <p><strong>Admin Email:</strong> {notification.adminEmail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            📧 All notifications are automatically sent to admin@appsorwebs.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;